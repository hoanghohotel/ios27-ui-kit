import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const catalogue=read('shared/catalogue.json');
const images=read('shared/assets/images.json');
const ids=new Set();
let scenes=0;
for(const entry of catalogue){
  assert(!ids.has(entry.id),`Duplicate ${entry.id}`); ids.add(entry.id);
  const component=read(`shared/assets/components/${entry.file}`);
  assert(component.width>0 && component.height>0,`Invalid bounds ${entry.id}`);
  for(const theme of ['light','dark']){
    const scene=component[theme];
    assert(scene.svg.startsWith('<svg'),`Missing SVG ${entry.id}/${theme}`);
    for(const hash of scene.assets){
      assert(images[hash],`Missing image metadata ${hash}`);
      assert(fs.existsSync(path.join(root,'shared/assets',images[hash].file)),`Missing image ${hash}`);
    }
    assert(!scene.warnings.some(w=>/missing-(master|image)/.test(w)),`Missing source ${entry.id}`);
    scenes++;
  }
}
console.log(JSON.stringify({components:catalogue.length,scenes,images:Object.keys(images).length,status:'passed'},null,2));
