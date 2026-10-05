const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const source=fs.readFileSync(path.join(__dirname,'../template/i18n.js'),'utf8');
function textNode(value,tagName='SPAN'){return {nodeValue:value,parentElement:{tagName,closest:()=>null}};}
function attributeNode(values){
 const attributes={...values};
 return {getAttribute:name=>Object.hasOwn(attributes,name)?attributes[name]:null,setAttribute:(name,value)=>{attributes[name]=value;},attributes};
}
function boot(pathname='/settings.html',savedLanguage='ko'){
 const nodes=[textNode('단색'),textNode('그라디언트 설정을 읽지 못했습니다'),textNode('왼쪽','OPTION')];
 const selector={value:'ko',addEventListener(_name,handler){this.change=handler;}};
 const guide={href:'guide.html'};
 const attributes=[attributeNode({placeholder:'assets/image.png 또는 https://…','aria-label':'언어',title:'설정 화면 배경'}),attributeNode({'aria-label':'설정 페이지',title:'설정 페이지'})];
 const document={
  documentElement:{lang:'ko'},body:{},
  getElementById:id=>id==='ui-language'?selector:id==='guide-link'?guide:null,
  createTreeWalker(){let index=-1;return {currentNode:null,nextNode(){index++;this.currentNode=nodes[index]||null;return this.currentNode;}};},
  querySelectorAll(){return attributes;},querySelector(){return null;}
 };
 const local={value:savedLanguage,getItem(){return this.value;},setItem(_key,value){this.value=value;}};
 const location={pathname,href:''};
 const languageEvents=[],window={dispatchEvent:event=>languageEvents.push(event)};
 const context={window,document,location,localStorage:local,NodeFilter:{SHOW_TEXT:4},CustomEvent:class{constructor(type,init){this.type=type;this.detail=init?.detail;}},MutationObserver:class{observe(){}disconnect(){}}};
 vm.runInNewContext(source,context,{filename:'i18n.js'});
 return {i18n:window.KMGI18n,nodes,selector,guide,attributes,document,location,local,languageEvents};
}

test('generic panel URL errors identify panel numbers in all languages',()=>{
 const {i18n}=boot();
 ['game','custom1','custom2','custom3','chat','translation','hand'].forEach((key,index)=>{
  for(const suffix of ['HTTP(S) web URL required','image/video assets path or HTTP(S) media URL required']){
   const error=key+': '+suffix;
   for(const language of ['ko','en','ja']){
    const message=i18n.localize(error,language);
    assert.ok(message.startsWith(`Panel ${index+1}: `));
    assert.notEqual(message,error);
   }
  }
 });
});

test('Japanese UI strings cover the existing Korean-to-English interface dictionary',()=>{
 const {i18n}=boot();
 const missing=Object.keys(i18n.dictionaries.en).filter(key=>!i18n.dictionaries.ja[key]);
 assert.deepEqual(missing,[]);
 const liveKeys=['블러','테두리 두께','전역 설정 대신 개별 설정','콘텐츠','홍보 경로 또는 URL','홍보 파일','동시 알림은 같은 칸에서 겹칠 수 있습니다.','Chzzk 후원 URL','Youtube 후원 URL','Soop 후원 URL','미리보기에 적용했습니다','마스크 생성 실패','방송 화면 미리보기','오버레이 미리보기','설정할 패널 선택','라이트/다크 모드','배경 설정으로 이동','그라디언트 설정을 읽지 못했습니다','지원하지 않는 파일 형식입니다','배경에는 이미지를 선택하세요'];
 assert.deepEqual(liveKeys.filter(key=>!i18n.dictionaries.ja[key]),[]);
});

test('shared header exposes Japanese in the locale picker',()=>{
 const header=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 assert.ok(header.includes('value=\\"ja\\">日本語'));
});

test('text, select-option text, placeholder, title, and aria-label survive ko-ja-en-ko round trips',()=>{
 const app=boot();
 app.i18n.set('ja');
 assert.deepEqual(app.nodes.map(node=>node.nodeValue),['単色','グラデーション設定を読み込めませんでした','左']);
 assert.deepEqual(app.attributes[0].attributes,{placeholder:'assets/image.png または https://…','aria-label':'言語',title:'設定画面の背景'});
 assert.deepEqual(app.attributes[1].attributes,{'aria-label':'設定ページ',title:'設定ページ'});
 app.i18n.set('en');
 assert.deepEqual(app.nodes.map(node=>node.nodeValue),['Solid','Could not read gradient settings','Left']);
 assert.deepEqual(app.attributes[0].attributes,{placeholder:'assets/image.png or https://…','aria-label':'Language',title:'Settings page background'});
 assert.deepEqual(app.attributes[1].attributes,{'aria-label':'Settings page',title:'Settings page'});
 app.i18n.set('ko');
 assert.deepEqual(app.nodes.map(node=>node.nodeValue),['단색','그라디언트 설정을 읽지 못했습니다','왼쪽']);
 assert.deepEqual(app.attributes[0].attributes,{placeholder:'assets/image.png 또는 https://…','aria-label':'언어',title:'설정 화면 배경'});
 assert.deepEqual(app.attributes[1].attributes,{'aria-label':'설정 페이지',title:'설정 페이지'});
 assert.equal(app.document.documentElement.lang,'ko');
});

test('guide links follow the selected language and guide pages route on language changes',()=>{
 const preview=boot('/settings.html');
 preview.i18n.set('ja');assert.equal(preview.guide.href,'guide-ja.html');
 preview.i18n.set('en');assert.equal(preview.guide.href,'guide-en.html');
 preview.i18n.set('ko');assert.equal(preview.guide.href,'guide.html');
 const guide=boot('/guide.html');guide.i18n.set('ja');assert.equal(guide.location.href,'guide-ja.html');
 const englishGuide=boot('/guide-en.html','en');englishGuide.i18n.set('ja');assert.equal(englishGuide.location.href,'guide-ja.html');
 const japaneseGuide=boot('/guide-ja.html','ja');japaneseGuide.i18n.set('en');assert.equal(japaneseGuide.location.href,'guide-en.html');
});

test('English guide retains product spelling and valid upstream link paths',()=>{
 const guide=fs.readFileSync(path.join(__dirname,'../template/guide-en.html'),'utf8');
 assert.ok(guide.includes('<h1>Configure and connect OBS</h1>'));
 assert.ok(guide.includes('Click <strong>Apply saved settings / Auto layout</strong>'));
 assert.doesNotMatch(guide,/WEFLAB|Speech Translator|optional examples/);
 assert.doesNotMatch(guide,/honfigure|hlick|WEFLpB|hSS|hHpNGELOG/);
});

test('export validation failures and gradient accessibility labels follow language changes',()=>{
 const app=boot();
 for(const value of ['chatUrl: HTTP(S) OBS URL required','custom2: media path or URL required','Invalid gradient stop: global fill','홍보와 알림은 한 칸씩만 선택하세요']){
  assert.match(app.i18n.localize(value,'ko'),/[가-힣]/);
  assert.match(app.i18n.localize(value,'ja'),/[ぁ-んァ-ン一-龯]/);
  assert.doesNotMatch(app.i18n.localize(value,'en'),/[가-힣]/);
 }
 assert.equal(app.i18n.localize('그라디언트 편집기를 불러오지 못했습니다','en'),'Could not load the gradient editor');
 assert.equal(app.i18n.localize('Selected stop color','ja'),'選択中のストップの色');
 assert.equal(app.i18n.localize('미리보기','en'),'Preview');
 assert.equal(app.i18n.localize('미리보기','ja'),'プレビュー');
 assert.equal(app.i18n.localize('Stop at 42 percent','ko'),'중지점 42%');
 assert.equal(app.i18n.localize('중지점 2, 42%','en'),'Select stop 2, 42 percent');
 assert.equal(app.i18n.localize('ストップ 2','ko'),'중지점 2');
});

test('generated property controls reference live row labels and color values in every locale',()=>{
 const preview=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
 const start=preview.indexOf('  let nextPropertyLabelId=0;'),end=preview.indexOf('  const gradientControl=',start);
 assert.ok(start>=0&&end>start,'property row builders are present');
 const context={};vm.runInNewContext(preview.slice(start,end)+';globalThis.builders={propertyRow,color};',context);
 const selectRow=context.builders.propertyRow('불투명도','<select name="globalFillOpacity"></select>','',undefined,false);
 const selectLabel=selectRow.match(/<span id="([^"]+)">불투명도<\/span>/)[1];
 assert.ok(selectRow.includes(`aria-labelledby="${selectLabel}"`),'select accessible name points to its visible row label');
 const colorRow=context.builders.propertyRow('단색',context.builders.color('globalFillColor','#ABCDEF'),'mode','solid',true);
 const colorLabel=colorRow.match(/<span id="([^"]+)" class="value-text" data-color-label="globalFillColor">/)[1];
 const colorRowLabel=colorRow.match(/<span id="([^"]+)">단색<\/span>/)[1];
 const colorInputLabel=colorRow.match(/<input name="globalFillColor"[^>]*aria-labelledby="([^"]+)"/)[1];
 assert.equal(colorInputLabel,`${colorRowLabel} ${colorLabel}`,'color control includes the row label and visible color value');
 assert.notEqual(selectLabel,colorRowLabel,'separate rows receive unique label IDs');
 const gradientRow=context.builders.propertyRow('그라디언트','<button aria-label="그라디언트 편집"></button>','',undefined,false);
 assert.match(gradientRow,/<button aria-label="그라디언트 편집"><\/button>/,'explicit action name remains intact');
 const app=boot();
 for(const [ko,en,ja] of [['매우 강함','Very strong','非常に強い'],['강함','Strong','強い'],['중간','Medium','中程度'],['약함','Weak','弱い'],['매우 약함','Very weak','非常に弱い']]){
  assert.equal(app.i18n.localize(ko,'ko'),ko);
  assert.equal(app.i18n.localize(ko,'en'),en);
  assert.equal(app.i18n.localize(ko,'ja'),ja);
 }
 for(let index=1;index<=3;index++){
  const ko=`커스텀 ${index} 설정`;
  assert.equal(app.i18n.localize(ko,'en'),`Custom panel ${index} settings`);
  assert.equal(app.i18n.localize(ko,'ja'),`カスタムパネル${index}の設定`);
 }
 app.i18n.set('ja');assert.equal(app.languageEvents.at(-1).type,'kmg-language-change');assert.equal(app.languageEvents.at(-1).detail.language,'ja');
 const overlay=fs.readFileSync(path.join(__dirname,'../template/overlay.js'),'utf8');
 assert.match(overlay,/function applyAccessibilityLanguage\(language\)/);
 assert.match(overlay,/applyAccessibilityLanguage\(config\.uiLanguage\)/);
 assert.match(preview,/live\.uiLanguage=document\.documentElement\.lang/);
 assert.match(preview,/window\.addEventListener\('kmg-language-change',\(\)=>\{apply\(\);updateFullscreenLabel\(\);\}\)/);
});

test('fullscreen failures log only request diagnostics with activation captured before await',()=>{
 const preview=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
 assert.match(preview,/const diagnostic=\{operation,errorName:[^}]*errorMessage:[^}]*fullscreenEnabled:[^}]*policyAllowsFullscreen[^}]*userActivationIsActive:[^}]*userActivationHasBeenActive:[^}]*hasFocus:[^}]*visibilityState:[^}]*prerendering:/);
 assert.match(preview,/console\.warn\('\[fullscreen\.request\.failed\]',JSON\.stringify\(diagnostic\)\)/);
 assert.match(preview,/const activation=fullscreenActivation\(\);\s*try\{if\(!document\.exitFullscreen\)[\s\S]*?await document\.exitFullscreen\(\);\}\s*catch\(error\)\{logFullscreenFailure\('exit',error,activation\)/);
 assert.match(preview,/const activation=fullscreenActivation\(\);\s*try\{await fullscreenSurface\.requestFullscreen\(\);\}\s*catch\(error\)\{logFullscreenFailure\('enter',error,activation\)/);
 assert.doesNotMatch(preview,/console\.warn\([^\n]*(?:config|event\.data|location\.href)/i);
});

test('full-screen preview keeps an exit control visible and translated',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../template/settings.html'),'utf8');
 const css=fs.readFileSync(path.join(__dirname,'../template/preview.css'),'utf8');
 const preview=fs.readFileSync(path.join(__dirname,'../template/preview.js'),'utf8');
 assert.match(html,/<div id="preview-fullscreen"[^>]*>[\s\S]*?<div class="screen-content">[\s\S]*?<div class="fullscreen-toolbar" hidden><span class="fullscreen-hint">Esc 키로 종료<\/span><button id="return-to-settings" type="button">설정으로 돌아가기<\/button><\/div><\/div>/);
 assert.match(css,/\.screen:fullscreen \.screen-content\{[^}]*aspect-ratio:16\/9/);
 assert.match(preview,/fullscreenToolbar\.hidden=!isFullscreen/);
 assert.match(preview,/returnToSettings\.onclick=exitPreviewFullscreen/);
 assert.match(preview,/document\.addEventListener\('fullscreenchange',updateFullscreenLabel\)/);
 const {i18n}=boot();
 assert.equal(i18n.localize('Esc 키로 종료','en'),'Press Esc to exit');
 assert.equal(i18n.localize('설정으로 돌아가기','ja'),'設定に戻る');
});

 test('fresh and invalid preferences default to English while saved Korean and Japanese persist',()=>{
 for(const value of [null,'','unsupported']){const app=boot('/settings.html',value);assert.equal(app.document.documentElement.lang,'en');assert.equal(app.guide.href,'guide-en.html');assert.equal(app.nodes[0].nodeValue,'Solid');}
 for(const value of ['ko','ja']){const app=boot('/settings.html',value);assert.equal(app.document.documentElement.lang,value);}
});


test('shared header lists English, Korean, Japanese in that order',()=>{
 let markup='';
 const source=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8').split(/\r?\n\r?\n/)[0];
 vm.runInNewContext(source,{document:{currentScript:{insertAdjacentHTML:(_position,html)=>{markup=html;}}}});
 const select=markup.match(/<select id="ui-language"[^>]*>([\s\S]*?)<\/select>/)[1];
 assert.deepEqual([...select.matchAll(/<option value="([^"]+)">([^<]+)<\/option>/g)].map(m=>[m[1],m[2]]),[['en','English'],['ko','한국어'],['ja','日本語']]);
});
