const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {resolveLayout} = require('../template/events.js');

test('fill and top frame cover all seven regions', () => {
  const node = () => ({style:{},dataset:{},children:[],append(...children){this.children.push(...children);},addEventListener(){}});
  const config = {layoutVersion:2,layout:{chat:{x:1400,y:40}},backgroundImage:'assets/bg.png',regionBackgrounds:{game:{color:'#654321',image:'assets/game.png',opacity:35,blur:9},chat:{color:'#123456',borderColor:'#abcdef'}}};
  function render(mode){
    const canvas=node(),context={document:{body:{dataset:{mode}},getElementById:()=>canvas,createElement:node},OverlayEvents:{resolveLayout},window:{OVERLAY_CONFIG:config,KMGGradient:require('../template/gradient.js')},innerWidth:1920,innerHeight:1080,addEventListener(){}};
    vm.runInNewContext(fs.readFileSync(require.resolve('../template/background.js'),'utf8'),context);
    return canvas.children;
  }
  const fill=render('fill');
  assert.deepEqual(fill.map(tile=>tile.dataset.region),['game','custom1','custom2','custom3','chat','translation','hand']);
  const gameFill=fill.find(tile=>tile.dataset.region==='game');
  assert.equal(gameFill.children[1].style.backgroundColor,'#654321');
  assert.equal(gameFill.children[1].style.opacity,'0.35');
  assert.equal(gameFill.children[2].className,'panel-image');
  assert.equal(gameFill.children[2].src,'assets/game.png');
  assert.equal(gameFill.children[2].style.opacity,undefined);
  assert.equal(gameFill.children[0].style.filter,'blur(9px)');
  const chatFill=fill.find(tile=>tile.dataset.region==='chat');
  assert.equal(chatFill.style.left,'1400px');
  assert.equal(chatFill.children[1].style.backgroundColor,'#123456');
  assert.equal(chatFill.children[0].src,'assets/bg.png');
  const frames=render('frame');
  assert.deepEqual(frames.map(tile=>tile.dataset.region),['game','custom1','custom2','custom3','chat','translation','hand']);
  const chatFrame=frames.find(tile=>tile.dataset.region==='chat');
  assert.equal(chatFrame.style.outlineColor,'#abcdef');
  assert.equal(chatFrame.style.top,'40px');
  assert.equal(chatFrame.children.length,0);
});
test('new style hides disabled panels and reaches OBS fill and stroke sources',()=>{
 const node=()=>({style:{},dataset:{},children:[],append(...children){this.children.push(...children);},addEventListener(){}});
 const config={panelEnabled:{chat:false},regionStyleOverrides:{hand:true},regionBackgrounds:{hand:{color:'#334455',borderColor:'#abcdef'}},globalStyle:{background:{mode:'gradient',color:'#000000',color2:'#333333'},fill:{mode:'gradient',color:'#111111',color2:'#222222',opacity:50,blur:8},stroke:{mode:'gradient',color:'#ff0000',color2:'#0000ff',opacity:80,width:6}}};
 function render(mode){const canvas=node(),context={document:{body:{dataset:{mode}},getElementById:()=>canvas,createElement:node},OverlayEvents:{resolveLayout},window:{OVERLAY_CONFIG:config,KMGGradient:require('../template/gradient.js')},innerWidth:1920,innerHeight:1080,addEventListener(){}};vm.runInNewContext(fs.readFileSync(require.resolve('../template/background.js'),'utf8'),context);return canvas.children;}
 const fill=render('fill'),frame=render('frame');
 assert.equal(fill.find(tile=>tile.dataset.region==='chat').style.display,'none');
 assert.match(fill.find(tile=>tile.dataset.region==='game').children[1].style.backgroundImage,/linear-gradient/);
 assert.equal(fill.find(tile=>tile.dataset.region==='game').children[1].style.opacity,'0.5');
 const border=frame.find(tile=>tile.dataset.region==='game').style;
 assert.equal(border.outlineWidth,'0');assert.equal(border.opacity,1);assert.equal(frame.find(tile=>tile.dataset.region==='game').className,'tile gradient-stroke');
 assert.equal(fill.find(tile=>tile.dataset.region==='hand').children[1].style.backgroundColor,'#334455');
 assert.equal(fill.find(tile=>tile.dataset.region==='hand').children[2].className,'panel-image');
 assert.match(fill.find(tile=>tile.dataset.region==='game').children[0].src,/^data:image\/gif;base64,/);
 assert.equal(frame.find(tile=>tile.dataset.region==='hand').style.outlineColor,'#abcdef');
});
test('global and regional stop gradients reach fill and frame renderers',()=>{
 const gradient={type:'linear',angle:27,stops:[{position:0,color:'#112233',opacity:100},{position:100,color:'#aabbcc',opacity:50}]},strokeGradient={type:'linear',angle:27,stops:[{position:0,color:'#ff0000',opacity:35},{position:100,color:'#0000ff',opacity:65}]},calls=[];
 const node=()=>({style:{setProperty(name,value){this[name]=value;}},dataset:{},children:[],append(...children){this.children.push(...children);},addEventListener(){}});
 const config={layoutVersion:2,regionStyleOverrides:{hand:true},globalStyle:{background:{mode:'gradient',gradient},fill:{mode:'gradient',gradient,opacity:40,blur:6},stroke:{mode:'gradient',gradient:strokeGradient,opacity:80,width:6}},regionBackgrounds:{hand:{color:'#334455',borderColor:'#abcdef',fill:{mode:'gradient',gradient,opacity:65,blur:4},stroke:{mode:'gradient',gradient:strokeGradient,opacity:55,width:5}}}};
 function render(mode){const canvas=node(),context={document:{body:{dataset:{mode}},getElementById:()=>canvas,createElement:node},OverlayEvents:{resolveLayout},window:{OVERLAY_CONFIG:config,KMGGradient:{css(part){calls.push(part);return `linear-gradient(${part.gradient.angle}deg, #123456, #abcdef)`;}}},innerWidth:1920,innerHeight:1080,addEventListener(){}};vm.runInNewContext(fs.readFileSync(require.resolve('../template/background.js'),'utf8'),context);return canvas.children;}
 const fill=render('fill'),frame=render('frame');
 assert.equal(fill.find(tile=>tile.dataset.region==='game').children[1].style.backgroundImage,'linear-gradient(27deg, #123456, #abcdef)');
 assert.equal(fill.find(tile=>tile.dataset.region==='game').children[1].style.opacity,'0.4');
 assert.equal(fill.find(tile=>tile.dataset.region==='hand').children[1].style.opacity,'0.65');
 assert.equal(fill.find(tile=>tile.dataset.region==='hand').children[0].style.filter,'blur(4px)');
 assert.equal(frame.find(tile=>tile.dataset.region==='game').style['--stroke-gradient'],'linear-gradient(27deg, #123456, #abcdef)');
 assert.equal(frame.find(tile=>tile.dataset.region==='hand').style['--stroke-width'],'5px');
 assert.equal(frame.find(tile=>tile.dataset.region==='hand').style.opacity,1);
 const strokeCalls=calls.filter(part=>part.gradient?.stops?.[0]?.color==='#ff0000');
 assert.ok(strokeCalls.length>=2);assert.ok(strokeCalls.every(part=>part.gradient.stops.every(stop=>stop.opacity===100)));
 assert.ok(calls.length>0);
});

test('preview stroke tiles and CSS gradients stay fully opaque for legacy opacity input',()=>{
 const elements=new Map(),classes=new Set(),gradient={type:'linear',angle:20,stops:[{position:0,color:'#112233',opacity:0},{position:100,color:'#aabbcc',opacity:35}]},calls=[];
 function element(key){
  if(elements.has(key))return elements.get(key);
  const children=[],node={style:{setProperty(name,value){this[name]=value;}},dataset:{},classList:{add(value){classes.add(value);},contains(value){return classes.has(value);}},children,hidden:false,append(...items){children.push(...items);},replaceChildren(...items){children.splice(0,children.length,...items);},addEventListener(){},removeAttribute(){},pause(){},load(){},play(){return Promise.resolve();},querySelector(selector){return element(key+' '+selector);},querySelectorAll(){return [];},scrollHeight:0};
  elements.set(key,node);return node;
 }
 const config={layoutVersion:2,name:'PLAYER',platforms:[],slotContent:{custom1:'none',custom2:'none',custom3:'none'},customSlotMedia:{},panelEnabled:{},showSubtitles:false,showChat:false,showSponsor:false,showAlerts:false,globalStyle:{background:{mode:'solid',color:'#000000'},stroke:{mode:'gradient',opacity:15,width:4,gradient}},regionStyleOverrides:{game:true},regionBackgrounds:{game:{stroke:{mode:'gradient',opacity:65,width:4,gradient}}}};
 const document={body:element('body'),getElementById:element,createElement:tag=>element('created '+tag),querySelector(selector){const region=/^\.overlay section\[data-region="([^"]+)"\]$/.exec(selector);return element(region?region[1]:selector);}};
 const context={window:{OVERLAY_CONFIG:config,OVERLAY_PUBLIC_CONFIG:config,Background:{applyConfig(){}},KMGGradient:{css(part){calls.push(part);return 'linear-gradient(20deg, #112233, #aabbcc)';}}},document,OverlayEvents:require('../template/events.js'),innerWidth:1920,innerHeight:1080,URL,URLSearchParams,location:{search:'?preview=1'},addEventListener(){},setTimeout(){return 0;},clearTimeout(){}};
 vm.runInNewContext(fs.readFileSync(require.resolve('../template/overlay.js'),'utf8'),context);
 const strokes=element('preview-strokes').children;
 assert.equal(strokes.length,7);assert.ok(strokes.every(tile=>tile.style.opacity==='1'));
 assert.equal(strokes[0].style['--stroke-gradient'],'linear-gradient(20deg, #112233, #aabbcc)');
 assert.ok(calls.every(part=>part.gradient.stops.every(stop=>stop.opacity===100)));
});
