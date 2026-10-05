(function(root){
  const configKey='obs-overlay-config',sourceKey='obs-overlay-source-config';
  function browserAssets(indexedDB){
    let database;
    function open(){
      if(!indexedDB)return Promise.reject(new Error('Browser file storage unavailable'));
      if(!database)database=new Promise((resolve,reject)=>{
        const request=indexedDB.open('obs-overlay-uploads',1);
        request.onupgradeneeded=()=>request.result.createObjectStore('files');
        request.onsuccess=()=>resolve(request.result);
        request.onerror=()=>reject(request.error||new Error('Browser file storage unavailable'));
        request.onblocked=()=>reject(new Error('Browser file storage is blocked'));
      });
      return database;
    }
    async function transaction(mode,operation){
      const db=await open();
      return new Promise((resolve,reject)=>{
        let result;const tx=db.transaction('files',mode),store=tx.objectStore('files');
        tx.oncomplete=()=>resolve(result);tx.onerror=tx.onabort=()=>reject(tx.error||new Error('Browser file storage failed'));
        try{operation(store,value=>{result=value;});}catch(error){tx.abort();reject(error);}
      });
    }
    return {
      putMany:entries=>transaction('readwrite',store=>{for(const [id,file] of entries)store.put(file,id);}),
      get:id=>transaction('readonly',(store,set)=>{const request=store.get(id);request.onsuccess=()=>set(request.result);}),
      remove:ids=>ids.length?transaction('readwrite',store=>{for(const id of ids)store.delete(id);}):Promise.resolve()
    };
  }
  function create({storage,indexedDB,assets=browserAssets(indexedDB),scope='',locks=root.navigator?.locks,onWarning=()=>{}}){
    let queue=Promise.resolve(),resetPending=false;
    const knownIds=new Set();
    const fileIds=new WeakMap(),persisted=new Set(),prefix=scope+'|'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2);
    let sequence=0;
    function save(input,entries,fingerprint){
      const config=structuredClone(input),snapshot=Array.from(entries,([key,entry])=>[key,{...entry}]);
      delete config._localUploads;
      const clearFiles=resetPending;resetPending=false;
      const manifest=snapshot.map(([key,entry])=>{
        let id=fileIds.get(entry.file);if(!id){id=prefix+'-'+(++sequence);fileIds.set(entry.file,id);}
        return {key,id,path:entry.path,name:entry.file.name||entry.path.split('/').pop(),type:entry.file.type||''};
      });
      const commit=async()=>{
        try{
          // Bytes must be durable before a draft can refer to them.
          const fresh=[];
          for(let index=0;index<snapshot.length;index++){
            const file=snapshot[index][1].file,id=manifest[index].id;
            if(!file||!(file.size>0)||typeof file.arrayBuffer!=='function')throw new Error('Empty upload');
            knownIds.add(id);
            // A different tab may have reset storage after this tab restored its files.
            const cached=persisted.has(id)?await assets.get(id):null;
            if(!cached||!(cached.size>0)||typeof cached.arrayBuffer!=='function')fresh.push([id,file]);
          }
          if(fresh.length){await assets.putMany(fresh);for(const [id] of fresh)persisted.add(id);}
          if(manifest.length)config._localUploads=manifest;
          // Keep the source fingerprint in the same JSON write as the draft.
          config._sourceFingerprint=fingerprint;
          storage.setItem(configKey,JSON.stringify(config));
          try{storage.setItem(sourceKey,fingerprint);}catch{} // Older releases use this companion key.
          // Ordinary saves retain old bytes: other open tabs can still reference them.
          // Cleanup is safe only when shared saves/reset cleanup hold a native lock.
          if(clearFiles&&locks){
            const obsolete=Array.from(knownIds).filter(id=>!manifest.some(item=>item.id===id));
            await assets.remove(obsolete).then(()=>{for(const id of obsolete){persisted.delete(id);knownIds.delete(id);}}).catch(()=>{});
          }
          onWarning('');return true;
        }catch(error){onWarning('파일 또는 설정을 브라우저에 저장하지 못했습니다. 현재 창에서만 유지됩니다. ZIP으로 저장하세요.');return false;}
      };
      const pending=queue.then(()=>locks?locks.request('obs-overlay-draft|'+scope,commit):commit()).catch(()=>{onWarning('파일 또는 설정을 브라우저에 저장하지 못했습니다. 현재 창에서만 유지됩니다. ZIP으로 저장하세요.');return false;});
      queue=pending.catch(()=>{});return pending;
    }
    async function restore(config){
      const entries=new Map(),missing=[];
      const manifest=Array.isArray(config?._localUploads)?config._localUploads:[];
      for(const item of manifest){
        if(!item||typeof item.id!=='string'||!item.id.startsWith(scope+'|')||typeof item.path!=='string'||!/^assets\/(?!.*\.\.)[\w.-]+\.(png|jpe?g|webp|gif|mp4|webm)$/i.test(item.path)||typeof item.key!=='string'){missing.push(item?.key||'file');continue;}
        try{
          const file=await assets.get(item.id);
          if(!file||!(file.size>0)||typeof file.arrayBuffer!=='function'){missing.push(item.key);continue;}
          fileIds.set(file,item.id);persisted.add(item.id);knownIds.add(item.id);entries.set(item.key,{file,path:item.path});
        }catch{missing.push(item.key);}
      }
      for(const item of manifest)if(typeof item?.id==='string'&&item.id.startsWith(scope+'|'))knownIds.add(item.id);
      return {entries,missing};
    }
    return {save,restore,reset:()=>{resetPending=true;},flush:()=>queue};
  }
  const api={create,browserAssets};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OverlayUploadStorage=api;
})(typeof window!=='undefined'?window:globalThis);
