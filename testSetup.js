import * as d3 from 'd3';

global.d3 = { ...d3 }; // copy to prevent errors like "TypeError: Cannot set property axisTop of #<Object> which has only a getter"
