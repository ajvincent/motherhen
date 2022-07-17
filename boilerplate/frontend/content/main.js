const { XPCOMUtils } = ChromeUtils.importESModule(
  "resource://gre/modules/XPCOMUtils.sys.mjs"
);

XPCOMUtils.defineLazyModuleGetters(this, {
  DevtoolsServer: "resource:///modules/DevtoolsServer.jsm",
});

function showMore() {
  document.getElementById("more-text").hidden = false;
}

function startDevtools() {
  const devtools = new DevtoolsServer();
  devtools.start();

  const instructions = document.getElementById("devtools-instructions");
  instructions.hidden = false;

  const portEl = document.getElementById("devtools-port");
  portEl.innerText = devtools.port;
}
