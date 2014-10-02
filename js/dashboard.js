var categories = {};

function addGraphToMenu(uri, label, category) {
  if (!(category in categories)) {
    var collapse = d3.select('#menu').append('chart-category');
    collapse.attr('label', category);
    categories[category] = collapse;
  }

  var collapse = categories[category];
  var menuItem = collapse.append('p');
  var addButton = menuItem.append('core-icon-button');
  addButton.attr('icon', 'add');
  addButton.attr('data-label', label).attr('data-uri', uri);
  addButton.append('span').text(label);

  addButton.on('click', function(e) {
    addGraphToCanvas($(this).attr('data-label'), $(this).attr('data-uri'));
  });
}

function addGraphToCanvas(label, uri) {
  var graphCanvas = d3.select('#canvas').insert('metrics-chart', ":first-child");
  graphCanvas.attr('endpoint', uri);
  graphCanvas.attr('label', label);
  console.log(graphCanvas.attr('label'));
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
            var categoryName = graphType;
            addGraphToMenu('http://localhost:8181/metric/'+graphType+'/'+graph, graph, categoryName);
          });
        });
      });
  });
});

var DataModel = function() {
  Polymer('data-model', {
    endpoint: null,
    endpointChanged: function(oldValue, newValue) {
      this.refresh();
      if (this.interval)
        clearInterval(this.interval);
      this.interval = setInterval(this.refresh.bind(this), 1000);
    },
    detached: function() {
      if (this.interval)
        clearInterval(this.interval);
    },

    rawData: null,
    refresh: function() {
      if (this.endpoint) {
        d3.json(this.endpoint, function(error, json) {
            if (error) return console.warn(error);
            this.rawData = d3.entries(json).sort(function (a, b) { return Number(a[0])-Number(b[0]);}).map(function (d) {return d.value});
            this.aggregate();
        }.bind(this));
      }
    },

    aggregate: function() {
      var data = this.rawData.map(function(d) {return d[this.aggregation];}, this);
      var mean = data.reduce(function(p, v) { return p + v; }, 0) / data.length;
      this.data = data.map(function(d, i) {return [i, d - mean];});
    },

    resolution: 0,
    resolutionChanged: function(oldValue, newValue) {
      this.refresh();
    },

    aggregation: 'average',
    aggregationChanged: function(oldValue, newValue) {
      this.aggregate();
    }
  });
}

var Category = function() {
  Polymer('chart-category', {
    label: "Uncategorized",
    opened: true,
    openedChanged: function(oldValue, newValue) {
      if (newValue)
        this.$.toggleButton.icon = "unfold-less";
      else
        this.$.toggleButton.icon = "unfold-more";
    },
    toggle: function() {
      this.opened = !this.opened;
    }
  });
}

var HorizonChart = function() {
  Polymer('horizon-chart', {
    data: [],
    dataChanged: function(oldValue, newValue) {
      console.log('data update');
      this.redraw();
    },

    domReady: function() {
      var width = this.clientWidth;
      var height = this.clientHeight;
      this.chart = d3.horizon()
          .width(width)
          .height(height)
          .bands(2)
          .mode("offset")
          .interpolate("basis");
      this.svg = d3.select(this.$.svg)
          .attr("width", width)
          .attr("height", height)
      this.redraw();
    },

    redraw: function() {
      if (this.svg) {
        this.svg.data([this.data]).call(this.chart);
      }
    },
  });
}

var Chart = function() {
  Polymer('metrics-chart', {
    label: "",
    resolution: 0,
    endpoint: null,

    closeHandler: function(event, detail, sender) {
      this.fire('close');
    },

    selectAggregation: function(e, detail) {
      if (detail.isSelected) {
        this.aggregation = d3.select(detail.item).attr('data-attrname');
      }
    },
  });
}
