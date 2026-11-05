// Sixfold's offline helper for the website. Pages come from the network when there is one
// (so an update shows up straight away) and from the cache when there isn't. The app's files
// are kept in a cache named after this release, and older releases' caches are deleted when
// a new one takes over; the guitar recordings and icons never change, so they live in a
// separate cache that's kept.
const BUILD = "1.6.18-mw3r4cr6"; // replaced with the release when the site is built
const APP = `sixfold-app-${BUILD}`;
const STATIC = "sixfold-static-v1";
const isStatic = (url) => /\/(sounds|icons)\//.test(url.pathname) || url.pathname.endsWith(".webmanifest");

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((n) => (n.startsWith("sixfold-") || n.startsWith("fretwise-")) && n !== APP && n !== STATIC).map((n) => caches.delete(n))))
      .then(() => self.clients.claim())
  )
);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== "GET" || url.origin !== location.origin) return;
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(APP).then((c) => c.put("./", copy));
          return res;
        })
        .catch(() => caches.match("./"))
    );
    return;
  }
  const name = isStatic(url) ? STATIC : APP;
  e.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(name).then((c) => c.put(req, copy));
          }
          return res;
        })
    )
  );
});
