'use client';
import {useContext,useEffect,useRef,useState,type CSSProperties} from 'react';
import {KitComponent,KitContext} from './KitComponent';
import type {CatalogueEntry,ThemeMode} from './catalog';
import layouts from './layouts.json';

export const figmaPages=layouts;
export interface FigmaPlacement {
 id:string;name:string;type:string;width:number;height:number;transform:number[];
 appearance?:ThemeMode;componentId?:string;entry?:CatalogueEntry;masterId?:string;
 opacity?:number;clip?:string|null;children?:FigmaPlacement[];
}
export interface FigmaLayout {name:string;slug:string;x:number;y:number;width:number;height:number;background:string;nodes:FigmaPlacement[]}

function Placement({node,theme}:{node:FigmaPlacement;theme:ThemeMode}){
 const appearance=node.appearance??theme;
 const style:CSSProperties={position:'absolute',left:0,top:0,width:node.width,height:node.height,transform:`matrix(${node.transform.join(',')})`,transformOrigin:'0 0',opacity:node.opacity??1};
 return <div style={style} data-figma-node={node.id} data-master-id={node.masterId}>
  <KitComponent id={node.componentId} entry={node.entry} theme={appearance} label={node.name}/>
  {!!node.children?.length&&<div style={{position:'absolute',inset:0,clipPath:node.clip?`path('${node.clip}')`:undefined}}>{node.children.map(child=><Placement key={child.id} node={child} theme={appearance}/>)}</div>}
 </div>;
}

/** Compose the original design coordinates with reusable KitComponent instances. */
export function FigmaPage({page,theme,showToolbar=true}:{page:string;theme?:ThemeMode;showToolbar?:boolean}){
 const context=useContext(KitContext),appearance=theme??context.theme;
 const summary=figmaPages.find(p=>p.name===page);
 const url=summary?`${context.assetBase}/layouts/${summary.slug}.json?v=${summary.revision}`:'';
 const [loaded,setLoaded]=useState<{url:string;layout:FigmaLayout}|null>(null);
 const [error,setError]=useState(''),[zoom,setZoom]=useState('fit'),[available,setAvailable]=useState(1200);
 const host=useRef<HTMLDivElement>(null);
 useEffect(()=>{if(!url)return;const controller=new AbortController();setError('');
  fetch(url,{signal:controller.signal}).then(r=>{if(!r.ok)throw new Error(`Cannot load design page (${r.status})`);return r.json() as Promise<FigmaLayout>;}).then(layout=>setLoaded({url,layout})).catch(e=>{if(!controller.signal.aborted)setError(String(e));});
  return ()=>controller.abort();
 },[url]);
 useEffect(()=>{if(!host.current)return;const observer=new ResizeObserver(([box])=>setAvailable(Math.max(1,box.contentRect.width)));observer.observe(host.current);return ()=>observer.disconnect();},[]);
 const layout=loaded?.url===url?loaded.layout:null;
 const scale=zoom==='fit'?Math.min(1,available/(summary?.width||1200)):Number(zoom);
 return <section className="figma-page" aria-label={`${page} — Figma layout`}>
  {showToolbar&&<div className="figma-page-toolbar"><p>Original layout <span>Components, examples and spacing from the Figma file</span></p><label>Zoom <select value={zoom} onChange={e=>setZoom(e.target.value)}><option value="fit">Fit width</option><option value="0.5">50%</option><option value="1">100%</option><option value="2">200%</option></select></label></div>}
  <div ref={host} className="figma-page-viewport" tabIndex={0} role="region" aria-label="Design canvas — scroll to explore">
   {error?<p role="alert">{error}</p>:<div className="figma-page-canvas" aria-busy={!layout} style={{position:'relative',width:(summary?.width??1200)*scale,height:(summary?.height??500)*scale,background:summary?.background}}>
    {layout&&<div style={{position:'absolute',width:layout.width,height:layout.height,transform:`scale(${scale})`,transformOrigin:'0 0'}}><div style={{position:'absolute',left:-layout.x,top:-layout.y}}>{layout.nodes.map(node=><Placement key={node.id} node={node} theme={appearance}/>)}</div></div>}
   </div>}
  </div>
 </section>;
}
