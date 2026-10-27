import fs from 'node:fs';import path from 'node:path';
import {fixProductBezels} from './fix-product-bezels.mjs';
const root=path.resolve(import.meta.dirname,'..');
fixProductBezels(root);
const cat=JSON.parse(fs.readFileSync(path.join(root,'shared/catalogue.json'),'utf8'));
const groups=new Map();for(const c of cat){const k=c.page+'/'+c.group;if(!groups.has(k))groups.set(k,{page:c.page,group:c.group,variants:[]});groups.get(k).variants.push(c);}
const pascal=s=>s.replace(/[^a-zA-Z0-9]+/g,' ').trim().split(/\s+/).map(w=>w[0].toUpperCase()+w.slice(1)).join('');
const used=new Set();let react="'use client';\nimport {KitComponent,type KitComponentProps} from './KitComponent';\n";
let dart="import 'component.dart';\n";
const map=[];
for(const [key,g] of groups){let name='Design'+pascal(g.page)+' '+pascal(g.group);name=name.replaceAll(' ','');if(used.has(name))name+=g.variants[0].id.replace(':','_');used.add(name);
 react+=`export function ${name}(props:Omit<KitComponentProps,'group'|'page'>){return <KitComponent {...props} group={${JSON.stringify(g.group)}} page={${JSON.stringify(g.page)}}/>;}\n`;
 const q=s=>"'"+s.replaceAll('\\','\\\\').replaceAll("'","\\'").replaceAll('$','\\$')+"'";
 dart+=`class ${name} extends KitComponent {const ${name}({super.key,super.variant,super.texts,super.actions,super.brightness,super.width,super.scale,super.onPressed,super.label}):super(group:${q(g.group)},page:${q(g.page)});}\n`;
 map.push({export:name,...g});
}
fs.writeFileSync(path.join(root,'packages/react/src/generated.tsx'),react);
fs.copyFileSync(path.join(root,'shared/catalogue.json'),path.join(root,'packages/react/src/catalogue.json'));
fs.copyFileSync(path.join(root,'shared/layouts.json'),path.join(root,'packages/react/src/layouts.json'));
fs.writeFileSync(path.join(root,'packages/flutter/lib/src/generated.dart'),dart);
fs.mkdirSync(path.join(root,'packages/flutter/assets'),{recursive:true});
for(const f of ['catalogue.json','tokens.json'])fs.copyFileSync(path.join(root,'shared',f),path.join(root,'packages/flutter/assets',f));
fs.cpSync(path.join(root,'shared/assets'),path.join(root,'packages/flutter/assets'),{recursive:true});
fs.writeFileSync(path.join(root,'shared/component-exports.json'),JSON.stringify(map));
console.log(`Generated ${groups.size} named component exports for both frameworks.`);
