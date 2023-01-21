let lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  BrowserToolboxLauncher:
    "resource://devtools/client/framework/browser-toolbox/Launcher.sys.mjs",
});

function showMore() {
  document.getElementById("more-text").hidden = false;
}

function startDevtools() {
  lazy.BrowserToolboxLauncher.init();
}
