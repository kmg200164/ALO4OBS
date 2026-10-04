(() => {
  const key=document.body.dataset.panel;
  const item=window.OVERLAY_CONFIG?.panelContent?.[key];
  if(window.OVERLAY_CONFIG?.panelEnabled?.[key]===false||item?.type!=='media')return;
  const value=item.url;
  if(typeof value!=='string')return;
  let url='';
  if(/^assets\/(?!.*\.\.)[\w./-]+$/i.test(value))url=value;
  else{
    try{
      const parsed=new URL(value);
      if(['http:','https:'].includes(parsed.protocol)&&!parsed.username&&!parsed.password)url=value;
    }catch{}
  }
  if(!url)return;
  const isVideo=/\.(?:mp4|webm)(?:[?#].*)?$/i.test(url);
  const media=document.querySelector(isVideo?'video':'img');
  media.src=url;
  media.hidden=false;
  if(isVideo)media.play().catch(()=>{});
})();
