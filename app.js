/* =========================================================
   きいてね! おんがくプレーヤー
   ---------------------------------------------------------
   曲の設定はここだけ書き換えればOKです。
   file には songs フォルダ内のファイル名を指定してください。
   title はボタンに表示される名前です（空文字でも可）。
   ========================================================= */
var SONGS = [
  { title: "どんな色が好き",  file: "songs/song01.mp3" },
  { title: "ぼくらのロコモーション",  file: "songs/song02.mp3" },
  { title: "ボロボロロケット",  file: "songs/song03.mp3" },
  { title: "わ～お!",  file: "songs/song04.mp3" },
  { title: "青空しんこきゅう",  file: "songs/song05.mp3" },
  { title: "クラッパラ!",  file: "songs/song06.mp3" },
  { title: "夢をかなえてドラえもん",  file: "songs/song07.mp3" },
  { title: "崖の上のポニョ",  file: "songs/song08.mp3" },
  { title: "にんげんっていいな",  file: "songs/song09.mp3" },
  { title: "アンパンマンのマーチ", file: "songs/song10.mp3" },
  { title: "君をのせて", file: "songs/song11.mp3" },
  { title: "この空", file: "songs/song12.mp3" },
  { title: "おどるポンポコリン", file: "songs/song13.mp3" },
  { title: "サザエさん", file: "songs/song14.mp3" },
  { title: "きかんしゃトーマスのテーマ", file: "songs/song15.mp3" },
  { title: "さんぽ", file: "songs/song16.mp3" },
  { title: "勇気100%", file: "songs/song17.mp3" },
  { title: "ジャングルポケット", file: "songs/song18.mp3" },
  { title: "ミッキーマウス・マーチ", file: "songs/song19.mp3" },
  { title: "てのひらをたいように", file: "songs/song20.mp3" },
  { title: "心のファンファーレ", file: "songs/song21.mp3" },
  { title: "ごあいさつのうた", file: "songs/song22.mp3" },
  { title: "おふろのかぞえうた", file: "songs/song23.mp3" }
];

var currentSong = null;   // 現在再生中の SONGS の要素
var currentBtn = null;    // 現在再生中のボタン要素

function getAudio(song) {
  if (!song._audio) {
    song._audio = new Audio(song.file);
    song._audio.preload = "auto";
    song._audio.addEventListener("ended", function () {
      if (currentSong === song) {
        stopCurrent();
      }
    });
  }
  return song._audio;
}

function playSong(song, btn) {
  if (currentSong === song) {
    // 同じ曲がすでに再生中なら最初から鳴らし直す
    var a = getAudio(song);
    a.currentTime = 0;
    a.play();
    return;
  }
  stopCurrent();
  var audio = getAudio(song);
  audio.currentTime = 0;
  var p = audio.play();
  if (p && p.catch) { p.catch(function () {}); }
  currentSong = song;
  currentBtn = btn;
  btn.classList.add("playing");
}

function stopCurrent() {
  if (!currentSong) { return false; }
  var a = getAudio(currentSong);
  a.pause();
  a.currentTime = 0;
  if (currentBtn) { currentBtn.classList.remove("playing"); }
  currentSong = null;
  currentBtn = null;
  return true;
}

function onStopPressed() {
  var wasPlaying = stopCurrent();
  if (!wasPlaying) {
    turnOff();
  }
}

function turnOff() {
  document.getElementById("grid-screen").style.display = "none";
  document.getElementById("off-screen").style.display = "flex";
  // 対応している端末では実際にタブ/ウィンドウを閉じる
  try { window.close(); } catch (e) {}
}

function turnOn() {
  document.getElementById("off-screen").style.display = "none";
  document.getElementById("grid-screen").style.display = "grid";
}

function buildGrid() {
  var grid = document.getElementById("grid-screen");
  grid.innerHTML = "";

  for (var i = 0; i < 23; i++) {
    var song = SONGS[i];
    var btn = document.createElement("button");
    btn.className = "btn c" + (i % 6);
    btn.setAttribute("type", "button");

    var num = document.createElement("div");
    num.className = "num";
    num.textContent = String(i + 1);
    btn.appendChild(num);

    if (song.title) {
      var label = document.createElement("div");
      label.className = "label";
      label.textContent = song.title;
      btn.appendChild(label);
    }

    (function (song, btn) {
      btn.addEventListener("click", function () {
        playSong(song, btn);
      });
    })(song, btn);

    grid.appendChild(btn);
  }

  // 24個目: ストップ/電源オフボタン
  var stopBtn = document.createElement("button");
  stopBtn.className = "btn stop-btn";
  stopBtn.setAttribute("type", "button");
  var icon = document.createElement("div");
  icon.className = "stop-icon";
  stopBtn.appendChild(icon);
  stopBtn.addEventListener("click", onStopPressed);
  grid.appendChild(stopBtn);
}

document.getElementById("off-screen").addEventListener("click", turnOn);

buildGrid();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", function () {
    navigator.serviceWorker.register("sw.js").catch(function () {});
  });
}
