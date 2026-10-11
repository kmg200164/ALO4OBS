const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const events=require('../template/events.js'),shape=require('../template/panel-shape.js');
test('neutral demo renders all seven Bento panels with shared geometry despite four-key placement',()=>{
 const node=()=>({style:{},dataset:{},children:[],attributes:{},append(...children){this.children.push(...children);},setAttribute(key,value){this.attributes[key]=value;}});
 const stage=node(),container=node(),document={getElementById:id=>id==='demo-stage'?stage:container,createElement:node,createElementNS:node};
 const context={window:{},document,OverlayEvents:events,KMGPanelShape:shape,innerWidth:1440,innerHeight:900,addEventListener(){}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/config.public.js'),'utf8'),context);
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../template/demo.js'),'utf8'),context);
 const tiles=container.children.filter(n=>n.className==='demo-tile'),strokes=container.children.filter(n=>n.attributes.class==='panel-shape-stroke');
 assert.deepEqual(tiles.map(n=>n.dataset.region),events.bentoPanelKeys);
 assert.equal(strokes.length,7);
 const layout=events.autoLayout();
 for(const tile of tiles){const box=layout[tile.dataset.region];assert.equal(tile.style.left,box.x+'px');assert.equal(tile.style.top,box.y+'px');assert.equal(tile.style.clipPath,"path('"+shape.path(box.width,box.height,16,0)+"')");assert.equal(tile.style.background,context.window.OVERLAY_PUBLIC_CONFIG.panel);assert.equal(tile.style.outline,'0');assert.equal(tile.children[0].textContent,events.panelLabels[tile.dataset.region]);}
 assert.ok(tiles.every(n=>n.children.length===2));
 assert.match(fs.readFileSync(path.join(__dirname,'../template/demo.html'),'utf8'),/<script src="panel-shape.js"><\/script>/);
});
