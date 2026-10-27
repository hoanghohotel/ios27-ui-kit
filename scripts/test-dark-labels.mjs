import fs from 'node:fs';
import assert from 'node:assert/strict';
import sharp from 'sharp';
const luminance=rgb=>rgb.map(c=>c/255).map(c=>c<=0.04045?c/12.92:((c+0.055)/1.055)**2.4).reduce((s,c,i)=>s+c*[0.2126,0.7152,0.0722][i],0);
const bg=[32,33,38];
for(const id of ['0-10525','5855-4982']){
 const data=JSON.parse(fs.readFileSync(new URL(`../shared/assets/components/${id}.json`,import.meta.url)));
 const label=data.dark.texts.find(t=>t.text==='Section Title');
 assert(label,`Missing header ${id}`);
 const rgb=label.color.slice(1).match(/../g).map(h=>parseInt(h,16));
 const painted=rgb.map((v,i)=>v*label.opacity+bg[i]*(1-label.opacity));
 const contrast=(luminance(painted)+0.05)/(luminance(bg)+0.05);
 assert(contrast>=4.5,`Dark header ${id} contrast ${contrast.toFixed(2)} is unreadable`);
 const {data:pixels}=await sharp(Buffer.from(data.dark.svg)).flatten({background:'#202126'}).raw().toBuffer({resolveWithObject:true});
 assert(pixels.some(v=>v>140),`SVG glyphs must also use readable foreground for ${id}`);
}
console.log('Dark menu headers: semantic text and SVG glyph checks passed; contrast >= 4.5:1.');
