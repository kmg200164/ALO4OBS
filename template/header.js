(() => { const source=document.currentScript; source.insertAdjacentHTML('beforebegin',"<header class=\"app-header\"><details class=\"header-menu header-menu--left\" open><summary class=\"icon-button\" aria-label=\"GitHub\" title=\"GitHub\" aria-controls=\"header-left-links\"><svg class=\"button-svg lucide lucide-menu\" data-lucide=\"menu\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" /></svg></summary><nav id=\"header-left-links\" class=\"header-tools\" aria-label=\"GitHub\"><a id=\"github-link\" class=\"icon-button\" href=\"\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"GitHub\" title=\"GitHub\" hidden><svg class=\"button-svg lucide lucide-github\" data-lucide=\"github\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4\" /><path d=\"M9 18c-4.51 2-5-2-7-2\" /></svg></a>\r\n<a id=\"bug-report-link\" class=\"icon-button\" href=\"\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"버그 신고\" title=\"버그 신고\" hidden><svg class=\"button-svg lucide lucide-bug\" data-lucide=\"bug\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m8 2 1.88 1.88\" /><path d=\"M14.12 3.88 16 2\" /><path d=\"M9 7.13v-1a3.003 3.003 0 1 1 6 0v1\" /><path d=\"M12 20c-3.3 0-6-2.7-6-6v-3a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v3c0 3.3-2.7 6-6 6\" /><path d=\"M12 20v-9\" /><path d=\"M6.53 9C4.6 8.8 3 7.1 3 5\" /><path d=\"M6 13H2\" /><path d=\"M3 21c0-2.1 1.7-3.9 3.8-4\" /><path d=\"M20.97 5c0 2.1-1.6 3.8-3.5 4\" /><path d=\"M22 13h-4\" /><path d=\"M17.2 17c2.1.1 3.8 1.9 3.8 4\" /></svg></a>\r\n<a id=\"donation-link\" class=\"icon-button\" href=\"\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"후원하기\" title=\"후원하기\" hidden><svg class=\"button-svg lucide lucide-heart\" data-lucide=\"heart\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z\" /></svg></a>\r\n</nav></details><div class=\"brand\">\r\n<h1 translate=\"no\"><span class=\"brand-full\">Auto Layout Overlay for OBS</span><span class=\"brand-short\">ALO4OBS</span></h1><a id=\"app-version\" class=\"icon-button version-button\" translate=\"no\" href=\"\" target=\"_blank\" rel=\"noopener noreferrer\" aria-label=\"변경 기록\" title=\"변경 기록\" hidden></a>\r\n</div><details class=\"header-menu header-menu--right\" open><summary class=\"icon-button\" aria-label=\"도구\" title=\"도구\" aria-controls=\"header-right-tools\"><svg class=\"button-svg lucide lucide-menu\" data-lucide=\"menu\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><line x1=\"4\" x2=\"20\" y1=\"12\" y2=\"12\" /><line x1=\"4\" x2=\"20\" y1=\"6\" y2=\"6\" /><line x1=\"4\" x2=\"20\" y1=\"18\" y2=\"18\" /></svg></summary><nav id=\"header-right-tools\" class=\"header-tools\" aria-label=\"도구\">\r\n<a id=\"settings-link\" class=\"icon-button\" href=\"settings.html\" aria-label=\"설정\" title=\"설정\"><svg class=\"button-svg lucide lucide-settings header-icon--settings\" data-lucide=\"settings\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z\" /><circle cx=\"12\" cy=\"12\" r=\"3\" /></svg></a>\r\n<a id=\"guide-link\" class=\"icon-button\" href=\"guide.html\" aria-label=\"가이드\" title=\"가이드\"><svg class=\"button-svg lucide lucide-book-open\" data-lucide=\"book-open\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 7v14\" /><path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\" /></svg></a>\r\n<label class=\"icon-button icon-picker\" aria-label=\"언어 / Language\" title=\"언어 / Language\"><svg class=\"button-svg lucide lucide-languages\" data-lucide=\"languages\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"m5 8 6 6\" /><path d=\"m4 14 6-6 2-3\" /><path d=\"M2 5h12\" /><path d=\"M7 2h1\" /><path d=\"m22 22-5-10-5 10\" /><path d=\"M14 18h6\" /></svg><select id=\"ui-language\" aria-label=\"언어 / Language\"><option value=\"en\">English</option><option value=\"ko\">한국어</option><option value=\"ja\">日本語</option></select></label>\r\n<button id=\"theme-toggle\" class=\"icon-button\" type=\"button\" aria-label=\"라이트/다크 모드\"><svg class=\"button-svg lucide lucide-sun theme-icon-sun\" data-lucide=\"sun\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"12\" cy=\"12\" r=\"4\" /><path d=\"M12 2v2\" /><path d=\"M12 20v2\" /><path d=\"m4.93 4.93 1.41 1.41\" /><path d=\"m17.66 17.66 1.41 1.41\" /><path d=\"M2 12h2\" /><path d=\"M20 12h2\" /><path d=\"m6.34 17.66-1.41 1.41\" /><path d=\"m19.07 4.93-1.41 1.41\" /></svg><svg class=\"button-svg lucide lucide-moon theme-icon-moon\" data-lucide=\"moon\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><path d=\"M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z\" /></svg></button>\r\n<details class=\"accent-presets\"><summary id=\"accent-preset-toggle\" class=\"icon-button\" aria-label=\"UI 색상 프리셋\" title=\"UI 색상 프리셋\" aria-controls=\"accent-preset-options\"><svg class=\"button-svg lucide lucide-palette\" data-lucide=\"palette\" aria-hidden=\"true\" focusable=\"false\" xmlns=\"http://www.w3.org/2000/svg\" width=\"32\" height=\"32\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><circle cx=\"13.5\" cy=\"6.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"17.5\" cy=\"10.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"8.5\" cy=\"7.5\" r=\".5\" fill=\"currentColor\" /><circle cx=\"6.5\" cy=\"12.5\" r=\".5\" fill=\"currentColor\" /><path d=\"M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z\" /></svg></summary><fieldset id=\"accent-preset-options\" class=\"accent-preset-options\"><legend class=\"sr-only\">UI 색상 프리셋</legend><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"red\"><span class=\"preset-swatch\" data-preset=\"red\" aria-hidden=\"true\"></span><span>체리</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"orange\"><span class=\"preset-swatch\" data-preset=\"orange\" aria-hidden=\"true\"></span><span>오렌지</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"yellow\"><span class=\"preset-swatch\" data-preset=\"yellow\" aria-hidden=\"true\"></span><span>바나나</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"lime\"><span class=\"preset-swatch\" data-preset=\"lime\" aria-hidden=\"true\"></span><span>라임</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"aloe\"><span class=\"preset-swatch\" data-preset=\"aloe\" aria-hidden=\"true\"></span><span>알로에</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"cyan\"><span class=\"preset-swatch\" data-preset=\"cyan\" aria-hidden=\"true\"></span><span>솜사탕</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"blue\"><span class=\"preset-swatch\" data-preset=\"blue\" aria-hidden=\"true\"></span><span>블루베리</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"purple\"><span class=\"preset-swatch\" data-preset=\"purple\" aria-hidden=\"true\"></span><span>포도</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"pink\"><span class=\"preset-swatch\" data-preset=\"pink\" aria-hidden=\"true\"></span><span>풍선껌</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label><label class=\"accent-preset-option\"><input type=\"radio\" name=\"ui-accent-preset\" value=\"monochrome\"><span class=\"preset-swatch\" data-preset=\"monochrome\" aria-hidden=\"true\"></span><span>모노</span><span class=\"preset-check\" aria-hidden=\"true\">✓</span></label></fieldset></details>\r\n</nav></details></header>"); })();

(() => {
  const header=document.querySelector('.app-header');
  header.addEventListener('pointerdown',()=>header.classList.add('pointer-focus'),true);
  document.addEventListener('keydown',event=>{if(event.key==='Tab')header.classList.remove('pointer-focus');},true);
  for(const icon of header.querySelectorAll('.button-svg')){icon.setAttribute('width','32');icon.setAttribute('height','32');icon.setAttribute('aria-hidden','true');icon.setAttribute('focusable','false');if(icon.getAttribute('viewBox')==='0 0 64 64')icon.setAttribute('viewBox','16 16 32 32');}
  const headerMenus=[...header.querySelectorAll('.header-menu')];
  const menuMedia=window.matchMedia('(max-width:920px)');
  function syncHeaderMenus(){for(const menu of headerMenus)menu.open=!menuMedia.matches;}
  menuMedia.addEventListener('change',syncHeaderMenus);
  syncHeaderMenus();
  for(const menu of headerMenus)menu.addEventListener('toggle',()=>{
    if(menuMedia.matches&&menu.open)for(const other of headerMenus)if(other!==menu)other.open=false;
  });
  header.addEventListener('keydown',event=>{
    if(event.key!=='Escape'||!menuMedia.matches)return;
    for(const menu of headerMenus)if(menu.open){menu.open=false;menu.querySelector('summary').focus();event.preventDefault();}
  });
  const version=header.querySelector('#app-version');
  version.textContent='v'+(window.KMG_VERSION||'0.0.0');
  const themeButton=header.querySelector('#theme-toggle');

  function setTheme(value){
    document.body.dataset.theme=value;
    document.documentElement.dataset.theme=value;
    const label=value==='light'?'어두운 테마로 전환':'밝은 테마로 전환';
    themeButton.setAttribute('aria-label',window.KMGI18n?.localize(label)||label);
    try{localStorage.setItem('overlay-ui-theme',value);}catch{}
  }
  let savedTheme='dark';
  try{savedTheme=localStorage.getItem('overlay-ui-theme')==='light'?'light':'dark';}catch{}
  setTheme(savedTheme);
  themeButton.addEventListener('click',()=>setTheme(document.body.dataset.theme==='light'?'dark':'light'));
  const presetMenu=header.querySelector('.accent-presets');
  const presetToggle=header.querySelector('#accent-preset-toggle');
  const presetInputs=[...header.querySelectorAll('input[name="ui-accent-preset"]')];
  const presetIds=presetInputs.map(input=>input.value);
  function setPreset(value){
    const preset=presetIds.includes(value)?value:'aloe';
    document.body.dataset.uiPreset=preset;
    document.documentElement.dataset.uiPreset=preset;
    for(const input of presetInputs)input.checked=input.value===preset;
    try{localStorage.setItem('overlay-ui-preset',preset);}catch{}
  }
  // Defensive cleanup also covers a restored page carrying stale inline aliases.
  document.documentElement.style.removeProperty('--accent');
  document.body.style.removeProperty('--accent');
  let savedPreset='aloe';
  try{
    savedPreset=localStorage.getItem('overlay-ui-preset');
    if(localStorage.getItem('overlay-ui-preset-migrated')!=='1'){
      localStorage.setItem('overlay-ui-preset-migrated','1');
    }
  }catch{}
  setPreset(savedPreset);
  presetMenu.addEventListener('change',event=>{
    if(presetInputs.includes(event.target))setPreset(event.target.value);
  });
  presetMenu.addEventListener('keydown',event=>{
    if(event.key==='Escape'&&presetMenu.open){presetMenu.open=false;presetToggle.focus();event.preventDefault();event.stopPropagation();}
  });
  document.addEventListener('click',event=>{if(!presetMenu.contains(event.target))presetMenu.open=false;});
  const settingsLink=header.querySelector('#settings-link');
  const guideLink=header.querySelector('#guide-link');
  const currentPath=location.pathname.replace(/\/+$/,'')||'/';
  const guidePath=/\/guide(?:-(?:en|ja))?\.html$/i.test(currentPath);
  settingsLink.hidden=!guidePath;
  guideLink.hidden=guidePath;
  try{localStorage.removeItem('overlay-ui-page-background');}catch{}
  // Public links (repository, donation) live in config.public.js as window.OVERLAY_PUBLIC_LINKS,
  // which on settings.html loads *after* this script. Fill hrefs once it's guaranteed to be
  // ready instead of depending on script order (also covers guide pages that load it too).
  const githubLink=header.querySelector('#github-link');
  const bugReportLink=header.querySelector('#bug-report-link');
  const donationLink=header.querySelector('#donation-link');
  const showLink=(link,href)=>{if(href){link.href=href;link.hidden=false;}else{link.hidden=true;}};
  document.addEventListener('DOMContentLoaded',()=>{
    const links=window.OVERLAY_PUBLIC_LINKS||{};
    showLink(githubLink,links.repository);
    showLink(bugReportLink,links.repository?links.repository+'/issues/new':'');
    showLink(donationLink,links.donation);
    showLink(version,links.repository?links.repository+'/blob/main/CHANGELOG.md':'');
  });
  // Fail-safe: never leave the page hidden if i18n.js never runs (its translate()
  // normally clears this once the shown language is set).
  setTimeout(()=>document.documentElement.setAttribute('data-i18n-ready',''),1500);
})();
