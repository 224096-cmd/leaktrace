/* オフライン対応：一度開いたファイルをブラウザに保存し、ネットに繋がらないときはそれを使う（ネット優先） */
const CACHE = "leaktrace-v0.7.0";
const FILES = [
  "./", "./index.html", "./css/style.css",
  "./js/glossary.js", "./js/record.js", "./js/cases.js", "./js/map.js", "./js/stage0.js", "./js/stage1.js", "./js/stage2.js",
  "./js/stage3.js", "./js/stage4.js", "./js/final.js", "./js/test.js", "./js/survey.js", "./js/app.js", "./js/worker-crack.js", "./data/test-items.json"
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy)).catch(() => {});
      return res;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("./index.html")))
  );
});
