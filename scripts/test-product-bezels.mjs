import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
const root=path.resolve(import.meta.dirname,'..');
const entries=JSON.parse(fs.readFileSync(path.join(root,'shared/catalogue.json'))).filter(e=>e.page==='Product Bezels');
assert.equal(entries.length,36);
for(const entry of entries){
  const data=JSON.parse(fs.readFileSync(path.join(root,'shared/assets/components',entry.file)));
  assert(entry.screenRect,`Missing original screen frame: ${entry.id}`);
  for(const mode of ['light','dark']){
    assert(data[mode].svg.includes(`viewBox="0 0 ${entry.width} ${entry.height}"`));
    for(const hit of data[mode].hits){
      assert(hit.x>=-0.001 && hit.y>=-0.001,`Clipped origin ${entry.id}`);
      assert(hit.x+hit.width<=entry.width+0.001 && hit.y+hit.height<=entry.height+0.001,`Clipped edge ${entry.id}`);
    }
  }
}
const phone=entries.find(e=>e.id==='6316:14139');
assert.deepEqual([phone.width,phone.height],[450,920]);
assert.deepEqual(phone.screenRect,{x:24,y:23,width:402,height:874});
const ipad=entries.find(e=>e.id==='487:11227');
assert.deepEqual([ipad.width,ipad.height],[1320,940]);
console.log('Passed: 36 bezels / 72 appearances preserve full device bounds and original screen geometry.');
