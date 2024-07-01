/*

import { Events } from "./events.js"
import { FeatureExtractor } from "./feature-extractor.js"
import {BandPowerPlot} from "./band-power-plot.js"
import {BandPowerLineGraph} from "./bp-line-graph.js"
*/

import { MuseGraph } from "./muse-graph.js";
import { BLE } from "./ble.js";
import { Events } from "./events.js";
import { Signal } from "./signal.js";
import { FeatureExtractor } from "./feature-extractor.js";
import { ChannelVis } from "./channel_vis.js";
import { BlocklyMain } from "./blockly-main.js";
import { BandPowerVis } from "./band-power-vis.js";

export const NeuroScope = class {
  constructor() {
    this.blocklyMain = new BlocklyMain();
    this.signal_handler = new Signal(512);
    this.bpBis = new BandPowerVis();
    this.events = new Events(this.blocklyMain);
    this.ble = new BLE(this.signal_handler.add_data.bind(this.signal_handler));
    this.feature_extractor = new FeatureExtractor(256);
    this.blocklyMain.start();
    setTimeout(() => {
      //this.ble.build_ble_modal_list(["device1", "device2"]);
    }, 3000);

    setInterval(() => {
      this.signal_handler.plot_data(0);
      this.signal_handler.plot_data(1);
      this.signal_handler.plot_data(2);
      this.signal_handler.plot_data(3);
      let data = this.signal_handler.get_data();
      let band_powers = this.feature_extractor.getFormattedBandPowers(data);
      window.band_powers = band_powers;
      this.bpBis.update(band_powers);
    }, 400);
  }
};

let neuroScope = new NeuroScope();
