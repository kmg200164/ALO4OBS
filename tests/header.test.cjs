const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

test('config.public.js exposes exactly the allowed repository and donation links, kept out of OVERLAY_CONFIG',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../template/config.public.js'),'utf8');
 const context={window:{}};vm.runInNewContext(source,context);
 assert.deepEqual(JSON.parse(JSON.stringify(context.window.OVERLAY_PUBLIC_LINKS)),{
  repository:'https://github.com/kmg200164/ALO4OBS',
  donation:'https://buymeacoffee.com/kmg200164'
 });
 assert.ok(!JSON.stringify(context.window.OVERLAY_CONFIG).includes('buymeacoffee'),'links must not leak into the exported settings config');
});

test('header markup: GitHub, bug-report, and donation buttons start hidden until config.public.js fills them in',()=>{
 const header=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 for(const id of ['github-link','bug-report-link','donation-link']){
  assert.match(header,new RegExp(`id=\\\\"${id}\\\\"[^>]*href=\\\\"\\\\"[^>]*hidden`),`${id} must start with an empty href and hidden`);
 }
});

test('header script derives the bug-report link from the repository URL and hides any link with no URL',()=>{
 const header=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 assert.match(header,/bugReportLink,links\.repository\?links\.repository\+'\/issues\/new':''/);
 assert.match(header,/const showLink=\(link,href\)=>\{if\(href\)\{link\.href=href;link\.hidden=false;\}else\{link\.hidden=true;\}\}/);
 assert.match(header,/window\.OVERLAY_PUBLIC_LINKS\|\|\{\}/);
});

test('build.py only allows the repository and donation URLs in the shipped public config',()=>{
 const buildPy=fs.readFileSync(path.join(__dirname,'../build.py'),'utf8');
 assert.match(buildPy,/https:\/\/github\.com\/kmg200164\/OBS-streaming-template/);
 assert.match(buildPy,/https:\/\/buymeacoffee\.com\/kmg200164/);
 assert.match(buildPy,/def check_public_config_urls/);
});

test('header navigation offers only the other page at the same icon position',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 const navigation=source.slice(source.indexOf('  const currentPath='),source.indexOf("  try{localStorage.removeItem"));
 for(const pathname of ['/settings.html','/guide.html','/guide-en.html','/guide-ja.html']){
  const context={location:{pathname},settingsLink:{},guideLink:{}};
  vm.runInNewContext(navigation,context);
  assert.equal(context.settingsLink.hidden,pathname==='/settings.html');
  assert.equal(context.guideLink.hidden,pathname!=='/settings.html');
 }
 assert.ok(!source.includes('header-tabs'));
});


test('header menus follow viewport changes, exclude each other on narrow screens and close on Escape',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 const start=source.indexOf('  const headerMenus='),end=source.indexOf('  const version=',start);
 assert.ok(start>=0,'responsive menu handler exists');
 const menus=[0,1].map(()=>({open:false,events:{},focuses:0,
  addEventListener(name,handler){this.events[name]=handler;},
  querySelector(){return {focus:()=>this.focuses++};}}));
 const media={matches:false,addEventListener(name,handler){assert.equal(name,'change');this.change=handler;}};
 const header={events:{},querySelectorAll:()=>menus,addEventListener(name,handler){this.events[name]=handler;}};
 vm.runInNewContext(source.slice(start,end),{header,window:{matchMedia:query=>{assert.equal(query,'(max-width:920px)');return media;}}});
 assert.deepEqual(menus.map(menu=>menu.open),[true,true]);
 media.matches=true;media.change();assert.deepEqual(menus.map(menu=>menu.open),[false,false]);
 menus[0].open=true;menus[0].events.toggle();assert.deepEqual(menus.map(menu=>menu.open),[true,false]);
 menus[1].open=true;menus[1].events.toggle();assert.deepEqual(menus.map(menu=>menu.open),[false,true]);
 let prevented=false;header.events.keydown({key:'Escape',preventDefault(){prevented=true;}});
 assert.deepEqual(menus.map(menu=>menu.open),[false,false]);assert.equal(menus[1].focuses,1);assert.equal(prevented,true);
 media.matches=false;media.change();assert.deepEqual(menus.map(menu=>menu.open),[true,true]);
 header.events.keydown({key:'Escape'});assert.deepEqual(menus.map(menu=>menu.open),[true,true]);
});

test('header puts public links on the left and centers the brand between native menus',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../template/header.js'),'utf8');
 let markup='';const first=source.split(/\r?\n\r?\n/)[0];
 vm.runInNewContext(first,{document:{currentScript:{insertAdjacentHTML(_position,html){markup=html;}}}});
 assert.equal((markup.match(/<details /g)||[]).length,2);assert.equal((markup.match(/<summary /g)||[]).length,2);
 assert.ok(markup.indexOf('id="github-link"')<markup.indexOf('class="brand"'));
 assert.ok(markup.indexOf('id="donation-link"')<markup.indexOf('class="brand"'));
 assert.ok(markup.indexOf('class="brand"')<markup.indexOf('id="settings-link"'));
 assert.match(markup,/<a id="guide-link"[^>]*>[\s\S]*?data-lucide="book-open"/);
 assert.equal((markup.match(/data-lucide="menu"/g)||[]).length,2);
 const css=fs.readFileSync(path.join(__dirname,'../template/header.css'),'utf8');
 assert.match(css,/grid-template-columns:minmax\(0,1fr\) auto minmax\(0,1fr\)/);
 assert.match(css,/@media\(max-width:920px\)/);
 assert.match(css,/header-menu--right>.header-tools\{right:0\}/);
 assert.doesNotMatch(css,/#ui-language[^\n]*stroke-width/);
 for(const svg of markup.matchAll(/<svg\b[^>]*viewBox="0 0 24 24"[^>]*>/g))assert.match(svg[0],/stroke-width="2"/);
});
