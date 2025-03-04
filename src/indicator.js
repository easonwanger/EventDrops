import { isBefore } from './isBefore';
import { isAfter } from './isAfter';
import {sortField,lowHighPostion} from './config';
import {throttle} from 'lodash';

export default (config, xScale) => selection => {
    const {
        label: { width: labelWidth },
        line: { height: lineHeight },
        drop: { date: dropDate },
        indicator: { previousText, nextText },
    } = config;

    const dateBounds = xScale.domain().map(d => new Date(d));

    const indicators = selection.selectAll('.indicator').data(throttle(d => {
        const data = [];
        const {low,high} = d.data[lowHighPostion];
        if (low > 0) {
            data.push('before');
        }
        if (high < d.fullData.length ) {
            data.push('after');
        }
        return data;
    },200));

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
