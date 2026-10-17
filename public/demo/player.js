/* The exported Unity runtime and assets are kept unchanged in Build/. */
(() => {
  "use strict";

  const canvas = document.getElementById("unity-canvas");
  const container = document.getElementById("unity-container");
  const status = document.getElementById("unity-status");
  const statusText = document.getElementById("unity-status-text");
  const progressBar = document.getElementById("unity-progress");
  const failureMessage = "The interactive demo could not load. Please refresh the page or try a recent desktop browser.";
  let instance = null;
  let failed = false;
  let ready = false;

  function notify(type, detail = {}) {
    if (window.parent !== window) {
      window.parent.postMessage({ channel: "pyrolysis-unity", type, ...detail }, window.location.origin);
    }
  }

  function fail() {
    if (failed) return true;
    failed = true;
    container.dataset.state = "error";
    status.hidden = false;
    statusText.textContent = failureMessage;
    progressBar.hidden = true;
    notify("error", { message: failureMessage });
    // A truthy errorHandler return suppresses the Unity loader's raw alert.
    return true;
  }

  function reportProgress(value) {
    if (failed || ready || !Number.isFinite(value)) return;
    const progress = Math.max(0, Math.min(1, value));
    progressBar.value = progress;
    notify("progress", { progress });
  }

  const buildUrl = "Build";
  const config = {
    arguments: [],
    dataUrl: buildUrl + "/Web_pyrolysis.data.unityweb",
    frameworkUrl: buildUrl + "/Web_pyrolysis.framework.js.unityweb",
    codeUrl: buildUrl + "/Web_pyrolysis.wasm.unityweb",
    streamingAssetsUrl: "StreamingAssets",
    companyName: "DefaultCompany",
    productName: "Pyrolysis of Plastics",
    productVersion: "0.1",
    showBanner: (_message, type) => { if (type === "error") fail(); },
    errorHandler: fail,
  };

  // Prefer the host's direct button click for browser user-activation rules.
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    const message = event.data;
    if (!message || typeof message !== "object" || message.channel !== "pyrolysis-host") return;
    if (message.type === "fullscreen" && ready && !failed && instance) {
      try { instance.SetFullscreen(1); } catch { /* A direct click may be required. */ }
    }
  });

  reportProgress(0);
  const script = document.createElement("script");
  script.src = buildUrl + "/Web_pyrolysis.loader.js";
  script.onerror = fail;
  script.onload = () => {
    if (failed) return;
    try {
      if (typeof window.createUnityInstance !== "function") { fail(); return; }
      window.createUnityInstance(canvas, config, reportProgress).then((unityInstance) => {
        instance = unityInstance;
        if (failed) return;
        ready = true;
        container.dataset.state = "ready";
        progressBar.value = 1;
        status.hidden = true;
        // This signals the exported Home scene, not the later Process scene.
        notify("ready");
      }).catch(fail);
    } catch {
      fail();
    }
  };
  document.body.appendChild(script);
})();
