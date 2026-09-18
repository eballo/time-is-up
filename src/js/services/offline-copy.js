/**
 * Registers the service worker at the site root, which is what lets the
 * browser offer "Install" and keeps the page working without a network.
 *
 * Every failure mode — no API, plain http://, a browser that cannot load a
 * module worker — ends the same way the wake lock's do: quietly, with an app
 * that runs exactly as it did before there was a worker.
 */
export function registerOfflineCopy() {
  if (!("serviceWorker" in navigator)) return;
  // Relative to the page, so it lands at the root under any base path
  // (localhost:8000/ and eballo.github.io/time-is-up/ alike).
  navigator.serviceWorker.register("sw.js", { type: "module" }).catch(() => {
    // Not installable here; nothing else changes.
  });
}
