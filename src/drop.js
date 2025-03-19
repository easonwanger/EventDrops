import {uniqBy,sortedUniqBy} from 'lodash';
import {sortField} from './config';
import * as Comlink from "comlink";

const filterOverlappingDrop = (xScale) => d =>{
    const uniq = sortedUniqBy(d.data, data =>{
        return  Math.round(xScale(data[sortField]))
         })
    // console.log('uniq',uniq)    
    return uniq;
}
    

export default (config, xScale) => selection => {
    const {
        drop: {
            color: dropColor,
            radius: dropRadius,
            date: dropDate,
            onClick,
            onMouseOver,
            onMouseOut,
        },
    } = config;

    const drops = selection
        .selectAll('.drop')
        .data(filterOverlappingDrop(xScale));

    drops
        .enter()
        .append('circle')
        .classed('drop', true)
        .on('click', onClick)
        .on('mouseover', onMouseOver)
        .on('mouseout', onMouseOut)
        .merge(drops)
        .attr('r', dropRadius)
        .attr('fill', dropColor)
        .attr('cx', d => xScale(dropDate(d)));

    drops
        .exit()
        .on('click', null)
        .on('mouseover', null)
        .on('mouseout', null)
        .remove();
};
