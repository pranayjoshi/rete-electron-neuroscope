import * as d3 from "d3";

export const BandPowerVis = class {
  constructor() {
    //this.width = window.innerWidth * 0.4;
    //this.height = window.innerHeight * 0.09;
    // set the dimensions and margins of the graph
    var margin = { top: 30, right: 30, bottom: 70, left: 60 };
    this.width = window.innerWidth * 0.4 - margin.left - margin.right;
    this.height = window.innerHeight * 0.4 - margin.top - margin.bottom;
    this.init_data = [
      { group: "Delta", value: 1 },
      { group: "Theta", value: 1 },
      { group: "Alpha", value: 1 },
      { group: "Beta", value: 1 },
      { group: "Gamma", value: 1 }
    ];
    this.svg = d3
      .select("#bands")
      .append("svg")
      .attr("width", this.width + margin.left + margin.right)
      .attr("height", this.height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add X axis
    this.x = d3
      .scaleBand()
      .range([0, this.width])
      .domain(
        this.init_data.map(function (d) {
          return d.group;
        })
      )
      .padding(0.2);

    this.svg
      .append("g")
      .attr("transform", "translate(0," + this.height + ")")
      .call(d3.axisBottom(this.x));

    // Add Y axis
    this.y = d3.scaleLinear().domain([0, 100]).range([this.height, 0]);
    this.svg.append("g").attr("class", "myYaxis").call(d3.axisLeft(this.y));
  }

  update(data) {
    let formatted_data = this.format_data(data);
    var u = this.svg.selectAll("rect").data(formatted_data);
    let x = this.x;
    let y = this.y;
    let height = this.height;
    u.enter()
      .append("rect")
      .merge(u)
      .transition()
      .duration(10)
      .attr("x", function (d) {
        return x(d.group);
      })
      .attr("y", function (d) {
        return y(d.value);
      })
      .attr("width", x.bandwidth())
      .attr("height", function (d) {
        return height - y(d.value);
      })
      .attr("fill", "#69b3a2");
  }

  format_data(data) {
    return [
      { group: "Delta", value: data.delta },
      { group: "Theta", value: data.theta },
      { group: "Alpha", value: data.alpha },
      { group: "Beta", value: data.beta },
      { group: "Gamma", value: data.gamma }
    ];
  }
};
