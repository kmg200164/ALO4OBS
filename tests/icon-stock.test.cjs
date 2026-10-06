const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');
// Glyph SHA-256 values from the integrity-verified official lucide-static 0.468.0 tarball.
const stockHashes={
  "menu": "37e4a3677b750d39d95c49cdb0fa27a2efb8b015d7761d0ec2b5d055fdb4dc7e",
  "languages": "240f444c8044ba544a5a443367dd5267a81095ec9c2a209ecf536738720d026b",
  "palette": "0618babf2628cebef6f8eaeec70452d29f9c8905aa59327148475e419d9b0c3f",
  "book-open": "b4c2d37ab56e0c761bf4513657ae2140d2c9a4b983fac08d51ebb3660091379c",
  "bug": "8a291012aca9ef7a99984cd6185924aecbad594a2b0f6d2699d91a4ba9ce6c83",
  "heart": "32beaf672de068374e940dabaa59b1ec2e8644dfe235217495a57e4e7e234016",
  "github": "9df8afd9044cf350e04ec80e576b48dd8b133f3953ae06caeef7762ac73ea4ad",
  "sun": "212f5bbbc01eacefd72c4b8d0e4d7debd4a7a0128e0836a36f0b74273355c99f",
  "moon": "a7e35972a0e15d42f79f65f2e6766f08a87c36cd8bc121eaeaf087a2cd8b7d3b",
  "settings": "7297cc72ebc16421f4f526453b71f9eab0f4e484606dab45735ce323ae95f177",
  "play": "521c7f63b1cbaf6b9366f5e0b99571d38ee0143bdfbdfe5dc1f84c867e0a5c01",
  "trash-2": "834b8b551c7440be577f97b77ddb304e1938ac33ca4d851049a7d8c0c0d39090",
  "maximize": "2bf636ca277709266c7b2f18345efb27b2c2148f0bbf63cac955e971f3e72bff",
  "rotate-ccw": "c484810a3563c2878fbac102036f049ca2253a7496669dabd603c4b3318c6c54",
  "save": "dbaf6a467b35702c92c4dd465f04b0c0b9c8f7638db8d41a3386442f28477514"
};
test('every UI icon retains its pinned Lucide stock glyph and common stroke without overrides',()=>{
 const headerSource=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 let header='';
 vm.runInNewContext(headerSource.split(/\r?\n\r?\n/)[0],{document:{currentScript:{insertAdjacentHTML(_where,markup){header=markup;}}}});
 const settings=fs.readFileSync(path.join(__dirname,'../template/settings.html'),'utf8');
 const found=new Set();let count=0;
 for(const [markup,size] of [[header,32],[settings,24]])for(const icon of markup.matchAll(/<svg\b([^>]*)>([\s\S]*?)<\/svg>/g)){
  const name=icon[1].match(/data-lucide="([^"]+)"/)?.[1];
  assert.ok(stockHashes[name],`untracked UI icon ${name}`);
  const glyph=icon[2].replace(/>\s+</g,'><').trim();
  assert.equal(crypto.createHash('sha256').update(glyph).digest('hex'),stockHashes[name],name+' keeps the stock paths');
  assert.match(icon[1],/viewBox="0 0 24 24"/);assert.match(icon[1],/stroke-width="2"/);
  assert.match(icon[1],new RegExp(`width="${size}"`));assert.match(icon[1],new RegExp(`height="${size}"`));
  assert.match(icon[1],/aria-hidden="true"/);assert.match(icon[1],/focusable="false"/);
  found.add(name);count++;
 }
 assert.equal(count,16);assert.deepEqual([...found].sort(),Object.keys(stockHashes).sort());
 assert.match(header,/data-lucide="sun"[^>]*class|class="[^"]*theme-icon-sun/);
 assert.match(header,/class="[^"]*theme-icon-moon/);
 assert.doesNotMatch(headerSource,/createElementNS/);
 for(const file of ['header.css','preview.css']){
  const css=fs.readFileSync(path.join(__dirname,'../template',file),'utf8');
  assert.doesNotMatch(css,/[^{}]*\.button-svg[^{}]*\{[^{}]*stroke-width/);
 }
 const notices=fs.readFileSync(path.join(__dirname,'../template/assets/THIRD-PARTY-NOTICES.md'),'utf8');
 const license=fs.readFileSync(path.join(__dirname,'../template/assets/Lucide-LICENSE.txt'),'utf8');
 assert.match(notices,/lucide-static.+0\.468\.0/);assert.doesNotMatch(notices,/Figma Simple Design System/);
 assert.match(license,/ISC License/);assert.match(license,/The MIT License \(MIT\)/);assert.match(license,/Cole Bemis/);
});
