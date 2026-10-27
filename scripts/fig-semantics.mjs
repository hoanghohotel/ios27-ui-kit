export const guid = g => g ? `${g.sessionID}:${g.localID}` : '';

// Fractional Figma indices use ordinal string ordering, not locale collation.
export function sortLayers(nodes) {
  return [...nodes].sort((a,b)=>{
    const x=a.parentIndex?.position??'',y=b.parentIndex?.position??'';
    return x<y?-1:x>y?1:0;
  });
}

export function paintOpacity(p,color) {
  // The serialized paint opacity caches the variable's alpha. Multiplying
  // both makes e.g. a 12% fill only 1.44% opaque.
  return p.colorVar ? color?.a??1 : (p.opacity??1)*(color?.a??1);
}

export function variantProperties(node) {
  return Object.fromEntries((node.name??'').split(/,\s*/).filter(s=>s.includes('=')).map(s=>{
    const i=s.indexOf('=');return [s.slice(0,i).trim(),s.slice(i+1).trim()];
  }).filter(([,v])=>v!==''));
}

export function resolveInstanceMaster(node,map,kids,resolveValue,modes) {
  const original=map.get(guid(node.symbolData?.symbolID));
  const explicit=map.get(guid(node.overriddenSymbolID));
  let master=explicit??original;
  if(!master)return {original,master};
  const desired={...variantProperties(master)};
  let bound=false;
  for(const e of node.variableConsumptionMap?.entries??[]) {
    if(e.variableField!=='VARIANT_PROPERTIES')continue;
    const expr=e.variableData?.value?.expressionValue;
    if(expr?.expressionFunction!=='RESOLVE_VARIANT')continue;
    for(const arg of expr.expressionArguments??[])for(const v of arg.value?.mapValue?.values??[]){
      const value=resolveValue(v.value,modes);
      if(value!==undefined){desired[v.key]=String(value);bound=true;}
    }
  }
  if(bound){
    const siblings=kids.get(guid(master.parentIndex?.guid))??[];
    master=siblings.find(n=>n.type==='SYMBOL'&&Object.entries(desired).every(([k,v])=>variantProperties(n)[k]===v))??master;
  }
  return {original,master};
}

// Preserve layout/text overrides when switching to an appearance sibling.
export function counterpartIds(from,to,kids,result=new Map()) {
  result.set(guid(from.guid),guid(to.guid));
  const a=kids.get(guid(from.guid))??[],b=kids.get(guid(to.guid))??[];
  const used=new Set();
  for(const child of a){
    const match=b.find(n=>!used.has(n)&&n.type===child.type&&n.name===child.name);
    if(match){used.add(match);counterpartIds(child,match,kids,result);}
  }
  return result;
}
