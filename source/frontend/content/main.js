let lazy = {};
ChromeUtils.defineESModuleGetters(lazy, {
  DevtoolsServer: "resource://app/modules/DevtoolsServer.sys.mjs",
});

function showMore() {
  document.getElementById("more-text").hidden = false;
}

function startDevtools() {
  const devtools = lazy.DevtoolsServer.get();
  devtools.start();

  const instructions = document.getElementById("devtools-instructions");
  instructions.hidden = false;

  const portEl = document.getElementById("devtools-port");
  portEl.innerText = devtools.port;
}
