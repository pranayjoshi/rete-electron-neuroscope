//import {fromEvent} from "https://unpkg.com/rxjs@^7/dist/bundles/rxjs.umd.min.js"
import { fromEvent, merge } from "rxjs";
import { first, map, takeUntil, scan, concatMap, filter, share } from "rxjs";

const TELEMETRY_CHARACTERISTIC = "273e000b-4c4d-454d-96be-f03bac821358";

const EEG_CHARACTERISTICS = [
  "273e0003-4c4d-454d-96be-f03bac821358",
  "273e0004-4c4d-454d-96be-f03bac821358",
  "273e0005-4c4d-454d-96be-f03bac821358",
  "273e0006-4c4d-454d-96be-f03bac821358",
  "273e0007-4c4d-454d-96be-f03bac821358"
];

export const EEG_FREQUENCY = 256;
export const EEG_SAMPLES_PER_READING = 12;

export const MuseElectronClient = class {
  constructor() {
    // Connect Events

    //console.log(MuseClient)

    /*
    document.getElementById("battery_level").onclick = function (e) {
      console.log(e)
      console.log(this.telemetryData)
      this.telemetryData.subscribe((telemetry) => {
        console.log(telemetry);
      });
    }.bind(this);

    */

    this.MUSE_SERVICE = 0xfe8d;
    this.device = null;
    this.deviceName = null;
    this.telemetryData = null;
    this.lastTimestamp = null;
  }

  parseTelemetry(data) {
    return {
      sequenceId: data.getUint16(0),
      batteryLevel: data.getUint16(2) / 512,
      fuelGaugeVoltage: data.getUint16(4) * 2.2,
      // Next 2 bytes are probably ADC millivolt level, not sure
      temperature: data.getUint16(8)
    };
  }

  decodeUnsigned12BitData(samples) {
    var samples12Bit = [];
    for (var i = 0; i < samples.length; i++) {
      if (i % 3 === 0) {
        samples12Bit.push((samples[i] << 4) | (samples[i + 1] >> 4));
      } else {
        samples12Bit.push(((samples[i] & 0xf) << 8) | samples[i + 1]);
        i++;
      }
    }
    return samples12Bit;
  }

  decodeEEGSamples(samples) {
    return this.decodeUnsigned12BitData(samples).map(function (n) {
      return 0.48828125 * (n - 0x800);
    });
  }

  parseControl(controlData) {
    return controlData.pipe(
      concatMap((data) => data.split("")),
      scan((acc, value) => {
        if (acc.indexOf("}") >= 0) {
          return value;
        } else {
          return acc + value;
        }
      }, ""),
      filter((value) => value.indexOf("}") >= 0),
      map((value) => JSON.parse(value))
    );
  }

  decodeResponse(bytes) {
    return new TextDecoder().decode(bytes.subarray(1, 1 + bytes[0]));
  }

  async observableCharacteristic(characteristic) {
    await characteristic.startNotifications();
    if (characteristic.service) {
      const disconnected = fromEvent(characteristic.service.device, "gattserverdisconnected");
      return fromEvent(characteristic, "characteristicvaluechanged").pipe(
        takeUntil(disconnected),
        map((event) => event.target.value)
      );
    } else {
      return null;
    }
  }

  async sendCommand(cmd) {
    await this.controlChar.writeValue(this.encodeCommand(cmd));
  }

  async pause() {
    await this.sendCommand("h");
  }

  async resume() {
    await this.sendCommand("d");
  }

  async start() {
    await this.pause();
    let preset = "p21";
    await this.controlChar.writeValue(this.encodeCommand(preset));
    await this.controlChar.writeValue(this.encodeCommand("s"));
    await this.resume();
  }

  encodeCommand(cmd) {
    const encoded = new TextEncoder().encode(`X${cmd}\n`);
    encoded[0] = encoded.length - 1;
    return encoded;
  }

  parseGyroscope(data) {
    return this.parseImuReading(data, 0.0074768);
  }

  parseImuReading(data, scale) {
    function sample(startIndex) {
      return {
        x: scale * data.getInt16(startIndex),
        y: scale * data.getInt16(startIndex + 2),
        z: scale * data.getInt16(startIndex + 4)
      };
    }
    return {
      sequenceId: data.getUint16(0),
      samples: [sample(2), sample(8), sample(14)]
    };
  }

  async connect() {
    this.device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          namePrefix: "Ganglion-"
        },
        {
          namePrefix: "Muse-"
        }
      ],
      filters: [{ services: [this.MUSE_SERVICE] }]
      //acceptAllDevices: true,
    });

    if (this.device.gatt) {
      this.gatt = await this.device.gatt.connect();
      this.deviceName = this.gatt.device.name || null;

      //document.getElementById("device-name").innerHTML = this.deviceName;

      fromEvent(this.gatt.device, "gattserverdisconnected")
        .pipe(first())
        .subscribe(() => {
          console.log("gattserverdisconnected");
          this.gatt = null;
          //this.connectionStatus.next(false);
        });

      // Battery
      const service = await this.gatt.getPrimaryService(this.MUSE_SERVICE);
      const telemetryCharacteristic = await service.getCharacteristic(TELEMETRY_CHARACTERISTIC);
      this.telemetryData = (await this.observableCharacteristic(telemetryCharacteristic)).pipe(
        map(this.parseTelemetry)
      );

      // Telemetry info
      /*
      this.telemetryData.subscribe((status) => {
        console.log(status);
      });
      */

      // Gyroscope
      const GYROSCOPE_CHARACTERISTIC = "273e0009-4c4d-454d-96be-f03bac821358";
      const gyroscopeCharacteristic = await service.getCharacteristic(GYROSCOPE_CHARACTERISTIC);

      this.gyroscopeData = (await this.observableCharacteristic(gyroscopeCharacteristic)).pipe(
        map(this.parseGyroscope.bind(this))
      );

      /*
      this.gyroscopeData.subscribe((status) => {
        console.log(status.samples[0]);
      });*/

      // EEG
      this.eegCharacteristics = [];
      const eegObservables = [];
      const channelCount = 4; // Only works for old muse devices

      for (let channelIndex = 0; channelIndex < channelCount; channelIndex++) {
        const characteristicId = EEG_CHARACTERISTICS[channelIndex];
        const eegChar = await service.getCharacteristic(characteristicId);
        eegObservables.push(
          (await this.observableCharacteristic(eegChar)).pipe(
            map((data) => {
              const eventIndex = data.getUint16(0);
              return {
                electrode: channelIndex,
                index: eventIndex,
                samples: this.decodeEEGSamples(new Uint8Array(data.buffer).subarray(2)),
                timestamp: this.getTimestamp(eventIndex, EEG_SAMPLES_PER_READING, EEG_FREQUENCY)
              };
            })
          )
        );
        this.eegCharacteristics.push(eegChar);
      }
      this.eegReadings = merge(...eegObservables);

      /*
      this.eegReadings.subscribe(sample => {
        console.log(sample)
      })
      */

      // Control
      const CONTROL_CHARACTERISTIC = "273e0001-4c4d-454d-96be-f03bac821358";
      this.controlChar = await service.getCharacteristic(CONTROL_CHARACTERISTIC);

      this.rawControlData = (await this.observableCharacteristic(this.controlChar)).pipe(
        map((data) => this.decodeResponse(new Uint8Array(data.buffer))),
        share()
      );

      this.controlResponses = this.parseControl(this.rawControlData);
      this.start();
    } else {
      console.log("error with gatt object.");
    }
  }

  get_eeg() {
    return this.eegReadings;
  }

  get_device() {
    return this.device;
  }

  getTimestamp(eventIndex, samplesPerReading, frequency) {
    const READING_DELTA = 1000 * (1.0 / frequency) * samplesPerReading;

    if (this.lastIndex === null || this.lastTimestamp === null) {
      this.lastIndex = eventIndex;
      this.lastTimestamp = new Date().getTime() - READING_DELTA;
    }

    // Handle wrap around
    while (this.lastIndex - eventIndex > 0x1000) {
      eventIndex += 0x10000;
    }

    if (eventIndex === this.lastIndex) {
      return this.lastTimestamp;
    }
    if (eventIndex > this.lastIndex) {
      this.lastTimestamp += READING_DELTA * (eventIndex - this.lastIndex);
      this.lastIndex = eventIndex;

      return this.lastTimestamp;
    } else {
      return this.lastTimestamp - READING_DELTA * (this.lastIndex - eventIndex);
    }
  }
};
