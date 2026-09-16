// ★ファイルを更新して再アップロードしたら、この数字を v3, v4... と増やしてください。
// (増やさないとブラウザが更新を検知しないことがあります)
var CACHE_NAME = "kids-music-app-v2";

var APP_SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

function isSongRequest(url) {
  return url.indexOf("/songs/") !== -1;
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = req.url;

  if (isSongRequest(url)) {
    // 曲(mp3)は変わらない前提なのでキャッシュ優先(オフライン再生の要)
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) { return cached; }
        return fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
          }
          return res;
        });
      })
    );
    return;
  }

  // アプリ本体(HTML/CSS/JS/アイコン等)はネットワーク優先
  // → 修正したらすぐ反映される。オフライン時のみキャッシュにフォールバック。
  event.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
      }
      return res;
    }).catch(function () {
      return caches.match(req);
    })
  );
});
