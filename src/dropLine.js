import drop from './drop';
import indicator from './indicator';

export default (config, xScale) => selection => {
    const {
        metaballs,
        label: {
            text: labelText,
            padding: labelPadding,
            onMouseOver: labelOnMouseOver,
            onMouseOut: labelOnMouseOut,
            onClick: labelOnClick,
            width: labelWidth,
        },
        line: { color: lineColor, height: lineHeight },
        indicator: indicatorEnabled,
    } = config;

    const lines = selection.selectAll('.drop-line').data(d => d);

    const g = lines

        .join('g')
        .classed('drop-line', true)
        .attr('fill', lineColor)
        .attr('transform', (_, index) => `translate(0, ${index * lineHeight})`);

    g.selectAll('.line-separator').data(d => [d])
        .join('line')
        .classed('line-separator', true)
        .attr('x1', labelWidth)
        .attr('x2', '100%')
        .attr('y1', () => lineHeight)
        .attr('y2', () => lineHeight);

    const drops = g.selectAll('.drops').data(d => [d])
        .join('g')
        .classed('drops', true)
        .attr('transform', () => `translate(${labelWidth}, ${lineHeight / 2})`)
        // .call(throttle(drop(config, xScale),200));

        
    drops.selectAll('rect').data(d => [d])
        .join('rect') // The rect allow us to size the drops g element
        .attr('x', 0)
        .attr('y', -config.line.height / 2)
        .attr('width', 1) // For the rect to impact its parent size it must have a non zero width
        .attr('height', config.line.height)
        .attr('fill', 'transparent');

    if (metaballs) {
        drops.style('filter', 'url(#metaballs)');
    }

    g.selectAll('.line-label').data(d => [d])
        .join('text')
        .classed('line-label', true)
        .attr('x', labelWidth - labelPadding)
        .attr('y', lineHeight / 2)
        .attr('dy', '0.25em')
        .attr('text-anchor', 'end')
        .text(labelText)
        .on('mouseover', labelOnMouseOver)
        .on('mouseout', labelOnMouseOut)
        .on('click', labelOnClick);

    lines.selectAll('.line-label').text(labelText);
    drops.call(drop(config, xScale));

    if (indicatorEnabled) {
        g.selectAll('.indicators').data(d => [d])
            .join('g')
            .classed('indicators', true)
            .call(indicator(config, xScale));

        lines.selectAll('.indicators').call(indicator(config, xScale));
    }

    lines.exit().remove();
};
