const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

// A small DOM harness executes the real editor listeners without a browser.
function editorHarness(language='en'){
 class Node {
  constructor(tag){this.tagName=tag;this.children=[];this.attributes={};this.dataset={};this.style={};this.listeners={};this.className='';}
  append(...nodes){for(const node of nodes){node.parent=this;this.children.push(node);}}
  replaceChildren(...nodes){this.children=[];this.append(...nodes);}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return this.attributes[name];}
  hasAttribute(name){return name==='data-stop-id'?this.dataset.stopId!==undefined:name in this.attributes;}
  addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}
  removeEventListener(type,listener){this.listeners[type]=(this.listeners[type]||[]).filter(item=>item!==listener);}
  dispatch(type,target=this,extra={}){for(const listener of this.listeners[type]||[])listener({target,preventDefault(){},...extra});}
  matches(selector){
   if(selector==='button')return this.tagName==='button';
   if(selector==='[role="slider"]')return this.attributes.role==='slider';
   if(selector==='[data-stop-id]')return this.dataset.stopId!==undefined;
   const match=/^\[data-stop-id="(\d+)"\]$/.exec(selector);return !!match&&this.dataset.stopId===match[1];
  }
  closest(selector){return this.matches(selector)?this:this.parent?.closest(selector)||null;}
  querySelectorAll(selector){return this.children.flatMap(node=>[...(node.matches(selector)?[node]:[]),...node.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  contains(node){return node===this||this.children.some(child=>child.contains(node));}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(node=>node!==this);}
  focus(){}
 }
 const document=new Node('document');document.documentElement={lang:language};document.body=new Node('body');
 document.createElement=tag=>{const node=new Node(tag);node.ownerDocument=document;return node;};
 const window=new Node('window');window.document=document;window.innerWidth=1400;window.innerHeight=1000;document.defaultView=window;
 const context={window,document};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/gradient.js'),'utf8'),context);
 const anchor=new Node('button');anchor.getBoundingClientRect=()=>({left:10,top:10,bottom:42});
 const changes=[];const open=part=>window.KMGGradient.open(anchor,part,value=>changes.push(JSON.parse(JSON.stringify(value))));
 const find=(root,className)=>[root,...root.children.flatMap(function walk(node){return [node,...node.children.flatMap(walk)];})].find(node=>node.className.split(' ').includes(className));
 return {document,window,anchor,changes,open,find,root:()=>document.body.children[0]};
}

test('numeric stop crossing uses the largest actual gap when adding another stop',()=>{
 const h=editorHarness(),editor=h.open({});let root=h.root();
 root.dispatch('click',h.find(root,'kmg-gradient-add'));
 const last=root.querySelectorAll('button').filter(node=>node.className.split(' ').includes('kmg-gradient-stop'))[2];
 root.dispatch('click',last);
 const input=h.find(root,'kmg-gradient-details').children[2].children[1];input.value='20';root.dispatch('input',input);
 root.dispatch('click',h.find(root,'kmg-gradient-add'));
 assert.deepEqual(JSON.parse(JSON.stringify(editor.value.stops.map(stop=>stop.position))),[0,20,35,50]);
 editor.close();
});

test('editor color, opacity, angle, reverse, remove, and reopen preserve the saved value',()=>{
 const h=editorHarness('ja');let editor=h.open({});let root=h.root();
 assert.equal(root.getAttribute('aria-label'),'グラデーションエディター');
 root.dispatch('click',h.find(root,'kmg-gradient-add'));
 const details=h.find(root,'kmg-gradient-details');
 const color=details.children[0].children[1];color.value='#123456';root.dispatch('input',color);
 const opacity=details.children[3].children[1];opacity.value='25';root.dispatch('input',opacity);
 const position=details.children[2].children[1];position.value='30';root.dispatch('input',position);root.dispatch('change',position);
 const angle=h.find(root,'kmg-gradient-angle');angle.value='225';root.dispatch('input',angle);
 root.dispatch('click',h.find(root,'kmg-gradient-action'));
 const saved=JSON.parse(JSON.stringify(editor.value));
 assert.equal(saved.angle,225);
 assert.deepEqual(saved.stops[1],{position:70,color:'#123456',opacity:25});
 editor.close();editor=h.open({gradient:saved});root=h.root();
 assert.deepEqual(JSON.parse(JSON.stringify(editor.value)),saved);
 const middle=root.querySelectorAll('button').filter(node=>node.className.split(' ').includes('kmg-gradient-stop'))[1];root.dispatch('click',middle);
 root.dispatch('click',h.find(root,'kmg-gradient-remove'));
 assert.equal(editor.value.stops.length,2);assert.equal(h.find(root,'kmg-gradient-remove').disabled,true);
 editor.close();
});

test('position changes refresh accessible names and language changes close the editor',()=>{
 const h=editorHarness(),editor=h.open({});const root=h.root();
 const position=h.find(root,'kmg-gradient-details').children[2].children[1];position.value='15';root.dispatch('input',position);root.dispatch('change',position);
 assert.equal(root.querySelectorAll('[role="slider"]')[0].getAttribute('aria-label'),'Stop at 15 percent');
 h.document.dispatch('change',{id:'ui-language'});
 assert.equal(h.document.body.children.length,0);
 assert.deepEqual(h.document.listeners.pointermove,[]);
 editor.close();
});
