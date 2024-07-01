import { MuseClient, MUSE_SERVICE, channelNames } from 'muse-js';
import { Ganglion } from "ganglion-ble";

// Since Ganglion refuses to export their device id, it is copied here
const GANGLION_SERVICE = 0xfe84;

// Device enums for supported types and States
export enum DeviceType {
	NONE,
	MUSE,
	GANGLION
};

// Useful enum for checking the device state
export enum DeviceState {
	CONNECTED,
	DISCONNECTED
}

// Scalp Electrode locations based on the International 10-20 System
//   https://en.wikipedia.org/wiki/10%E2%80%9320_system_(EEG)
export enum ScalpElectrodes {
	FP1, FP2,
	AF7, AF8,
	F7, F3, FZ, F4, F8,
	A1, T3, C3, CZ, C4, T4, A2,
	TP9, TP10,
	T5, P3, PZ, P4, T6,
	O1, O2
};

export interface BCIDeviceSample {
	data: number[];
	electrode: number;
	sampleRate: number;
}

// FIXME: Actually implement this
export interface BCIDeviceStatus {

}

// Callbacks that can be used during processing
export interface BCIDeviceCalbacks {
	dataHandler?:       (sample: BCIDeviceSample) => void;
	statusHandler?:     (status: BCIDeviceStatus) => void;
	connectionHandler?: (connected: boolean) => void;
}

/** @class BCIDevice
 * A bluetooth device wrapper for botht the Muse headset and the OpenBCI Ganglion
 */
export class BCIDevice {
	// Device properties
	device: MuseClient | Ganglion;
	type: DeviceType;
	state: DeviceState;
	subscription: () => void;

	// Callbacks
	callbacks: BCIDeviceCalbacks;

	// Sync Timer
	sync: number[];

	// Initialize the device with supplied defaults
	constructor(callbacks: BCIDeviceCalbacks) {
		this.device = null;
		this.type   = DeviceType.NONE;
		this.state  = DeviceState.DISCONNECTED;

		// Save the handlers
		this.callbacks = callbacks;
	}

	// Attempts to connect to a valid device.
	// WARN: Due to chrome security settngs, must be attached to some form of user input.
	// Will throw if the connection fails or is cancelled.
	// Can be `await`ed
	async connect() {
		// Make sure there is not an attached, connected device
		if (this.device !== null && this.state === DeviceState.CONNECTED)
			this.disconnect();

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
		});

		// Quit out if any of the fields are false
		if (!dev || !dev.gatt || !dev.name) throw new Error("Required fields are empty!");

		// Connect to the device
		const gatt = await dev.gatt.connect();
		this.state = DeviceState.CONNECTED;

		// Create the client by analyzing the name
		let getType = (x: BluetoothDevice): DeviceType => {
			if (x.name.match(/^Muse-/)) return DeviceType.MUSE;
			if (x.name.match(/^Ganglion-/)) return DeviceType.GANGLION;

			throw new Error("Unknown device type with name: " + x.name);
		};

		let sensors: number[] = [];
		let self: BCIDevice = this;

		// Initialize the device based on the type of device (muse vs ganglion)
		switch (getType(dev)) {
			case DeviceType.MUSE:
				this.type = DeviceType.MUSE;
				this.device = new MuseClient();

				// Map the sensors to their equivalent electrodes
				sensors[channelNames.indexOf("TP9")]  = ScalpElectrodes.TP9;
				sensors[channelNames.indexOf("TP10")] = ScalpElectrodes.TP10;
				sensors[channelNames.indexOf("AF7")]  = ScalpElectrodes.AF7;
				sensors[channelNames.indexOf("AF8")]  = ScalpElectrodes.AF8;

				// Fill timestamp array
				this.sync = new Array(4).fill(0);

				// Create the subscription container
				this.subscription = () => {
					let d = self.device as MuseClient;

					// Samples
					d.eegReadings.subscribe(sample => {
						let electrode = sensors[sample.electrode];
						let delta = sample.timestamp - self.sync[electrode];

						// Call the specified callback
						if (self.callbacks.dataHandler) {
							self.callbacks.dataHandler({
								data: sample.samples,
								electrode: electrode,
								sampleRate: 1000 / delta * sample.samples.length
							});
						}

						self.sync[electrode] = sample.timestamp;
					});

					// Telemetry info
					d.telemetryData.subscribe(status => {
						if (self.callbacks.statusHandler)
							self.callbacks.statusHandler(status);
					});

					// Status info (connected / disconnected)
					d.connectionStatus.subscribe(status => {
						if (self.callbacks.connectionHandler)
							self.callbacks.connectionHandler(status);
					});
				}

				break;

			case DeviceType.GANGLION:
				this.type = DeviceType.GANGLION;
				this.device = new Ganglion();

				// Map the sensors to their equivalent electrodes
				// TODO: Make this a configurable argument
				sensors[0] = ScalpElectrodes.FP1;
				sensors[1] = ScalpElectrodes.FP2;
				sensors[2] = ScalpElectrodes.O1;
				sensors[3] = ScalpElectrodes.O2;

				// Fill timestamp array
				this.sync = new Array(4).fill(0);

				// Subscribe to the data stream
				this.subscription = () => {
					let d = self.device as Ganglion;

					// Samples
					d.stream.subscribe(sample => {
						sample.data.forEach((val, ind) => {
							let electrode = sensors[ind];
							let delta = sample.timestamp.getUTCMilliseconds() - self.sync[electrode];

							if (self.callbacks.dataHandler) {
								self.callbacks.dataHandler({
									data: [val],
									electrode: electrode,
									sampleRate: 1000 / delta
								});
							}

							self.sync[electrode] = sample.timestamp.getUTCMilliseconds();
						});
					});

					// Status
					console.warn("BCIDevice: Ganglion does not offer status information.");

					// Listen for connection information
					console.warn("BCIDevice: Ganglion does not offer connection information.")
					if (self.callbacks.connectionHandler)
						self.callbacks.connectionHandler(true);
				}

				break;
		}

		// Connect the physical device to this device
		await this.device.connect(gatt);
		await this.device.start();

		// Subscribe to the data
		this.subscription();
	}

	// Disconnect the device
	disconnect() {
		if (this.state === DeviceState.DISCONNECTED) return;

		this.device.disconnect();
		this.state = DeviceState.DISCONNECTED;
	}

	// TODO: Allow for multiple susbscriptions
	// FIXME: Might not be needed
	subscribe(callback: (sample: BCIDeviceSample) => void) {
		this.callbacks.dataHandler = callback;
	}

	// Gets the electrode type based on its index
	static electrodeIndex(electrode: number) {
		return ScalpElectrodes[electrode];
	}
}
