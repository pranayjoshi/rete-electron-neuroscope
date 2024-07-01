export const BandPowerPlot = function (
  graph_id,
  x_axis_id,
  y_axis_id,
  width = 400,
  height = 100,
  band_count = 4
) {

  let x_axis_element = document.getElementById(x_axis_id);
  x_axis_element.style.width = `${width}px`
  let y_axis_element = document.getElementById(y_axis_id);
  let y_axis_padding = 20
  y_axis_element.style.height = `${height+y_axis_padding}px`
  let controls_element = document.getElementById("controls");
  let bp_height = `${document.getElementById("bp_segment").clientHeight + 20}px`
  controls_element.style.height = bp_height

  let graph = new Rickshaw.Graph({
    element: document.getElementById(graph_id),
    width: width,
    height: height,
    renderer: "bar",
    stack: false,
    series: [
      {
        data: [
          { x: 0, y: 40 },
          { x: 1, y: 49 },
          { x: 2, y: 60 },
          { x: 3, y: 90 },
        ],
        color: "steelblue",
        name: "Theta",
      },
      {
        data: [
          { x: 0, y: 20 },
          { x: 1, y: 24 },
          { x: 2, y: 10 },
          { x: 3, y: 40 },
        ],
        color: "lightblue",
        name: "Alpha",
      },
      {
        data: [
          { x: 0, y: 20 },
          { x: 1, y: 24 },
          { x: 2, y: 23 },
          { x: 3, y: 33 },
        ],
        color: "gold",
        name: "Beta",
      },
      {
        data: [
          { x: 0, y: 20 },
          { x: 1, y: 24 },
          { x: 2, y: 23 },
          { x: 3, y: 33 },
        ],
        color: "red",
        name: "Gamma",
      },
    ],
  });

  var format = function (n) {
    var map = {
      0: "Theta",
      1: "Alpha",
      2: "Beta",
      3: "Gamma",
    };

    return map[n];
  };

  var xAxis = new Rickshaw.Graph.Axis.X({
    graph: graph,
    orientation: "bottom",
    element: x_axis_element,
    pixelsPerTick: width / band_count,
    tickFormat: format,
  });

  var y_ticks = new Rickshaw.Graph.Axis.Y({
    graph: graph,
    orientation: "left",
    tickFormat: Rickshaw.Fixtures.Number.formatKMBT,
    element: y_axis_element,
  });

  return graph;
};
