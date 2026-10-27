import assert from 'node:assert/strict';
import sharp from 'sharp';
import fs from 'node:fs';
import {svgEffects} from './svg-effects.mjs';
const render=async effects=>sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><defs>${svgEffects(effects,40,40,'effect')}</defs><g transform="translate(20 20)"><rect width="40" height="40" fill="white" filter="url(#effect)"/></g></svg>`)).ensureAlpha().raw().toBuffer();
const pixel=(b,x,y)=>[...b.subarray((y*80+x)*4,(y*80+x)*4+4)];
const shadow={type:'INNER_SHADOW',offset:{x:8,y:0},radius:0,spread:0,color:{r:0,g:0,b:0,a:1}};
const inner=await render([shadow]);
assert(pixel(inner,22,40)[0]<10,'Inset shadow must darken inside left edge');
assert(pixel(inner,40,40)[0]>245,'Inset shadow must preserve center');
assert.equal(pixel(inner,18,40)[3],0,'Inset shadow must not escape shape');
const multiple=await render([{...shadow,type:'DROP_SHADOW',offset:{x:-8,y:0},showShadowBehindNode:true,color:{r:1,g:0,b:0,a:1}},{...shadow,type:'DROP_SHADOW',offset:{x:8,y:0},showShadowBehindNode:true,color:{r:0,g:0,b:1,a:1}}]);
assert(pixel(multiple,15,40)[0]>245&&pixel(multiple,15,40)[3]>245,'First drop shadow must render');
assert(pixel(multiple,65,40)[2]>245&&pixel(multiple,65,40)[3]>245,'Second drop shadow must render');
const overlap=await render([{...shadow,type:'DROP_SHADOW',offset:{x:8,y:0},showShadowBehindNode:true,color:{r:1,g:0,b:0,a:1}},{...shadow,type:'DROP_SHADOW',offset:{x:8,y:0},showShadowBehindNode:true,color:{r:0,g:0,b:1,a:1}}]);
assert(pixel(overlap,65,40)[0]>245&&pixel(overlap,65,40)[2]<10,'First listed outer shadow must be above the second');
const blur=await render([{type:'FOREGROUND_BLUR',radius:8}]);
assert(pixel(blur,18,40)[3]>0&&pixel(blur,18,40)[3]<255,'Layer blur must soften silhouette');
assert.equal(svgEffects([{...shadow,visible:false}],40,40,'hidden'),'');
// This source widget has an opaque purple fill with a black-to-gray
// additive highlight. Treating that highlight as normal paint turns it black.
const widget=JSON.parse(fs.readFileSync(new URL('../shared/assets/components/144-109472.json',import.meta.url)));
const {data:widgetPixels,info}=await sharp(Buffer.from(widget.light.svg)).ensureAlpha().raw().toBuffer({resolveWithObject:true});
const center=(Math.floor(info.height/2)*info.width+Math.floor(info.width/2))*4;
assert(widgetPixels[center+2]>160&&widgetPixels[center]>70,'Additive gradient must preserve the source purple widget fill');
console.log('Passed rendered-pixel checks: inset shadow, multiple outer shadows, layer blur, hidden effects.');
