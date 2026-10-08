const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const template=path.join(__dirname,'../template');

test('every guide starts with the shared visual workflow and keeps setup and recovery collapsed',()=>{
 for(const name of ['guide.html','guide-en.html','guide-ja.html']){
  const html=fs.readFileSync(path.join(template,name),'utf8');
  assert.ok(html.indexOf('assets/setup-workflow.png')<html.indexOf('data-guide-required'),name);
  assert.equal((html.match(/data-guide-required/g)||[]).length,6,name);
  assert.doesNotMatch(html,/<details\b[^>]*\bopen(?:[\s=>])/);
  for(const essential of ['OBS-script.lua','OBS-settings.zip','config.public.js','local_file','OST ·','data-guide-layout'])assert.ok(html.includes(essential),`${name}: ${essential}`);
 }
 assert.deepEqual(fs.readFileSync(path.join(template,'assets/setup-workflow.png')),fs.readFileSync(path.join(__dirname,'../docs/images/setup-workflow.png')));
});

test('whole-card toggling leaves native summaries and links interactive',()=>{
 let click;
 const card={open:false,addEventListener:(type,handler)=>{assert.equal(type,'click');click=handler;}};
 const document={documentElement:{lang:'en'},querySelectorAll:selector=>selector==='.faq-item'?[card]:[]};
 vm.runInNewContext(fs.readFileSync(path.join(template,'guide-layout.js'),'utf8'),{document});
 click({target:{closest:()=>null}});assert.equal(card.open,true);
 for(const interactive of ['summary','a','button','input','select','textarea']){
  click({target:{closest:selector=>{assert.ok(selector.split(',').includes(interactive));return {};}}});
  assert.equal(card.open,true,interactive);
 }
 click({target:{closest:()=>null}});assert.equal(card.open,false);
});
