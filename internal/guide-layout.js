(() => {
  let firstGuide=location.hash==='#first-use';
  try{firstGuide=firstGuide||localStorage.getItem('obs-overlay-first-use')==='guide';}catch{}
  try{firstGuide=firstGuide||sessionStorage.getItem('obs-overlay-first-guide')==='yes';if(firstGuide)sessionStorage.setItem('obs-overlay-first-guide','yes');}catch{}
  if(firstGuide){
    const link=document.getElementById('settings-link');
    const message={ko:'가이드를 다 읽으셨다면 설정으로 이동하세요',en:'When you have finished the guide, go to Settings.',ja:'ガイドを読み終えたら、設定に進んでください。'};
    const note=document.createElement('p');note.id='first-guide-note';note.setAttribute('role','note');note.textContent=message[document.documentElement.lang]||message.en;
    link.setAttribute('aria-describedby',note.id);document.querySelector('.app-header').after(note);
    const target=new URL(link.href);target.hash='from-first-guide';link.href=target.href;
    link.addEventListener('click',()=>{try{sessionStorage.removeItem('obs-overlay-first-guide');}catch{}history.replaceState(null,'',location.pathname+location.search);});
  }
  const copy = {
    ko: {
      description: '기본 배치: 왼쪽 상위 프레임의 위 하위 프레임은 Main, 아래 하위 프레임은 Sub 1~3의 묶음입니다. 오른쪽 상위 프레임에는 Side 1~3이 위에서 아래로 놓입니다. 회색은 상위 프레임, 모드에 따라 흰색 또는 검정으로 바뀌는 부분은 하위 프레임입니다. 각 패널의 콘텐츠는 자유롭게 바꿀 수 있습니다.',
      parent: '상위 프레임', child: '하위 프레임',
    },
    en: {
      description: 'Default layout: the left parent frame holds Main in its upper child frame and Sub 1–3 in its lower child frame. The right parent frame holds Side 1–3 from top to bottom. Gray marks parent frames; child frames switch between white and black with the theme. Each panel can show any content.',
      parent: 'Parent frame', child: 'Child frame',
    },
    ja: {
      description: '初期配置: 左側の親フレームは上の子フレームに Main、下の子フレームに Sub 1～3 を収めます。右側の親フレームには Side 1～3 が上から順に並びます。灰色が親フレーム、テーマに応じて白または黒に変わる部分が子フレームです。各パネルの内容は自由に変更できます。',
      parent: '親フレーム', child: '子フレーム',
    },
  };
  const labels = copy[document.documentElement.lang] || copy.en;
  document.querySelectorAll('[data-guide-layout]').forEach((mount,index) => {
    const figure = document.createElement('figure');
    figure.className = 'guide-layout-figure';
    figure.setAttribute('role','group');
    figure.setAttribute('aria-labelledby',`guide-layout-caption-${index}`);
    figure.innerHTML = `
      <div class="guide-layout-canvas" aria-hidden="true">
        <div class="guide-layout-parent guide-layout-parent--left">
          <div class="guide-layout-child guide-layout-game"></div>
          <div class="guide-layout-child guide-layout-custom-band">
            <div class="guide-layout-customs">
              <div class="guide-layout-custom-item"></div>
              <div class="guide-layout-custom-item"></div>
              <div class="guide-layout-custom-item"></div>
            </div>
          </div>
        </div>
        <div class="guide-layout-parent guide-layout-parent--right">
          <div class="guide-layout-child"></div>
          <div class="guide-layout-child"></div>
          <div class="guide-layout-child"></div>
        </div>
      </div>
      <figcaption class="guide-layout-caption" id="guide-layout-caption-${index}">
        <span class="guide-layout-description">${labels.description}</span>
        <span class="guide-layout-legend">
          <span><i class="guide-layout-swatch guide-layout-swatch--parent" aria-hidden="true"></i>${labels.parent}</span>
          <span><i class="guide-layout-swatch guide-layout-swatch--child" aria-hidden="true"></i>${labels.child}</span>
        </span>
      </figcaption>`;
    mount.replaceWith(figure);
  });
  document.querySelectorAll('.faq-item').forEach(card=>card.addEventListener('click',event=>{
    if(event.target.closest('summary,a,button,input,select,textarea'))return;
    card.open=!card.open;
  }));
})();
