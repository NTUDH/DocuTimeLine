// normalize/parse data
spendData.forEach(function (d) {
    d.Spent = d.Spent.match(/\d+/)[0];
});

// object set
var yearRingChart = dc.pieChart("#chart-ring-year"),
    spendHistChart = dc.barChart("#chart-hist-spend"),
    spenderRowChart = dc.rowChart("#chart-row-spenders");

var table = dc.dataTable('#table');

// set crossfilter with 
var ndx = crossfilter(spendData),
    yearDim = ndx.dimension(function (d) {
        return +d.Year;
    }),
    spendDim = ndx.dimension(function (d) {
        return Math.floor(d.Spent / 10);
    }),
    nameDim = ndx.dimension(function (d) {
        return d.Name;
    }),
    spendPerYear = yearDim.group().reduceSum(function (d) {
        return +d.Spent;
    }),
    spendPerName = nameDim.group().reduceSum(function (d) {
        return +d.Spent;
    }),
    spendHist = spendDim.group().reduceCount();

// set crossfilter
var allDollars = ndx.groupAll().reduceSum(function (d) {
    return +d.Spent;
});

// draw yearRingChart  
yearRingChart
    .width(300)
    .height(300)
    .dimension(yearDim)
    .group(spendPerYear)
    .innerRadius(50)
    .controlsUseVisibility(true);

// draw spendHistChart 
spendHistChart
    .dimension(spendDim)
    .group(spendHist)
    .x(d3.scale.linear().domain([0, 10]))
    .elasticY(true)
    .controlsUseVisibility(true);

// draw spendHistChart's xAxis
spendHistChart.xAxis().tickFormat(function (d) {
    return d * 10
});

// draw spendHistChart's yAxis, convert back to base unit
spendHistChart.yAxis().ticks(2);

// draw spenderRowChart
spenderRowChart
    .dimension(nameDim)
    .group(spendPerName)
    .elasticX(true)
    .controlsUseVisibility(true);


// set table
table
    .dimension(spendDim)
    .group(function (d) {
        return d.value;
    })
    .sortBy(function (d) {
        return +d.Spent;
    })
    .showGroups(false)
    .columns(['Name',
        {
            label: 'Spent',
            format: function (d) {
                return '$' + d.Spent;
            }
        },
        'Year',
        {
            label: 'Percent of Total',
            format: function (d) {
                return Math.floor((d.Spent / allDollars.value()) * 100) + '%';
            }
        }
    ]);

// download 
d3.select('#download')
    .on('click', function () {
        var data = nameDim.top(Infinity);
        if (d3.select('#download-type input:checked').node().value === 'table') {
            data = data.sort(function (a, b) {
                return table.order()(table.sortBy()(a), table.sortBy()(b));
            });
            data = data.map(function (d) {
                var row = {};
                table.columns().forEach(function (c) {
                    row[table._doColumnHeaderFormat(c)] = table._doColumnValueFormat(c, d);
                });
                return row;
            });
        }
        var blob = new Blob([d3.csv.format(data)], {
            type: "text/csv;charset=utf-8"
        });
        saveAs(blob, 'data.csv');
    });
dc.renderAll();