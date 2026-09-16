// v3: 206(部分リクエスト)応答でも曲を確実にキャッシュできるよう修正
var CACHE_NAME = "kids-music-app-v3";

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

// 曲ファイル全体を、Rangeヘッダ無しのリクエストとして裏側でキャッシュする
function warmSongCache(url) {
  var fullReq = new Request(url, { method: "GET" }); // Rangeなしの素のGET
  caches.match(fullReq).then(function (already) {
    if (already) { return; } // 既にフルでキャッシュ済みなら何もしない
    fetch(fullReq).then(function (fullRes) {
      if (fullRes && fullRes.status === 200) {
        caches.open(CACHE_NAME).then(function (cache) {
          cache.put(fullReq, fullRes);
        });
      }
    }).catch(function () {});
  });
}

self.addEventListener("fetch", function (event) {
  var req = event.request;
  var url = req.url;

  if (isSongRequest(url)) {
    event.respondWith(
      caches.match(req).then(function (cached) {
        if (cached) { return cached; }
        return fetch(req).then(function (res) {
          if (res && res.status === 200) {
            var clone = res.clone();
            caches.open(CACHE_NAME).then(function (cache) { cache.put(req, clone); });
          } else if (res && res.status === 206) {
            // 部分応答は保存せず、フル取得を裏で走らせて次回以降に備える
            warmSongCache(url);
          }
          return res;
        });
      })
    );
    return;
  }

  // アプリ本体(HTML/CSS/JS/アイコン等)はネットワーク優先
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
