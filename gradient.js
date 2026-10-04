(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root)root.KMGGradient=api;
})(typeof window!=='undefined'?window:globalThis,function(){
  'use strict';

  const MAX_STOPS=12,MIN_STOPS=2;
  const DEFAULT_COLORS=['#000000','#000000'];
  const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
  const number=(value,fallback)=>{
    if(value===null||value===undefined||typeof value==='boolean'||(typeof value==='string'&&!value.trim()))return fallback;
    const parsed=Number(value);
    return Number.isFinite(parsed)?parsed:fallback;
  };
  function color(value,fallback){
    if(typeof value!=='string')return fallback;
    const text=value.trim();
    if(/^#[0-9a-f]{3}$/i.test(text))return '#'+text.slice(1).split('').map(char=>char+char).join('').toUpperCase();
    if(/^#[0-9a-f]{6}$/i.test(text))return text.toUpperCase();
    return fallback;
  }
  const record=value=>value&&typeof value==='object'&&!Array.isArray(value);
  function sourceOf(part){
    if(record(part)&&record(part.gradient))return {source:part.gradient,legacy:false};
    if(record(part)&&part.type==='linear'&&Array.isArray(part.stops))return {source:part,legacy:false};
    return {source:record(part)?part:{},legacy:record(part)&&part.mode==='gradient'};
  }
  function normalize(part){
    const {source,legacy}=sourceOf(part);
    let raw=Array.isArray(source.stops)?source.stops.slice(0,MAX_STOPS):null;
    const hasStops=!!(raw&&raw.length);
    const firstColor=color(source.color,null),secondColor=color(source.color2,null);
    const hasLegacyColors=!hasStops&&(firstColor!==null||secondColor!==null);
    if(hasLegacyColors){
      raw=[
        {position:0,color:firstColor||secondColor,opacity:100},
        {position:100,color:secondColor||firstColor,opacity:100}
      ];
    }
    if(!raw||raw.length===0)raw=DEFAULT_COLORS.map((value,index)=>({position:index?100:0,color:value,opacity:100}));
    const stops=raw.map((stop,index)=>{
      const item=record(stop)?stop:{};
      const fallbackPosition=raw.length<2?0:index/(raw.length-1)*100;
      return {
        position:clamp(number(item.position,fallbackPosition),0,100),
        color:color(item.color,DEFAULT_COLORS[0]),
        opacity:clamp(number(item.opacity,100),0,100)
      };
    });
    while(stops.length<MIN_STOPS){
      const first=stops[0]||{position:0,color:DEFAULT_COLORS[0],opacity:100};
      stops.push({...first,position:first.position===0?100:0});
    }
    stops.sort((a,b)=>a.position-b.position);
    let angle=number(source.angle,legacy&&hasLegacyColors?135:90)%360;
    if(angle<0)angle+=360;
    return {type:'linear',angle,stops};
  }
  function css(part){
    const gradient=normalize(part);
    const stops=gradient.stops.map(stop=>{
      const channels=stop.color.slice(1).match(/../g).map(pair=>parseInt(pair,16));
      const colorText=stop.opacity===100?stop.color:`rgba(${channels.join(', ')}, ${+(stop.opacity/100).toFixed(3)})`;
      return `${colorText} ${+stop.position.toFixed(3)}%`;
    });
    return `linear-gradient(${+gradient.angle.toFixed(3)}deg, ${stops.join(', ')})`;
  }

  let active=null;
  let nextId=1;
  const make=(tag,className,text)=>{
    const node=document.createElement(tag);
    if(className)node.className=className;
    if(text!==undefined)node.textContent=text;
    return node;
  };
  const button=(className,text,label)=>{
    const node=make('button',className,text);
    node.type='button';
    if(label)node.setAttribute('aria-label',label);
    return node;
  };
  function open(anchor,part,onChange,options={}){
    if(typeof document==='undefined'||!document.body)return null;
    const lockOpacity=options?.lockOpacity===true;
    const japanese={
      'Gradient editor':'グラデーションエディター','Gradient type':'グラデーションの種類',
      'Rotate gradient counterclockwise':'反時計回りに回転','Rotate gradient clockwise':'時計回りに回転',
      'Reverse':'反転','Reverse gradient':'グラデーションを反転','Angle':'角度','Angle in degrees':'角度（度）',
      'Gradient stops; drag a handle to change its position':'カラーストップ。ハンドルをドラッグして位置を変更',
      'Stops':'ストップ','+ Add stop':'+ ストップを追加','Add gradient stop':'ストップを追加',
      'Color':'色','Selected stop color':'選択中のストップの色','Hex':'カラーコード',
      'Selected stop hex color':'選択中のストップのカラーコード','Position':'位置',
      'Selected stop position percent':'選択中のストップの位置（%）','Opacity':'不透明度',
      'Selected stop opacity percent':'選択中のストップの不透明度（%）',
      'Remove stop':'ストップを削除','Remove selected stop':'選択中のストップを削除','Linear':'線形'
    };
    const label=(ko,en)=>{
      const language=document.documentElement.lang;
      if(language==='en')return en;
      if(language!=='ja')return ko;
      if(japanese[en])return japanese[en];
      let match=/^Stop at (\d+) percent$/.exec(en);
      if(match)return `ストップ ${match[1]}%`;
      match=/^Select stop (\d+), (\d+) percent$/.exec(en);
      if(match)return `ストップ ${match[1]} を選択、${match[2]}%`;
      match=/^Stop (\d+)$/.exec(en);
      return match?`ストップ ${match[1]}`:en;
    };
    if(active){const wasSame=active.anchor===anchor;active.close();if(wasSame)return null;}
    const normalized=normalize(part);
    const editor={type:'linear',angle:normalized.angle,stops:normalized.stops.map(stop=>({...stop,opacity:lockOpacity?100:stop.opacity,id:nextId++}))};
    let selectedId=editor.stops[0].id;
    const root=make('section','kmg-gradient-popover');
    root.setAttribute('role','dialog');root.setAttribute('aria-label',label('그라디언트 편집기','Gradient editor'));
    const header=make('header','kmg-gradient-head');
    const typeSelect=make('select','kmg-gradient-type');
    typeSelect.setAttribute('aria-label',label('그라디언트 종류','Gradient type'));
    const linear=make('option','',label('선형','Linear'));linear.value='linear';typeSelect.append(linear);
    const rotateLeft=button('kmg-gradient-icon','−',label('반시계방향 회전','Rotate gradient counterclockwise'));
    const rotateRight=button('kmg-gradient-icon','+',label('시계방향 회전','Rotate gradient clockwise'));
    const reverse=button('kmg-gradient-action',label('반전','Reverse'),label('그라디언트 반전','Reverse gradient'));
    header.append(typeSelect,rotateLeft,rotateRight,reverse);
    const angleLine=make('div','kmg-gradient-angle-line');
    angleLine.append(make('span','',label('각도','Angle')));
    const angleInput=make('input','kmg-gradient-angle');angleInput.type='number';angleInput.min='0';angleInput.max='359';angleInput.step='1';angleInput.setAttribute('aria-label',label('각도','Angle in degrees'));
    angleLine.append(angleInput,make('span','kmg-gradient-unit','°'));
    const track=make('div','kmg-gradient-track');track.setAttribute('role','group');track.setAttribute('aria-label',label('그라디언트 중지점. 핸들을 끌어 위치를 바꾸세요','Gradient stops; drag a handle to change its position'));
    const stopsHeading=make('div','kmg-gradient-stops-heading');
    stopsHeading.append(make('strong','',label('중지점','Stops')));
    const add=button('kmg-gradient-add',label('+ 중지점 추가','+ Add stop'),label('중지점 추가','Add gradient stop'));
    stopsHeading.append(add);
    const list=make('div','kmg-gradient-list');
    const details=make('div','kmg-gradient-details');
    const colorField=make('label','kmg-gradient-field');colorField.append(make('span','',label('색상','Color')));
    const colorInput=make('input','kmg-gradient-color color-swatch');colorInput.type='color';colorInput.setAttribute('aria-label',label('선택한 중지점 색상','Selected stop color'));colorField.append(colorInput);
    const hexField=make('label','kmg-gradient-field kmg-gradient-hex-field');hexField.append(make('span','',label('색상 코드','Hex')));
    const hexInput=make('input','kmg-gradient-value');hexInput.type='text';hexInput.inputMode='text';hexInput.maxLength=7;hexInput.autocomplete='off';hexInput.spellcheck=false;hexInput.setAttribute('aria-label',label('선택한 중지점 색상 코드','Selected stop hex color'));hexField.append(hexInput);
    const positionField=make('label','kmg-gradient-field');positionField.append(make('span','',label('위치','Position')));
    const positionInput=make('input','kmg-gradient-value');positionInput.type='number';positionInput.min='0';positionInput.max='100';positionInput.step='1';positionInput.setAttribute('aria-label',label('선택한 중지점 위치','Selected stop position percent'));positionField.append(positionInput,make('span','kmg-gradient-unit','%'));
    const opacityField=make('label','kmg-gradient-field');opacityField.append(make('span','',label('불투명도','Opacity')));
    const opacityInput=make('input','kmg-gradient-value');opacityInput.type='number';opacityInput.min='0';opacityInput.max='100';opacityInput.step='1';opacityInput.setAttribute('aria-label',label('선택한 중지점 불투명도','Selected stop opacity percent'));opacityField.append(opacityInput,make('span','kmg-gradient-unit','%'));
    opacityField.hidden=lockOpacity;
    details.append(colorField,hexField,positionField,opacityField);
    const remove=button('kmg-gradient-remove',label('중지점 삭제','Remove stop'),label('선택한 중지점 삭제','Remove selected stop'));
    root.append(header,angleLine,track,stopsHeading,list,details,remove);
    // A modal dialog occupies the browser's top layer. Keep its editor there too.
    (anchor?.closest?.('dialog[open]')||document.body).append(root);
    const ownerWindow=root.ownerDocument.defaultView||window;
    const listeners=[];
    const listen=(target,type,handler,options)=>{target.addEventListener(type,handler,options);listeners.push(()=>target.removeEventListener(type,handler,options));};
    let draggingId=null;
    function snapshot(){return {type:'linear',angle:editor.angle,stops:editor.stops.map(({position,color,opacity})=>({position,color,opacity:lockOpacity?100:opacity})).sort((a,b)=>a.position-b.position)};}
    function changed(){
      if(typeof onChange==='function'){
        try{onChange(snapshot());}catch(error){ownerWindow.console?.error?.('Gradient change callback failed',error);}
      }
    }
    function selected(){return editor.stops.find(stop=>stop.id===selectedId)||editor.stops[0];}
    function updateBar(){track.style.backgroundImage=css(snapshot());}
    function render(){
      angleInput.value=String(Math.round(editor.angle));
      updateBar();
      track.replaceChildren();
      editor.stops.forEach(stop=>{
        const handle=button(`kmg-gradient-handle${stop.id===selectedId?' is-selected':''}`,'',label(`중지점 ${Math.round(stop.position)}%`,`Stop at ${Math.round(stop.position)} percent`));
        handle.dataset.stopId=String(stop.id);handle.style.left=`${stop.position}%`;handle.setAttribute('role','slider');handle.setAttribute('aria-valuemin','0');handle.setAttribute('aria-valuemax','100');handle.setAttribute('aria-valuenow',String(Math.round(stop.position)));handle.tabIndex=0;
        track.append(handle);
      });
      list.replaceChildren();
      editor.stops.forEach((stop,index)=>{
        const row=button(`kmg-gradient-stop${stop.id===selectedId?' is-selected':''}`,'',label(`중지점 ${index+1}, ${Math.round(stop.position)}%`,`Select stop ${index+1}, ${Math.round(stop.position)} percent`));
        row.dataset.stopId=String(stop.id);
        const swatch=make('span','kmg-gradient-swatch');swatch.style.backgroundColor=stop.color;swatch.style.opacity=String(stop.opacity/100);
        row.append(swatch,make('span','kmg-gradient-stop-name',label(`중지점 ${index+1}`,`Stop ${index+1}`)),make('span','kmg-gradient-stop-value',`${Math.round(stop.position)}%`));
        list.append(row);
      });
      const stop=selected();
      colorInput.value=stop.color;hexInput.value=stop.color;positionInput.value=String(Math.round(stop.position));opacityInput.value=String(Math.round(stop.opacity));
      remove.disabled=editor.stops.length<=MIN_STOPS;
      add.disabled=editor.stops.length>=MAX_STOPS;
    }
    function repaintPosition(){
      const stop=editor.stops.find(item=>item.id===draggingId);
      if(!stop)return;
      for(const handle of track.querySelectorAll('[data-stop-id]')){
        const item=editor.stops.find(candidate=>candidate.id===Number(handle.dataset.stopId));
        if(item){handle.style.left=`${item.position}%`;handle.setAttribute('aria-valuenow',String(Math.round(item.position)));handle.setAttribute('aria-label',label(`중지점 ${Math.round(item.position)}%`,`Stop at ${Math.round(item.position)} percent`));}
      }
      updateBar();changed();
    }
    function reposition(){
      if(!anchor?.getBoundingClientRect){root.style.left='12px';root.style.top='12px';return;}
      const rect=anchor.getBoundingClientRect(),margin=8,gap=8;
      const width=root.offsetWidth||340,height=root.offsetHeight||420;
      const maxLeft=Math.max(margin,ownerWindow.innerWidth-width-margin);
      let left=clamp(rect.left,maxLeft?margin:0,maxLeft);
      let top=rect.bottom+gap;
      if(top+height>ownerWindow.innerHeight-margin&&rect.top-height-gap>=margin)top=rect.top-height-gap;
      top=clamp(top,margin,Math.max(margin,ownerWindow.innerHeight-height-margin));
      root.style.left=`${left}px`;root.style.top=`${top}px`;
    }
    function close(){
      if(active?.root===root)active=null;
      listeners.splice(0).forEach(removeListener=>removeListener());
      root.remove();
    }
    listen(root,'click',event=>{
      const target=event.target.closest('button');
      if(!target)return;
      if(target.hasAttribute('data-stop-id')){selectedId=Number(target.dataset.stopId);render();return;}
      if(target===rotateLeft||target===rotateRight){editor.angle=(editor.angle+(target===rotateRight?15:-15)+360)%360;render();changed();return;}
      if(target===reverse){editor.stops.forEach(stop=>stop.position=100-stop.position);editor.stops.sort((a,b)=>a.position-b.position);render();changed();return;}
      if(target===add){
        if(editor.stops.length>=MAX_STOPS)return;
        // Numeric position edits may cross a neighbor before the next repaint.
        editor.stops.sort((a,b)=>a.position-b.position);
        let pair=[editor.stops[0],editor.stops[1]],gap=-1;
        for(let index=0;index<editor.stops.length-1;index++){
          const candidate=[editor.stops[index],editor.stops[index+1]],candidateGap=candidate[1].position-candidate[0].position;
          if(candidateGap>gap){pair=candidate;gap=candidateGap;}
        }
        const ratio=.5,channel=(a,b)=>Math.round(parseInt(a,16)+(parseInt(b,16)-parseInt(a,16))*ratio).toString(16).padStart(2,'0');
        const a=pair[0].color.slice(1),b=pair[1].color.slice(1),newStop={id:nextId++,position:(pair[0].position+pair[1].position)/2,color:'#'+channel(a.slice(0,2),b.slice(0,2))+channel(a.slice(2,4),b.slice(2,4))+channel(a.slice(4,6),b.slice(4,6)),opacity:lockOpacity?100:(pair[0].opacity+pair[1].opacity)/2};
        editor.stops.push(newStop);editor.stops.sort((x,y)=>x.position-y.position);selectedId=newStop.id;render();changed();return;
      }
      if(target===remove){
        if(editor.stops.length<=MIN_STOPS)return;
        const index=editor.stops.findIndex(stop=>stop.id===selectedId);
        editor.stops.splice(index,1);selectedId=editor.stops[Math.max(0,index-1)].id;render();changed();
      }
    });
    listen(root,'input',event=>{
      const target=event.target,stop=selected();
      if(target===angleInput){editor.angle=clamp(number(target.value,editor.angle),0,359);changed();return;}
      if(target===colorInput){stop.color=color(target.value,stop.color);hexInput.value=stop.color;updateBar();changed();return;}
      if(target===hexInput){const value=color(target.value,stop.color);if(/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(target.value.trim())){stop.color=value;colorInput.value=value;updateBar();changed();}return;}
      if(target===positionInput){stop.position=clamp(number(target.value,stop.position),0,100);for(const handle of track.querySelectorAll('[data-stop-id]'))if(Number(handle.dataset.stopId)===stop.id){handle.style.left=`${stop.position}%`;handle.setAttribute('aria-valuenow',String(Math.round(stop.position)));}updateBar();changed();return;}
      if(target===opacityInput&&!lockOpacity){stop.opacity=clamp(number(target.value,stop.opacity),0,100);updateBar();changed();}
    });
    listen(root,'change',event=>{
      if(event.target===positionInput){editor.stops.sort((a,b)=>a.position-b.position);render();}
      else if(event.target===hexInput&&!/^#[0-9a-f]{3}(?:[0-9a-f]{3})?$/i.test(hexInput.value.trim()))render();
    });
    listen(track,'pointerdown',event=>{
      const handle=event.target.closest('[data-stop-id]');if(!handle)return;
      event.preventDefault();draggingId=Number(handle.dataset.stopId);selectedId=draggingId;
      try{handle.setPointerCapture(event.pointerId);}catch{}
      for(const node of root.querySelectorAll('[data-stop-id]'))node.classList.toggle('is-selected',Number(node.dataset.stopId)===selectedId);
      const stop=selected();colorInput.value=stop.color;hexInput.value=stop.color;positionInput.value=String(Math.round(stop.position));opacityInput.value=String(Math.round(stop.opacity));
    });
    listen(ownerWindow.document,'pointermove',event=>{
      if(draggingId===null)return;
      const rect=track.getBoundingClientRect();
      const stop=editor.stops.find(item=>item.id===draggingId);
      if(!stop||rect.width<=0)return;
      stop.position=clamp((event.clientX-rect.left)/rect.width*100,0,100);repaintPosition();
    });
    listen(ownerWindow.document,'pointerup',()=>{
      if(draggingId===null)return;
      draggingId=null;editor.stops.sort((a,b)=>a.position-b.position);render();
    });
    listen(root,'keydown',event=>{
      const handle=event.target.closest?.('[role="slider"]');
      if(!handle)return;
      const stop=editor.stops.find(item=>item.id===Number(handle.dataset.stopId));if(!stop)return;
      let next=stop.position;
      if(event.key==='ArrowLeft'||event.key==='ArrowDown')next-=1;
      else if(event.key==='ArrowRight'||event.key==='ArrowUp')next+=1;
      else if(event.key==='Home')next=0;
      else if(event.key==='End')next=100;
      else return;
      event.preventDefault();stop.position=clamp(next,0,100);render();changed();track.querySelector(`[data-stop-id="${stop.id}"]`)?.focus();
    });
    listen(ownerWindow.document,'pointerdown',event=>{if(!root.contains(event.target)&&!anchor?.contains?.(event.target))close();},true);
    listen(ownerWindow.document,'keydown',event=>{if(event.key==='Escape')close();});
    listen(ownerWindow.document,'change',event=>{if(event.target?.id==='ui-language')close();});
    listen(ownerWindow,'resize',reposition);listen(ownerWindow,'scroll',reposition,true);
    render();reposition();
    active={anchor,root,close};
    return {close,get value(){return snapshot();}};
  }
  return {normalize,css,open};
});
