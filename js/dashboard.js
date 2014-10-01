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

    _aggProp: 'average',

    selectAggregation: function(e, detail) {
      if (detail.isSelected) {
        this._aggProp = d3.select(detail.item).attr('data-attrname');
        this.redraw();
      }
    },

    domReady: function() {
      var width = this.$.canvas.clientWidth;
      var height = this.$.canvas.clientHeight;
      this.chart = d3.horizon()
          .width(width)
          .height(height)
          .bands(2)
          .mode("offset")
          .interpolate("basis");
      this.svg = d3.select(this.$.canvas).append("svg")
          .attr("width", width)
          .attr("height", height)
      this.redraw();
    },

    data: null,

    redraw: function() {
      if (this.svg && this.data) {
        var data = this.data.map(function(d) {return d[this._aggProp];}, this);
        var mean = data.reduce(function(p, v) { return p + v; }, 0) / data.length;
        console.log(data.reduce(function(p, v) {return p+v}, 0));
        data = data.map(function(d, i) {return [i, d - mean];});

        this.svg.data([data]).call(this.chart);
      }
    },

    refresh: function() {
      if (this.endpoint) {
        d3.json(this.endpoint, function(error, json) {
            if (error) return console.warn(error);
            this.data = d3.entries(json).sort(function (a, b) { return Number(a[0])-Number(b[0]);}).map(function (d) {return d.value});
            this.redraw();
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
