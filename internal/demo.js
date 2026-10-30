(() => {
  // A local, synthetic arrangement. Every position accepts the same content choices.
  const panelKeys = OverlayEvents.bentoPanelKeys;
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

  panelKeys.forEach((key, index) => {
    const box = layout[key];
    const type = config.panelContent[key].type;
    const tile = document.createElement('section');
    tile.className = 'demo-tile';
    tile.dataset.region = key;
    tile.dataset.content = type;
    tile.setAttribute('aria-label', `${OverlayEvents.panelLabels[key]}: ${contentLabels[type]}`);
    Object.assign(tile.style, {left: `${box.x}px`, top: `${box.y}px`, width: `${box.width}px`, height: `${box.height}px`});
    const geometry = KMGPanelShape.styleFor(config, key);
    KMGPanelShape.apply(tile, box.width, box.height, geometry);
    tile.style.background = config.panel;
    tile.style.color = config.text;
    const number = document.createElement('span');
    number.className = 'demo-panel-number';
    number.textContent = OverlayEvents.panelLabels[key];
    const content = document.createElement('span');
    content.className = 'demo-content-type';
    content.textContent = contentLabels[type];
    tile.append(number, content);
    const shadow = KMGPanelShape.shadowNode(box.width, box.height, geometry, document);
    if (shadow) {
      Object.assign(shadow.style, {left: `${box.x + parseFloat(shadow.style.left)}px`, top: `${box.y + parseFloat(shadow.style.top)}px`});
      container.append(shadow);
    }
    container.append(tile);
    const stroke = KMGPanelShape.strokeNode(box.width, box.height, geometry, document);
    if (stroke) {
      Object.assign(stroke.style, {left: `${box.x + parseFloat(stroke.style.left)}px`, top: `${box.y + parseFloat(stroke.style.top)}px`});
      container.append(stroke);
    }
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
