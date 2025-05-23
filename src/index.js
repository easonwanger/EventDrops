import { defaultsDeep, sortBy, sortedIndexBy } from 'lodash';
import * as d3 from 'd3';
import axis from './axis';
import { getBreakpointLabel } from './breakpoint';
import bounds from './bounds';
import defaultConfiguration from './config';
import { eventDropsData, sortField } from './config';
import dropLine from './dropLine';
import zoomFactory from './zoom';
import { getDomainTransform } from './zoom';
import { addMetaballsDefs } from './metaballs';
import { uniqBy, sortedUniqBy } from 'lodash';
import './style.css';


// do not export anything else here to keep window.eventDrops as a function
export default ({ global = window, ...customConfiguration }) => {
    const initChart = (selection) => {
     
        const config = defaultsDeep(
            customConfiguration || {},
            defaultConfiguration(d3)
        );

        const {
            dropsData,
            getDrops,
            zoom: zoomConfig,
            drop: { onClick, onMouseOut, onMouseOver },
            metaballs,
            label: { width: labelWidth },
            line: { height: lineHeight },
            range: { start: rangeStart, end: rangeEnd },
            margin,
            breakpoints,
        } = config;

        selection.selectAll('svg').remove();
        const root = selection.selectAll('svg').data([dropsData]);
        root.exit().remove();

        // Follow margins conventions (https://bl.ocks.org/mbostock/3019563)
        const width = selection.node().clientWidth - margin.left - margin.right;

        const xScale = d3
            .scaleTime()
            .domain([rangeStart, rangeEnd])
            .range([0, width - labelWidth]);

        chart._scale = xScale;
        chart.currentBreakpointLabel = getBreakpointLabel(
            breakpoints,
            global.innerWidth
        );

        const svg = root
            .enter()
            .append('svg')
            .attr('width', width)
            .classed('event-drop-chart', true);

        const height = parseFloat(svg.style('height'));

        if (zoomConfig) {
            const zoom = d3.zoom();
            svg.call(
                zoomFactory(
                    d3,
                    svg,
                    config,
                    zoom,
                    xScale,
                    draw,
                    width,
                    height
                )
            );

            chart._zoomToDomain = (domain, duration, delay, ease) => {
                const zoomIdentity = getDomainTransform(
                    d3,
                    config,
                    domain,
                    xScale,
                    width
                );
                svg.transition()
                    .ease(ease)
                    .delay(delay)
                    .duration(duration)
                    .call(zoom.transform, zoomIdentity);
            };
        }

        if (metaballs) {
            svg.call(addMetaballsDefs(config));
        }

        svg.merge(root).attr(
            'height',
            (d) => (d.length + 1) * lineHeight + margin.top + margin.bottom
        );

        svg.append('g')
            .classed('viewport', true)
            .attr('transform', `translate(${margin.left},${margin.top})`)
            .call(draw(config, xScale, undefined, true));
    };

    const chart = (selection) => {
        chart._initialize = () => initChart(selection);
        chart._initialize();

        global.addEventListener('resize', chart._initialize, true);
    };

    chart.scale = () => chart._scale;
    chart.filteredData = () => chart._filteredData;
    chart.zoomToDomain = (
        domain,
        duration = 0,
        delay = 0,
        ease = d3.easeLinear
    ) => {
        if (typeof chart._zoomToDomain === 'function') {
            chart._zoomToDomain(domain, duration, delay, ease);
        } else {
            throw new Error(
                'Calling "zoomToDomain" requires zooming to be enabled.'
            );
        }
    };
    chart.destroy = (callback = () => {}) => {
        global.removeEventListener('resize', chart._initialize, true);
        callback();
    };

    const filterOverlappingDrop = (d, xScale) => {
        const uniq = sortedUniqBy(d, (data) => {
            return Math.round(xScale(data[sortField]));
        });
        return uniq;
    };

    const filterSortedByBounds = (data, dateBounds) => {
        const low = sortedIndexBy(
            data,
            { [sortField]: dateBounds[0] },
            (d) => d[sortField]
        );
        const high = sortedIndexBy(
            data,
            { [sortField]: dateBounds[1] },
            (d) => d[sortField]
        );
        return { low, high, result: data.slice(low, high) };
    };

    const draw =
        (config, scale, transform, initialize = false) =>
        (selection) => {
            let {
                drop: { getDate: getDate },
                kCache,
            } = config;
            kCache = kCache < 10 ? 10 : kCache;//filterOverlappingDrop is used to shrink drops number. the range (of scale) used to shrink is kCache * currentRange(viewport)

            const dateBounds = scale.domain().map((d) => new Date(d));
            const filteredData = selection.data().map((dataSet) => {
                if (!Array.isArray(dataSet)) {
                    throw new Error(
                        'Selection data is not an array. Are you sure you provided an array of arrays to `data` function?'
                    );
                }

                return dataSet.map((row) => {
                    if (initialize) {
                        delete row[eventDropsData];
                    }
                    if (!row[eventDropsData]) {
                        config.getDrops(row).forEach((p) => {
                            p[sortField] = getDate(p);
                        });
                        row[eventDropsData] = sortBy(
                            config.getDrops(row),
                            (d) => d[sortField]
                        );
                        const fullData = row[eventDropsData];
                        if (!fullData) {
                            throw new Error(
                                'No drops data has been found. It looks by default in the `data` property. You can use the `drops` configuration parameter to tune it.'
                            );
                        }
                        const sc = d3
                            .scaleLinear()
                            .domain(scale.domain())
                            .range([0, scale.range()[1] * kCache]);
                        fullData.shrinkedData = filterOverlappingDrop(
                            fullData,
                            sc
                        );
                    }
                    const fullData = row[eventDropsData];
                    const { low, high, result } = filterSortedByBounds(
                        fullData,
                        dateBounds
                    );
                    fullData.dataInRange = result;
                    fullData.lowHighPostion = { low, high };

                    let dts = result;
                    if (transform?.k < kCache / 1.5 && dts?.length > 10000) {
                        const { result } = filterSortedByBounds(
                            fullData.shrinkedData,
                            dateBounds
                        );
                        dts = result;
                    }

                    fullData.dataToShow = filterOverlappingDrop(dts, scale);

                    return row;
                });
            });

            chart._scale = scale;
            chart._filteredData = filteredData[0];

            selection
                .data(filteredData)
                .call(axis(d3, config, scale, chart.currentBreakpointLabel))
                .call(dropLine(config, scale))
                .call(bounds(config, scale));
        };

    chart.draw = draw;

    return chart;
};

export { eventDropsData };
