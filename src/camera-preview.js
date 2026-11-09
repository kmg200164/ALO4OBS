(function(root,factory){
  const api=factory();
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else root.KMGCameraPreview=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  const emptySnapshot=()=>({status:'idle',devices:[],selectedDeviceId:'',errorName:''});
  const copySnapshot=state=>({...state,devices:state.devices.map(device=>({...device}))});
  const stopStream=stream=>{
    for(const track of stream?.getTracks?.()||[])try{track.stop();}catch{}
  };
  const errorStatus=name=>{
    if(name==='NotAllowedError'||name==='PermissionDeniedError')return 'denied';
    if(name==='NotFoundError'||name==='DevicesNotFoundError')return 'empty';
    if(name==='NotReadableError'||name==='TrackStartError')return 'busy';
    if(name==='SecurityError'||name==='TypeError')return 'unavailable';
    return 'error';
  };
  function create({mediaDevices,onState,onStream}={}){
    const devicesApi=mediaDevices===undefined
      ?(typeof navigator!=='undefined'?navigator.mediaDevices:undefined)
      :mediaDevices;
    let state=emptySnapshot(),stream=null,connectGeneration=0,refreshGeneration=0,pendingConnect=0;
    const notify=()=>{try{onState?.(copySnapshot(state));}catch{}};
    const emitStream=value=>{try{onStream?.(value,copySnapshot(state));}catch{}};
    const available=()=>!!devicesApi&&typeof devicesApi.enumerateDevices==='function'&&typeof devicesApi.getUserMedia==='function';
    const listDevices=async()=>{
      const listed=await devicesApi.enumerateDevices();
      return (Array.isArray(listed)?listed:[])
        .filter(device=>device?.kind==='videoinput'&&typeof device.deviceId==='string')
        .map((device,index)=>({deviceId:device.deviceId,label:String(device.label||`Camera ${index+1}`)}));
    };
    const snapshot=()=>copySnapshot(state);
    const getState=snapshot;
    async function refresh(){
      const generation=++refreshGeneration;
      if(!available()){
        state={...state,status:'unavailable',errorName:'NotSupportedError'};notify();return snapshot();
      }
      if(!stream&&!pendingConnect){state={...state,status:'loading',errorName:''};notify();}
      try{
        const devices=await listDevices();
        if(generation!==refreshGeneration)return snapshot();
        state=pendingConnect?{...state,devices}:{...state,devices,status:stream?'connected':devices.length?'idle':'empty',errorName:''};
      }catch(error){
        if(generation!==refreshGeneration)return snapshot();
        const name=String(error?.name||'Error');
        if(!pendingConnect)state={...state,status:stream?'connected':errorStatus(name),errorName:name};
      }
      notify();return snapshot();
    }
    async function connect(deviceId=''){
      if(!available()){
        state={...state,status:'unavailable',errorName:'NotSupportedError'};notify();return snapshot();
      }
      const generation=++connectGeneration;
      // Enumeration must not make an outstanding permission/device request idle.
      refreshGeneration++;pendingConnect=generation;
      state={...state,status:'loading',errorName:''};notify();
      try{
        const constraints={video:deviceId?{deviceId:{exact:deviceId}}:true,audio:false};
        const nextStream=await devicesApi.getUserMedia(constraints);
        if(generation!==connectGeneration){stopStream(nextStream);return snapshot();}
        const oldStream=stream;
        stream=nextStream;
        const track=stream?.getVideoTracks?.()[0];
        const actualDeviceId=track?.getSettings?.().deviceId||deviceId||'';
        state={...state,status:'connected',selectedDeviceId:actualDeviceId,errorName:''};
        stopStream(oldStream);
        emitStream(stream);
        notify();
        try{
          const devices=await listDevices();
          if(generation===connectGeneration){state={...state,devices};notify();}
        }catch(error){
          if(generation===connectGeneration){state={...state,errorName:String(error?.name||'Error')};notify();}
        }
      }catch(error){
        if(generation!==connectGeneration)return snapshot();
        const name=String(error?.name||'Error');
        state={...state,status:stream?'connected':errorStatus(name),errorName:name};notify();
      }finally{
        if(pendingConnect===generation)pendingConnect=0;
      }
      return snapshot();
    }
    function disconnect(){
      connectGeneration++;refreshGeneration++;
      pendingConnect=0;
      const previous=stream;stream=null;
      stopStream(previous);
      state={...emptySnapshot(),status:available()?'idle':'unavailable',errorName:available()?'':'NotSupportedError'};
      emitStream(null);notify();return snapshot();
    }
    if(!available())state={...state,status:'unavailable',errorName:'NotSupportedError'};
    notify();
    return {snapshot,getState,refresh,connect,disconnect};
  }
  return {create};
});
