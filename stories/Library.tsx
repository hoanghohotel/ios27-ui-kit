import React, {useEffect,useRef,useState} from 'react';
import {catalogue, type CatalogueEntry} from '../packages/react/src/catalog';
import {KitComponent, KitProvider} from '../packages/react/src/KitComponent';
import './library.css';

const priority=['Buttons','Toggles','Text Fields','Segmented Controls','Sliders','Steppers','Alerts','Menus','Lists','Tab Bars','Product Bezels','Widgets'];
const pages=[...new Set(catalogue.map(e=>e.page))].sort((a,b)=>{
  const ai=priority.indexOf(a),bi=priority.indexOf(b);
  return (ai<0?999:ai)-(bi<0?999:bi)||a.localeCompare(b);
});
const slug=(s:string)=>s.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const link=(page?:string)=>`./?path=/story/${page?'library-'+slug(page)+'--overview':'library-overview--welcome'}`;

function Sample({entry,theme,compact=false}:{entry:CatalogueEntry;theme:'light'|'dark';compact?:boolean}){
  const host=useRef<HTMLDivElement>(null);
  const [available,setAvailable]=useState(compact?138:220);
  useEffect(()=>{const element=host.current;if(!element)return;const observer=new ResizeObserver(([box])=>setAvailable(Math.max(1,box.contentRect.width-24)));observer.observe(element);return ()=>observer.disconnect();},[]);
  const device=!compact&&entry.page==='Product Bezels';
  const scale=Math.min(1,available/entry.width,(compact?90:device?280:180)/entry.height);
  return <KitProvider theme={theme}><div ref={host} className={`library-sample ${theme} ${compact?'compact':''} ${device?'device':''} ${!compact&&entry.height<=80?'small-control':''}`}>
    {!compact&&<span className="library-mode">{theme==='light'?'Light':'Dark'}</span>}
    <KitComponent id={entry.id} scale={scale} theme={theme}/>
  </div></KitProvider>;
}

export function LibraryHome(){
  const [query,setQuery]=useState('');
  const filtered=pages.filter(p=>p.toLowerCase().includes(query.toLowerCase()));
  return <main className="library-shell">
    <header className="library-hero"><div><p className="library-eyebrow">COMPONENT LIBRARY / 01</p><h1>A place for every detail.</h1><p className="library-intro">Explore the iOS & iPadOS UI kit. Every family, variant and appearance, together in one place.</p></div><div className="library-stats"><strong>{catalogue.length.toLocaleString('en-US')}</strong><span>variants · {pages.length} collections</span><span className="library-pill">Light + Dark</span></div></header>
    <div className="library-toolbar"><h2>Collections <span>{pages.length}</span></h2><label className="library-search"><span>Find a collection</span><input type="search" placeholder="Search collections…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
    <div className="library-collections">{filtered.map((page,index)=>{
      const entries=catalogue.filter(e=>e.page===page);
      const example=entries.find(e=>!e.name.startsWith('_')&&!e.group.startsWith('_'))??entries[0];
      return <a className="library-collection" key={page} href={link(page)} target="_top" aria-label={`${page}, ${entries.length} variants`}><div className="library-mini"><Sample entry={example} theme="light" compact/><Sample entry={example} theme="dark" compact/></div><div className="library-collection-label"><div><span className="library-number">{String(pages.indexOf(page)+1).padStart(2,'0')}</span><h3>{page}</h3><p>{entries.length} variants</p></div><span aria-hidden="true">↗</span></div></a>;
    })}</div>
    {!filtered.length&&<p className="library-empty">No collections match “{query}”. Try a different name.</p>}
    <footer className="library-footer">Design catalogue · Original assets, organized for exploration.</footer>
  </main>;
}

export function CollectionBoard({page}:{page:string}){
  const [query,setQuery]=useState(''),[group,setGroup]=useState(''),[limit,setLimit]=useState(24);
  const entries=catalogue.filter(e=>e.page===page);
  const groups=[...new Set(entries.map(e=>e.group))];
  const filtered=entries.filter(e=>(!group||e.group===group)&&`${e.group} ${e.name}`.toLowerCase().includes(query.toLowerCase()));
  const visible=filtered.slice(0,limit);
  return <main className="library-shell">
    <nav className="library-breadcrumb"><a href={link()} target="_top">All collections</a><span>/</span><span>{page}</span></nav>
    <header className="library-hero"><div><p className="library-eyebrow">DESIGN COLLECTION</p><h1>{page}</h1><p className="library-intro">A shared view of every variant. Compare light and dark appearances side by side.</p></div><div className="library-stats"><strong>{entries.length}</strong><span>variants · {groups.length} families</span></div></header>
    <div className="library-toolbar"><label className="library-select">Family<select value={group} onChange={e=>{setGroup(e.target.value);setLimit(24);}}><option value="">All families</option>{groups.map(g=><option key={g}>{g}</option>)}</select></label><label className="library-search"><span>Find a variant</span><input type="search" placeholder="Search variants…" value={query} onChange={e=>{setQuery(e.target.value);setLimit(24);}}/></label></div>
    <p className="library-count">Showing {visible.length} of {filtered.length} variants <span>Previews fit to the board · dimensions shown at original size</span></p>
    {groups.filter(g=>visible.some(e=>e.group===g)).map(g=><section className="library-family" key={g}><div className="library-family-heading"><h2>{g}</h2><span>{filtered.filter(e=>e.group===g).length} variants</span></div><div className={`library-variants ${page==='Product Bezels'?'devices':''}`}>{visible.filter(e=>e.group===g).map(entry=><article className="library-variant" key={entry.id}><div className="library-pair"><Sample entry={entry} theme="light"/><Sample entry={entry} theme="dark"/></div><div className="library-variant-label"><h3>{entry.name}</h3><span>{Math.round(entry.width)} × {Math.round(entry.height)}</span></div></article>)}</div></section>)}
    {!visible.length&&<p className="library-empty">No variants match these filters.</p>}
    {limit<filtered.length&&<div className="library-more"><button onClick={()=>setLimit(n=>n+24)}>Show more variants <span>↓</span></button></div>}
    <footer className="library-footer">{page} · Light & Dark · {entries.length} variants</footer>
  </main>;
}
