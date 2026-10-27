'use client';
import {createContext, useContext, useEffect, useId, useMemo, useState, type CSSProperties, type ReactNode} from 'react';
import {catalogue, findVariant, type ComponentData, type ThemeMode} from './catalog';

const KitContext=createContext({theme:'light' as ThemeMode,assetBase:'/ios27'});
export function KitProvider({children,theme='light',assetBase='/ios27'}:{children:ReactNode;theme?:ThemeMode;assetBase?:string}) {
 return <KitContext.Provider value={{theme,assetBase}}><div className="ios27" data-theme={theme}>{children}</div></KitContext.Provider>;
}
export interface KitComponentProps {
 id?:string; group?:string; page?:string; variant?:Record<string,string|boolean>; theme?:ThemeMode;
 width?:number; scale?:number; texts?:Record<string,string>; actions?:Record<string,()=>void>;
 onPress?:()=>void; label?:string; className?:string; style?:CSSProperties; data?:ComponentData;
 onLoad?:(data:ComponentData)=>void;
}
const cache=new Map<string,Promise<ComponentData>>();
function load(url:string){let p=cache.get(url);if(!p){p=fetch(url).then(r=>{if(!r.ok)throw new Error(`Component could not load (${r.status})`);return r.json() as Promise<ComponentData>}).catch(e=>{cache.delete(url);throw e});cache.set(url,p);}return p;}
const escapeReg=(s:string)=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
export function KitComponent({id,group,page,variant,theme,width,scale=1,texts={},actions={},onPress,label,className='',style,data:provided,onLoad}:KitComponentProps){
 const context=useContext(KitContext);const mode=theme??context.theme;const prefix=useId().replace(/[^a-zA-Z0-9]/g,'');
 const entry=provided??(id?catalogue.find(c=>c.id===id):group?findVariant(group,variant,page):undefined);
 const [loaded,setLoaded]=useState<{url:string;data:ComponentData}|null>(null);const [error,setError]=useState('');
 const url=entry?`${context.assetBase}/components/${entry.file}`:'';
 useEffect(()=>{if(provided||!url)return;let active=true;setError('');load(url).then(data=>{if(active)setLoaded({url,data})}).catch(e=>{if(active)setError(String(e))});return ()=>{active=false}},[url,provided]);
 const data=provided??(loaded?.url===url?loaded.data:undefined);
 useEffect(()=>{if(data)onLoad?.(data)},[data,onLoad]);
 const scene=data?.[mode];
 const rendered=useMemo(()=>{
  if(!scene)return {svg:'',overrides:[]};
  let svg=scene.svg;
  const overrides=scene.texts.filter(t=>texts[t.id]!==undefined||texts[t.name]!==undefined||texts[t.key]!==undefined);
  for(const t of overrides)svg=svg.replace(new RegExp(`<!--${escapeReg(t.key)}:start-->[\\s\\S]*?<!--${escapeReg(t.key)}:end-->`),'');
  svg=svg.replace(/id="([^"]+)"/g,(_,id)=>`id="${prefix}-${id}"`).replace(/href="#([^"]+)"/g,(_,id)=>`href="#${prefix}-${id}"`).replace(/url\(#([^)]+)\)/g,(_,id)=>`url(#${prefix}-${id})`);
  svg=svg.replace(/__ASSET_([a-f0-9]+)__/g,(_,hash)=>`${context.assetBase}/images/${hash}`);
  return {svg,overrides};
 },[scene,texts,prefix,context.assetBase]);
 if(!entry)return <span role="alert">Unknown component</span>;
 const factor=width?width/entry.width:scale;const w=entry.width*factor,h=entry.height*factor;
 if(error)return <span role="alert">{error}</span>;
 const actionHits=scene?.hits.filter(hit=>actions[hit.id]||actions[hit.name])??[];
 return <div className={`kit-component ${className}`} style={{width:w,height:h,...style}} aria-busy={!data}>
  {data?<div className="kit-component-inner" style={{width:entry.width,height:entry.height,transform:`scale(${factor})`}}>
   <div aria-hidden="true" dangerouslySetInnerHTML={{__html:rendered.svg}}/>
   {rendered.overrides.map(t=><span key={t.key} className="kit-text" style={{left:0,top:0,width:t.width,height:t.height,transform:`matrix(${t.matrix.join(',')})`,fontSize:t.fontSize,fontWeight:t.fontWeight,lineHeight:`${t.lineHeight}px`,color:t.color,opacity:t.opacity,textAlign:t.align.toLowerCase() as CSSProperties['textAlign']}}>{texts[t.id]??texts[t.name]??texts[t.key]}</span>)}
   {actionHits.map(hit=><button key={hit.id} type="button" className="kit-hotspot" aria-label={hit.name} style={{left:hit.x,top:hit.y,width:hit.width,height:hit.height}} onClick={actions[hit.id]??actions[hit.name]}/>)}
   {onPress?<button type="button" className="kit-hotspot kit-whole" aria-label={label??entry.group} onClick={onPress}/>:null}
   {!onPress&&!actionHits.length?<span className="kit-sr-only">{label??entry.group}</span>:null}
  </div>:<div className="kit-loading"/>}
 </div>;
}
