"use strict";

// TODO
const version = 10;
const isOnline = true;
const isLoggedIn = false;
const cacheName = `app-${version}`;

const urlsToCache = {
  loggedOut: [
    "/",
    "/about",
    "/add-post",
    "/contact",
    "login",
    "offline",
    "404",
    "/css/style.css",
    "/images/logo.gif",
    "/images/offline.png",
    "/js/add-post.js",
    "/js/login.js",
    "/js/blog.js",
    "js/home.js",
  ],
};

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);
self.addEventListener("message", onMessage);
main().catch(console.error);

async function main() {
  console.log("restarting service worker");
  await sendMessage({ requestStatusUpdate: true }); // Sending message to client
  await loggedOutCache(true);
}

async function onInstall(evt) {
  console.log(`Service worker ${version} is installing...`);
  self.skipWaiting(); // skip the waiting stage regardless of there are any open clients using previous version of srvw.
}

function onActivate(evt) {
  evt.waitUntil(handleActivation());
}

async function sendMessage(msg) {
  const totalClients = await clients.matchAll({ includeUnctrolled: true });
  return Promise.all(
    totalClients.map((client) => {
      const channel = new MessageChannel();
      client.port1.addEventListener("message", onMessage); // Listening event from port 1
      return client.postMessage(msg, [channel.port2]); // Sending message from port 2
    })
  ); // get all clients , include clients not controlled by service worker
}

function onMessage({ data }) {
  console.log("Receiving data ", data);
  if (data.statusUpdate) {
    const { isLoggedIn, isOnline } = data.statusUpdate;

    console.log(
      `The svw version ${version} status update, isOnline:${isOnline} , isLoggedIn:${isLoggedIn}`
    );
  }
}
async function handleActivation() {
  await clearCaches();

  await clients.claim();
  await loggedOutCache(true);
  console.log("Service workers are activated...");
}

async function clearCaches() {
  const cacheNames = await caches.keys();
  console.log("all cache names", await caches);

  let foundOldCachesNames = cacheNames.filter((cachename) => {
    const isMyCache = cachename.includes("app-");

    if (isMyCache) {
      let [, cacheVersion] = cachename.match(/^app-(\d+)$/); // Retrive stores cache version number from ['app-','version']
      cacheVersion =
        cacheVersion !== null ? Number(cacheVersion) : cacheVersion;

      return cacheVersion > 0 && cacheVersion !== version;
    }
  });

  // Delete old my own caches
  return Promise.all(
    foundOldCachesNames.map((cachename) => {
      return caches.delete(cachename);
    })
  );
}
async function loggedOutCache(forceReload = false) {
  console.log(await caches);
  const cache = await caches.open(cacheName); // open cache object

  return Promise.all(
    urlsToCache.loggedOut.map(async function requestFile(url) {
      try {
        let res;
        if (!forceReload) {
          res = await cacheName.match(url);

          if (res) {
            return res;
          }
        }

        let fetchOptions = {
          method: "GET",
          Credentials: "omit",
          cache: "no-cache",
        };

        res = await fetch(url, fetchOptions);

        if (res.ok) {
          cache.put(url, res);
          // Adding info inside of cache object
        }
      } catch (err) {}
    })
  );
}
