import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const catalogue=JSON.parse(fs.readFileSync(path.join(root,'shared/catalogue.json')));
const groups=new Map();
for(const entry of catalogue){if(!groups.has(entry.page))groups.set(entry.page,[]);groups.get(entry.page).push(entry);}
const target=path.join(root,'stories/generated');fs.mkdirSync(target,{recursive:true});
for(const [page,entries] of groups){
  fs.writeFileSync(path.join(target,page.replace(/[^a-z0-9]+/gi,'-')+'.overview.stories.tsx'),`import React from 'react';\nimport {CollectionBoard} from '../Library';\nexport default {title:${JSON.stringify('Library/'+page)},parameters:{layout:'fullscreen',libraryBoard:true,chromatic:{disableSnapshot:true}}};\nexport const Overview={render:()=> <CollectionBoard page=${JSON.stringify(page)}/>};\n`);
  let source=`import React from 'react';\nimport {expect,waitFor} from 'storybook/test';\nimport {KitComponent} from '../../packages/react/src/KitComponent';\nexport default {title:${JSON.stringify('Design/'+page)},parameters:{chromatic:{disableSnapshot:true}},play:async({canvasElement})=>{await waitFor(()=>expect(canvasElement.querySelector('.kit-component')).toHaveAttribute('aria-busy','false'),{timeout:15000});const images=Array.from(canvasElement.querySelectorAll('svg image'));await Promise.all(images.map(el=>new Promise<void>((resolve,reject)=>{const img=new Image();img.onload=()=>resolve();img.onerror=()=>reject(new Error('Image failed to load'));img.src=el.getAttribute('href')!;})));}};\n`;
  for(const entry of entries){
    // Capture every variant at its design size; scaling to 420px hid small defects.
    for(const theme of ['light','dark'])source+=`export const V${entry.id.replace(':','_')}${theme}={name:${JSON.stringify(entry.group+' / '+entry.name+' / '+theme)},globals:{theme:${JSON.stringify(theme)}},parameters:{chromatic:{disableSnapshot:false,viewports:[${Math.max(800,Math.ceil(entry.width+64))}]}},render:()=> <KitComponent id=${JSON.stringify(entry.id)}/>};\n`;
  }
  fs.writeFileSync(path.join(target,page.replace(/[^a-z0-9]+/gi,'-')+'.stories.tsx'),source);
}
console.log(`Generated ${catalogue.length*2} light/dark catalogue stories across ${groups.size} collections.`);
