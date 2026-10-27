// Compose Figma shadows in list order. Use SourceAlpha for each shadow so
// one effect does not change the silhouette used by subsequent effects.
export function svgEffects(effects, width, height, id) {
  const active=effects.filter(e=>e.visible!==false && ['DROP_SHADOW','INNER_SHADOW','FOREGROUND_BLUR'].includes(e.type));
  if(!active.length)return '';
  const n=x=>Number.isFinite(x)?Math.round(x*100000)/100000:0;
  const color=c=>'#'+['r','g','b'].map(k=>Math.round(Math.max(0,Math.min(1,c?.[k]??0))*255).toString(16).padStart(2,'0')).join('');
  let body='',current='SourceGraphic',serial=0;
  // Outer shadows are inserted behind the current image (front-to-back).
  // Inset shadows are inserted above it (back-to-front); blur applies last.
  const ordered=[...active.filter(e=>e.type==='DROP_SHADOW'),...active.filter(e=>e.type==='INNER_SHADOW').reverse(),...active.filter(e=>e.type==='FOREGROUND_BLUR')];
  for(const e of ordered) {
    const p=`fx${serial++}`,radius=Math.max(0,e.radius??0)/2,spread=e.spread??0;
    if(e.type==='FOREGROUND_BLUR'){body+=`<feGaussianBlur in="${current}" stdDeviation="${n(radius)}" result="${p}"/>`;current=p;continue;}
    const inner=e.type==='INNER_SHADOW';
    let alpha='SourceAlpha';
    if(spread){body+=`<feMorphology in="SourceAlpha" operator="${(spread>0)!==inner?'dilate':'erode'}" radius="${n(Math.abs(spread))}" result="${p}spread"/>`;alpha=`${p}spread`;}
    body+=`<feGaussianBlur in="${alpha}" stdDeviation="${n(radius)}" result="${p}blur"/><feOffset in="${p}blur" dx="${n(e.offset?.x)}" dy="${n(e.offset?.y)}" result="${p}offset"/>`;
    body+=inner?`<feComposite in="SourceAlpha" in2="${p}offset" operator="out" result="${p}mask"/>`:`<feComposite in="${p}offset" in2="SourceAlpha" operator="${e.showShadowBehindNode===true?'over':'out'}" result="${p}mask"/>`;
    // When shadows are allowed behind translucent fills, retain the offset alpha.
    const mask=!inner&&e.showShadowBehindNode===true?`${p}offset`:`${p}mask`;
    body+=`<feFlood flood-color="${color(e.color)}" flood-opacity="${n(e.color?.a??1)}" result="${p}color"/><feComposite in="${p}color" in2="${mask}" operator="in" result="${p}shadow"/>`;
    if(inner&&e.blendMode==='LINEAR_DODGE')body+=`<feComposite in="${p}shadow" in2="${current}" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="${p}"/>`;
    else if(inner&&['MULTIPLY','SCREEN','OVERLAY','DARKEN','LIGHTEN'].includes(e.blendMode))body+=`<feBlend in="${p}shadow" in2="${current}" mode="${e.blendMode.toLowerCase()}" result="${p}"/>`;
    else body+=`<feComposite in="${inner?`${p}shadow`:current}" in2="${inner?current:`${p}shadow`}" operator="over" result="${p}"/>`;
    current=p;
  }
  const pad=Math.max(1,...active.map(e=>Math.abs(e.offset?.x??0)+Math.abs(e.offset?.y??0)+Math.abs(e.spread??0)+Math.max(0,e.radius??0)*3));
  return `<filter id="${id}" filterUnits="userSpaceOnUse" x="${n(-pad)}" y="${n(-pad)}" width="${n(width+pad*2)}" height="${n(height+pad*2)}" color-interpolation-filters="sRGB">${body}</filter>`;
}
