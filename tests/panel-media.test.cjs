const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..','template');
const script=fs.readFileSync(path.join(root,'panel-media.js'),'utf8');
const keys=['game','custom1','custom2','custom3','chat','translation','hand'];

function render(key,item,enabled=true){
  const image={hidden:true,src:undefined};
  const video={hidden:true,src:undefined,play(){this.played=true;return Promise.resolve();}};
  const context={URL,document:{body:{dataset:{panel:key}},querySelector(selector){return selector==='video'?video:image;}},window:{OVERLAY_CONFIG:{panelContent:{[key]:item},panelEnabled:{[key]:enabled}}}};
  vm.runInNewContext(script,context);
  return {image,video};
}

test('every panel has a dedicated local browser entry and media targets only its own panel',()=>{
  for(const key of keys){
    const html=fs.readFileSync(path.join(root,`panel-media-${key}.html`),'utf8');
    assert.match(html,new RegExp(`data-panel="${key}"`));
    assert.match(html,/src="panel-media.js"/);
    const result=render(key,{type:'media',url:`assets/${key}.png`});
    assert.equal(result.image.src,`assets/${key}.png`);
    assert.equal(result.image.hidden,false);
  }
});

test('video plays muted in the media page and inactive or unsafe media stays blank',()=>{
  const video=render('hand',{type:'media',url:'assets/camera.webm'});
  assert.equal(video.video.src,'assets/camera.webm');
  assert.equal(video.video.played,true);
  assert.equal(video.video.hidden,false);
  for(const item of [{type:'media',url:'../template/secret.png'},{type:'media',url:'file:///secret.png'},{type:'source',url:'assets/sample.png'}]){
    const result=render('hand',item);
    assert.equal(result.image.src,undefined);
    assert.equal(result.video.src,undefined);
  }
  assert.equal(render('hand',{type:'media',url:'assets/sample.png'},false).image.src,undefined);
});

test('OBS overlay media is displayed only in preview',()=>{
  const overlay=fs.readFileSync(path.join(root,'overlay.js'),'utf8');
  assert.match(overlay,/else if\(item\.type==='media'&&url&&preview\)/);
});
