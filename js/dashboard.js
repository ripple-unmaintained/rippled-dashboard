function drawGraph(rootNode, endpoint) {

  var width = rootNode.node().clientWidth;
  var height = rootNode.node().clientHeight;

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
      .attr("width", width)
      .attr("height", height)
    .append("g");

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
  var menuItem = d3.select('#menu').append('p');
  var addButton = menuItem.append('core-icon-button');
  addButton.attr('icon', 'add');
  addButton.attr('data-label', label).attr('data-uri', uri);
  addButton.append('span').text(label);

  addButton.on('click', function(e) {
    addGraphToCanvas($(this).attr('data-label'), $(this).attr('data-uri'));
  });
}

function addGraphToCanvas(label, uri) {
  var graphCanvas = d3.select('#canvas').append('metrics-chart');
  graphCanvas.attr('endpoint', uri);
  graphCanvas.attr('title', label);
  graphCanvas.on('close', function() {
    graphCanvas.remove();
  });
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
      $('#chart-title').text(selectedItem.attr('data-label'));
    }
  });
});
