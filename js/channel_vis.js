import * as d3 from "d3";

export const ChannelVis = class {
  constructor() {
    this.width = window.innerWidth * 0.4;
    this.height = window.innerHeight * 0.09;
    const signal_amplitude = 300;
    this.svgs = {};

    this.plot();
    this.walkX = d3
      .scaleLinear()
      .domain([0, 512])
      .range([10, this.width - 10]);

    this.walkY = d3.scaleLinear().domain([-signal_amplitude, signal_amplitude]).range([50, 10]);

    this.line = d3
      .line()
      .x((d) => this.walkX(d.step))
      .y((d) => this.walkY(d.value));

    // hard coded for muse for now
    this.add_channel("0", 0);
    this.add_channel("1", 1);
    this.add_channel("2", 2);
    this.add_channel("3", 3);
  }

  add_channel(div_id, channel_id) {
    this.svgs[channel_id] = d3.create("svg").attr("width", this.width).attr("height", this.height);
    // Append the SVG element.
    this.svgs[channel_id].append("path").attr("fill", "none").attr("stroke", "red");
    //container.append(this.svgs[channel_id].node());
    document.getElementById(div_id).append(this.svgs[channel_id].node());
  }

  async plot() {
    let data = await this.add_data();
    let line_data = this.line(data);
    this.svgs[0]
      .selectAll("path")
      .transition()
      .duration(100)
      .ease(d3.easeLinear)
      .attr("d", line_data);
  }

  plot_external(channel_id, data) {
    //let data = await this.add_data();
    let line_data = this.line(data);
    this.svgs[channel_id].selectAll("path").attr("d", line_data);
  }

  async add_data() {
    const data = [];
    for (let i = 0, v = 2; i < 50; ++i) {
      v += Math.random() - 0.5;
      v = Math.max(Math.min(v, 4), 0);
      data.push({ step: i, value: v });
    }
    return data;
  }
};
