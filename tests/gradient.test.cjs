const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const api=require('../gradient.js');

test('default gradient uses a neutral two-stop fallback',()=>{
 const gradient=api.normalize({});
 assert.deepEqual(gradient,{type:'linear',angle:90,stops:[
  {position:0,color:'#000000',opacity:100},
  {position:100,color:'#000000',opacity:100}
 ]});
});

test('legacy two-color gradients keep colors and default to the legacy angle',()=>{
 const gradient=api.normalize({mode:'gradient',color:'#123456',color2:'#ABCDEF'});
 assert.deepEqual(gradient,{type:'linear',angle:135,stops:[
  {position:0,color:'#123456',opacity:100},
  {position:100,color:'#ABCDEF',opacity:100}
 ]});
});

test('solid legacy colors seed a gradient preview without changing mode',()=>{
 const part={mode:'solid',color:'#123456',color2:'#ABCDEF'};
 assert.deepEqual(api.normalize(part),{type:'linear',angle:90,stops:[
  {position:0,color:'#123456',opacity:100},
  {position:100,color:'#ABCDEF',opacity:100}
 ]});
 assert.match(api.css(part),/#123456 0%, #ABCDEF 100%/);
});

test('nested shared schema wins over legacy fields',()=>{
 const gradient=api.normalize({mode:'gradient',color:'#000000',color2:'#ffffff',gradient:{type:'linear',angle:-30,stops:[
  {position:70,color:'#00ff00',opacity:50},
  {position:15,color:'#ff0000',opacity:20}
 ]}});
 assert.deepEqual(gradient,{type:'linear',angle:330,stops:[
  {position:15,color:'#FF0000',opacity:20},
  {position:70,color:'#00FF00',opacity:50}
 ]});
});

test('saved nested gradient stops win over legacy color seeds',()=>{
 const saved={color:'#123456',color2:'#abcdef',gradient:{type:'linear',angle:210,stops:[
  {position:20,color:'#fedcba',opacity:75},
  {position:80,color:'#010203',opacity:30}
 ]}};
 assert.deepEqual(api.normalize(saved),{type:'linear',angle:210,stops:[
  {position:20,color:'#FEDCBA',opacity:75},
  {position:80,color:'#010203',opacity:30}
 ]});
});

test('malformed values are sanitized, clamped, sorted, and limited to twelve stops',()=>{
 const input={type:'radial',angle:Infinity,stops:[
  {position:-20,color:'url(javascript:alert(1))',opacity:-5},
  {position:150,color:'#abc',opacity:130},
  ...Array.from({length:14},(_,index)=>({position:index*10,color:'#010203',opacity:'40'}))
 ]};
 const gradient=api.normalize(input);
 assert.equal(gradient.type,'linear');
 assert.equal(gradient.angle,90);
 assert.equal(gradient.stops.length,12);
 assert.deepEqual(gradient.stops.map(stop=>stop.position),gradient.stops.map(stop=>stop.position).slice().sort((a,b)=>a-b));
 assert.equal(gradient.stops[0].position,0);
 assert.equal(gradient.stops.at(-1).position,100);
 assert.ok(gradient.stops.every(stop=>/^#[0-9A-F]{6}$/.test(stop.color)&&stop.opacity>=0&&stop.opacity<=100));
});

test('CSS includes ordered stops, direction, and alpha',()=>{
 const value=api.css({type:'linear',angle:225,stops:[
  {position:0,color:'#112233',opacity:100},
  {position:40,color:'#ABCDEF',opacity:25},
  {position:100,color:'#FFFFFF',opacity:0}
 ]});
 assert.equal(value,'linear-gradient(225deg, #112233 0%, rgba(171, 205, 239, 0.25) 40%, rgba(255, 255, 255, 0) 100%)');
});

test('browser build exposes the same API on window.KMGGradient',()=>{
 const window={};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../gradient.js'),'utf8'),{window});
 assert.equal(typeof window.KMGGradient.normalize,'function');
 assert.equal(typeof window.KMGGradient.css,'function');
 assert.equal(typeof window.KMGGradient.open,'function');
});
