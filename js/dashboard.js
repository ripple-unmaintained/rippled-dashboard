function drawGraph(rootNode, endpoint) {

  var width = rootNode.node().offsetWidth;
  var height = rootNode.node().offsetHeight;

  var margin = {top: 20, right: 50, bottom: 20, left: 50},
      width = width - margin.left - margin.right,
      height = height - margin.top - margin.bottom;

  var x = d3.scale.linear()
      .range([0, width])

  var y = d3.scale.linear()
      .range([height, 0]);

  var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

  var yAxis = d3.svg.axis()
      .scale(y)
      .orient("left");

  var line = d3.svg.line()
      .x(function(d) { return x(d.seconds); })
      .y(function(d) { return y(d.value); });

  var svg = rootNode.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
    .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  var xRender = svg.append('g')
      .attr('class', 'x axis')
      .attr('transform', 'translate(0,' + height + ')');

  var yRender = svg.append('g')
      .attr('class', 'y axis');

  d3.json(endpoint, function(error, json) {
    if (error) return console.warn(error);
    var graphData = [];
    jobs = d3.entries(json);
    jobs.forEach(function(d) {
        graphData.unshift({seconds: +d['key'], value: +d.value.average});
    });

    x.domain(d3.extent(graphData, function(d) {return d.seconds}));
    y.domain(d3.extent(graphData, function (d) {return d.value}));

    xRender.call(xAxis);
    yRender.call(yAxis)

    svg.append('path')
      .datum(graphData)
      .attr('class', 'line')
      .attr('d', line);
  });
}

function addGraphToMenu(uri, label) {
  var menuItem = d3.select('#menu').append('core-item');
  menuItem.attr('label', label).attr('data-uri', uri);
}

$(document).ready(function() {
  d3.json('http://localhost:8181/metric/', function(error, json) {
      if (error) return console.warn(error);
      json.sort();
      json.forEach(function(graphType) {
        d3.json('http://localhost:8181/metric/'+graphType+'/', function(error, graphJson) {
          graphJson.sort();
          graphJson.forEach(function(graph) {
            addGraphToMenu('http://localhost:8181/metric/'+graphType+'/'+graph, graph);
          });
        });
      });
  });
  $('#menu').on('core-select', function(e) {
    if (e.originalEvent.detail.isSelected) {
      var selectedItem = $(e.originalEvent.detail.item);
      $('#chart-canvas').attr('endpoint', selectedItem.attr('data-uri'));
      $('#chart-title').text(selectedItem.attr('label'));
    }
  });
});
