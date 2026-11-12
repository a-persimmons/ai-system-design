import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { createMarkdownRenderer } from 'vitepress';
import { chapters, manifest, base } from './site-data.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const dist=path.join(root,'site/.vitepress/dist');
const exists=async p=>{try{await fs.access(p);return true;}catch{return false;}};
const walk=async p=>(await Promise.all((await fs.readdir(p,{withFileTypes:true})).map(async e=>e.isDirectory()?walk(path.join(p,e.name)):[path.join(p,e.name)]))).flat();
const source=(await fs.readFile(path.join(root,'README.md'),'utf8')).split(/\r?\n/);
const markdown=await createMarkdownRenderer(root);
const fences=s=>[...s.matchAll(/^```[^\n]*\n([\s\S]*?)^```/gm)].map(m=>m[1]);
for(const c of chapters){
  const original=source.slice(c.start,c.end).join('\n');
  const zh=await fs.readFile(path.join(root,'translations/zh',`${c.id}.md`),'utf8');
  const tokens=markdown.parse(zh,{});
  assert.equal(tokens.filter(t=>t.type==='table_open').length,markdown.parse(original,{}).filter(t=>t.type==='table_open').length,`Table structure changed: ${c.id}`);
  for(const token of tokens)for(const child of token.children??[])if(child.type==='text'){
    assert(!child.content.includes('**'),`Unrendered bold in ${c.id}`);
    assert(!child.content.includes(']('),`Malformed Markdown link in ${c.id}`);
  }
  assert.deepEqual(fences(zh),fences(original),`Code/diagram changed: ${c.id}`);
  assert.equal(zh.trim().split('\n').length,original.trim().split('\n').length,`Source-line coverage changed: ${c.id}`);
  const required=manifest.headings.filter(h=>h.line>=c.start&&h.line<c.end);
  for(const h of required)assert(zh.includes(`{#${h.anchor}}`),`Missing translated heading ${h.anchor}`);
  for(const en of [false,true]){
    const html=await fs.readFile(path.join(dist,en?'en':'','guide',`${c.id}.html`),'utf8');
    const other=`${base}${en?'':'en/'}guide/${c.id}.html`;
    assert(html.includes(`href="${other}"`),`Missing corresponding-language link ${c.id}`);
    assert(!/QZP\d+PZQ|ZXQS\d+SQXZ/.test(html),`Translation marker left in ${c.id}`);
  }
}
const all=await walk(dist), htmlFiles=all.filter(p=>p.endsWith('.html'));
assert.equal(htmlFiles.length,117,'Expected 110 chapter pages, 6 navigation pages and 404');
const ids=new Map(),contents=new Map();
for(const file of htmlFiles){const s=await fs.readFile(file,'utf8');contents.set(file,s);ids.set(file,new Set([...s.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])));}
const errors=[];let checked=0;
for(const [file,html] of contents){
  for(const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const raw=m[1].replaceAll('&amp;','&');
    if(/^(?:https?:|mailto:|tel:|data:|javascript:|\/\/)/.test(raw))continue;
    const url=new URL(raw,`https://local.test${base}${path.relative(dist,file)}`);
    if(!url.pathname.startsWith(base)){errors.push(`${path.relative(dist,file)} → outside base: ${raw}`);continue;}
    let target=path.join(dist,decodeURIComponent(url.pathname.slice(base.length)));
    if(url.pathname.endsWith('/'))target=path.join(target,'index.html');
    else if(!path.extname(target))target+='.html';
    if(!await exists(target)){errors.push(`${path.relative(dist,file)} → missing ${raw}`);continue;}
    if(url.hash&&ids.has(target)&&!ids.get(target).has(decodeURIComponent(url.hash.slice(1))))errors.push(`${path.relative(dist,file)} → missing anchor ${raw}`);
    checked++;
  }
}
assert.equal(errors.length,0,errors.slice(0,30).join('\n'));
console.log(`Verified ${chapters.length} chapter pairs, unchanged code/diagrams, source-line coverage, ${htmlFiles.length} HTML pages and ${checked} local links/assets.`);
