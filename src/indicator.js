import { isBefore } from './isBefore';
import { isAfter } from './isAfter';
import {eventDropsData} from './config';

export default (config, xScale) => selection => {
    const {
        label: { width: labelWidth },
        line: { height: lineHeight },
        drop: { date: dropDate },
        indicator: { previousText, nextText },
    } = config;

    const dateBounds = xScale.domain().map(d => new Date(d));

    const indicators = selection.selectAll('.indicator').data(d => {
        const data = [];
        const {low,high} = d[eventDropsData].lowHighPostion;
        if (low > 0) {
            data.push('before');
        }
        if (high < d[eventDropsData].length ) {
            data.push('after');
        }
        return data;
    });

    indicators
        .enter()
        .append('text')
        .classed('indicator', true)
        .attr('opacity', 0.5)
        .attr('x', d => (d === 'before' ? labelWidth : '100%'))
        .attr('dx', d => (d === 'before' ? 0 : -25))
        .attr('y', lineHeight / 2)
        .attr('dy', '0.25em')
        .text(d => (d === 'before' ? previousText : nextText));

    indicators
        .attr('x', d => (d === 'before' ? labelWidth : '100%'))
        .attr('dx', d => (d === 'before' ? 0 : -25))
        .attr('y', lineHeight / 2)
        .attr('dy', '0.25em')
        .text(d => (d === 'before' ? previousText : nextText));

    indicators.exit().remove();
};
