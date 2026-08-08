const fs = require('fs');

function generateDrip(width) {
  let path = "M 0,0 L " + width + ",0 L " + width + ",30 ";
  
  // Drip properties
  let x = width;
  let minW = 20, maxW = 80;
  
  while (x > 0) {
    let w = Math.random() * (maxW - minW) + minW; // Width of this segment
    if (x - w < 0) w = x;
    
    // Choose if it's a deep drip or shallow wave
    let isDrip = Math.random() > 0.4;
    let depth = isDrip ? Math.random() * 100 + 40 : Math.random() * 20 + 20;
    
    // Smooth transition from the top down to the tip
    let p1x = x - w * 0.2;
    let p1y = 30; // Control point 1 (starts moving down)
    
    let p2x = x - w * 0.4;
    let p2y = depth; // Control point 2 (at the tip)
    
    let tipX = x - w * 0.5;
    let tipY = depth; // Tip of the drip
    
    // From tip back up
    let p3x = x - w * 0.6;
    let p3y = depth;
    
    let p4x = x - w * 0.8;
    let p4y = 30;
    
    let endX = x - w;
    let endY = 30;
    
    // Cubic bezier to tip
    path += `C ${p1x.toFixed(1)},${p1y.toFixed(1)} ${p2x.toFixed(1)},${tipY.toFixed(1)} ${tipX.toFixed(1)},${tipY.toFixed(1)} `;
    // Cubic bezier from tip
    path += `C ${p3x.toFixed(1)},${tipY.toFixed(1)} ${p4x.toFixed(1)},${endY.toFixed(1)} ${endX.toFixed(1)},${endY.toFixed(1)} `;
    
    x -= w;
  }
  
  path += "L 0,30 Z";
  return path;
}

const pathStr = generateDrip(1440);
console.log(pathStr);
