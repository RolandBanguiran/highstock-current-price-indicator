/**
* Highstock plugin for displaying current price indicator.
*
* Author: Roland Banguiran
* Email: banguiran@gmail.com
*
*/

// JSLint options:
/*global Highcharts, document */

(function(H) {
    'use strict';
    var merge = H.merge;

    H.wrap(H.Chart.prototype, 'init', function(proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        renderCurrentPriceIndicator(this);
    });

    H.wrap(H.Chart.prototype, 'redraw', function(proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        renderCurrentPriceIndicator(this);
    });

    function renderCurrentPriceIndicator(chart) {

        var priceYAxis = chart.yAxis[0],
            priceSeries = chart.series[0],
            priceData = priceSeries.yData,
            currentPrice = priceData[priceData.length - 1][3],

            extremes = priceYAxis.getExtremes(),
            min = extremes.min,
            max = extremes.max,

            options = chart.options.yAxis[0].currentPriceIndicator,
            defaultOptions = {
                backgroundColor: '#000000',
                borderColor: '#000000',
                lineColor: '#000000',
                enabled: true,
                style: {
                    color: '#ffffff',
                    fontSize: '11px'
                },
                x: 0,
                y: 0,
                zIndex: 7
            },

            chartWidth = chart.chartWidth,
            chartHeight = chart.chartHeight,
            marginRight = chart.optionsMarginRight || 0,
            marginLeft = chart.optionsMarginLeft || 0,

            renderer = chart.renderer,

            currentPriceIndicator = priceYAxis.currentPriceIndicator || {},
            isRendered = Object.keys(currentPriceIndicator).length,

            group = currentPriceIndicator.group,
            label = currentPriceIndicator.label,
            box = currentPriceIndicator.box,
            line = currentPriceIndicator.line,

            width,
            height,
            x,
            y,

            lineFrom;

        options = merge(true, defaultOptions, options);

        width = priceYAxis.opposite ? (marginRight ? marginRight : 40) : (marginLeft ? marginLeft : 40);
        x = priceYAxis.opposite ? chartWidth - width : marginLeft;
        y = priceYAxis.toPixels(currentPrice);

        lineFrom = priceYAxis.opposite ? marginLeft : chartWidth - marginRight;

        console.log([lineFrom, x]);

        // offset
        x += options.x;
        y += options.y;

        if (options.enabled) {

            // render or animate
            if (!isRendered) {
                // group
                group = renderer.g()
                    .attr({
                    zIndex: options.zIndex
                })
                    .add();

                // label
                label = renderer.text(currentPrice, x, y)
                    .attr({
                    zIndex: 2
                })
                    .css({
                    color: options.style.color,
                    fontSize: options.style.fontSize
                })
                    .add(group);

                height = label.getBBox().height;

                // box
                box = renderer.rect(x, y - (height / 2), width, height)
                    .attr({
                    fill: options.backgroundColor,
                    stroke: options.borderColor,
                    zIndex: 1,
                        'stroke-width': 1
                })
                    .add(group);

                // box
                line = renderer.path(['M', lineFrom, y, 'L', x, y])
                    .attr({
                    stroke: options.lineColor,
                    zIndex: 1,
                        'stroke-width': 1,
                    //'stroke-dasharray': dashStyleToArray(options.dashStyle,1),
                    opacity: 1
                })
                    .add(group);

                // adjust
                label.animate({
                    y: y + (height / 4)
                }, 0);
            } else {
                currentPriceIndicator.label.animate({
                    text: currentPrice,
                    y: y
                }, 0);

                height = currentPriceIndicator.label.getBBox().height;

                currentPriceIndicator.box.animate({
                    y: y - (height / 2)
                }, 0);

                currentPriceIndicator.line.animate({
                    d: ['M', lineFrom, y, 'L', x, y]
                }, 0);

                // adjust
                currentPriceIndicator.label.animate({
                    y: y + (height / 4)
                }, 0);
            }

            if (currentPrice > min && currentPrice < max) {
                group.show();
            } else {
                group.hide();
            }

            // register to price y-axis object
            priceYAxis.currentPriceIndicator = {
                group: group,
                label: label,
                box: box,
                line: line
            }
        }
    }
}(Highcharts));
