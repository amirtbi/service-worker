(function Blog() {
  "use strict";

  var offlineIcon;
  let isOnline = "onLine" in navigator ? navigator.onLine : true;
  var isLoggedIn = /isLoggedIn=1/.test(document.cookie.toString() || "");
  let svcworker;
  let serviceWorkerRegisteration;
  const usingSvc = "serviceworker" in navigator;

  document.addEventListener("DOMContentLoaded", ready, false);

  initServiceWorker().catch(console.error);
  // **********************************

  function ready() {
    offlineIcon = document.getElementById("connectivity-status");
    if (!isOnline) {
      offlineIcon.classList.remove("hidden");
    }

    window.addEventListener("online", function online() {
      console.log("online");
      offlineIcon.classList.add("hidden");
      isOnline = true;
      sendUpdateStatusMessage();
    });

    window.addEventListener("offline", function offline() {
      console.log("offline");
      offlineIcon.classList.remove("hidden");
      isOnline = false;
      sendUpdateStatusMessage();
    });
  }

  async function initServiceWorker() {
    serviceWorkerRegisteration = await navigator.serviceWorker.register(
      "/sw.js",
      {
        updateViaCache: "none",
      }
    );

    // Defingin service worker according of Life cycle step
    svcworker =
      serviceWorkerRegisteration.installing ||
      serviceWorkerRegisteration.waiting ||
      serviceWorkerRegisteration.active;
    sendUpdateStatusMessage(svcworker);
    console.log("service worker", svcworker);
    // Listen when new service worker take controll
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      svcworker = navigator.serviceWorker.controller;

      sendUpdateStatusMessage(svcworker);
    });

    // Listent when message is received from service worker
    navigator.serviceWorker.addEventListener("message", onSwMessage);
  }

  function onSwMessage(evt) {
    const { data } = evt;
    if (data.requestStatusUpdate) {
      console.log(
        "Received status update request from service worker, responding..."
      );
      console.log("ports", evt);
      sendUpdateStatusMessage(evt.ports && evt.ports[0]); // Sending to specific channel port
    }
  }

  function sendUpdateStatusMessage(target) {
    sendSWMessage({ statusUpdate: { isOnline, isLoggedIn } }, target);
  }

  function sendSWMessage(msg, target) {
    console.log("controller", navigator.serviceWorker.controller);
    if (target) {
      console.log("service worker is getting message", target);
      target.postMessage(msg);
    } else if (svcworker) {
      svcworker.postMessage(msg);
    } else {
      navigator.serviceWorker.controller.postMessage(msg);
    }
    console.log("Caches", CacheStorage);
  }
})();
