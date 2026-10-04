const test=require('node:test');
const assert=require('node:assert/strict');
const {create}=require('../camera-preview.js');

function fakeStream(deviceId='cam-1'){
 const track={stopped:false,stop(){this.stopped=true;},getSettings(){return {deviceId};}};
 return {track,getTracks(){return [track];},getVideoTracks(){return [track];}};
}
function fakeMediaDevices({devices=[{kind:'videoinput',deviceId:'cam-1',label:'Camera One'}],getUserMedia}={}){
 const calls={enumerate:0,media:[]};
 return {calls,api:{async enumerateDevices(){calls.enumerate++;return devices;},async getUserMedia(constraints){calls.media.push(constraints);if(getUserMedia)return getUserMedia(constraints);return fakeStream(constraints.video===true?'cam-1':constraints.video.deviceId.exact);}}};
}

test('refresh only enumerates cameras and returns a detached snapshot',async()=>{
 const {api,calls}=fakeMediaDevices({devices:[
  {kind:'audioinput',deviceId:'mic-1',label:'Microphone'},
  {kind:'videoinput',deviceId:'cam-1',label:''},
  {kind:'videoinput',deviceId:'cam-2',label:'Camera Two'}
 ]});
 const controller=create({mediaDevices:api});
 const state=await controller.refresh();
 assert.equal(state.status,'idle');
 assert.deepEqual(state.devices,[{deviceId:'cam-1',label:'Camera 1'},{deviceId:'cam-2',label:'Camera Two'}]);
 assert.equal(calls.media.length,0);assert.equal(calls.enumerate,1);
 state.devices[0].label='mutated';
 assert.equal(controller.getState().devices[0].label,'Camera 1');
});

test('explicit connect is video only, selects the device, refreshes labels, and disconnect stops tracks',async()=>{
 const {api,calls}=fakeMediaDevices();
 const changes=[],streams=[];
 const controller=create({mediaDevices:api,onState:state=>changes.push(state),onStream:stream=>streams.push(stream)});
 const connected=await controller.connect('cam-1');
 assert.equal(connected.status,'connected');assert.equal(connected.selectedDeviceId,'cam-1');
 assert.deepEqual(calls.media,[{video:{deviceId:{exact:'cam-1'}},audio:false}]);
 assert.equal(calls.enumerate,1);
 const active=streams[0];assert.ok(active);
 assert.equal(controller.disconnect().status,'idle');
 assert.equal(active.track.stopped,true);assert.equal(streams.at(-1),null);
 assert.ok(changes.some(state=>state.status==='loading'));
});

test('missing camera maps NotFoundError to empty without requesting fallback hardware',async()=>{
 const {api,calls}=fakeMediaDevices({devices:[],getUserMedia:async()=>{const error=new Error();error.name='NotFoundError';throw error;}});
 const controller=create({mediaDevices:api});
 assert.equal((await controller.refresh()).status,'empty');
 assert.equal((await controller.connect()).status,'empty');
 assert.equal(controller.getState().errorName,'NotFoundError');
 assert.equal(calls.media.length,1);assert.deepEqual(calls.media[0],{video:true,audio:false});
});

test('permission, busy-device, and unsupported API errors are distinguished',async()=>{
 for(const [name,status] of [['NotAllowedError','denied'],['NotReadableError','busy'],['OverconstrainedError','error']]){
  const {api}=fakeMediaDevices({getUserMedia:async()=>{const error=new Error();error.name=name;throw error;}});
  const controller=create({mediaDevices:api});
  const state=await controller.connect();
  assert.equal(state.status,status);assert.equal(state.errorName,name);
 }
 const missing=create({mediaDevices:{enumerateDevices:async()=>[]}});
 assert.equal(missing.getState().status,'unavailable');
 assert.equal((await missing.refresh()).status,'unavailable');
});

test('disconnect invalidates a pending connect and stops its late stream',async()=>{
 let resolveRequest;
 const {api}=fakeMediaDevices({getUserMedia:()=>new Promise(resolve=>{resolveRequest=resolve;})});
 const streams=[];
 const controller=create({mediaDevices:api,onStream:stream=>streams.push(stream)});
 const pending=controller.connect('cam-1');
 assert.equal(controller.getState().status,'loading');
 controller.disconnect();
 const late=fakeStream();resolveRequest(late);
 assert.equal((await pending).status,'idle');
 assert.equal(late.track.stopped,true);assert.deepEqual(streams,[null]);
});

test('switch keeps old stream until replacement succeeds and stops stale results',async()=>{
 const first=fakeStream('cam-1'),second=fakeStream('cam-2'),late=fakeStream('late');
 let requestCount=0,resolveSecond;
 const {api}=fakeMediaDevices({getUserMedia:()=>{
  requestCount++;
  if(requestCount===1)return Promise.resolve(first);
  if(requestCount===2)return new Promise(resolve=>{resolveSecond=resolve;});
  return Promise.resolve(late);
 }});
 const controller=create({mediaDevices:api});
 await controller.connect('cam-1');
 const switchPending=controller.connect('cam-2');
 assert.equal(first.track.stopped,false);
 const latest=controller.connect('cam-3');
 assert.equal((await latest).selectedDeviceId,'late');
 assert.equal(first.track.stopped,true);
 resolveSecond(second);await switchPending;
 assert.equal(second.track.stopped,true);
 assert.equal(controller.getState().selectedDeviceId,'late');
 controller.disconnect();
});

test('failed device switch preserves the active stream and reports errorName',async()=>{
 const first=fakeStream('cam-1');let calls=0;
 const {api}=fakeMediaDevices({getUserMedia:async()=>{
  calls++;if(calls===1)return first;
  const error=new Error();error.name='NotReadableError';throw error;
 }});
 const controller=create({mediaDevices:api});
 await controller.connect('cam-1');
 const failed=await controller.connect('cam-2');
 assert.equal(failed.status,'connected');assert.equal(failed.selectedDeviceId,'cam-1');
 assert.equal(failed.errorName,'NotReadableError');assert.equal(first.track.stopped,false);
 controller.disconnect();assert.equal(first.track.stopped,true);
});

test('a stale refresh cannot clear loading while an explicit connection is pending',async()=>{
 let resolveList,resolveConnect;
 const controller=create({mediaDevices:{
  enumerateDevices:()=>new Promise(resolve=>{resolveList=resolve;}),
  getUserMedia:()=>new Promise(resolve=>{resolveConnect=resolve;})
 }});
 const refresh=controller.refresh();
 const connecting=controller.connect('cam-1');
 resolveList([{kind:'videoinput',deviceId:'cam-1',label:'One'}]);await refresh;
 assert.equal(controller.getState().status,'loading');
 controller.disconnect();resolveConnect(fakeStream());await connecting;
});

test('refresh during connection updates devices without making connect controls idle',async()=>{
 let resolveConnect;
 const {api}=fakeMediaDevices({getUserMedia:()=>new Promise(resolve=>{resolveConnect=resolve;})});
 const controller=create({mediaDevices:api});
 const connecting=controller.connect('cam-1');
 await controller.refresh();
 assert.equal(controller.getState().devices.length,1);
 assert.equal(controller.getState().status,'loading');
 controller.disconnect();resolveConnect(fakeStream());await connecting;
});
