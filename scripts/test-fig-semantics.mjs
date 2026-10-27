import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import {sortLayers,paintOpacity,resolveInstanceMaster} from './fig-semantics.mjs';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p)));
const component=id=>read(`shared/assets/components/${id.replace(':','-')}.json`);
assert.deepEqual(sortLayers(['%',' }N','$','!'].map(position=>({parentIndex:{position}}))).map(n=>n.parentIndex.position),[' }N','!','$','%']);
assert.equal(paintOpacity({colorVar:{},opacity:.12},{a:.24}),.24);
assert.equal(paintOpacity({opacity:.5},{a:.4}),.2);
// An appearance variable selects the matching master without changing other props.
const light={guid:{sessionID:1,localID:1},parentIndex:{guid:{sessionID:1,localID:0}},type:'SYMBOL',name:'Mode=Light, Style=Thick'};
const dark={...light,guid:{sessionID:1,localID:2},name:'Mode=Dark, Style=Thick'};
const instance={symbolData:{symbolID:light.guid},variableConsumptionMap:{entries:[{variableField:'VARIANT_PROPERTIES',variableData:{value:{expressionValue:{expressionFunction:'RESOLVE_VARIANT',expressionArguments:[{value:{mapValue:{values:[{key:'Mode',value:{}}]}}}]}}}}]}};
assert.equal(resolveInstanceMaster(instance,new Map([['1:1',light],['1:2',dark]]),new Map([['1:0',[light,dark]]]),()=> 'Dark',{}).master,dark);

sharp.concurrency(1);
async function pixels(id,theme){
 const data=component(id),scene=data[theme];
 const png=await sharp(Buffer.from(scene.svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
 return {data:png.data,width:png.info.width,height:png.info.height,scene};
}
function count(image,predicate){let total=0;for(let i=0;i<image.data.length;i+=4)if(predicate(...image.data.subarray(i,i+4)))total++;return total;}
for(const theme of ['light','dark']){
 const face=await pixels('123:58197',theme);
 assert(count(face,(r,g,b,a)=>g>180&&g>r*1.3&&a>200)>500,`Face ID checkmark is hidden in ${theme}`);
 const popover=await pixels('0:12354',theme);
 assert.equal(count(popover,(r,g,b,a)=>r>180&&g<50&&b<50&&a>20),0,'Arrow mask must not render red');
 assert(popover.scene.svg.includes('<mask'),'Popover is missing its arrow mask');
 assert(popover.data[(100*popover.width+100)*4+3]>100,'Arrow mask must stop at the clipped Material frame, preserving the popover body');
 if(theme==='dark')assert(popover.data[(100*popover.width+100)*4]>=40,'Dark popover surface must remain visible over a black canvas');
 const tabs=await pixels('3:72207',theme);
 const blue=count(tabs,(r,g,b,a)=>b>180&&r<40&&g>70&&a>200);
 assert(blue>50&&blue<1600,`Tab tint must follow glyphs, not cover a rectangle: ${blue} ${theme}`);
 const segmented=component('488:60882')[theme].svg;
 assert(segmented.includes(`fill-opacity="${theme==='light'?'.12':'.24'}`.replace('".','"0.')),'Segment track alpha was multiplied twice');
 const activity=component('128:58645')[theme];
 const close=activity.texts.find(t=>t.id.includes('/13117:19020/')&&t.name==='Symbol');
 assert.equal(close?.text,'􀆄','Activity View close must retain the outer instance text override');
 const guide=component('12892:62244')[theme];
 assert.equal(guide.texts.filter(t=>t.name==='Time').length,1,'Hidden horizontal status bar must not overlap the vertical status bar');
 assert(!guide.hits.some(h=>h.id.startsWith('12892:62244/12892:61630/12883:6042')),'Hidden leading toolbar must not overlap Title');
}

const summaries=read('shared/layouts.json');assert.equal(summaries.length,8);
let placements=0,instances=0;
const catalogue=read('shared/catalogue.json');
for(const summary of summaries){
 const layout=read(`shared/assets/layouts/${summary.slug}.json`);
 assert(layout.width>0&&layout.height>0);
 function visit(n){
  assert(n.transform.every(Number.isFinite));
  if(n.componentId){assert(catalogue.some(c=>c.id===n.componentId));placements++;}
  if(n.masterId)instances++;
  if(n.entry){const data=read(`shared/assets/components/${n.entry.file}`);assert(data.light.svg&&data.dark.svg);assert(!data.light.warnings.some(w=>w.startsWith('missing-')));}
  n.children?.forEach(visit);
 }
 layout.nodes.forEach(visit);
}
assert.equal(placements,147);assert.equal(instances,49);
const segmentedPage=read('shared/assets/layouts/segmented-controls.json');
assert.deepEqual(segmentedPage.nodes.find(n=>n.id==='2666:17069').transform,[1,0,0,1,500,0]);
assert.equal(segmentedPage.nodes.find(n=>n.id==='2666:17070').appearance,'dark');
console.log('Passed source semantics and pixel regressions: visible Face ID, masked popover/tab glyphs, track alpha, 8 layouts / 147 components / 49 instances.');
