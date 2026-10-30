(() => {
 const copy={
  ko:{title:'브라우저에서 배치하고, Lua 하나로 적용하세요',steps:[
   ['1. 배치 선택','Bento 또는 Overlap을 고르고 미리보기에서 패널을 선택하세요. 기본 프리셋으로 시작하거나 크기·간격·색상을 직접 바꿀 수 있습니다. OBS 원본 소스는 OBS에서 연결합니다.'],
   ['2. Lua 다운로드','다운로드 버튼으로 script-bento.lua 또는 script-overlap.lua 한 개를 받습니다. 압축을 풀거나 settings.html을 다운로드할 필요가 없습니다.'],
   ['3. OBS에 적용','OBS 도구 → 스크립트 → +에서 Lua를 추가하세요. 패널별 원본 소스를 선택하고 저장한 설정 / 자동 배치 적용을 누르세요. 로컬 이미지·영상을 썼다면 Lua의 로컬 파일 항목에서 원본 파일을 선택합니다. Lua에 영상·이미지 원본은 들어가지 않습니다.'],
   ['4. 다음에 이어서 편집','같은 컴퓨터의 같은 브라우저에서 다시 열면 설정을 복원합니다. 다른 컴퓨터나 브라우저에서는 Lua 불러오기를 누르세요. 설정 패널과 두 레이아웃의 배치를 복원하며, 로컬 미디어 미리보기는 원본 파일을 다시 선택해야 합니다. 프리셋 적용 취소로 직전 설정을 되돌릴 수 있습니다.']
  ],details:'OBS와 저장',notes:[
   'OBS 30.1 이상, 브라우저 소스, 도구 → 스크립트, 1920 × 1080 기본 캔버스가 필요합니다. 실제 캡처와 위젯은 OBS에서 확인하세요.',
   'Lua를 쓰기 가능한 영구 폴더에 보관하세요. OBS가 Lua 옆에 렌더링용 폴더를 자동 준비합니다. 적용 후에는 생성 폴더를 함께 보관하세요. 설정 변경은 새 Lua 다운로드 → OBS 다시 불러오기 → 적용 순서로 반영합니다.',
   'Overlap의 라이브 배경 흐림에는 Composite Blur가 필요합니다. 플러그인을 사용하지 않으려면 채우기 흐림을 0으로 설정하세요. 게임 + 캠 기본 프리셋은 흐림을 사용하지 않습니다.',
   '브라우저 저장소를 지우거나 브라우저를 바꾸면 자동 복원되지 않습니다. 다운로드한 Lua를 보관하세요. OBS의 원본 소스 선택과 로컬 파일 경로는 OBS 스크립트 항목이 보관하므로 다른 컴퓨터에서는 다시 선택합니다.',
   '위젯 URL이 포함된 개인 Lua는 비공개로 보관하세요. Lua 불러오기는 파일의 설정 데이터만 읽으며 코드를 실행하거나 파일을 서버에 올리지 않습니다.'
  ]},
  en:{title:'Arrange in your browser. Apply one Lua in OBS.',steps:[
   ['1. Choose a layout','Choose Bento or Overlap, then select a panel in the preview. Start with a built-in preset or edit size, spacing and colors. Connect original OBS sources in OBS.'],
   ['2. Download Lua','The download button saves one script-bento.lua or script-overlap.lua. No ZIP extraction or settings.html download is needed.'],
   ['3. Apply in OBS','Open OBS Tools → Scripts → + and add the Lua. Select each original source and press Apply saved settings / Auto layout. If your layout uses local images or videos, select their original files in the script’s Local file fields. Original media bytes are not included in Lua.'],
   ['4. Continue later','The same browser on the same computer restores your settings automatically. Use Import Lua on another computer or browser. It restores the settings panel and both layouts; reselect original files for local media previews. Undo preset restores the state before the last preset application.']
  ],details:'OBS and saved settings',notes:[
   'Use OBS 30.1 or newer with Browser Source, Tools → Scripts and a 1920 × 1080 base canvas. Check actual captures and widgets in OBS.',
   'Save the Lua in a writable permanent folder. OBS automatically prepares its rendering folder beside the Lua. Keep that generated folder after Apply. Later edits require a new Lua download, script reload and Apply.',
   'Overlap live panel blur needs Composite Blur. Set fill blur to 0 to avoid that dependency. The game + camera preset starts with blur disabled.',
   'Cleared browser storage or a different browser cannot restore automatically. Keep your downloaded Lua. OBS retains original-source selections and local file paths in its script entry; select them again on another computer.',
   'Keep personal Lua files private if they contain widget URLs. Import Lua reads settings data only; it never executes imported code or uploads the file to a server.'
  ]},
  ja:{title:'ブラウザーで配置して、Lua ひとつで OBS に適用',steps:[
   ['1. 配置を選択','Bento または Overlap を選び、プレビューのパネルを選択します。基本プリセットから始めるか、サイズ・間隔・色を編集してください。元の OBS ソースは OBS で接続します。'],
   ['2. Lua をダウンロード','ダウンロードボタンで script-bento.lua または script-overlap.lua をひとつ保存します。ZIP の展開や settings.html のダウンロードは不要です。'],
   ['3. OBS に適用','OBS ツール → スクリプト → + で Lua を追加します。元のソースを選び、保存した設定 / 自動配置の適用を押してください。ローカル画像・動画を使う場合はスクリプトのローカルファイル欄で元のファイルを選択します。Lua に元のメディアは含まれません。'],
   ['4. 続けて編集','同じパソコンの同じブラウザーでは設定が自動で復元されます。別の環境では Lua を読み込んでください。設定パネルと両方の配置が復元されます。ローカル画像・動画のプレビューには元のファイルを再選択してください。プリセットを元に戻すと、適用前の設定に戻せます。']
  ],details:'OBS と設定の保存',notes:[
   'OBS 30.1 以降、ブラウザーソース、ツール → スクリプト、1920 × 1080 の基本キャンバスを使います。実際のキャプチャーとウィジェットは OBS で確認してください。',
   'Lua は書き込み可能な固定フォルダーに保存してください。OBS が Lua の隣に描画用フォルダーを自動で準備します。適用後はそのフォルダーも保管します。変更時は新しい Lua を保存し、再読み込みして適用します。',
   'Overlap のライブぼかしには Composite Blur が必要です。使わない場合はぼかしを 0 にしてください。ゲーム + カメラの基本プリセットはぼかしを使いません。',
   'ブラウザーの保存データを削除した場合や別のブラウザーでは自動復元できません。ダウンロードした Lua を保管してください。元のソースとローカルファイルのパスは OBS のスクリプト項目に保存されるため、別のパソコンでは再選択します。',
   'ウィジェット URL を含む個人用 Lua は非公開で保管してください。Lua の読み込みは設定データだけを読み、コード実行やサーバーへのアップロードは行いません。'
  ]}
 };
 const content=copy[document.documentElement.lang]||copy.en,mount=document.getElementById('web-guide');
 const title=document.createElement('h1'),pageHeading=document.createElement('div');title.textContent=content.title;pageHeading.className='page-heading';pageHeading.append(title);mount.replaceChildren(pageHeading);
 const steps=document.createElement('section');steps.className='steps';mount.append(steps);
 for(const [heading,text] of content.steps){const section=document.createElement('article'),body=document.createElement('div'),h=document.createElement('h2'),p=document.createElement('p');section.className='step-card';body.className='step-content';h.textContent=heading;p.textContent=text;body.append(h,p);section.append(body);steps.append(section);}
 const faq=document.createElement('section'),details=document.createElement('details'),summary=document.createElement('summary'),body=document.createElement('div'),list=document.createElement('ul'),faqList=document.createElement('div');faq.className='faq';faq.setAttribute('aria-label',content.details);faqList.className='faq-list';details.className='faq-item';summary.textContent=content.details;body.className='faq-body';for(const note of content.notes){const li=document.createElement('li');li.textContent=note;list.append(li);}body.append(list);details.append(summary,body);faqList.append(details);faq.append(faqList);mount.append(faq);
})();
