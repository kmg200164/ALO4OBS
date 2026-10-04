(() => {
  // A local, synthetic arrangement. Every position accepts the same content choices.
  const panelKeys = ['game', 'custom1', 'custom2', 'custom3', 'chat', 'translation', 'hand'];
  const choices = ['source', 'web', 'media', 'source', 'web', 'media', 'source'];
  const contentLabels = {source: 'OBS SOURCE', web: 'WEB ADDRESS', media: 'IMAGE / VIDEO'};
  const panelEnabled = Object.fromEntries(panelKeys.map(key => [key, true]));
  const panelPlacement = OverlayEvents.normalizePlacement(OverlayEvents.defaultPlacement());
  const panelContent = Object.fromEntries(panelKeys.map((key, index) => [key, {type: choices[index], url: ''}]));
  const config = {
    ...window.OVERLAY_PUBLIC_CONFIG,
    layoutVersion: 4,
    panelEnabled,
    panelPlacement,
    panelContent
  };
  const layout = OverlayEvents.autoLayout({placement: config.panelPlacement, enabled: config.panelEnabled});
  const stage = document.getElementById('demo-stage');
  const container = document.getElementById('demo-panels');

  for (const side of ['left', 'right']) {
    const boxes = panelKeys.filter(key => config.panelPlacement[key].level1 === side).map(key => layout[key]);
    if (!boxes.length) continue;
    const frame = document.createElement('div');
    frame.className = 'demo-upper-frame';
    frame.setAttribute('aria-hidden', 'true');
    const x = Math.min(...boxes.map(box => box.x));
    const y = Math.min(...boxes.map(box => box.y));
    const right = Math.max(...boxes.map(box => box.x + box.width));
    const bottom = Math.max(...boxes.map(box => box.y + box.height));
    Object.assign(frame.style, {left: `${x - 12}px`, top: `${y - 12}px`, width: `${right - x + 24}px`, height: `${bottom - y + 24}px`});
    container.append(frame);
  }

  panelKeys.forEach((key, index) => {
    const box = layout[key];
    const type = config.panelContent[key].type;
    const tile = document.createElement('section');
    tile.className = 'demo-tile';
    tile.dataset.region = key;
    tile.dataset.content = type;
    tile.setAttribute('aria-label', `Panel ${index + 1}: ${contentLabels[type]}`);
    Object.assign(tile.style, {left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px`});
    const number = document.createElement('span');
    number.className = 'demo-panel-number';
    number.textContent = `PANEL ${index + 1}`;
    const content = document.createElement('span');
    content.className = 'demo-content-type';
    content.textContent = contentLabels[type];
    tile.append(number, content);
    container.append(tile);
  });

  function scale() {
    const value = Math.min(innerWidth / 1920, innerHeight / 1080);
    Object.assign(stage.style, {
      left: `${(innerWidth - 1920 * value) / 2}px`,
      top: `${(innerHeight - 1080 * value) / 2}px`,
      transform: `scale(${value})`
    });
  }
  addEventListener('resize', scale);
  scale();
})();
