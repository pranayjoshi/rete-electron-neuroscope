import { Data } from "./data.js";
import { MuseSeries } from "./series_muse.js";

export const MuseGraph = class {
  constructor(div_id, width, height, max_data, time_interval = 1) {
    this.width = document.querySelector(`#${div_id}`).parentElement.clientWidth;
    //console.log("width", this.width);
    this.height = height;
    this.sample_freq = 256;
    let Rickshaw = window.Rickshaw;
    this.graph = new Rickshaw.Graph({
      element: document.querySelector(`#${div_id}`),
      width: this.width,
      height: this.height,
      renderer: "line",
      series: MuseSeries(max_data, time_interval)
    });
    this.isChannelDataReady = { 0: false, 1: false, 2: false, 3: false };
    this.recent_data_temp = {};
    this.is_active = true;
    this.is_local_recording = false;
    this.data = new Data("muse", { 0: "TP9", 1: "TP10", 2: "AF8", 3: "AF7" }, this.sample_freq);

    /*
        let updateWidth = () => {
            let w =  document.querySelector(`#${div_id}`).clientWidth
            this.graph.width = w
            console.log(w)
        }

        window.onresize = updateWidth.bind(this)
        */
  }

  toggle_local_recording() {
    this.is_local_recording = !this.is_local_recording;
    //console.log(this.is_local_recording)
  }

  get_graph() {
    return this.graph;
  }

  add_data(data, electrode) {
    this.recent_data_temp[electrode] = data;
    this.isChannelDataReady[electrode] = true;
    this.update_graph();
  }

  reset_channel_status() {
    this.isChannelDataReady = { 0: false, 1: false, 2: false, 3: false };
  }

  // Checks to see if all channels have new data
  is_refresh_ready() {
    return (
      this.isChannelDataReady[0] &&
      this.isChannelDataReady[1] &&
      this.isChannelDataReady[2] &&
      this.isChannelDataReady[3]
    );
  }

  get_formatted_data(i) {
    return {
      TP9: this.recent_data_temp[0][i] + this.height * 0.1, //F8
      TP10: this.recent_data_temp[1][i] + this.height * 0.2, //F7
      AF8: this.recent_data_temp[2][i] + this.height * 0.3, //TP9
      AF7: this.recent_data_temp[3][i] + this.height * 0.4 // TP10
    };
  }

  // Update graph visualizer if all channels hold new data
  update_graph() {
    if (this.is_refresh_ready() && this.is_active) {
      this.reset_channel_status();

      // Render recent data for all channels
      for (let i in this.recent_data_temp[0]) {
        this.graph.series.addData(this.get_formatted_data(i));
        this.graph.render();
      }

      // record data session
      if (this.is_local_recording) {
        this.data.add_data(this.recent_data_temp);
      }

      // Flush old data
      for (let i in this.recent_data_temp) {
        this.recent_data_temp[i] = [];
      }
    }
  }
};
