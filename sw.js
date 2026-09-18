/*
 * Service worker: what makes the page installable, and what keeps it working
 * when the meeting room's Wi-Fi does not.
 *
 * Strategy: network first, cache as the fallback. Online, every request goes to
 * the server exactly as it does without a worker, so a deploy to main is seen
 * on the next load and there is never a stale copy to explain. Offline — or on
 * a network that stalls — the copy taken on the last successful load is served
 * instead. Speed was never the point: the whole app is a few tens of kilobytes.
 *
 * The cache is named after APP_VERSION, so a release retires the previous
 * cache on activation and re-takes the whole shell rather than trusting what
 * happened to be fetched since. This file is a module so it can read that
 * constant from the one place it is kept.
 */
import { APP_VERSION } from "./src/js/version.js";

const CACHE_NAME = `time-is-up-v${APP_VERSION}`;

/** Longer than this and the network is treated as absent for this request. */
const NETWORK_TIMEOUT_MS = 4000;

/**
 * Everything a first offline visit needs. Relative to this file, which sits at
 * the site root beside index.html, so the list holds under any base path.
 */
const APP_SHELL = [
  "./",
  "index.html",
  "manifest.webmanifest",
  "favicon.svg",
  "icons/icon-192.png",
  "icons/icon-512.png",
  "icons/icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "src/css/styles.css",
  "src/js/app.js",
  "src/js/version.js",
  "src/js/core/session.js",
  "src/js/core/turn-timer.js",
  "src/js/services/chime.js",
  "src/js/services/offline-copy.js",
  "src/js/services/preferences.js",
  "src/js/services/screen-wake-lock.js",
  "src/js/services/theme-controller.js",
  "src/js/services/translator.js",
  "src/js/ui/elements.js",
  "src/js/ui/fireworks.js",
  "src/js/ui/keyboard-shortcuts.js",
  "src/js/ui/preroll-countdown.js",
  "src/js/ui/running-screen.js",
  "src/js/ui/setup-screen.js",
  "src/js/ui/share-button.js",
  "src/js/ui/summary-screen.js",
  "src/js/ui/tab-title.js",
  "src/js/util/dom.js",
  "src/js/util/time-format.js",
  "src/i18n/index.js",
  "src/i18n/ca.js",
  "src/i18n/en.js",
  "src/i18n/es.js",
  "src/i18n/fr.js",
  "src/i18n/nl.js"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      // A new release should not sit behind the old worker until every tab closes.
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name)))
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  // Only this origin's GETs are ours to answer for.
  if (request.method !== "GET" || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetchWithTimeout(request);
    if (response.ok) cache.put(request, response.clone());
    return response;
  } catch {
    const cached = await cache.match(request, { ignoreSearch: true });
    if (cached) return cached;
    // A navigation to a URL never seen still gets the app rather than the
    // browser's offline page.
    if (request.mode === "navigate") {
      const shell = await cache.match("index.html");
      if (shell) return shell;
    }
    return Response.error();
  }
}

function fetchWithTimeout(request) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("network timeout")), NETWORK_TIMEOUT_MS);
    fetch(request).then(
      (response) => {
        clearTimeout(timer);
        resolve(response);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      }
    );
  });
}
