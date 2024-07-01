//import { MuseClient, MUSE_SERVICE, channelNames } from "muse-js"
//import { Ganglion } from "ganglion-ble"

const {MuseClient, MUSE_SERVICE, channelNames} = require("muse-js")
const {Ganglion} = require("ganglion-ble")


// Since Ganglion refuses to export their device id, it is copied here
const GANGLION_SERVICE = 0xfe84

// Device enums for supported types and States
export let DeviceType

;(function(DeviceType) {
  DeviceType[(DeviceType["NONE"] = 0)] = "NONE"
  DeviceType[(DeviceType["MUSE"] = 1)] = "MUSE"
  DeviceType[(DeviceType["GANGLION"] = 2)] = "GANGLION"
})(DeviceType || (DeviceType = {}))

// Useful enum for checking the device state
export let DeviceState

;(function(DeviceState) {
  DeviceState[(DeviceState["CONNECTED"] = 0)] = "CONNECTED"
  DeviceState[(DeviceState["DISCONNECTED"] = 1)] = "DISCONNECTED"
})(DeviceState || (DeviceState = {}))

// Scalp Electrode locations based on the International 10-20 System
//   https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG)
export let ScalpElectrodes

;(function(ScalpElectrodes) {
  ScalpElectrodes[(ScalpElectrodes["FP1"] = 0)] = "FP1"
  ScalpElectrodes[(ScalpElectrodes["FP2"] = 1)] = "FP2"
  ScalpElectrodes[(ScalpElectrodes["AF7"] = 2)] = "AF7"
  ScalpElectrodes[(ScalpElectrodes["AF8"] = 3)] = "AF8"
  ScalpElectrodes[(ScalpElectrodes["F7"] = 4)] = "F7"
  ScalpElectrodes[(ScalpElectrodes["F3"] = 5)] = "F3"
  ScalpElectrodes[(ScalpElectrodes["FZ"] = 6)] = "FZ"
  ScalpElectrodes[(ScalpElectrodes["F4"] = 7)] = "F4"
  ScalpElectrodes[(ScalpElectrodes["F8"] = 8)] = "F8"
  ScalpElectrodes[(ScalpElectrodes["A1"] = 9)] = "A1"
  ScalpElectrodes[(ScalpElectrodes["T3"] = 10)] = "T3"
  ScalpElectrodes[(ScalpElectrodes["C3"] = 11)] = "C3"
  ScalpElectrodes[(ScalpElectrodes["CZ"] = 12)] = "CZ"
  ScalpElectrodes[(ScalpElectrodes["C4"] = 13)] = "C4"
  ScalpElectrodes[(ScalpElectrodes["T4"] = 14)] = "T4"
  ScalpElectrodes[(ScalpElectrodes["A2"] = 15)] = "A2"
  ScalpElectrodes[(ScalpElectrodes["TP9"] = 16)] = "TP9"
  ScalpElectrodes[(ScalpElectrodes["TP10"] = 17)] = "TP10"
  ScalpElectrodes[(ScalpElectrodes["T5"] = 18)] = "T5"
  ScalpElectrodes[(ScalpElectrodes["P3"] = 19)] = "P3"
  ScalpElectrodes[(ScalpElectrodes["PZ"] = 20)] = "PZ"
  ScalpElectrodes[(ScalpElectrodes["P4"] = 21)] = "P4"
  ScalpElectrodes[(ScalpElectrodes["T6"] = 22)] = "T6"
  ScalpElectrodes[(ScalpElectrodes["O1"] = 23)] = "O1"
  ScalpElectrodes[(ScalpElectrodes["O2"] = 24)] = "O2"
})(ScalpElectrodes || (ScalpElectrodes = {}))

/** @class BCIDevice
 * A bluetooth device wrapper for botht the Muse headset and the OpenBCI Ganglion
 */
export class BCIDevice {
  // Initialize the device with supplied defaults
  constructor(callbacks) {
    this.device = null
    this.type = DeviceType.NONE
    this.state = DeviceState.DISCONNECTED

    // Save the handlers
    this.callbacks = callbacks
  }

  // Attempts to connect to a valid device.
  // WARN: Due to chrome security settngs, must be attached to some form of user input.
  // Will throw if the connection fails or is cancelled.
  // Can be `await`ed
  async connect() {
    // Make sure there is not an attached, connected device
    if (this.device !== null && this.state === DeviceState.CONNECTED)
      this.disconnect()

    // Request the device, filtered by name
    let dev = await navigator.bluetooth.requestDevice({
      filters: [
        {
          namePrefix: "Ganglion-"
        },
        {
          namePrefix: "Muse-"
        }
      ],
      optionalServices: [MUSE_SERVICE, GANGLION_SERVICE]
    })

    // Quit out if any of the fields are false
    if (!dev || !dev.gatt || !dev.name)
      throw new Error("Required fields are empty!")

    // Connect to the device
    const gatt = await dev.gatt.connect()
    this.state = DeviceState.CONNECTED

    // Create the client by analyzing the name
    let getType = x => {
      if (x.name.match(/^Muse-/)) return DeviceType.MUSE
      if (x.name.match(/^Ganglion-/)) return DeviceType.GANGLION

      throw new Error("Unknown device type with name: " + x.name)
    }

    let sensors = []
    let self = this

    // Initialize the device based on the type of device (muse vs ganglion)
    switch (getType(dev)) {
      case DeviceType.MUSE:
        this.type = DeviceType.MUSE
        this.device = new MuseClient()

        // Map the sensors to their equivalent electrodes
        sensors[channelNames.indexOf("TP9")] = ScalpElectrodes.TP9
        sensors[channelNames.indexOf("TP10")] = ScalpElectrodes.TP10
        sensors[channelNames.indexOf("AF7")] = ScalpElectrodes.AF7
        sensors[channelNames.indexOf("AF8")] = ScalpElectrodes.AF8

        // Fill timestamp array
        this.sync = new Array(4).fill(0)

        // Create the subscription container
        this.subscription = () => {
          let d = self.device

          // Samples
          d.eegReadings.subscribe(sample => {
            let electrode = sensors[sample.electrode]
            let delta = sample.timestamp - self.sync[electrode]

            // Call the specified callback
            if (self.callbacks.dataHandler) {
              self.callbacks.dataHandler({
                data: sample.samples,
                electrode: electrode,
                sampleRate: (1000 / delta) * sample.samples.length
              })
            }

            self.sync[electrode] = sample.timestamp
          })

          // Telemetry info
          d.telemetryData.subscribe(status => {
            if (self.callbacks.statusHandler)
              self.callbacks.statusHandler(status)
          })

          // Status info (connected / disconnected)
          d.connectionStatus.subscribe(status => {
            if (self.callbacks.connectionHandler)
              self.callbacks.connectionHandler(status)
          })
        }

        break

      case DeviceType.GANGLION:
        this.type = DeviceType.GANGLION
        this.device = new Ganglion()

        // Map the sensors to their equivalent electrodes
        // TODO: Make this a configurable argument
        sensors[0] = ScalpElectrodes.FP1
        sensors[1] = ScalpElectrodes.FP2
        sensors[2] = ScalpElectrodes.O1
        sensors[3] = ScalpElectrodes.O2

        // Fill timestamp array
        this.sync = new Array(4).fill(0)

        // Subscribe to the data stream
        this.subscription = () => {
          let d = self.device

          // Samples
          d.stream.subscribe(sample => {
            sample.data.forEach((val, ind) => {
              let electrode = sensors[ind]
              let delta =
                sample.timestamp.getUTCMilliseconds() - self.sync[electrode]

              if (self.callbacks.dataHandler) {
                self.callbacks.dataHandler({
                  data: [val],
                  electrode: electrode,
                  sampleRate: 1000 / delta
                })
              }

              self.sync[electrode] = sample.timestamp.getUTCMilliseconds()
            })
          })

          // Status
          console.warn("BCIDevice: Ganglion does not offer status information.")

          // Listen for connection information
          console.warn(
            "BCIDevice: Ganglion does not offer connection information."
          )
          if (self.callbacks.connectionHandler)
            self.callbacks.connectionHandler(true)
        }

        break
    }

    // Connect the physical device to this device
    await this.device.connect(gatt)
    await this.device.start()

    // Subscribe to the data
    this.subscription()
  }

  // Disconnect the device
  disconnect() {
    if (this.state === DeviceState.DISCONNECTED) return

    this.device.disconnect()
    this.state = DeviceState.DISCONNECTED
  }

  // TODO: Allow for multiple susbscriptions
  // FIXME: Might not be needed
  subscribe(callback) {
    this.callbacks.dataHandler = callback
  }

  // Gets the electrode type based on its index
  static electrodeIndex(electrode) {
    return ScalpElectrodes[electrode]
  }
}
