// Neutral defaults packaged as config.js. Keep personal settings in the local config.js only.
// Separate from OVERLAY_CONFIG so these links never end up in an exported settings JSON.
window.OVERLAY_PUBLIC_LINKS = {
  repository: "https://github.com/kmg200164/ALO4OBS",
  donation: "https://buymeacoffee.com/kmg200164"
};
window.OVERLAY_PUBLIC_CONFIG = window.OVERLAY_CONFIG = {
  layoutVersion: 4,
  name: "", accent: "#ad92ff", panel: "#1a1a1a", text: "#ffffff",
  logo: "", showNicknames: true, nicknameColor: "platform",
  panelContent: Object.fromEntries(["game", "custom1", "custom2", "custom3", "chat", "translation", "hand"].map(key => [key, {type: key === "game" ? "source" : "none", url: ""}])),
  backgroundColor: "#000000", backgroundImage: "",
  globalStyle: { background: {
    mode: "solid", color: "#000000", color2: "#909090",
    gradient: { type: "linear", angle: 135, stops: [
      { position: 0, color: "#303030", opacity: 100 },
      { position: 100, color: "#909090", opacity: 100 }
    ] }
  } },
  regionBackgrounds: Object.fromEntries(["game", "custom1", "custom2", "custom3", "chat", "translation", "hand"].map(key => [key, {
    color: "#ffffff", image: "", opacity: 20, blur: 16,
    borderColor: "#ffffff", borderVisible: true
  }])),
  alertDuration: 7000
};
