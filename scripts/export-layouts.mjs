import {guid} from './fig-semantics.mjs';
import crypto from 'node:crypto';

export const restoredPages=['Segmented Controls','Activity Views','Face ID','Layout Guides','Popovers','Tab Bars','Toggles','Windows'];

export function exportLayouts({doc,kids,catalogue,exportNode,baseModes,blobPath,json,matrix,mul,color,num}) {
  const summaries=[];
  const colors=doc.nodes.find(n=>n.type==='VARIABLE_SET'&&n.name==='Colors'&&!n.isSoftDeleted);
  const modeName=id=>colors?.variableSetModes.find(m=>guid(m.id)===id)?.name.toLowerCase();
  for(const page of doc.nodes.filter(n=>n.type==='CANVAS'&&restoredPages.includes(n.name))){
    const slug=page.name.toLowerCase().replaceAll(' ','-');let componentCount=0,instanceCount=0;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    function walk(n,parentModes={},world=[1,0,0,1,0,0]){
      if(n.visible===false||n.opacity===0)return null;
      const id=guid(n.guid),transform=matrix(n.transform),absolute=mul(world,transform);
      const width=n.size?.x||0,height=n.size?.y||0;
      for(const [x,y] of [[0,0],[width,0],[0,height],[width,height]]){
        const px=absolute[0]*x+absolute[2]*y+absolute[4],py=absolute[1]*x+absolute[3]*y+absolute[5];
        minX=Math.min(minX,px);minY=Math.min(minY,py);maxX=Math.max(maxX,px);maxY=Math.max(maxY,py);
      }
      const modes={...parentModes};for(const e of n.variableModeBySetMap?.entries||[])modes[guid(e.variableSetID?.guid)]=guid(e.variableModeID);
      const appearance=modeName(modes[guid(colors?.guid)]);
      const item={id,name:n.name,type:n.type,width,height,transform:transform.map(num),appearance};
      const publicEntry=catalogue.find(e=>e.id===id);
      if(publicEntry){componentCount++;return {...item,componentId:id};}
      const children=kids.get(id)||[];
      const container=children.length>0&&n.type!=='INSTANCE';
      const entry={id:'layout:'+id,page:page.name,group:n.name,name:n.name,properties:{},width,height,file:`layout-${id.replace(':','-')}.json`,warnings:[],textCount:0};
      const source=container?{...n,opacity:1}:n;
      const light=exportNode(source,appearance||'light',{shallow:container,modes:{...baseModes('light'),...modes}});
      const dark=exportNode(source,appearance||'dark',{shallow:container,modes:{...baseModes('dark'),...modes}});
      entry.warnings=[...new Set([...light.warnings,...dark.warnings])];entry.textCount=light.texts.length;
      entry.revision=crypto.createHash('sha256').update(light.svg).update(dark.svg).digest('hex').slice(0,12);
      json('shared/assets/components/'+entry.file,{...entry,light,dark});
      if(n.type==='INSTANCE')instanceCount++;
      return {...item,entry,masterId:guid(n.symbolData?.symbolID)||undefined,opacity:container?n.opacity??1:1,
        clip:container&&n.frameMaskDisabled===false?(n.fillGeometry?.length?n.fillGeometry.map(g=>blobPath(g.commandsBlob)).join(' '):null):null,
        children:container?children.map(c=>walk(c,modes,absolute)).filter(Boolean):[]};
    }
    const nodes=(kids.get(guid(page.guid))||[]).map(n=>walk(n)).filter(Boolean);
    // Leave room for shadows and the visible device bezel outside source frames.
    const margin=80;
    const layout={id:guid(page.guid),name:page.name,slug,background:color(page.backgroundColor),x:num(minX-margin),y:num(minY-margin),width:num(maxX-minX+margin*2),height:num(maxY-minY+margin*2),componentCount,instanceCount,nodes};
    layout.revision=crypto.createHash('sha256').update(JSON.stringify(layout)).digest('hex').slice(0,12);
    json(`shared/assets/layouts/${slug}.json`,layout);
    summaries.push({...layout,nodes:undefined});
  }
  json('shared/layouts.json',summaries);
  console.log(`Reconstructed ${summaries.length} source pages using ${summaries.reduce((s,p)=>s+p.componentCount,0)} component placements and ${summaries.reduce((s,p)=>s+p.instanceCount,0)} instances.`);
}
