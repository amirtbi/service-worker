"use strict";

// TODO
const version = 4;
const isOnline = true;
const isLoggedIn = false;

self.addEventListener("install", onInstall);
self.addEventListener("activate", onActivate);
self.addEventListener("message", onMessage);
main().catch(console.error);

async function main() {
  console.log("restarting service worker");
  await sendMessage({ requestStatusUpdate: true }); // Sending message to client
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
  await clients.claim();
  console.log("Service workers are activated...");
}
