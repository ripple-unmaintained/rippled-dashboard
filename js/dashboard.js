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

var Chart = function() {
  Polymer('metrics-chart', {
    resolution: 0,
    endpoint: null,

    closeHandler: function(event, detail, sender) {
      this.fire('close');
    },

    resolutionChanged: function(oldValue, newValue) {
      this.refresh();
    },

    domReady: function() {
      var width = this.$.canvas.clientWidth - 20;
      var height = this.$.canvas.clientHeight - 20;
      this.xScale = d3.scale.linear()
          .range([0, width]);
      this.yScale = d3.scale.linear()
          .range([height, 0]);
      this.xAxis = d3.svg.axis()
          .scale(this.xScale)
          .orient("bottom");
      this.yAxis = d3.svg.axis()
          .scale(this.yScale)
          .orient("left");
      this.line = d3.svg.line()
          .x(function(d) { return this.xScale(d.key); }.bind(this))
          .y(function(d) { return this.yScale(d.value.average); }.bind(this));
      var svg = d3.select(this.$.canvas).append("svg")
          .attr("width", width)
          .attr("height", height)
          .append("g");
      this.xRender = svg.append('g')
          .attr('class', 'x axis')
          .attr('transform', 'translate(0,' + height + ')');
      this.yRender = svg.append('g')
          .attr('class', 'y axis');
      this.path = svg.append('path');
    },

    refresh: function() {
      if (this.endpoint && this.path) {
        d3.json(this.endpoint, function(error, json) {
            if (error) return console.warn(error);
            var data = d3.entries(json);
            this.xScale.domain(d3.extent(data, function(d) {return d.key}));
            this.yScale.domain(d3.extent(data, function(d) {return d.value.average}));
            this.xRender.call(this.xAxis);
            this.yRender.call(this.yAxis);
            this.path.datum(data)
              .attr('class', 'line')
              .attr('d', this.line);
        }.bind(this));
      }
    },

    endpointChanged: function(oldValue, newValue) {
      this.refresh();
      if (this.interval)
        clearInterval(this.interval);
      this.interval = setInterval(this.refresh.bind(this), 1000);
    },
    detached: function() {
      if (this.interval)
        clearInterval(this.interval);
    }
  });
}
