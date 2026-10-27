import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {parseFig,getBlobBytes,resolveGradientGeometry} from 'openfig-core';
import {svgEffects} from './svg-effects.mjs';
import {sortLayers,paintOpacity,resolveInstanceMaster,counterpartIds,variantProperties} from './fig-semantics.mjs';
import {exportLayouts} from './export-layouts.mjs';

const source=process.argv[2];
if(!source)throw new Error('Usage: node scripts/export-fig.mjs source.fig [output-directory]');
const out=path.resolve(process.argv[3] || path.join(import.meta.dirname,'..'));
const doc=parseFig(new Uint8Array(fs.readFileSync(source)));
const gid=g=>g?`${g.sessionID}:${g.localID}`:'';
const map=doc.nodeMap, kids=doc.childrenMap;
for(const [id,children] of kids)kids.set(id,sortLayers(children));
const write=(f,s)=>{fs.mkdirSync(path.dirname(path.join(out,f)),{recursive:true});fs.writeFileSync(path.join(out,f),s);};
const json=(f,s)=>write(f,JSON.stringify(s));
const pageOf=n=>n?.type==='CANVAS'?n:n?.parentIndex?pageOf(map.get(gid(n.parentIndex.guid))):null;
const esc=s=>String(s??'').replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const num=x=>Number.isFinite(x)?Math.round(x*100000)/100000:0;
const matrix=t=>t?[t.m00,t.m10,t.m01,t.m11,t.m02,t.m12]:[1,0,0,1,0,0];
const mul=(a,b)=>[a[0]*b[0]+a[2]*b[1],a[1]*b[0]+a[3]*b[1],a[0]*b[2]+a[2]*b[3],a[1]*b[2]+a[3]*b[3],a[0]*b[4]+a[2]*b[5]+a[4],a[1]*b[4]+a[3]*b[5]+a[5]];
const identity=[1,0,0,1,0,0];
const paths=new Map();
function blobPath(i){
 if(paths.has(i))return paths.get(i);
 const b=getBlobBytes(doc,i); if(!b)return '';
 const v=new DataView(b.buffer,b.byteOffset,b.byteLength);let at=0,s='';
 while(at<b.length){const c=b[at++];if(c===0){if(s)s+='Z';continue;}const count=c===1||c===2?2:c===3?4:c===4?6:0;if(!count||at+count*4>b.length)break;s+=c===1?'M':c===2?'L':c===3?'Q':'C';let a=[];for(let j=0;j<count;j++){a.push(num(v.getFloat32(at,true)));at+=4;}s+=a.join(' ');}
 paths.set(i,s);return s;
}
function resolveValue(data,modes,seen=new Set()){
 const v=data?.value;if(!v)return undefined;
 if(v.alias){const id=gid(v.alias.guid);if(seen.has(id))return undefined;seen.add(id);const n=map.get(id);const set=map.get(gid(n?.variableSetID?.guid));const mode=modes[gid(set?.guid)]||gid(set?.variableSetModes?.[0]?.id);const values=n?.variableDataValues?.entries||[];return resolveValue((values.find(e=>gid(e.modeID)===mode)||values[0])?.variableData,modes,seen);}
 return v.colorValue??v.floatValue??v.textValue??v.boolValue??v.textDataValue;
}
const activeVariables=doc.nodes.filter(n=>n.type==='VARIABLE'&&!n.isSoftDeleted);
const sets=doc.nodes.filter(n=>n.type==='VARIABLE_SET'&&!n.isSoftDeleted);
const baseModes=theme=>Object.fromEntries(sets.map(s=>[gid(s.guid),gid((s.variableSetModes.find(m=>m.name.toLowerCase()===theme)||s.variableSetModes[0])?.id)]));
const tokens=activeVariables.map(n=>({id:gid(n.guid),name:n.name,type:n.variableResolvedType,collection:map.get(gid(n.variableSetID?.guid))?.name,collectionId:gid(n.variableSetID?.guid),values:(n.variableDataValues?.entries||[]).map(e=>({mode:map.get(gid(n.variableSetID?.guid))?.variableSetModes?.find(m=>gid(m.id)===gid(e.modeID))?.name||gid(e.modeID),value:resolveValue(e.variableData,{...baseModes('light'),[gid(n.variableSetID?.guid)]:gid(e.modeID)})}))}));
json('shared/tokens.json',tokens);
json('shared/collections.json',sets.map(s=>({id:gid(s.guid),name:s.name,modes:s.variableSetModes.map(m=>({id:gid(m.id),name:m.name}))})));
const color=c=>c?`#${[c.r,c.g,c.b].map(v=>Math.max(0,Math.min(255,Math.round(v*255))).toString(16).padStart(2,'0')).join('')}`:'#000000';
const imageInfo={};
for(const [hash,bytes]of doc.images){let mime=bytes[0]===137?'image/png':bytes[0]===255?'image/jpeg':String.fromCharCode(...bytes.slice(0,4))==='RIFF'?'image/webp':'application/octet-stream';let ext=mime.split('/')[1];imageInfo[hash]={mime,file:`images/${hash}.${ext}`,bytes:bytes.length};write(`shared/assets/${imageInfo[hash].file}`,bytes);}
json('shared/assets/images.json',imageInfo);
const allWarnings=[];
function exportNode(root,theme,{shallow=false,modes:initialModes}={}){
 let defs=[],texts=[],hits=[],assets=new Set(),warnings=new Set(),serial=0,rendered=0;
 // Vibrant label values are blend operands, not standalone foreground colors.
 // SVG/Flutter exports lack native material compositing. Use semantic labels
 // in dark appearance, retaining a readable minimum alpha for tertiary text.
 function paintColor(p,n,modes){
  const resolved=resolveValue(p.colorVar,modes)||p.color;
  const variable=map.get(gid(p.colorVar?.value?.alias?.guid));
  if(theme==='dark'&&n.type==='TEXT'&&variable?.name?.startsWith('Labels - Vibrant/')){
   const name=variable.name.replace('Labels - Vibrant/','Labels/');
   const semantic=activeVariables.find(v=>v.name===name&&gid(v.variableSetID?.guid)===gid(variable.variableSetID?.guid));
   if(semantic){const c=resolveValue({value:{alias:{guid:semantic.guid}}},modes);if(c){warnings.add('vibrant-label-semantic-fallback');return {...c,a:Math.max(c.a??1,0.6)};}}
  }
  return resolved;
 }
 const key=()=>`s${++serial}`;
 const propRefs=n=>[...(n.componentPropRefs??[]),...(n.parameterConsumptionMap?.entries??[]).filter(e=>e.variableData?.value?.propRefValue).map(e=>({defID:e.variableData.value.propRefValue.defId,componentPropNodeField:e.variableField}))];
 const overridden=(raw,contexts)=>{
  let n={...raw};const id=gid(n.guid);
  // Outer instance overrides take precedence over nested master defaults.
  for(const ctx of [...contexts].reverse()){const o=ctx.entries.get([...ctx.prefix,id].join('/'));if(o)n={...n,...o};}
  for(const ref of propRefs(n))for(const ctx of [...contexts].reverse()){
   const value=ctx.props?.get(gid(ref.defID));
   if(value!==undefined&&ref.componentPropNodeField==='TEXT_DATA')n.textData=value;
   if(value!==undefined&&ref.componentPropNodeField==='VISIBLE')n.visible=value;
   if(value!==undefined&&ref.componentPropNodeField==='OVERRIDDEN_SYMBOL_ID')n.overriddenSymbolID=value;
  }
  return n;
 };
 const usePath=(i)=>{const d=blobPath(i);if(!d)return '';const k=`p${i}`;if(!defs.some(x=>x.startsWith(`<path id="${k}" `)))defs.push(`<path id="${k}" d="${d}"/>`);return k;};
 function paints(paints,n,modes,geometry){let s='',solidBase=null;for(const original of paints||[]){if(original.visible===false)continue;let p=original;let c=paintColor(p,n,modes);
 if(p.blendMode==='LINEAR_DODGE'&&solidBase){
  const add=over=>({r:Math.min(1,solidBase.r+over.r*(over.a??1)*(p.opacity??1)),g:Math.min(1,solidBase.g+over.g*(over.a??1)*(p.opacity??1)),b:Math.min(1,solidBase.b+over.b*(over.a??1)*(p.opacity??1)),a:1});
  if(p.type==='SOLID'){c=add(c);p={...p,opacity:1};}
  else if(p.type?.startsWith('GRADIENT')){const stops=(p.stops||[]).map(stop=>({position:stop.position,color:add(resolveValue(stop.colorVar,modes)||stop.color)}));p={...p,stops,opacity:1};}
 }
 let fill=color(c);let op=paintOpacity(p,c);
 solidBase=p.type==='SOLID'&&op===1?c:null;
 if(p.type==='IMAGE'){
  const raw=p.image?.hash;const hash=typeof raw==='string'?raw:raw?Buffer.from(raw instanceof Uint8Array?raw:Object.values(raw)).toString('hex'):'';
  if(imageInfo[hash]){assets.add(hash);const clip=key();defs.push(`<clipPath id="${clip}">${geometry('white',1)}</clipPath>`);const w=n.size?.x||1,h=n.size?.y||1,t=p.transform;const changed=t&&(t.m00!==1||t.m11!==1||t.m01!==0||t.m10!==0||t.m02!==0||t.m12!==0);
   if(p.imageScaleMode==='TILE'){const tile=key(),tw=(p.originalImageWidth||20)*(p.scale||1),th=(p.originalImageHeight||20)*(p.scale||1);defs.push(`<pattern id="${tile}" patternUnits="userSpaceOnUse" width="${num(tw)}" height="${num(th)}"><image href="__ASSET_${hash}__" width="${num(tw)}" height="${num(th)}"/></pattern>`);s+=geometry(`url(#${tile})`,p.opacity??1);}
   else if(changed){const det=t.m00*t.m11-t.m01*t.m10;if(Math.abs(det)>.000001){const a=t.m11/det,b=-t.m10/det,c=-t.m01/det,d=t.m00/det,e=(t.m01*t.m12-t.m11*t.m02)/det,f=(t.m10*t.m02-t.m00*t.m12)/det;s+=`<g clip-path="url(#${clip})"><image href="__ASSET_${hash}__" width="1" height="1" preserveAspectRatio="none" transform="matrix(${[w*a,h*b,w*c,h*d,w*e,h*f].map(num).join(' ')})" opacity="${num(p.opacity??1)}"/></g>`;}else warnings.add('singular-image-transform');}
   else s+=`<image href="__ASSET_${hash}__" x="0" y="0" width="${num(w)}" height="${num(h)}" preserveAspectRatio="${p.imageScaleMode==='STRETCH'?'none':p.imageScaleMode==='FIT'?'xMidYMid meet':'xMidYMid slice'}" opacity="${num(p.opacity??1)}" clip-path="url(#${clip})"/>`;
  }else warnings.add('missing-image:'+hash);continue;
 }
 if(p.type?.startsWith('GRADIENT')){
  const k=key();let g;try{g=resolveGradientGeometry({type:p.type==='GRADIENT_LINEAR'?'linear':'radial',transform:p.transform},n.size?.x||1,n.size?.y||1);}catch{};
  const stops=(p.stops||[]).map(t=>{const c=resolveValue(t.colorVar,modes)||t.color;return `<stop offset="${num(t.position)}" stop-color="${color(c)}" stop-opacity="${num(c?.a??1)}"/>`;}).join('');
  if(p.type==='GRADIENT_LINEAR'){const t=p.transform;const x1=g?.start?.x??0,y1=g?.start?.y??0,x2=g?.end?.x??(n.size?.x||1),y2=g?.end?.y??0;defs.push(`<linearGradient id="${k}" gradientUnits="userSpaceOnUse" x1="${num(x1)}" y1="${num(y1)}" x2="${num(x2)}" y2="${num(y2)}">${stops}</linearGradient>`);}
  else{if(g?.type==='radial')defs.push(`<radialGradient id="${k}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="1" gradientTransform="translate(${num(g.center.x)} ${num(g.center.y)}) rotate(${num(g.angle)}) scale(${num(g.radiusX)} ${num(g.radiusY)})">${stops}</radialGradient>`);else defs.push(`<radialGradient id="${k}">${stops}</radialGradient>`);if(p.type!=='GRADIENT_RADIAL')warnings.add('gradient-'+p.type);}
  fill=`url(#${k})`;op=p.opacity??1;
 }
 s+=geometry(fill,op);
 }return s;}
 function visit(raw,contexts=[],world=identity,modes=baseModes(theme),depth=0,rootNode=false,route=''){
  if(depth>48){warnings.add('recursion-limit');return '';}
  let n=overridden(raw,contexts);const id=gid(n.guid);
  if(n.visible===false||n.opacity===0)return '';
  const inherited={...modes};for(const e of n.variableModeBySetMap?.entries||[])inherited[gid(e.variableSetID?.guid)]=gid(e.variableModeID);
  modes=inherited;
  if(n.type==='INSTANCE'){
   const {original,master}=resolveInstanceMaster(n,map,kids,resolveValue,modes);if(!master){warnings.add('missing-master:'+gid(n.symbolData?.symbolID));return '';}
   const switched=original&&master!==original;
   const remap=switched?counterpartIds(original,master,kids):new Map();
   const propRemap=new Map();
   for(const [a,b] of remap)for(const ref of propRefs(map.get(a))){const peer=propRefs(map.get(b)).find(r=>r.componentPropNodeField===ref.componentPropNodeField);if(peer)propRemap.set(gid(ref.defID),gid(peer.defID));}
   const remapProps=props=>new Map([...(props??[])].map(([k,v])=>[propRemap.get(k)||k,v]));
   const remapKey=k=>k.split('/').map(id=>remap.get(id)||id).join('/');
   const entries=new Map();for(const o of [...(n.derivedSymbolData||[]),...(n.symbolData?.symbolOverrides||[])]){const k=o.guidPath?.guids?.map(gid).join('/');if(k)entries.set(k,{...entries.get(k),...o});}
   if(switched){for(const [k,o]of [...entries]){entries.delete(k);entries.set(remapKey(k),o);}for(const field of ['fillPaints','strokePaints','effects','variableModeBySetMap'])delete n[field];}
   const masterOverride=entries.get(gid(master.guid))||{};entries.delete(gid(master.guid));
   const actual={...master,...masterOverride,...n,type:'RESOLVED_INSTANCE',resolvedMaster:master};
   const props=new Map((n.componentPropAssignments??[]).map(a=>[gid(a.defID),resolveValue(a.varValue,modes)??a.value?.textValue??a.value?.boolValue]));
   const nested=contexts.map(c=>({...c,entries:switched?new Map([...c.entries].map(([k,v])=>[remapKey(k),v])):c.entries,props:remapProps(c.props),prefix:[...c.prefix,id]}));nested.push({entries,props:remapProps(props),prefix:[]});
   return render(actual,kids.get(gid(master.guid))||[],nested,world,modes,depth,rootNode,route||id);
  }
  return render(n,kids.get(id)||[],contexts,world,modes,depth,rootNode,route||id);
 }
 function render(n,children,contexts,world,modes,depth,rootNode,route){
  const material=n.resolvedMaster??n;
  if(map.get(gid(material.parentIndex?.guid))?.name==='_Materials/Mode Options'&&variantProperties(material).Mode==='Dark'){
   // Native backdrop compositing is unavailable in the portable SVG scenes.
   // A black tint alone disappears over a black Dark example. Use the source
   // elevated surface token as a documented opaque material fallback.
   const token=activeVariables.find(v=>v.name==='Backgrounds/Secondary - Elevated');
   const surface=token&&resolveValue({value:{alias:{guid:token.guid}}},baseModes('dark'));
   if(surface){n={...n,fillPaints:[{type:'SOLID',color:surface,opacity:1}]};warnings.add('dark-material-elevated-surface-fallback');}
  }
  rendered++;const local=rootNode?identity:matrix(n.transform);const absolute=mul(world,local);const w=n.size?.x||n.derivedTextData?.layoutSize?.x||0,h=n.size?.y||n.derivedTextData?.layoutSize?.y||0;const id=gid(n.guid);const uid=key();
  hits.push({id:route,name:n.name,x:num(absolute[4]),y:num(absolute[5]),width:num(w*Math.hypot(absolute[0],absolute[1])),height:num(h*Math.hypot(absolute[2],absolute[3]))});
  let own='',inside='';
  function geo(refs,stroke=false){return (fill,opacity)=>{if(refs?.length)return refs.map(g=>{const k=usePath(g.commandsBlob);return k?`<use href="#${k}" fill="${fill}" fill-opacity="${num(opacity)}" fill-rule="${g.windingRule==='ODD'?'evenodd':'nonzero'}"/>`:'';}).join('');const r=num(n.cornerRadius||0);if(n.type==='ELLIPSE')return `<ellipse cx="${num(w/2)}" cy="${num(h/2)}" rx="${num(w/2)}" ry="${num(h/2)}" fill="${fill}" fill-opacity="${num(opacity)}"/>`;return `<rect width="${num(w)}" height="${num(h)}" rx="${r}" ${stroke?`fill="none" stroke="${fill}" stroke-width="${num(n.strokeWeight||1)}" stroke-opacity`:`fill="${fill}" fill-opacity`}="${num(opacity)}"/>`;};}
  if(n.type==='TEXT'){
   const glyphs=n.derivedTextData?.glyphs||[];const txt=n.textData?.characters||'';
   const col=n.fillPaints?.[0]?paintColor(n.fillPaints[0],n,modes):undefined;
   const textId=`t${texts.length}`;
   texts.push({key:textId,id:route,name:n.name,text:txt,x:num(absolute[4]),y:num(absolute[5]),width:num(w),height:num(h),fontSize:n.fontSize||17,fontFamily:n.fontName?.family||'sans-serif',fontWeight:n.derivedTextData?.fontMetaData?.[0]?.fontWeight||400,lineHeight:n.lineHeight?.units==='PIXELS'?n.lineHeight.value:(n.fontSize||17)*1.2,color:color(col),opacity:col?.a??1,align:n.textAlignHorizontal||'LEFT',matrix:absolute.map(num)});
   own=paints(n.fillPaints,n,modes,(fill,opacity)=>glyphs.map(g=>{const k=usePath(g.commandsBlob);return k?`<use href="#${k}" transform="translate(${num(g.position?.x)} ${num(g.position?.y)}) scale(${num(g.fontSize||n.fontSize||17)} ${-num(g.fontSize||n.fontSize||17)})" fill="${fill}" fill-opacity="${num(opacity)}"/>`:'';}).join(''));
   if(!glyphs.length&&txt.trim()){warnings.add('text-without-outlines');own=`<text x="0" y="${num(n.fontSize||17)}" font-size="${num(n.fontSize||17)}" fill="${color(col)}">${esc(txt)}</text>`;}
   own=`<!--${textId}:start--><g>${own}</g><!--${textId}:end-->`;
  }else{
   own=paints(n.fillPaints,n,modes,geo(n.fillGeometry));
   own+=paints(n.strokePaints,n,modes,geo(n.strokeGeometry,true));
  }
  const effects=n.effects?.filter(e=>e.visible!==false)||[];
  if(effects.some(e=>e.type==='GLASS'))warnings.add('glass-refraction-approximation');
  if(effects.some(e=>e.type==='BACKGROUND_BLUR'))warnings.add('backdrop-blur-not-baked');
  const neutralSource=n.fillPaints?.length===1&&n.fillPaints[0].blendMode==='MULTIPLY'&&['r','g','b'].every(k=>n.fillPaints[0].color?.[k]===1);
  const f=key(),effectMarkup=svgEffects(effects,w,h,f,{neutralSource});
  if(neutralSource&&!effectMarkup)own='';
  if(neutralSource&&effectMarkup)own=`<!--neutral-source:start-->${own}<!--neutral-source:end-->`;
  let filter='';if(effectMarkup){defs.push(effectMarkup);filter=` filter="url(#${f})"`;warnings.add('svg-filter-platform-difference');}
  if(!(shallow&&rootNode)&&n.type!=='BOOLEAN_OPERATION'&&n.type!=='VECTOR'){
   let activeMask='',masked='';
   const flush=()=>{inside+=activeMask?`<g mask="url(#${activeMask})">${masked}</g>`:masked;masked='';};
   for(const c of children){
    const resolved=overridden(c,contexts);
    const markup=visit(c,contexts,absolute,modes,depth+1,false,`${route}/${gid(c.guid)}`);
    if(resolved.mask&&resolved.visible!==false){flush();activeMask=key();const type=resolved.maskType==='LUMINANCE'?'luminance':'alpha';defs.push(`<mask id="${activeMask}" maskUnits="userSpaceOnUse" x="-100%" y="-100%" width="300%" height="300%" style="mask-type:${type}">${markup}</mask>`);}
    else {
     masked+=markup;
     // Figma ends a sibling mask at a clipped frame/component. Include that
     // frame in the mask, then let subsequent siblings render independently.
     if(activeMask&&resolved.frameMaskDisabled===false&&['FRAME','SYMBOL','INSTANCE'].includes(resolved.type)){flush();activeMask='';}
    }
   }
   flush();
  }
  if(n.frameMaskDisabled===false&&inside){const c=key();defs.push(`<clipPath id="${c}">${geo(n.fillGeometry)('white',1)}</clipPath>`);inside=`<g clip-path="url(#${c})">${inside}</g>`;}
  return `<g data-node="${id}" transform="matrix(${local.map(num).join(' ')})" opacity="${num(n.opacity??1)}"${filter}>${own}${inside}</g>`;
 }
 const body=visit(root,[],identity,initialModes??baseModes(theme),0,true);
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${num(root.size?.x)}" height="${num(root.size?.y)}" viewBox="0 0 ${num(root.size?.x)} ${num(root.size?.y)}"><defs>${defs.join('')}</defs>${body}</svg>`;
 return {svg,texts,hits,assets:[...assets],warnings:[...warnings],rendered};
}
const publicSymbols=doc.nodes.filter(n=>n.type==='SYMBOL'&&!['Internal Only Canvas','_Kit Helpers'].includes(pageOf(n)?.name));
const catalogue=[];let i=0;
for(const n of publicSymbols){
 const parent=map.get(gid(n.parentIndex?.guid));const group=parent?.isStateGroup?parent.name:n.name;
 const properties=variantProperties(n);
 const entry={id:gid(n.guid),page:pageOf(n)?.name,group,name:n.name,properties,width:n.size?.x||0,height:n.size?.y||0,file:gid(n.guid).replace(':','-')+'.json'};
 const light=exportNode(n,'light'),dark=exportNode(n,'dark');
 entry.revision=crypto.createHash('sha256').update(light.svg).update(dark.svg).digest('hex').slice(0,12);
 entry.warnings=[...new Set([...light.warnings,...dark.warnings])];entry.textCount=light.texts.length;
 json('shared/assets/components/'+entry.file,{...entry,light,dark});catalogue.push(entry);
 if(++i%100===0)console.log(`${i}/${publicSymbols.length}`);
}
json('shared/catalogue.json',catalogue);
exportLayouts({doc,kids,catalogue,exportNode,baseModes,blobPath,json,matrix,mul,color,num});
json('shared/text-styles.json',doc.nodes.filter(n=>n.styleType==='TEXT').map(n=>({id:gid(n.guid),name:n.name,font:n.fontName,fontSize:n.fontSize,lineHeight:n.lineHeight,letterSpacing:n.letterSpacing})));
const pages=doc.nodes.filter(n=>n.type==='CANVAS'&&n.name!=='Internal Only Canvas').map(p=>({id:gid(p.guid),name:p.name,components:catalogue.filter(c=>c.page===p.name).length}));
json('shared/pages.json',pages);
const license=doc.nodes.filter(n=>pageOf(n)?.name==='License'&&n.textData).map(n=>n.textData.characters).join('\n\n');write('SOURCE-LICENSE.txt',license);
json('shared/extraction-report.json',{source:path.basename(source),sha256:crypto.createHash('sha256').update(fs.readFileSync(source)).digest('hex'),nodeCount:doc.nodes.length,publicComponents:catalogue.length,internalComponents:doc.nodes.filter(n=>n.type==='SYMBOL'&&pageOf(n)?.name==='Internal Only Canvas').length,variables:tokens.length,images:doc.images.size,pages,warnings:catalogue.filter(c=>c.warnings.length).map(c=>({id:c.id,warnings:c.warnings})),verification:'Export integrity only; visual review in progress.'});
console.log(JSON.stringify({components:catalogue.length,variables:tokens.length,images:doc.images.size,warningComponents:catalogue.filter(c=>c.warnings.length).length}));
