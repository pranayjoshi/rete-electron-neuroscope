import { MuseElectronClient } from "./muse-client.js";

export const MuseDataCapture = class {
  constructor(connect_button_id, eeg_handler) {
    this.device = new MuseElectronClient();
    this.connect_button_id = connect_button_id;
    this.eeg_handler = eeg_handler;
    this.channels = {};
    this.SECONDS = 4;
    this.BUFFER_SIZE = this.SECONDS * 256;

    // Set up UI
    this.init_ui();
  }

  init_ui() {
    document.getElementById(this.connect_button_id).onclick = () =>
      this.on_connect(this.device);
  }

  add_data(samples, channel) {
    if (!this.channels[channel]) {
      this.channels[channel] = [];
      //console.log(this.channels);
    }

    for (let i in samples) {
      if (this.channels[channel].length > this.BUFFER_SIZE - 1) {
        this.channels[channel].shift();
        //console.log("shift")
        //console.log(channel, this.channels[channel])
      }

      this.channels[channel].push(samples[i]);
    }
  }

  async on_connect() {
    await this.device.connect();

    // EEG DATA
    this.device.eegReadings.subscribe((sample) => {
      let { electrode, samples } = sample;
      this.add_data(samples, electrode);
      //this.eeg_handler(sample)
    });
  }
};

//let dc = new DataCapture()
