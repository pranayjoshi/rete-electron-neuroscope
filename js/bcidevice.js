const {MuseClient, MUSE_SERVICE, channelNames} = require("muse-js")
const {Ganglion} = require("ganglion-ble")

// Since Ganglion refuses to export their device id, it is copied here
const GANGLION_SERVICE = 0xfe84

// Device enums for supported types and States
let DeviceType;

class BCIDevice {
    // Initialize the device with supplied defaults
    constructor() {
        this.id = 1
        console.log("constructor")
    }

    getID() {
        console.log(this.id)
    }

    async connect() {
        console.log("connect")
        console.log(navigator)
    }
}

module.exports = BCIDevice