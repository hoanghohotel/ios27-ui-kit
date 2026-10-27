import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
const root=path.resolve(import.meta.dirname,'..');
const cat=JSON.parse(fs.readFileSync(path.join(root,'shared/catalogue.json')));
const images=JSON.parse(fs.readFileSync(path.join(root,'shared/assets/images.json')));
const refs=new Map();
sharp.concurrency(1);
const jobs=cat.flatMap(e=>['light','dark'].map(theme=>({e,theme})));
let next=0,passed=0;const failures=[];
async function worker(){while(next<jobs.length){const {e,theme}=jobs[next++];try{
  const scene=JSON.parse(fs.readFileSync(path.join(root,'shared/assets/components',e.file)))[theme];
  const svg=scene.svg.replace(/__ASSET_([a-f0-9]+)__/g,(_,hash)=>{
    if(!refs.has(hash)){const i=images[hash];refs.set(hash,`data:${i.mime};base64,${fs.readFileSync(path.join(root,'shared/assets',i.file)).toString('base64')}`);}return refs.get(hash);
  });
  // Preserve at least one raster pixel for thin source separators. Large
  // embedded images can exceed libxml's text-node limit; the local input is
  // trusted and output pixel allocation is still bounded explicitly.
  const density=72*Math.max(1/Math.min(e.width,e.height),Math.min(1,160/e.width,160/e.height));
  const {info}=await sharp(Buffer.from(svg),{density,unlimited:true,limitInputPixels:100000000}).png().toBuffer({resolveWithObject:true});
  if(info.width<1||info.height<1)throw new Error('Empty output');
  passed++;
}catch(error){failures.push({id:e.id,theme,error:String(error)});}
if((passed+failures.length)%250===0)console.log(`Rendered ${passed+failures.length}/${jobs.length}`);
}}
await Promise.all(Array.from({length:3},worker));
const report={scenes:jobs.length,passed,failures,renderer:'sharp/librsvg',thumbnailTarget:160,note:'Thumbnail render validity only; thin separators retain at least one pixel. Not pixel parity with Figma or browser/Flutter equivalence.'};
fs.mkdirSync(path.join(root,'docs'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/render-audit.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));if(failures.length)process.exitCode=1;
