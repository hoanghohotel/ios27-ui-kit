import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {fileURLToPath} from 'node:url';

// Figma bezel components use screen-sized frames with clipping disabled.
// Include their overflowing image layers in the standalone export canvas.
export function fixProductBezels(root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..')) {
  const cataloguePath=path.join(root,'shared/catalogue.json');
  const catalogue=JSON.parse(fs.readFileSync(cataloguePath,'utf8'));
  let changed=0;
  for (const entry of catalogue.filter(e=>e.page==='Product Bezels')) {
    if (entry.screenRect) continue;
    const file=path.join(root,'shared/assets/components',entry.file);
    const data=JSON.parse(fs.readFileSync(file,'utf8'));
    const layers=data.light.hits.filter(h=>h.id!==entry.id);
    assert(layers.length===1 && data.light.assets.length===1 && data.light.texts.length===0,
      `Review changed bezel structure: ${entry.id}`);
    const layer=layers[0];
    const x=Math.min(0,layer.x),y=Math.min(0,layer.y);
    const width=Math.max(entry.width,layer.x+layer.width)-x;
    const height=Math.max(entry.height,layer.y+layer.height)-y;
    const screenRect={x:-x,y:-y,width:entry.width,height:entry.height};
    for (const theme of ['light','dark']) {
      const scene=data[theme];
      scene.svg=scene.svg.replace(/(<svg\b[^>]*?) width="[^"]+" height="[^"]+" viewBox="[^"]+"/,
        `$1 width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"`)
        .replace('</defs>',`</defs><g transform="translate(${-x} ${-y})">`)
        .replace('</svg>','</g></svg>');
      scene.hits=scene.hits.map(h=>({...h,x:h.x-x,y:h.y-y}));
    }
    Object.assign(entry,{width,height,screenRect});
    Object.assign(data,{width,height,screenRect});
    fs.writeFileSync(file,JSON.stringify(data));
    changed++;
  }
  if(changed)fs.writeFileSync(cataloguePath,JSON.stringify(catalogue));
  return changed;
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  console.log(`Corrected ${fixProductBezels()} Product Bezels canvases.`);
