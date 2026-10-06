(() => {
  const $ = id => document.getElementById(id);
  const panel = key => document.querySelector(`.overlay section[data-region="${key}"]`);
  const canvas = document.querySelector('.overlay');
  const defaults = {...(document.body.classList.contains('preview-mode')?window.OVERLAY_PUBLIC_CONFIG:window.OVERLAY_CONFIG)};
  let config = {...defaults}, history = [], timer = null, queue = [];
  let previewHighlight={keys:[],color:'#d4ff00'},strokeTiles=[];
  function highlightStrokes(){
    if(!document.body.classList.contains('preview-mode'))return;
    for(const tile of strokeTiles){
      tile.style.cssText=tile.baseStyle;tile.className=tile.baseClass;
      if(previewHighlight.keys.includes(tile.panelKey)&&/^#[0-9a-f]{6}$/i.test(previewHighlight.color)){tile.className='preview-stroke-tile';tile.style.outlineWidth='8px';tile.style.outlineColor=previewHighlight.color;}
    }
  }
  const store = OverlayEvents.createEventStore(100);
  const labels = {chzzk:'CHZZK',twitch:'TWITCH',youtube:'YOUTUBE',soop:'SOOP',external:'LIVE'};
  const accessibilityLabels={
    ko:{overlay:'방송 오버레이',game:'게임 캡처',sponsor:'홍보',translation:'영어 번역 자막',alerts:'방송 알림',chat:'채팅',hand:'캠',custom1:'커스텀 패널 1',custom2:'커스텀 패널 2',custom3:'커스텀 패널 3',webWidget:'커스텀 웹 위젯',sponsorWidget:'홍보 웹 위젯'},
    en:{overlay:'Broadcast overlay',game:'Game capture',sponsor:'Sponsor',translation:'English subtitles',alerts:'Stream alerts',chat:'Chat',hand:'Camera',custom1:'Custom panel 1',custom2:'Custom panel 2',custom3:'Custom panel 3',webWidget:'Custom web widget',sponsorWidget:'Sponsor web widget'},
    ja:{overlay:'配信オーバーレイ',game:'ゲームキャプチャ',sponsor:'プロモーション',translation:'英語字幕',alerts:'配信アラート',chat:'チャット',hand:'カメラ',custom1:'カスタムパネル1',custom2:'カスタムパネル2',custom3:'カスタムパネル3',webWidget:'カスタムWebウィジェット',sponsorWidget:'プロモーション用Webウィジェット'}
  };
  function applyAccessibilityLanguage(language){
    const locale=Object.hasOwn(accessibilityLabels,language)?language:'en',text=accessibilityLabels[locale];
    if(document.documentElement)document.documentElement.lang=locale;canvas?.setAttribute?.('aria-label',text.overlay);
    for(const key of ['game','sponsor','translation','alerts','chat','hand','custom1','custom2','custom3'])panel(key)?.setAttribute?.('aria-label',text[key]);
    if(config.layoutVersion>=4)panelKeys.forEach(key=>panel(key)?.setAttribute?.('aria-label',OverlayEvents.panelLabels[key]));
    const sponsorImage=$('sponsor-image'),sponsorEmbed=$('sponsor-embed');if(sponsorImage)sponsorImage.alt=text.sponsor;if(sponsorEmbed)sponsorEmbed.title=text.sponsorWidget;
    for(const key of ['custom1','custom2','custom3'])panel(key)?.querySelector('iframe')?.setAttribute?.('title',text.webWidget);
  }
  function scale() {canvas.style.transform = `scale(${Math.min(innerWidth/1920,innerHeight/1080)})`;}
  addEventListener('resize',scale); scale();
  const safeHttp = value => {try{const url=new URL(value);return ['http:','https:'].includes(url.protocol)&&!url.username&&!url.password?value:'';}catch{return '';}};
  const safePath = value => typeof value==='string' && (/^assets\/(?!.*\.\.)[\w./-]+$/i.test(value)||/^data:(image\/(png|jpeg|webp|gif)|video\/(mp4|webm));base64,/i.test(value)||safeHttp(value)) ? value : '';
  let sponsorMediaKey = '';
  const customMediaKeys = {};
  function media() {
    const image = $('sponsor-image'), video = $('sponsor-video'), embed=$('sponsor-embed'), path = safePath(config.sponsor);
    const slot=Object.keys(config.slotContent).find(key=>config.slotContent[key]==='sponsor');
    const enabled=!!slot&&config.panelEnabled?.[slot]!==false&&config.showSponsor!==false;
    const key=JSON.stringify([config.sponsorType,path,enabled]);
    if(key===sponsorMediaKey)return;
    sponsorMediaKey=key;
    embed.style.display='none';embed.removeAttribute('src');
    video.pause(); video.removeAttribute('src'); video.load();
    image.hidden = true; image.removeAttribute('src'); video.style.display = 'none';
    if(!enabled||!path)return;
    if(config.sponsorType==='embed' && safeHttp(path)){image.hidden=true;embed.style.display='block';embed.src=path;}
    else if (config.sponsorType === 'video') {image.hidden=true;video.style.display='block';video.src=path;video.muted=true;video.play().catch(()=>{});}
    else {image.src=path;image.hidden=false;}
  }
  function customMedia(positions){
    for(const key of ['custom1','custom2','custom3']){
      const role=config.slotContent[key],node=panel(key),box=positions[key],url=config.customSlotMedia?.[key]?.url||'';
      if(!node)continue;
      Object.assign(node.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px',padding:'0'});
      const enabled=config.panelEnabled?.[key]!==false;
      const mediaKey=JSON.stringify([role,safePath(url),document.body.classList.contains('preview-mode'),enabled]);
      if(mediaKey===customMediaKeys[key])continue;
      customMediaKeys[key]=mediaKey;
      const image=node.querySelector('img'),video=node.querySelector('video'),embed=node.querySelector('iframe'),label=node.querySelector('.preview-label');
      video.pause();video.removeAttribute('src');video.load();image.removeAttribute('src');embed.removeAttribute('src');
      for(const element of [image,video,embed,label])element.style.display='none';
      node.hidden=!enabled||!['image','video','browser','source'].includes(role);
      if(node.hidden)continue;
      if(role==='image'&&safePath(url)){image.src=url;Object.assign(image.style,{display:'block',width:'100%',height:'100%',objectFit:'cover'});}
      if(role==='video'&&safePath(url)){video.src=url;video.muted=true;Object.assign(video.style,{display:'block',width:'100%',height:'100%',objectFit:'cover'});video.play().catch(()=>{});}
      if(role==='browser'&&document.body.classList.contains('preview-mode')&&safeHttp(url)){embed.src=url;Object.assign(embed.style,{display:'block',width:'100%',height:'100%',border:'0'});}
      if(document.body.classList.contains('preview-mode')&&role==='source'){label.textContent='OBS SOURCE · '+key.toUpperCase();label.style.display='flex';}
    }
  }
  function previewLayers(positions){
    if(!document.body.classList.contains('preview-mode'))return;
    const background=config.globalStyle?.background||{};
    const wallpaper=$('preview-wallpaper');
    const backgroundPath=['file','url'].includes(background.mode)?safePath(background.url||config.backgroundImage):'';
    wallpaper.hidden=!backgroundPath;
    if(backgroundPath)wallpaper.src=backgroundPath;
    else wallpaper.removeAttribute('src');
    canvas.style.background=background.mode==='gradient'
      ?window.KMGGradient.css(background)
      :background.mode==='solid'&&/^#[0-9a-f]{6}$/i.test(background.color)?background.color:'#000000';
    window.Background?.applyConfig(config);
    const strokes=$('preview-strokes');
    strokes.replaceChildren();strokeTiles=[];
    const opaqueStroke=part=>{
      if(!part||typeof part!=='object')return part;
      const result={...part,opacity:100};
      if(Object.prototype.hasOwnProperty.call(part,'borderOpacity'))result.borderOpacity=100;
      const source=part.gradient&&typeof part.gradient==='object'?part.gradient:part;
      if(Array.isArray(source.stops)){const gradient={...source,stops:source.stops.map(stop=>({...stop,opacity:100}))};if(source===part)Object.assign(result,gradient);else result.gradient=gradient;}
      return result;
    };
    for(const key of ['game','custom1','custom2','custom3','chat','translation','hand']){
      if(config.panelEnabled?.[key]===false)continue;
      const box=positions[key],override=config.regionStyleOverrides?.[key]===true;
      const local=config.regionBackgrounds?.[key]||{},regionalStroke=override?local.stroke:undefined;
      const rawStroke=regionalStroke||(!override?config.globalStyle?.stroke:null);
      const globalStroke=opaqueStroke(rawStroke);
      const mode=globalStroke?.mode||(local.borderVisible===false?'none':'solid');
      if(mode==='none')continue;
      const width=Math.max(0,Math.min(32,Number(globalStroke?.width??4)));
      if(!width)continue;
      const tile=document.createElement('div');
      tile.className='preview-stroke-tile'+(mode==='gradient'?' gradient-stroke':'');
      const color=globalStroke?.color||local.borderColor||'#ffffff';
      Object.assign(tile.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px',outlineWidth:mode==='gradient'?'0':width+'px',outlineColor:/^#[0-9a-f]{6}$/i.test(color)?color:'#ffffff',opacity:'1'});
      if(mode==='gradient'){
        tile.style.setProperty('--stroke-width',width+'px');
        tile.style.setProperty('--stroke-gradient',window.KMGGradient.css(globalStroke));
      }
      tile.panelKey=key;tile.strokeWidth=width;tile.baseStyle=tile.style.cssText;tile.baseClass=tile.className;
      strokes.append(tile);strokeTiles.push(tile);
      highlightStrokes();
    }
  }
  const panelKeys=['game','custom1','custom2','custom3','chat','translation','hand'];
  const genericMediaKeys={};
  function genericLayer(node){
    let layer=node.querySelector('.generic-media');
    if(layer)return layer;
    layer=document.createElement('div');layer.className='generic-media';
    const image=document.createElement('img');image.alt='';
    const video=document.createElement('video');video.muted=true;video.loop=true;video.playsInline=true;
    const embed=document.createElement('iframe');embed.title='웹 콘텐츠';embed.referrerPolicy='no-referrer';
    const hint=document.createElement('span');hint.className='generic-source-hint';hint.textContent='OBS 소스는 OBS에서 확인';
    const sample=document.createElement('div');sample.className='generic-sample';sample.hidden=true;
    layer.append(image,video,embed,hint,sample);node.append(layer);
    return layer;
  }
  function genericContent(positions){
    const preview=document.body.classList.contains('preview-mode');
    for(const key of panelKeys){
      const node=panel(key),box=positions[key],item=config.panelContent?.[key]||{type:'none',url:''};
      if(!node||!box)continue;
      Object.assign(node.style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px',padding:'0',visibility:config.panelEnabled?.[key]===false?'hidden':'visible'});
      node.hidden=false;
      const layer=genericLayer(node),image=layer.querySelector('img'),video=layer.querySelector('video'),embed=layer.querySelector('iframe'),hint=layer.querySelector('.generic-source-hint');
      const locale=Object.hasOwn(accessibilityLabels,config.uiLanguage)?config.uiLanguage:'en';
      hint.textContent=locale==='ko'?'OBS 소스는 OBS에서 확인':locale==='ja'?'OBS ソースは OBS で確認':'Check OBS sources in OBS';
      embed.title=locale==='ko'?'웹 콘텐츠':locale==='ja'?'Web コンテンツ':'Web content';
      const url=item.type==='web'?safeHttp(item.url):item.type==='media'?safePath(item.url):'';
      const isVideo=/^(?:data:video\/|.*\.(?:mp4|webm)(?:[?#].*)?$)/i.test(url);
      const mediaKey=JSON.stringify([item.type,url,isVideo,preview]);
      if(genericMediaKeys[key]===mediaKey)continue;
      genericMediaKeys[key]=mediaKey;
      video.pause();video.removeAttribute('src');video.load();image.removeAttribute('src');embed.removeAttribute('src');
      image.hidden=video.hidden=embed.hidden=hint.hidden=true;
      if(item.type==='source'&&preview)hint.hidden=false;
      else if(item.type==='web'&&preview&&url){embed.src=url;embed.hidden=false;}
      else if(item.type==='media'&&url&&preview){if(isVideo){video.src=url;video.hidden=false;video.play().catch(()=>{});}else{image.src=url;image.hidden=false;}}
    }
  }
  function showGenericSample(input){
    if(!document.body.classList.contains('preview-mode')||!panelKeys.includes(input?.target)||config.panelEnabled?.[input.target]===false)return false;
    for(const key of panelKeys){const sample=panel(key)?.querySelector('.generic-sample');if(sample)sample.hidden=true;}
    const sample=genericLayer(panel(input.target)).querySelector('.generic-sample');
    sample.replaceChildren();
    const name=document.createElement('strong'),message=document.createElement('p');
    name.textContent=String(input.nickname||'');message.textContent=String(input.text||'');
    sample.append(name,message);sample.hidden=false;
    return true;
  }
  function applyConfig(update = {}) {
    const source=update.layoutVersion?update:defaults;
    const positions=source.layoutVersion>=3?OverlayEvents.validateLayout(source.layout):OverlayEvents.resolveLayout(source.layoutVersion===2?source.layout:undefined);
    config = {...defaults,...update};
    applyAccessibilityLanguage(config.uiLanguage);
    // Boxes already include the gap; the token keeps any gap-based CSS in sync.
    canvas.style?.setProperty?.('--gap',(OverlayEvents.normalizeGap?.(source.panelGap)??32)+'px');
    if(source.layoutVersion>=4){
      canvas.classList?.add?.('generic-layout');
      previewLayers(positions);
      for(const key of ['sponsor','alerts']){const node=panel(key);if(node)node.hidden=true;}
      genericContent(positions);
      return;
    }
    canvas.classList?.remove?.('generic-layout');
    config.cameraMode=update.cameraMode??(Object.hasOwn(update,'handcam')?(config.handcam?'camera':'none'):defaults.cameraMode??(config.handcam?'camera':'none'));
    config.slotContent=OverlayEvents.resolveSlots(source.layoutVersion>=2?source.slotContent:undefined);
    previewLayers(positions);
    const slotFor=role=>Object.keys(config.slotContent).find(slot=>config.slotContent[slot]===role);
    if(!Array.isArray(config.platforms))config.platforms=defaults.platforms;
    const layout=OverlayEvents.handcamLayout();
    canvas.style.setProperty('--hand-height',layout.handHeight+'px');
    for(const region of ['game','chat','translation','hand']){const box=positions[region];Object.assign(panel(region).style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});}
    for(const [region,slot] of [['sponsor',slotFor('sponsor')],['alerts',slotFor('alerts')]])if(slot){const box=positions[slot];Object.assign(panel(region).style,{left:box.x+'px',top:box.y+'px',width:box.width+'px',height:box.height+'px'});}
    customMedia(positions);
    const standalone=document.body.classList.contains('demo');
    for(const region of (standalone?['game','chat','translation','hand','custom1','custom2','custom3']:[])){
      const node=panel(region),style=config.regionBackgrounds?.[region]||{};
      if(node){node.style.borderColor=/^#[0-9a-f]{6}$/i.test(style.borderColor)?style.borderColor:'#4b5563';node.style.borderWidth=style.borderVisible===false?'0':'1px';}
    }
    if(standalone)for(const [region,slot] of [['sponsor',slotFor('sponsor')],['alerts',slotFor('alerts')]])if(slot){const node=panel(region),style=config.regionBackgrounds?.[slot]||{};node.style.borderColor=/^#[0-9a-f]{6}$/i.test(style.borderColor)?style.borderColor:'#4b5563';node.style.borderWidth=style.borderVisible===false?'0':'1px';}
    document.querySelector('.hand .preview-label').textContent=config.cameraMode==='reactive'?'DISCORD REACTIVE · OBS':'CAMERA PREVIEW';
    for(const key of ['accent','panel','text']) if (/^#[0-9a-f]{6}$/i.test(config[key])) canvas.style.setProperty('--'+key,config[key]);
    const logo=safePath(config.logo);
    $('player-name').textContent=config.name||'';
    $('brand-logo').hidden=!logo;
    if(logo)$('brand-logo').src=logo;else $('brand-logo').removeAttribute('src');
    $('alert-default').hidden=true;
    panel('game').style.visibility=config.panelEnabled?.game===false?'hidden':'visible';
    panel('hand').style.visibility=config.panelEnabled?.hand===false||config.cameraMode==='none'?'hidden':'visible';
    for(const [region,key] of [['translation','showSubtitles'],['chat','showChat']]) panel(region).style.visibility=config.panelEnabled?.[region]!==false&&config[key] ? 'visible':'hidden';
    panel('sponsor').style.visibility=slotFor('sponsor')&&config.panelEnabled?.[slotFor('sponsor')]!==false&&config.showSponsor?'visible':'hidden';
    panel('alerts').style.visibility=slotFor('alerts')&&config.panelEnabled?.[slotFor('alerts')]!==false&&config.showAlerts?'visible':'hidden';
    if(!config.showAlerts){queue=[];clearTimeout(timer);timer=null;$('alert-default').hidden=true;$('alert-active').hidden=true;}
    queue=queue.filter(event=>config.platforms.includes(event.platform));
    media();
    if(document.body.classList.contains('preview-mode')&&!timer&&!queue.length)$('alert-default').hidden=true;
    render();
  }
  function render() {
    const chat=$('chat-feed'), subs=$('subtitles');chat.replaceChildren();subs.replaceChildren();
    for(const event of history) {
      if(event.type==='chat' && config.platforms.includes(event.platform)) {
        const row=document.createElement('div');row.className='chat-line';
        const badge=document.createElement('span');badge.className='platform-label';badge.textContent=labels[event.platform]||'LIVE';
        const nick=document.createElement('strong');nick.textContent=event.nickname;nick.style.color=OverlayEvents.nicknameColor(event.platform,event.nickname,config.nicknameColor);
        const text=document.createElement('p');text.textContent=event.text;
        row.append(badge);if(config.showNicknames)row.append(nick);row.append(text);chat.append(row);
      } else if(event.type==='subtitle') {
        const row=document.createElement('div');row.className='subtitle-line';
        const time=document.createElement('time');time.dateTime=new Date(event.timestamp).toISOString();time.textContent=new Date(event.timestamp).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});row.append(time);
        const text=document.createElement('p');text.textContent=event.text;row.append(text);subs.append(row);
      }
    }
    chat.scrollTop=chat.scrollHeight;subs.scrollTop=subs.scrollHeight;
  }
  function nextAlert() {
    timer=null;
    const event=queue.shift();
    $('alert-default').hidden=true;$('alert-active').hidden=!event;
    if(!event)return;
    $('alert-kind').textContent=`${labels[event.platform]} · ${event.type==='subscription'?'SUBSCRIPTION':'SUPPORT'}`;
    $('alert-name').textContent=event.nickname;$('alert-text').textContent=event.text;$('alert-active').scrollTop=0;
    timer=setTimeout(nextAlert,Math.max(1500,Math.min(Number(config.alertDuration)||7000,30000)));
  }
  function receive(input) {
    if(config.layoutVersion>=4)return showGenericSample(input);
    const event=OverlayEvents.normalizeEvent(input);if(!event||!store.accept(event))return false;
    history.push(event);if(history.length>100)history.shift();
    if((event.type==='donation'||event.type==='subscription')&&config.showAlerts&&config.platforms.includes(event.platform)) {if(queue.length<20)queue.push(event);if(!timer)nextAlert();}
    render();return true;
  }
  function clear() {history=[];queue=[];clearTimeout(timer);timer=null;nextAlert();render();for(const key of panelKeys){const sample=panel(key)?.querySelector('.generic-sample');if(sample)sample.hidden=true;}}
  $('brand-logo')?.addEventListener('error',()=>{$('brand-logo').hidden=true;$('brand-logo').removeAttribute('src');});
  $('preview-wallpaper')?.addEventListener('error',()=>{$('preview-wallpaper').hidden=true;});
  $('sponsor-image')?.addEventListener('error',()=>{$('sponsor-image').hidden=true;$('sponsor-image').removeAttribute('src');});
  $('sponsor-video')?.addEventListener('error',()=>{$('sponsor-video').style.display='none';$('sponsor-video').removeAttribute('src');});
  for(const key of ['custom1','custom2','custom3']){const node=panel(key);if(!node)continue;for(const tag of ['img','video'])node.querySelector(tag)?.addEventListener('error',event=>{event.currentTarget.style.display='none';});}
  window.Overlay={receive,applyConfig,clear,getConfig:()=>({...config})};
  addEventListener('message',event=>{if(event.source!==parent||event.data?.channel!=='kmg-preview')return;const {action,data}=event.data;if(action==='apply')applyConfig(data);else if(action==='receive')receive(data);else if(action==='clear')clear();else if(action==='highlight'&&Array.isArray(data?.keys)){previewHighlight=data;highlightStrokes();}});
  if(new URLSearchParams(location.search).has('preview'))document.body.classList.add('preview-mode');
  applyConfig();
})();
