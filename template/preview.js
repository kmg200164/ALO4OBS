(() => {
  const byId=id=>document.getElementById(id);
  const form=byId('settings'), frame=byId('preview'), status=byId('status');
  const keys=['game','custom1','custom2','custom3','chat','translation','hand'];
  const names=Object.fromEntries(keys.map((key,index)=>[key,`패널 ${index+1}`]));
  const defaults=structuredClone(window.OVERLAY_PUBLIC_CONFIG);
  const sourceConfig=structuredClone(window.OVERLAY_CONFIG);
  const sourceFingerprint=sourceConfig?.layoutVersion>=3?JSON.stringify(sourceConfig):'';
  const initialPlacement=OverlayEvents.defaultPlacement();
  const uploads=new Map();
  const uploadRequests=new Map();
  let draftReady=false,storageWarning='';
  const missingUploads=new Set();
  function showStatus(message,isError=false){
    status.textContent=window.KMGI18n?.localize(message)||message;
    status.classList.toggle('sr-only',!isError);
    status.setAttribute('role',isError?'alert':'status');
  }
  const uploadStorage=window.OverlayUploadStorage.create({storage:{setItem:(...args)=>window.localStorage.setItem(...args)},indexedDB:window.indexedDB,scope:window.location.href.split(/[?#]/)[0],onWarning:message=>{
    const previous=storageWarning;storageWarning=message;
    if(message)showStatus(message,true);
    else if(previous&&!missingUploads.size)showStatus('설정 미리보기 준비 완료');
  }});
  let config=structuredClone(defaults), selected=null, hovered=null, sizeConstraintTarget=null, snappingSlider=null;
  const highlight=()=>send(frame,'highlight',{keys:document.fullscreenElement?[]:[selected,hovered].filter(Boolean),color:getComputedStyle(document.body).getPropertyValue('--accent').trim()});
  let cameraState={status:'unavailable',devices:[],selectedDeviceId:'',errorName:'NotSupportedError'},cameraController=null,cameraActive=false;
  const cameraVideo=byId('camera-preview-video');
  byId('app-version').textContent='v'+window.KMG_VERSION;

  // The Figma path selectors are a hierarchy: side → row → slot. The layout
  // engine alone projects these groups to the OBS pixel coordinates.
  const levelOptions={
    level1:[['left','왼쪽'],['right','오른쪽']],
    level2:[['top','위'],['center','가운데'],['bottom','아래']]
  };
  const optionHtml=(items,value)=>items.map(([v,label])=>`<option value="${v}"${v===value?' selected':''}>${label}</option>`).join('');
  const send=(target,action,data)=>target.contentWindow?.postMessage({channel:'kmg-preview',action,data},'*');
  const control=(name)=>form.elements.namedItem(name);
  const defaultStyle={
    background:{mode:'solid',color:'#000000',color2:'#101010',url:'',gradient:{type:'linear',angle:135,stops:[{position:0,color:'#303030',opacity:100},{position:100,color:'#909090',opacity:100}]}},
    fill:{mode:'solid',color:'#ffffff',color2:'#000000',opacity:20,blur:32},
    stroke:{mode:'solid',color:'#ffffff',color2:'#000000',opacity:100,width:4}
  };
  function backgroundStyle(configured){
    const background={...defaultStyle.background,...configured};
    const hasLegacyColor=configured&&('color'in configured||'color2'in configured);
    if(!configured?.gradient&&hasLegacyColor)delete background.gradient;
    return background;
  }
  const opacityPresets=[100,70,40,20,10],blurPresets=[64,32,16,8,4],strokeWidthPresets=[8,6,4,2,1];
  function nearestPreset(value,values,fallback){
    const numberValue=Number(value);if(!Number.isFinite(numberValue))return fallback;
    return values.reduce((best,candidate)=>Math.abs(candidate-numberValue)<Math.abs(best-numberValue)||Math.abs(candidate-numberValue)===Math.abs(best-numberValue)&&candidate<best?candidate:best,values[0]);
  }
  function presetSelect(name,value,values,fallback){
    const selected=nearestPreset(value,values,fallback),labels=['매우 강함','강함','중간','약함','매우 약함'];
    return `<select name="${name}">${values.map((amount,index)=>`<option value="${amount}"${amount===selected?' selected':''}>${labels[index]}</option>`).join('')}</select>`;
  }
  function forceStrokeAlpha(part){
    if(!part||typeof part!=='object')return;
    part.opacity=100;
    const gradient=part.gradient&&typeof part.gradient==='object'?part.gradient:part;
    if(Array.isArray(gradient.stops))gradient.stops=gradient.stops.map(stop=>({...stop,opacity:100}));
  }
  function normalizeStylePresets(next){
    const fill=next.globalStyle.fill,stroke=next.globalStyle.stroke;
    fill.opacity=nearestPreset(fill.opacity,opacityPresets,20);fill.blur=nearestPreset(fill.blur,blurPresets,32);
    stroke.width=nearestPreset(stroke.width,strokeWidthPresets,4);forceStrokeAlpha(stroke);next.borderOpacity=100;
    for(const region of Object.values(next.regionBackgrounds)){
      if(!region||typeof region!=='object')continue;
      region.opacity=nearestPreset(region.fill?.opacity??region.opacity,opacityPresets,20);
      region.blur=nearestPreset(region.fill?.blur??region.blur,blurPresets,16);
      if(region.fill){region.fill.opacity=region.opacity;region.fill.blur=region.blur;}
      region.borderOpacity=100;
      if(region.stroke){region.stroke.width=nearestPreset(region.stroke.width,strokeWidthPresets,4);forceStrokeAlpha(region.stroke);}
    }
  }
  function migratePanelContent(input){
    const direct=input?.panelContent;
    if(input?.layoutVersion>=4&&direct){
      return Object.fromEntries(keys.map(key=>{
        const item=direct[key]||{},type=['none','source','web','media'].includes(item.type)?item.type:'none';
        return [key,{type,url:['web','media'].includes(type)&&typeof item.url==='string'?item.url:''}];
      }));
    }
    const migrated=Object.fromEntries(keys.map(key=>[key,{type:'none',url:''}]));
    migrated.game.type='source';
    if(input?.chatUrl)migrated.chat={type:'web',url:input.chatUrl};
    if(input?.translationUrl)migrated.translation={type:'web',url:input.translationUrl};
    if(input?.cameraMode==='camera'||input?.handcam)migrated.hand.type='source';
    else if(input?.cameraMode==='reactive'&&input?.reactiveUrl)migrated.hand={type:'web',url:input.reactiveUrl};
    for(const key of ['custom1','custom2','custom3']){
      const role=input?.slotContent?.[key]||'none',url=input?.customSlotMedia?.[key]?.url||'';
      if(role==='source')migrated[key].type='source';
      else if(role==='browser'&&url)migrated[key]={type:'web',url};
      else if(['image','video'].includes(role)&&url)migrated[key]={type:'media',url};
      else if(role==='sponsor'&&input?.sponsor)migrated[key]={type:input.sponsorType==='embed'?'web':'media',url:input.sponsor};
      else if(role==='alerts'){
        const alertUrl=['donationChzzk','donationTwitch','donationYoutube','donationSoop'].map(name=>input?.[name]).find(Boolean);
        if(alertUrl)migrated[key]={type:'web',url:alertUrl};
      }
    }
    return migrated;
  }
  function normalize(input){
    const next={...structuredClone(defaults),...structuredClone(input||{})};
    next.layoutVersion=4;
    next.panelSizing=OverlayEvents.normalizeSizing(next.panelSizing);
    next.panelContent=migratePanelContent(input||next);
    for(const legacy of ['chatUrl','translationUrl','reactiveUrl','donationChzzk','donationTwitch','donationYoutube','donationSoop','sponsor','sponsorType','slotContent','customSlotMedia','cameraMode','handcam','platforms','showSponsor','showSubtitles','showChat','showAlerts'])delete next[legacy];
    next.panelEnabled=Object.fromEntries(keys.map(key=>[key,next.panelEnabled?.[key]!==false]));
    next.panelPlacement=OverlayEvents.normalizePlacement(Object.fromEntries(keys.map(key=>[key,{...initialPlacement[key],...next.panelPlacement?.[key]}])));
    next.regionBackgrounds={...defaults.regionBackgrounds,...next.regionBackgrounds};
    next.regionStyleOverrides={...next.regionStyleOverrides};
    next.globalStyle={
      background:backgroundStyle(input?.globalStyle?.background),
      fill:{...defaultStyle.fill,...next.globalStyle?.fill},
      stroke:{...defaultStyle.stroke,...next.globalStyle?.stroke}
    };
    normalizeStylePresets(next);
    // Test lobby assets and personal settings never become the public reset.
    return next;
  }
  function restoredSettings(runtime,saved,savedSource){
    // Replacing config.js with an exported ZIP must beat an older browser draft.
    const exported=runtime?.layoutVersion>=3?runtime:null;
    const fingerprint=exported?JSON.stringify(exported):'';
    if(saved?.layoutVersion>=3&&(!exported||savedSource===fingerprint)){
      try{OverlayEvents.validateLayout(saved.layout);return saved;}catch{}
    }
    if(exported){try{OverlayEvents.validateLayout(exported.layout);return exported;}catch{}}
    return defaults;
  }
  let nextPropertyLabelId=0;
  function bindRowLabel(controlHtml,labelId){
    return (controlHtml||'').replace(/<(input|select|textarea|button)\b([^>]*)>/gi,(tag,element,attributes)=>{
      const type=(attributes.match(/\btype=["']?([^"'\s>]+)/i)||[])[1]?.toLowerCase()||'';
      if(/\baria-(?:label|labelledby)=/i.test(attributes)||element.toLowerCase()==='input'&&['radio','checkbox','file'].includes(type))return tag;
      const colorName=element.toLowerCase()==='input'&&type==='color'?(attributes.match(/\bname=["']([^"']+)/i)||[])[1]:null;
      const refs=colorName?`${labelId} ${colorName}-value-label`:labelId;
      return `<${element}${attributes} aria-labelledby="${refs}">`;
    });
  }
  function propertyRow(label,controlHtml,radioName,value,checked,choiceType='radio',variant=''){
    const choice=radioName?`<input type="${choiceType}" name="${radioName}"${choiceType==='checkbox'?'':` value="${value}"`}${checked?' checked':''}>`:'';
    const labelId=`property-row-label-${++nextPropertyLabelId}`;
    return `<div class="property-row${variant?` ${variant}`:''}"><label>${choice}<span id="${labelId}">${label}</span></label><div class="property-value">${bindRowLabel(controlHtml,labelId)}</div></div>`;
  }
  const color=(name,value)=>`<span id="${name}-value-label" class="value-text" data-color-label="${name}">${value.toUpperCase()}</span><input name="${name}" type="color" class="color-swatch" value="${value}">`;
  const gradientControl=(name)=>`<button class="gradient-edit" type="button" data-gradient-edit="${name}" data-gradient-preview="${name}" aria-label="그라디언트 편집"></button>`;
  function gradientValue(part){
    const normalized=window.KMGGradient?.normalize(part||{});
    if(!normalized||normalized.type!=='linear'||!Array.isArray(normalized.stops))return null;
    return normalized;
  }
  function paintGradientControls(){
    if(!window.KMGGradient)return;
    form.querySelectorAll('[data-gradient-preview]').forEach(button=>{
      const part=gradientPart(button.dataset.gradientPreview);
      if(part)button.style.backgroundImage=window.KMGGradient.css(part);
    });
  }
  function gradientPart(name){
    if(name.startsWith('global')){
      const key=name==='globalBackground'?'background':name==='globalFill'?'fill':'stroke';
      return config.globalStyle[key];
    }
    if(name==='regionFill'||name==='regionStroke'){
      if(!selected)return null;
      const key=name==='regionFill'?'fill':'stroke',region=config.regionBackgrounds[selected]||{};
      if(!region[key]){
        region[key]=key==='fill'
          ?{mode:'solid',color:region.color||'#ffffff',color2:region.color2||region.color||'#ffffff',opacity:region.opacity??20,blur:region.blur??16}
          :{mode:region.borderVisible===false?'none':'solid',color:region.borderColor||'#ffffff',color2:region.borderColor2||region.borderColor||'#ffffff',opacity:100,width:4};
        config.regionBackgrounds[selected]=region;
      }
      return region[key];
    }
    return null;
  }
  function openGradient(name,anchor){
    if(name.startsWith('global'))readGlobal();else readEditor();
    const part=gradientPart(name),api=window.KMGGradient;
    if(!part||!api?.open){status.textContent='그라디언트 편집기를 불러오지 못했습니다';return;}
    part.mode='gradient';
    const lockOpacity=name==='globalStroke'||name==='regionStroke';
    if(lockOpacity)forceStrokeAlpha(part);
    const normalized=gradientValue(part);
    if(!normalized){status.textContent='그라디언트 설정을 읽지 못했습니다';return;}
    part.gradient=normalized;
    const modeName=name==='globalBackground'?'globalBackgroundMode':name==='globalFill'?'globalFillMode':name==='globalStroke'?'globalStrokeMode':name==='regionFill'?'regionFillMode':'regionStrokeMode';
    const gradientRadio=form.querySelector(`input[name="${modeName}"][value="gradient"]`);if(gradientRadio)gradientRadio.checked=true;
    apply();
    api.open(anchor,part,value=>{
      const next=value?.gradient||value;
      let safe=next&&next.type==='linear'&&Array.isArray(next.stops)?next:gradientValue({gradient:next});
      if(!safe)return;
      if(lockOpacity)safe={...safe,stops:safe.stops.map(stop=>({...stop,opacity:100}))};
      part.gradient=safe;
      if(safe.stops.length){part.color=safe.stops[0].color;part.color2=safe.stops[safe.stops.length-1].color;}
      if(name==='regionFill'||name==='regionStroke'){
        const colorName=name==='regionFill'?'regionColor':'regionBorderColor',input=control(colorName);
        if(input&&part.color){input.value=part.color;const label=form.querySelector(`[data-color-label="${colorName}"]`);if(label)label.textContent=part.color.toUpperCase();}
      }
      if(name.startsWith('global'))readGlobal();else readEditor();
      paintGradientControls();apply();
    },{lockOpacity});
  }
  function renderGlobal(){
    const s=config.globalStyle,b=s.background,f=s.fill,t=s.stroke;
    byId('global-settings').innerHTML=`<div class="global-stack">
      <div class="property-section" id="global-background-group"><h4>배경</h4><div class="property-group">
        ${propertyRow('단색',color('globalBackgroundColor',b.color),'globalBackgroundMode','solid',b.mode==='solid')}
        ${propertyRow('그라디언트',gradientControl('globalBackground'),'globalBackgroundMode','gradient',b.mode==='gradient')}
        ${propertyRow('파일',`<label class="mini-action">파일 선택<input data-upload="whole" type="file" accept="image/png,image/jpeg,image/webp,image/gif"></label>`,'globalBackgroundMode','file',b.mode==='file')}
        ${propertyRow('URL',`<input name="globalBackgroundUrl" type="url" placeholder="https://…" value="">`,'globalBackgroundMode','url',b.mode==='url','radio','property-row--long')}
      </div></div><div class="divider"></div>
      <div class="property-section"><h4>패널 채우기</h4><div class="property-group">
        ${propertyRow('없음','','globalFillMode','none',f.mode==='none')}
        ${propertyRow('단색',color('globalFillColor',f.color),'globalFillMode','solid',f.mode==='solid')}
        ${propertyRow('그라디언트',gradientControl('globalFill'),'globalFillMode','gradient',f.mode==='gradient')}
        ${propertyRow('불투명도',presetSelect('globalFillOpacity',f.opacity,opacityPresets,20))}
        ${propertyRow('흐림',presetSelect('globalFillBlur',f.blur,blurPresets,32))}
      </div></div><div class="divider"></div>
      <div class="property-section"><h4>패널 테두리</h4><div class="property-group">
        ${propertyRow('없음','','globalStrokeMode','none',t.mode==='none')}
        ${propertyRow('단색',color('globalStrokeColor',t.color),'globalStrokeMode','solid',t.mode==='solid')}
        ${propertyRow('그라디언트',gradientControl('globalStroke'),'globalStrokeMode','gradient',t.mode==='gradient')}
        ${propertyRow('두께',presetSelect('globalStrokeWidth',t.width,strokeWidthPresets,4))}
      </div></div></div>`;
    control('globalBackgroundUrl').value=b.url||'';
    paintGradientControls();
  }
  function renderPlacement(){
    byId('placement-list').innerHTML=keys.map(key=>{
      const p=config.panelPlacement[key],fields=['level1','level2'];
      return `<div class="placement-row" data-placement="${key}"><label class="placement-heading"><input type="checkbox" data-enabled="${key}"${config.panelEnabled[key]?' checked':''}><span>${names[key]}</span></label><div class="placement-fields">${fields.map(level=>{const options=level==='level2'&&p.level1==='left'?levelOptions.level2.filter(([value])=>value!=='center'):levelOptions[level],label=level==='level1'?'상위 프레임':'하위 프레임';return `<label class="form-field">${label}<select data-placement-level="${level}" data-panel="${key}">${optionHtml(options,p[level])}</select></label>`;}).join('')}</div></div>`;
    }).join('');
  }
  function updatePlacement(input){
    if(!input.matches('[data-placement-level]'))return false;
    const key=input.dataset.panel,level=input.dataset.placementLevel;
    if(!config.panelPlacement[key])return false;
    const placement=structuredClone(config.panelPlacement);
    placement[key][level]=input.value;
    config.panelPlacement=OverlayEvents.normalizePlacement(placement,level==='level2'?key:undefined);
    sizeConstraintTarget=key;
    renderPlacement();
    return true;
  }
  const editorRow=(label,controlHtml,variant='')=>propertyRow(label,controlHtml,'',undefined,false,'radio',variant);
  const editorColor=(label,name,value)=>editorRow(label,color(name,value));
  const editorPreset=(label,name,value,values,fallback)=>editorRow(label,presetSelect(name,value,values,fallback));
  const fieldHtml=(label,name,type='text',extra='',wide=false)=>editorRow(label,`<input name="${name}" type="${type}" ${extra}>`,wide?'property-row--long':'');
  const urlField=(label,name)=>fieldHtml(label,name,'url','placeholder="https://…" autocomplete="off"',true);
  const editorSelect=(label,name,options,value)=>editorRow(label,`<select name="${name}">${optionHtml(options,value)}</select>`);
  const editorFile=(label,kind,accept)=>editorRow(label,`<label class="mini-action">파일 선택<input data-upload="${kind}" type="file" accept="${accept}"></label>`);
  const editorToggle=(label,name,checked)=>propertyRow(label,'',name,undefined,checked,'checkbox','property-row--toggle');
  function renderEditor(){
    byId('panel-empty').hidden=!!selected;byId('panel-editor').hidden=!selected;
    if(!selected){byId('panel-editor').replaceChildren();return;}
    const key=selected,region=config.regionBackgrounds[key]||{},item=config.panelContent[key]||{type:'none',url:''};
    const kinds=[['none','없음'],['source','OBS 소스'],['web','웹 주소'],['media','이미지/영상']];
    const section=(title,html)=>`<div class="property-section"><h4>${title}</h4><div class="property-group">${html}</div></div>`;
    const content=section('콘텐츠',`${editorSelect('콘텐츠 종류','panelContentType',kinds,item.type)}<div id="panel-content-extra" class="property-group"></div>`);
    const size=config.panelSizing[key],sizeModes=[['auto','자동'],['fixed','고정']];
    const sizeControl=axis=>{const title=axis==='width'?'너비':'높이',name=axis==='width'?'panelWidth':'panelHeight';if(axis==='width'&&!OverlayEvents.canResizeWidth(key))return '';return editorRow(title,`<select name="${name}Mode">${optionHtml(sizeModes,size[axis+'Mode'])}</select><div class="size-controls" data-fixed-size="${axis}"${size[axis+'Mode']==='fixed'?'':' hidden'}><input name="${name}" type="number" min="1" step="1" aria-label="${title} (px)"><input name="${name}Slider" type="range" min="1" step="1" list="${name}-ratios" aria-label="${title} 슬라이더"><datalist id="${name}-ratios"></datalist><div class="size-ratio-marks" data-ratio-marks="${axis}"></div><span class="editor-help" data-size-range="${axis}"></span></div>`,'property-row--size');};
    const sizing=section('크기',`${sizeControl('width')}${sizeControl('height')}<div class="size-help"><p class="editor-help"><span>현재 비율</span>: <span data-panel-ratio></span></p><p class="editor-help">자동: 남은 공간을 채웁니다. 고정: 입력한 픽셀 크기를 유지합니다.</p><p class="editor-help">슬라이더의 1:1·16:9 눈금에 가까이 드래그하면 해당 비율에 맞춰집니다.</p></div>`);

    const fill=region.fill||{mode:'solid',color:region.color||'#ffffff',opacity:region.opacity??20,blur:region.blur??16};
    const stroke=region.stroke||{mode:region.borderVisible===false?'none':'solid',color:region.borderColor||'#ffffff',opacity:100,width:4};
    const useRegionOverride=!!config.regionStyleOverrides[key];
    const regionInputs=section('영역 스타일',`
      ${editorToggle('전역 설정 대신 개별 설정','regionOverride',config.regionStyleOverrides[key])}
      <div class="property-group region-style-details"${useRegionOverride?'':' hidden'}>
      ${propertyRow('없음','','regionFillMode','none',fill.mode==='none')}
      ${propertyRow('단색',color('regionColor',fill.color||region.color||'#ffffff'),'regionFillMode','solid',fill.mode!=='none'&&fill.mode!=='gradient')}
      ${propertyRow('그라디언트',gradientControl('regionFill'),'regionFillMode','gradient',fill.mode==='gradient')}
      ${editorPreset('불투명도','regionOpacity',fill.opacity??region.opacity??20,opacityPresets,20)}
      ${editorPreset('블러','regionBlur',fill.blur??region.blur??16,blurPresets,16)}
      ${propertyRow('없음','','regionStrokeMode','none',stroke.mode==='none')}
      ${propertyRow('단색',color('regionBorderColor',stroke.color||region.borderColor||'#ffffff'),'regionStrokeMode','solid',stroke.mode!=='none'&&stroke.mode!=='gradient')}
      ${propertyRow('그라디언트',gradientControl('regionStroke'),'regionStrokeMode','gradient',stroke.mode==='gradient')}
      ${editorPreset('테두리 두께','regionStrokeWidth',stroke.width??4,strokeWidthPresets,4)}
      ${fieldHtml('이미지 경로 또는 URL','regionImage','text','placeholder="assets/image.png 또는 https://…"',true)}
      ${editorFile('이미지 파일','region','image/png,image/jpeg,image/webp,image/gif')}
      </div>`);
    byId('panel-editor').innerHTML=`<h4 class="editor-title"><span class="panel-number">${names[key]}</span></h4>${sizing}<div class="divider"></div>${content}<div class="divider"></div>${regionInputs}`;
    for(const [name,value] of Object.entries({regionColor:fill.color||region.color||'#ffffff',regionOpacity:nearestPreset(fill.opacity??region.opacity,opacityPresets,20),regionBlur:nearestPreset(fill.blur??region.blur,blurPresets,16),regionBorderColor:stroke.color||region.borderColor||'#ffffff',regionStrokeWidth:nearestPreset(stroke.width,strokeWidthPresets,4),regionImage:region.image||''})){const input=control(name);if(input)input.value=value;}
    syncSizeControls();
    renderContentExtra();
    paintGradientControls();
  }
  function renderContentExtra(){
    if(!selected)return;
    const item=config.panelContent[selected]||{type:'none',url:''},type=control('panelContentType').value;
    const root=byId('panel-content-extra');let html='';
    if(type==='source')html='<p class="editor-help">OBS에서 이 패널에 사용할 기존 소스를 선택하세요. 한 소스는 한 패널에만 지정할 수 있습니다.</p>';
    if(type==='web')html=urlField('표시용 웹 주소','panelContentUrl');
    if(type==='media')html=urlField('이미지/영상 경로 또는 URL','panelContentUrl')+editorFile('이미지/영상 파일','panel','image/png,image/jpeg,image/webp,image/gif,video/mp4,video/webm');
    root.innerHTML=html;
    if(control('panelContentUrl'))control('panelContentUrl').value=item.url||'';
  }
  function cameraStatusText(){
    if(cameraState.errorName&&cameraState.status==='connected')return '카메라 전환에 실패했습니다. 기존 연결을 유지합니다.';
    return ({idle:'카메라를 선택한 뒤 연결하세요.',loading:'카메라 목록 또는 연결 상태를 확인하는 중입니다.',connected:'카메라가 연결되었습니다.',empty:'카메라를 찾을 수 없습니다. 권한 요청을 위해 연결을 눌러 보세요.',denied:'카메라 권한이 거부되었습니다. 브라우저 권한을 확인하세요.',busy:'카메라가 다른 앱에서 사용 중입니다.',unavailable:'이 환경에서는 카메라를 사용할 수 없습니다.',error:'카메라 연결에 실패했습니다.'})[cameraState.status]||'카메라 연결 상태를 확인할 수 없습니다.';
  }
  function renderCameraControls(){
    const root=byId('camera-extra'),group=root?.querySelector('.camera-preview-controls');
    if(!group)return;
    const select=group.querySelector('[name="cameraDevice"]'),previous=select?.value;
    const preferredId=cameraState.status==='connected'&&cameraState.selectedDeviceId?cameraState.selectedDeviceId:previous;
    const selectedId=cameraState.devices.some(device=>device.deviceId===preferredId)?preferredId:(cameraState.selectedDeviceId||'');
    const options=cameraState.devices.length?cameraState.devices.map(device=>`<option value="${escapeHtml(device.deviceId)}"${device.deviceId===selectedId?' selected':''}>${escapeHtml(window.KMGI18n?.localize(device.label)||device.label)}</option>`).join(''):`<option value="">${cameraState.status==='empty'?'카메라 장치가 없습니다':'카메라 장치 확인 중'}</option>`;
    group.querySelector('label').innerHTML=`카메라 장치<select name="cameraDevice" aria-label="카메라 장치">${options}</select>`;
    const status=group.querySelector('.camera-preview-status');if(status)status.textContent=window.KMGI18n?.localize(cameraStatusText())||cameraStatusText();
    const loading=cameraState.status==='loading';
    for(const button of group.querySelectorAll('[data-camera-action]'))button.disabled=loading||(!cameraController&&button.dataset.cameraAction!=='disconnect')||(button.dataset.cameraAction==='disconnect'&&cameraState.status!=='connected');
  }
  function escapeHtml(value){return String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));}
  function updateCameraOverlay(layout=config.layout){
    const box=layout?.hand,visible=!!(config.layoutVersion<4&&cameraActive&&cameraVideo?.srcObject&&config.cameraMode==='camera'&&config.panelEnabled.hand&&box);
    if(!cameraVideo)return;
    cameraVideo.hidden=!visible;
    if(visible){cameraVideo.style.left=`${box.x/1920*100}%`;cameraVideo.style.top=`${box.y/1080*100}%`;cameraVideo.style.width=`${box.width/1920*100}%`;cameraVideo.style.height=`${box.height/1080*100}%`;}
  }
  function syncCamera(){
    const shouldConnect=config.layoutVersion<4&&config.cameraMode==='camera'&&config.panelEnabled.hand;
    if(shouldConnect&&!cameraActive){cameraActive=true;void cameraController?.refresh();}
    else if(!shouldConnect&&cameraActive){cameraActive=false;cameraController?.disconnect();}
    updateCameraOverlay();
  }
  cameraController=window.KMGCameraPreview?.create({
    onState:state=>{cameraState=state;renderCameraControls();},
    onStream:stream=>{if(cameraVideo){cameraVideo.srcObject=stream||null;if(stream)cameraVideo.play?.().catch(()=>{});else cameraVideo.hidden=true;}updateCameraOverlay();}
  })||null;
  window.addEventListener('pagehide',()=>{cameraActive=false;cameraController?.disconnect();},{once:true});
  function readEditor(){
    if(!selected)return;
    const key=selected,r=config.regionBackgrounds[key]||{},fill=r.fill||{},stroke=r.stroke||{};
    config.panelSizing[key]={widthMode:control('panelWidthMode')?.value||'auto',width:control('panelWidth')?Number(control('panelWidth').value):config.panelSizing[key].width,heightMode:control('panelHeightMode').value,height:Number(control('panelHeight').value)};
    const fillMode=control('regionFillMode')?.value||fill.mode||'solid',strokeMode=control('regionStrokeMode')?.value||stroke.mode||(r.borderVisible===false?'none':'solid');
    r.color=fillMode==='gradient'&&fill.gradient?.stops?.length?fill.gradient.stops[0].color:control('regionColor').value;
    r.opacity=Number(control('regionOpacity').value);r.blur=Number(control('regionBlur').value);
    r.borderColor=strokeMode==='gradient'&&stroke.gradient?.stops?.length?stroke.gradient.stops[0].color:control('regionBorderColor').value;
    r.borderVisible=strokeMode!=='none';r.image=control('regionImage').value.trim();
    Object.assign(fill,{mode:fillMode,color:r.color,color2:fill.color2||r.color,opacity:r.opacity,blur:r.blur});
    Object.assign(stroke,{mode:strokeMode,color:r.borderColor,color2:stroke.color2||r.borderColor,opacity:100,width:Number(control('regionStrokeWidth').value)});forceStrokeAlpha(stroke);
    r.borderOpacity=100;
    r.fill=fill;r.stroke=stroke;
    config.regionBackgrounds[key]=r;config.regionStyleOverrides[key]=control('regionOverride').checked;
    const type=control('panelContentType').value;
    config.panelContent[key]={type,url:['web','media'].includes(type)?(control('panelContentUrl')?.value.trim()||''):''};
  }
  function readGlobal(){
    const b=config.globalStyle.background,f=config.globalStyle.fill,t=config.globalStyle.stroke;
    for(const [part,fields] of [[b,['Mode','Color','Color2','Url']],[f,['Mode','Color','Color2','Opacity','Blur']],[t,['Mode','Color','Color2','Width']]]){
      const prefix=part===b?'globalBackground':part===f?'globalFill':'globalStroke';
      for(const suffix of fields){const input=control(prefix+suffix);if(!input)continue;const prop=suffix.toLowerCase()==='color2'?'color2':suffix.toLowerCase();part[prop]=['opacity','blur','width'].includes(prop)?Number(input.value):input.value;}
    }
    f.opacity=nearestPreset(f.opacity,opacityPresets,20);f.blur=nearestPreset(f.blur,blurPresets,32);
    t.width=nearestPreset(t.width,strokeWidthPresets,4);forceStrokeAlpha(t);
    config.backgroundColor=b.color;config.backgroundImage=['file','url'].includes(b.mode)?b.url:'';
  }
  function liveConfig(source){
    const live=structuredClone(source);
    live.uiLanguage=document.documentElement.lang;
    for(const [key,entry] of uploads){
      if(key==='whole'&&live.backgroundImage===entry.path){live.backgroundImage=entry.url;live.globalStyle.background.url=entry.url;}
      else if(key==='sponsor'&&live.sponsor===entry.path)live.sponsor=entry.url;
      else if(key.startsWith('region-')){const panel=key.slice(7);if(live.regionBackgrounds[panel]?.image===entry.path)live.regionBackgrounds[panel].image=entry.url;}
      else if(live.panelContent[key]?.url===entry.path)live.panelContent[key].url=entry.url;
    }
    return live;
  }
  function savedConfig(source){
    const saved=structuredClone(source);
    delete saved._localUploads;delete saved._sourceFingerprint;
    return saved;
  }
  function clampPanelSizes(){
    // Sanitize raw number input before shared geometry validation.
    for(const key of keys)for(const axis of ['width','height']){const size=config.panelSizing[key],limit=axis==='width'?1856:1016;size[axis]=Math.min(limit,Math.max(1,Math.round(Number(size[axis])||1)));}
    config.panelSizing=OverlayEvents.normalizeSizing(config.panelSizing);
    // Clamp the changed panel first so editing it cannot shrink valid fixed peers.
    const target=sizeConstraintTarget||selected,ordered=target?[target,...keys.filter(key=>key!==target)]:keys;
    sizeConstraintTarget=null;
    // Recompute against active siblings and gaps after any frame change.
    for(const key of ordered)for(const axis of ['width','height']){
      const size=config.panelSizing[key];
      if(size[axis+'Mode']!=='fixed'||config.panelEnabled[key]===false)continue;
      const bounds=OverlayEvents.sizingBounds({placement:config.panelPlacement,enabled:config.panelEnabled,sizing:config.panelSizing},key,axis);
      size[axis]=Math.min(bounds.max,Math.max(bounds.min,Math.round(size[axis]||bounds.min)));
    }
  }
  function syncSizeControls(){
    if(!selected||!control('panelHeight'))return;
    for(const axis of ['width','height']){
      const name=axis==='width'?'panelWidth':'panelHeight';if(!control(name))continue;const bounds=OverlayEvents.sizingBounds({placement:config.panelPlacement,enabled:config.panelEnabled,sizing:config.panelSizing},selected,axis);
      for(const input of [control(name),control(name+'Slider')]){input.min=bounds.min;input.max=bounds.max;input.value=config.panelSizing[selected][axis+'Mode']==='fixed'?config.panelSizing[selected][axis]:(config.layout?.[selected]?.[axis]||config.panelSizing[selected][axis]);}
      byId('panel-editor').querySelector(`[data-size-range="${axis}"]`).textContent=`${bounds.min}–${bounds.max} px`;
      const box=config.layout?.[selected]||config.panelSizing[selected],stops=OverlayEvents.aspectStops(box,axis,bounds);
      byId(name+'-ratios').innerHTML=stops.map(stop=>`<option value="${stop.value}" label="${stop.label}"></option>`).join('');
      byId('panel-editor').querySelector(`[data-ratio-marks="${axis}"]`).innerHTML=stops.map(stop=>`<span style="left:${(stop.value-bounds.min)/Math.max(1,bounds.max-bounds.min)*100}%">${stop.label}</span>`).join('');
    }
    const box=config.layout?.[selected]||config.panelSizing[selected],ratio=box.width/box.height;
    byId('panel-editor').querySelector('[data-panel-ratio]').textContent=Math.abs(box.width-box.height)<=1?'1:1':Math.abs(box.height-box.width*9/16)<=1?'16:9':ratio.toFixed(2)+':1';
  }
  function current(){
    readEditor();readGlobal();clampPanelSizes();
    config.layout=OverlayEvents.autoLayout({placement:config.panelPlacement,enabled:config.panelEnabled,sizing:config.panelSizing});
    syncSizeControls();return structuredClone(config);
  }
  function drawHits(layout){
    updateCameraOverlay(layout);
    const target=byId('event-target');
    if(target){for(const option of target.options)option.disabled=!config.panelEnabled[option.value];if(!config.panelEnabled[target.value])target.value=keys.find(key=>config.panelEnabled[key])||'';}
    const hits=byId('panel-hit-areas');
    for(const button of [...hits.children])if(!config.panelEnabled[button.dataset.hit])button.remove();
    for(const key of keys.filter(key=>config.panelEnabled[key])){
      const b=layout[key],label=`${names[key]} 설정`,accessibleName=window.KMGI18n?.localize(label)||label,visibleNumber=window.KMGI18n?.localize(names[key])||names[key];
      let button=hits.querySelector(`[data-hit="${key}"]`);
      if(!button){button=document.createElement('button');button.className='panel-hit';button.type='button';button.dataset.hit=key;const number=document.createElement('span');number.className='panel-number';number.setAttribute('aria-hidden','true');button.append(number);hits.append(button);}
      // Keep focused and pressed nodes alive when committing an input updates layout.
      button.setAttribute('aria-label',accessibleName);button.setAttribute('aria-pressed',String(selected===key));
      button.style.cssText=`left:${b.x/1920*100}%;top:${b.y/1080*100}%;width:${b.width/1920*100}%;height:${b.height/1080*100}%;border-radius:${16/b.width*100}% / ${16/b.height*100}%`;
      button.firstElementChild.textContent=visibleNumber;
    }
    highlight();
  }
  function apply(message){
    try{
      const data=current(),live=liveConfig(data);
      syncCamera();
      drawHits(data.layout);
      send(frame,'apply',live);
      if(draftReady&&!missingUploads.size)void uploadStorage.save(savedConfig(data),uploads,sourceFingerprint);
      const warning=missingUploads.size?'저장한 파일을 복원하지 못했습니다. 파일을 다시 선택하세요.':storageWarning;
      showStatus(warning||message||'설정 미리보기 준비 완료',!!warning);
    }catch(error){showStatus(error.message,true);}
  }
  function selectPanel(key){if(!keys.includes(key)||!config.panelEnabled[key])return;readEditor();selected=selected===key?null:key;if(selected)byId('event-target').value=selected;renderEditor();syncCamera();drawHits(config.layout||OverlayEvents.autoLayout({placement:config.panelPlacement,enabled:config.panelEnabled,sizing:config.panelSizing}));}
  function reset(){draftReady=true;form.inert=false;byId('bundle').disabled=false;byId('reset').disabled=false;uploadStorage.reset();uploadRequests.clear();missingUploads.clear();storageWarning='';uploads.clear();cameraActive=false;cameraController?.disconnect();config=normalize(defaults);selected=null;renderGlobal();renderPlacement();renderEditor();apply('기본 설정을 복원했습니다');}

  form.addEventListener('input',event=>{
    const input=event.target;
    if(['panelWidth','panelHeight'].includes(input.name))return; // Commit typed numbers on change, so partial digits are not rewritten.
    if(['panelWidthSlider','panelHeightSlider'].includes(input.name)){
      if(input===snappingSlider){
        const axis=input.name==='panelWidthSlider'?'width':'height',bounds={min:Number(input.min),max:Number(input.max)},stops=OverlayEvents.aspectStops(config.layout[selected],axis,bounds);
        const nearest=stops.sort((a,b)=>Math.abs(a.value-Number(input.value))-Math.abs(b.value-Number(input.value)))[0];
        if(nearest&&Math.abs(nearest.value-Number(input.value))<=(bounds.max-bounds.min)*0.012)input.value=nearest.value;
      }
      control(input.name.replace('Slider','')).value=input.value;
    }
    if(input.matches('[data-enabled]')){
      const key=input.dataset.enabled;
      if(!input.checked&&selected===key){readEditor();selected=null;renderEditor();}
      config.panelEnabled[key]=input.checked;sizeConstraintTarget=key;
    }
    if(input.matches('[data-placement-level]'))return;
    if(selected&&['panelWidthMode','panelHeightMode'].includes(input.name)){
      const axis=input.name==='panelWidthMode'?'width':'height';
      if(input.value==='fixed'&&config.panelSizing[selected][axis+'Mode']==='auto')control(axis==='width'?'panelWidth':'panelHeight').value=config.layout[selected][axis];
      byId('panel-editor').querySelector(`[data-fixed-size="${axis}"]`).hidden=input.value!=='fixed';
    }
    if(input.matches('input[type=color]')){const label=form.querySelector(`[data-color-label="${input.name}"]`);if(label)label.textContent=input.value.toUpperCase();}
    apply();
    paintGradientControls();
  });
  form.addEventListener('change',event=>{
    const input=event.target;
    if(input.matches('[data-upload]')){handleUpload(input);return;}
    if(input.name==='cameraDevice')return;
    if(input.matches('[data-placement-level]')){updatePlacement(input);apply();return;}
    if(input.name==='regionOverride'){
      const details=byId('panel-editor').querySelector('.region-style-details');
      if(details)details.hidden=!input.checked;
    }
    if(input.name==='panelContentType'){readEditor();renderContentExtra();}
    apply();
    paintGradientControls();
    if(['globalBackgroundMode','globalFillMode','globalStrokeMode','regionFillMode','regionStrokeMode'].includes(input.name)&&input.value==='gradient'){
      const name=input.name==='globalBackgroundMode'?'globalBackground':input.name==='globalFillMode'?'globalFill':input.name==='globalStrokeMode'?'globalStroke':input.name==='regionFillMode'?'regionFill':'regionStroke';
      const anchor=form.querySelector(`[data-gradient-edit="${name}"]`);if(anchor)openGradient(name,anchor);
    }
  });
  form.addEventListener('click',event=>{const cameraButton=event.target.closest('[data-camera-action]');if(cameraButton){event.preventDefault();if(cameraButton.dataset.cameraAction==='refresh')void cameraController?.refresh();else if(cameraButton.dataset.cameraAction==='connect')void cameraController?.connect(control('cameraDevice')?.value||'');else if(cameraButton.dataset.cameraAction==='disconnect')cameraController?.disconnect();return;}const button=event.target.closest('[data-gradient-edit]');if(button){event.preventDefault();openGradient(button.dataset.gradientEdit,button);}});
  form.addEventListener('pointerdown',event=>{snappingSlider=event.target.matches('input[type=range]')?event.target:null;});
  window.addEventListener('pointerup',()=>{snappingSlider=null;});
  window.addEventListener('pointercancel',()=>{snappingSlider=null;});
  form.addEventListener('focusout',event=>{if(['panelWidth','panelHeight'].includes(event.target.name))apply();});
  form.addEventListener('keydown',event=>{if(event.key==='Enter'&&['panelWidth','panelHeight'].includes(event.target.name)){event.preventDefault();apply();}});
  form.addEventListener('submit',event=>event.preventDefault());
  byId('panel-hit-areas').addEventListener('pointerover',event=>{hovered=event.target.closest('[data-hit]')?.dataset.hit||null;highlight();});
  byId('panel-hit-areas').addEventListener('pointerleave',()=>{hovered=null;highlight();});
  byId('panel-hit-areas').addEventListener('focusin',event=>{hovered=event.target.closest('[data-hit]')?.dataset.hit||null;highlight();});
  byId('panel-hit-areas').addEventListener('focusout',()=>{hovered=null;highlight();});
  byId('panel-hit-areas').addEventListener('click',event=>{const button=event.target.closest('[data-hit]');if(button)selectPanel(button.dataset.hit);});
  byId('reset').onclick=reset;
  byId('send').onclick=()=>{const target=byId('event-target').value;if(!config.panelEnabled[target])return;send(frame,'receive',{target,nickname:byId('event-name').value,text:byId('event-text').value});status.textContent='샘플을 표시했습니다';};
  byId('clear').onclick=()=>{send(frame,'clear');status.textContent='샘플을 비웠습니다';};
  const fullscreenButton=byId('fullscreen'),fullscreenLabel=fullscreenButton.querySelector('[data-fullscreen-label]'),fullscreenMessage=byId('fullscreen-message');
  const fullscreenSurface=byId('preview-fullscreen'),fullscreenToolbar=fullscreenSurface.querySelector('.fullscreen-toolbar'),returnToSettings=byId('return-to-settings');
  let fullscreenTimer=null;
  function localized(message){return window.KMGI18n?.localize(message)||message;}
  function showFullscreenMessage(message){fullscreenMessage.textContent=localized(message);fullscreenMessage.hidden=false;status.textContent=message;clearTimeout(fullscreenTimer);fullscreenTimer=setTimeout(()=>{fullscreenMessage.hidden=true;},5000);}
  function fullscreenActivation(){const activation=window.navigator?.userActivation;let hasFocus=null;try{if(typeof document.hasFocus==='function')hasFocus=document.hasFocus();}catch{}return {isActive:activation?.isActive??null,hasBeenActive:activation?.hasBeenActive??null,hasFocus,visibilityState:document.visibilityState??null,prerendering:document.prerendering??null};}
  function logFullscreenFailure(operation,error,activation){
    const policy=document.permissionsPolicy||document.featurePolicy;let policyAllowsFullscreen=null;
    try{if(typeof policy?.allowsFeature==='function')policyAllowsFullscreen=policy.allowsFeature('fullscreen');}catch{}
    const diagnostic={operation,errorName:typeof error?.name==='string'?error.name:'Error',errorMessage:typeof error?.message==='string'?error.message:String(error??''),fullscreenEnabled:document.fullscreenEnabled??null,policyAllowsFullscreen,userActivationIsActive:activation.isActive,userActivationHasBeenActive:activation.hasBeenActive,hasFocus:activation.hasFocus,visibilityState:activation.visibilityState,prerendering:activation.prerendering};
    console.warn('[fullscreen.request.failed]',JSON.stringify(diagnostic));
  }
  function updateFullscreenLabel(){
    const isFullscreen=document.fullscreenElement===fullscreenSurface;
    fullscreenLabel.textContent=localized(isFullscreen?'전체화면 종료':'전체화면 보기');
    fullscreenToolbar.hidden=!isFullscreen;
    fullscreenButton.setAttribute('aria-expanded',String(isFullscreen));
  }
  async function exitPreviewFullscreen(){
    if(document.fullscreenElement!==fullscreenSurface)return;
    const activation=fullscreenActivation();
    try{if(!document.exitFullscreen)throw new Error('exitFullscreen unavailable');await document.exitFullscreen();}
    catch(error){logFullscreenFailure('exit',error,activation);showFullscreenMessage('전체 화면을 종료하지 못했습니다. 브라우저 권한을 확인하세요.');}
  }
  returnToSettings.onclick=exitPreviewFullscreen;
  fullscreenButton.onclick=async()=>{
    if(document.fullscreenElement===fullscreenSurface){await exitPreviewFullscreen();return;}
    if(!fullscreenSurface.requestFullscreen||document.fullscreenEnabled===false){showFullscreenMessage('이 브라우저에서는 전체 화면을 사용할 수 없습니다.');return;}
    fullscreenMessage.hidden=true;clearTimeout(fullscreenTimer);
    const activation=fullscreenActivation();
    try{await fullscreenSurface.requestFullscreen();}
    catch(error){logFullscreenFailure('enter',error,activation);showFullscreenMessage('전체 화면을 시작하지 못했습니다. 브라우저 권한을 확인하세요.');}
  };
  document.addEventListener('fullscreenchange',updateFullscreenLabel);
  document.addEventListener('fullscreenchange',highlight);
  document.addEventListener('fullscreenerror',()=>showFullscreenMessage('전체 화면을 시작하지 못했습니다. 브라우저 권한을 확인하세요.'));
  window.addEventListener('kmg-language-change',()=>{apply();updateFullscreenLabel();});

  function previewData(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(file);});}
  async function readUpload(key,file){
    const ticket={};uploadRequests.set(key,ticket);
    try{
      const url=await previewData(file);
      return uploadRequests.get(key)===ticket?url:null;
    }catch{
      if(uploadRequests.get(key)===ticket){const message='파일을 읽지 못했습니다. 파일을 다시 선택하세요.';status.textContent=window.KMGI18n?.localize(message)||message;}
      return null;
    }
  }
  async function handleUpload(input){
    const file=input.files?.[0];if(!file)return;
    if(!(file.size>0)){showStatus('빈 파일은 사용할 수 없습니다. 다른 파일을 선택하세요.',true);return;}
    const ext=file.name.split('.').pop().toLowerCase(),video=['mp4','webm'].includes(ext);
    if(!['png','jpg','jpeg','webp','gif','mp4','webm'].includes(ext))return void(status.textContent='지원하지 않는 파일 형식입니다');
    if(video&&['whole','region'].includes(input.dataset.upload))return void(status.textContent='배경에는 이미지를 선택하세요');
    const kind=input.dataset.upload,panelKey=selected;
    if(['panel','region'].includes(kind)&&!panelKey)return;
    const key=kind==='panel'?panelKey:kind==='region'?'region-'+panelKey:kind;
    const path=kind==='whole'?'assets/background-whole.'+ext:kind==='region'?'assets/background-'+panelKey+'.'+ext:kind==='sponsor'?'assets/team-promo.'+ext:'assets/'+panelKey+'.'+ext;
    const url=await readUpload(key,file);if(url===null)return;
    uploads.set(key,{file,path,url});missingUploads.delete(key);
    if(kind==='whole'){config.globalStyle.background.mode='file';config.globalStyle.background.url=path;renderGlobal();}
    else if(kind==='region'){config.regionBackgrounds[panelKey].image=path;if(selected===panelKey&&control('regionImage'))control('regionImage').value=path;}
    else if(kind==='sponsor'){config.sponsor=path;config.sponsorType=video?'video':'image';if(selected===panelKey)renderContentExtra();}
    else {config.panelContent[panelKey]={type:'media',url:path};if(selected===panelKey){if(control('panelContentType'))control('panelContentType').value='media';renderContentExtra();}}
    apply();
  }
  async function alphaMask(box,name){
    const canvas=document.createElement('canvas');canvas.width=1920;canvas.height=1080;const context=canvas.getContext('2d');
    const {x,y,width,height}=box,r=Math.min(16,width/2,height/2);context.fillStyle='#fff';context.beginPath();context.roundRect(x,y,width,height,r);context.fill();
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('마스크 생성 실패');
    return {name,bytes:new Uint8Array(await blob.arrayBuffer())};
  }
  byId('bundle').onclick=async()=>{
    try{
      const data=current(),uploadSnapshot=Array.from(uploads,([key,entry])=>[key,{...entry}]),entries=OverlayPack.settingsEntries(data);
      if(!window.OBS_EXPORT_RUNTIME)throw new Error('Open settings from the downloaded template package before saving.');
      const saveHandle=window.showSaveFilePicker?await window.showSaveFilePicker({suggestedName:'OBS-settings.zip',types:[{description:'ZIP archive',accept:{'application/zip':['.zip']}}]}):null;
      for(const [name,encoded] of Object.entries(window.OBS_EXPORT_RUNTIME))entries.push({name,bytes:Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))});
      for(const key of keys)entries.push(await alphaMask(data.layout[key],'assets/'+key+'-alpha-mask.png'));
      for(const [key,entry] of uploadSnapshot){const selectedPath=key==='whole'?data.backgroundImage:key==='sponsor'?data.sponsor:key.startsWith('region-')?data.regionBackgrounds[key.slice(7)]?.image:data.panelContent[key]?.url;if(selectedPath===entry.path)entries.push({name:entry.path,bytes:new Uint8Array(await entry.file.arrayBuffer())});}
      // Reopened packages retain asset paths, but no File objects in uploads.
      const assetPaths=new Set([data.backgroundImage,data.sponsor,data.logo,...Object.values(data.regionBackgrounds||{}).map(region=>region.image),...Object.values(data.panelContent||{}).filter(panel=>panel.type==='media').map(panel=>panel.url)]);
      for(const path of assetPaths){
        if(typeof path!=='string'||!/^assets\/[A-Za-z0-9_.-]+\.(png|jpe?g|webp|gif|mp4|webm|svg)$/i.test(path)||entries.some(entry=>entry.name===path))continue;
        try{
          const response=await fetch(path);if(!response.ok)throw new Error('asset unavailable');
          entries.push({name:path,bytes:new Uint8Array(await response.arrayBuffer())});
        }catch{throw new Error('Could not include saved media. Re-upload local files before saving ZIP.');}
      }
      const blob=new Blob([OverlayPack.zip(entries)],{type:'application/zip'});
      if(saveHandle){const writable=await saveHandle.createWritable();try{await writable.write(blob);await writable.close();}catch(error){await writable.abort().catch(()=>{});throw error;}}
      else{const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='OBS-settings.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
      status.textContent='Extract OBS-settings.zip, then select OBS-script.lua from that folder in OBS.';
    }catch(error){if(error.name==='AbortError')return;status.textContent=window.KMGI18n?.localize(error.message)||error.message;}
  };
  frame.addEventListener('load',()=>{if(draftReady)send(frame,'apply',liveConfig(current()));});
  async function restoreDraft(){
    form.inert=true;byId('bundle').disabled=true;byId('reset').disabled=true;
    showStatus('저장한 설정과 파일을 불러오는 중입니다');
    let saved,savedSource;try{saved=JSON.parse(localStorage.getItem('obs-overlay-config'));savedSource=saved?._sourceFingerprint??localStorage.getItem('obs-overlay-source-config');}catch{}
    const restored=restoredSettings(sourceConfig,saved,savedSource);
    const clean=structuredClone(restored);delete clean._localUploads;delete clean._sourceFingerprint;
    config=normalize(clean);
    if(restored===saved){
      const recovered=await uploadStorage.restore(saved);
      for(const key of recovered.missing)missingUploads.add(key);
      for(const [key,entry] of recovered.entries){
        try{uploads.set(key,{...entry,url:await previewData(entry.file)});}
        catch{missingUploads.add(key);}
      }
    }
    draftReady=true;form.inert=false;byId('bundle').disabled=false;byId('reset').disabled=false;
    renderGlobal();renderPlacement();renderEditor();apply();
  }
  function recoverDraft(error){
    config=normalize(defaults);selected=null;uploads.clear();missingUploads.clear();
    draftReady=true;form.inert=false;byId('bundle').disabled=false;byId('reset').disabled=false;
    renderGlobal();renderPlacement();renderEditor();drawHits(config.layout);send(frame,'apply',liveConfig(config));
    // Preserve the failed draft until an explicit user edit or reset replaces it.
    showStatus(error.message,true);
  }
  void restoreDraft().catch(recoverDraft);
})();
