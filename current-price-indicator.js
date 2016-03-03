/**
* Highstock plugin for displaying current price indicator.
*
* Author: Roland Banguiran
* Email: banguiran@gmail.com
*
* Edited By: Gal Ziv on 3.3.2016
* Functionallity added: 
* options.pullLeft(number) : takes the box x position left by specified value. to pull right use negative values.
* options.triangle(object):  specify null to disable. else specify an object with 'width'(number) property
* options.extractLastPriceFunction(function): the function to extract the last price from our yAxis data.
* options.priceIncreaseColor(color): the color when the price has increased from its last value. to disable, just specify the background color
* options.priceDecreaseColor(color): the color when the price has decreased from its last value. to disable, just specify the background color
*/

// JSLint options:
/*global Highcharts, document */

(function (H) {
    'use strict';
    var merge = H.merge;

    H.wrap(H.Chart.prototype, 'init', function (proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        renderCurrentPriceIndicator(this);
    });

    H.wrap(H.Chart.prototype, 'redraw', function (proceed) {

        // Run the original proceed method
        proceed.apply(this, Array.prototype.slice.call(arguments, 1));

        renderCurrentPriceIndicator(this);
    });

    function renderCurrentPriceIndicator(chart) {

        var options = chart.options.yAxis[0].currentPriceIndicator;

        // if not configured then do nothing.
        if (!options) {
            return;
        }

        var priceYAxis = chart.yAxis[0],
            priceSeries = chart.series[0],
            priceData = priceSeries.yData,
            extractLastPriceFunction = options.extractLastPriceFunction,
            currentPrice = extractLastPriceFunction ? extractLastPriceFunction(priceData) : priceData[priceData.length - 1][3],

            extremes = priceYAxis.getExtremes(),
            min = extremes.min,
            max = extremes.max,

            defaultOptions = {
                backgroundColor: '#000000',
                priceIncreaseColor: 'green',
                priceDecreaseColor: 'red',
                borderColor: '#000000',
                lineColor: '#000000',
                lineDashStyle: 'Solid',
                pullLeft: 0,
                lineOpacity: 0.8,
                triangle: { width: 10 },
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
            marginRight = chart.optionsMarginRight || 0,
            marginLeft = chart.optionsMarginLeft || 0,

            renderer = chart.renderer,

            currentPriceIndicator = priceYAxis.currentPriceIndicator || {},
            isRendered = Object.keys(currentPriceIndicator).length,

            group = currentPriceIndicator.group,
            label = currentPriceIndicator.label,
            box = currentPriceIndicator.box,
            line = currentPriceIndicator.line,
            triangle = currentPriceIndicator.triangle,

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

        // offset
        x += options.x - options.pullLeft;
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
                box = renderer.rect(x, y - (height / 2), width + options.boxIncreaseWidthBy, height)
                    .attr({
                        fill: options.backgroundColor,
                        stroke: options.borderColor,
                        zIndex: 1,
                        'stroke-width': 1
                    })
                    .add(group);

                // horizontal line
                line = renderer.path(['M', lineFrom, y, 'L', x, y])
                    .attr({
                        stroke: options.lineColor,
                        'stroke-dasharray': dashStyleToArray(options.lineDashStyle, 1),
                        'stroke-width': 1,
                        opacity: options.lineOpacity,
                        zIndex: 1,
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

                // set price direction color
            }

            if (options.triangle) {

                if (currentPriceIndicator.triangle) {
                    currentPriceIndicator.triangle.destroy();
                }

                triangle = renderer.path(['M', x, y - (height / 2), 'L', x, y + (height / 2), 'L', x - options.triangle.width, y, 'Z'])
                    .attr({
                        fill: options.backgroundColor,
                        zIndex: 1,
                    })
                .add(group);
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
                line: line,
                triangle: triangle
            }
        }

        if (priceYAxis.lastPrice) {
            var color = currentPrice > priceYAxis.lastPrice ? options.priceIncreaseColor : options.priceDecreaseColor;
            priceYAxis.currentPriceIndicator.box.attr({ fill: color, stroke: color });
            priceYAxis.currentPriceIndicator.line.attr({ stroke: color });
            priceYAxis.currentPriceIndicator.triangle.attr({ fill: color });
        }

        priceYAxis.lastPrice = currentPrice;
    };

    /**
     * Convert dash style name to array to be used a the value
     * for SVG element's "stroke-dasharray" attribute
     * @param {String} dashStyle	Possible values: 'Solid', 'Shortdot', 'Shortdash', etc
     * @param {Integer} width	SVG element's "stroke-width"
     * @param {Array} value
     */
    function dashStyleToArray(dashStyle, width) {
        var value;

        dashStyle = dashStyle.toLowerCase();
        width = (typeof width !== 'undefined' && width !== 0) ? width : 1;

        if (dashStyle === 'solid') {
            value = 'none';
        } else if (dashStyle) {
            value = dashStyle
                .replace('shortdashdotdot', '3,1,1,1,1,1,')
                .replace('shortdashdot', '3,1,1,1')
                .replace('shortdot', '1,1,')
                .replace('shortdash', '3,1,')
                .replace('longdash', '8,3,')
                .replace(/dot/g, '1,3,')
                .replace('dash', '4,3,')
                .replace(/,$/, '')
                .split(','); // ending comma

            i = value.length;
            while (i--) {
                value[i] = parseInt(value[i]) * width;
            }
            value = value.join(',');
        }

        return value;
    };
}(Highcharts));
