const fs = require('fs');

function generateDrip(totalWidth) {
  let path = `M 0,0 L ${totalWidth},0 L ${totalWidth},30 `;
  let x = totalWidth;
  
  while (x > 0) {
    let isDeep = Math.random() > 0.5;
    
    // Valley
    let vw = Math.random() * 20 + 20; // 20 to 40
    if (x - vw < 0) vw = x;
    let vx = x - vw;
    
    // Drip
    let dw = isDeep ? Math.random() * 30 + 30 : Math.random() * 20 + 20;
    if (vx - dw < 0) dw = vx;
    let ex = vx - dw;
    
    // Draw Valley (webbing between drips)
    // Curving up to y=15
    if (vw > 0) {
      let v_cp1x = x - vw * 0.3;
      let v_cp2x = x - vw * 0.7;
      let vy = 10 + Math.random() * 10; // y between 10 and 20
      path += `C ${v_cp1x.toFixed(1)},${vy.toFixed(1)} ${v_cp2x.toFixed(1)},${vy.toFixed(1)} ${vx.toFixed(1)},30 `;
    }
    
    // Draw Drip
    if (dw > 0) {
      let tx = vx - dw / 2; // Tip X
      let y_tip = isDeep ? 80 + Math.random() * 60 : 40 + Math.random() * 20;
      let R = dw * 0.3; // Bulb radius
      
      // Down to tip
      let cp1x_d = vx - dw * 0.1;
      let cp1y_d = 40;
      let cp2x_d = tx + R;
      let cp2y_d = y_tip;
      path += `C ${cp1x_d.toFixed(1)},${cp1y_d.toFixed(1)} ${cp2x_d.toFixed(1)},${cp2y_d.toFixed(1)} ${tx.toFixed(1)},${y_tip.toFixed(1)} `;
      
      // Up from tip
      let cp3x_d = tx - R;
      let cp3y_d = y_tip;
      let cp4x_d = ex + dw * 0.1;
      let cp4y_d = 40;
      path += `C ${cp3x_d.toFixed(1)},${cp3y_d.toFixed(1)} ${cp4x_d.toFixed(1)},${cp4y_d.toFixed(1)} ${ex.toFixed(1)},30 `;
    }
    
    x = ex;
  }
  
  path += "L 0,30 Z";
  return path;
}

const pathStr = generateDrip(1440);
console.log(pathStr);
