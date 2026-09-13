/* ============================================================
   Workshop deck engine
   - fixed 1280x720 canvas, scaled to fit any screen (no overlap)
   - arrow-key navigation with in-slide fragment steps
   - speaker notes panel, overview grid, presenter timer
   ============================================================ */
(function () {
  "use strict";

  var stage   = document.getElementById("stage");
  var slides  = Array.prototype.slice.call(document.querySelectorAll(".slide"));
  var progress= document.getElementById("progress");
  var counter = document.getElementById("counter");
  var partlbl = document.getElementById("partlbl");
  var notesEl = document.getElementById("notes");
  var ovEl    = document.getElementById("overview");
  var helpEl  = document.getElementById("help");
  var timerEl = document.getElementById("timer");
  var hintEl  = document.getElementById("hint");

  var cur = 0;      // slide index
  var frag = 0;     // fragment step within slide
  var fragMap = []; // per slide: sorted unique fragment indices

  /* ---------- fit canvas to viewport ---------- */
  function fit() {
    var padded = notesEl.classList.contains("open");
    var availW = window.innerWidth - (padded ? 400 : 0);
    var availH = window.innerHeight;
    var s = Math.min(availW / 1280, availH / 720);
    stage.style.transform = "translate(-50%,-50%) scale(" + s + ")";
    stage.style.left = (padded ? availW / 2 : window.innerWidth / 2) + "px";
  }
  window.addEventListener("resize", fit);

  /* ---------- index fragments ---------- */
  slides.forEach(function (sl, i) {
    var set = {};
    sl.querySelectorAll("[data-frag]").forEach(function (el) {
      set[parseInt(el.getAttribute("data-frag"), 10) || 1] = 1;
    });
    fragMap[i] = Object.keys(set).map(Number).sort(function (a, b) { return a - b; });
  });

  function applyFrags() {
    var sl = slides[cur];
    var steps = fragMap[cur];
    var upto = steps.slice(0, frag);
    sl.querySelectorAll("[data-frag]").forEach(function (el) {
      var n = parseInt(el.getAttribute("data-frag"), 10) || 1;
      el.classList.toggle("frag-on", upto.indexOf(n) !== -1);
    });
    runScene(sl, frag);
  }

  /* GSAP-driven scenes: a slide with data-scene hands control to scenes.js */
  function runScene(sl, step) {
    var name = sl.getAttribute("data-scene");
    if (!name || !window.SCENES || typeof window.SCENES[name] !== "function") return;
    try { window.SCENES[name](sl, step); } catch (e) { console.warn("scene " + name + " failed", e); }
  }

  /* ---------- render a slide ---------- */
  function show(i, fragStart) {
    i = Math.max(0, Math.min(slides.length - 1, i));
    var changed = i !== cur;
    cur = i;
    frag = fragStart === "end" ? fragMap[i].length : 0;

    slides.forEach(function (s) { s.classList.remove("is-active"); });
    var sl = slides[cur];
    void sl.offsetWidth;            // force reflow so CSS animations restart
    sl.classList.add("is-active");
    applyFrags();

    progress.style.width = ((cur + 1) / slides.length * 100) + "%";
    counter.textContent = String(cur + 1).padStart(2, "0") + " / " + slides.length;
    var part = sl.getAttribute("data-part") || "";
    partlbl.textContent = part;
    partlbl.style.display = part ? "" : "none";

    renderNotes();
    if (changed) history.replaceState(null, "", "#" + (cur + 1));
    markOverview();
  }

  /* ---------- navigation ---------- */
  function next() {
    if (frag < fragMap[cur].length) { frag++; applyFrags(); return; }
    if (cur < slides.length - 1) show(cur + 1);
  }
  function prev() {
    if (frag > 0) { frag--; applyFrags(); return; }
    if (cur > 0) show(cur - 1, "end");
  }
  function nextSlide() { if (cur < slides.length - 1) show(cur + 1); }
  function prevSlide() { if (cur > 0) show(cur - 1); }

  /* ---------- speaker notes ---------- */
  function renderNotes() {
    if (!notesEl.classList.contains("open")) return;
    var sl = slides[cur];
    var aside = sl.querySelector("aside.notes");
    var title = sl.querySelector(".s-title");
    var nxt = slides[cur + 1] ? slides[cur + 1].querySelector(".s-title") : null;
    notesEl.innerHTML =
      '<h3>Speaker notes &middot; ' + (cur + 1) + ' / ' + slides.length + '</h3>' +
      '<div class="nslide">' + (title ? title.textContent : "untitled") + "</div>" +
      '<div class="nbody">' + (aside ? aside.innerHTML : '<p class="dim">No notes for this slide.</p>') + "</div>" +
      (nxt ? '<div class="nnext">Next &rarr; ' + nxt.textContent + "</div>" : "");
  }

  function toggleNotes() {
    notesEl.classList.toggle("open");
    renderNotes();
    fit();
  }

  /* ---------- overview ---------- */
  function buildOverview() {
    var html = '<h2>All slides</h2><div class="ovgrid">';
    var lastPart = null;
    slides.forEach(function (sl, i) {
      var part = sl.getAttribute("data-part") || "";
      if (part !== lastPart) { html += '<div class="ovpart">' + (part || "Opening") + "</div>"; lastPart = part; }
      var t = sl.querySelector(".s-title");
      html += '<div class="ovcell" data-i="' + i + '">' +
              '<div class="ovn">' + String(i + 1).padStart(2, "0") + "</div>" +
              '<div class="ovt">' + (t ? t.textContent : "untitled") + "</div></div>";
    });
    ovEl.innerHTML = html + "</div>";
    ovEl.querySelectorAll(".ovcell").forEach(function (c) {
      c.addEventListener("click", function () {
        show(parseInt(c.getAttribute("data-i"), 10));
        ovEl.classList.remove("open");
      });
    });
  }
  function markOverview() {
    ovEl.querySelectorAll(".ovcell").forEach(function (c) {
      c.classList.toggle("cur", parseInt(c.getAttribute("data-i"), 10) === cur);
    });
  }

  /* ---------- presenter timer ---------- */
  var tStart = null, tPaused = true, tElapsed = 0, TARGET = 180 * 60;
  function tick() {
    if (!tPaused && tStart) tElapsed = Math.floor((Date.now() - tStart) / 1000);
    var m = Math.floor(tElapsed / 60), s = tElapsed % 60;
    var over = tElapsed > TARGET;
    timerEl.innerHTML =
      '<span class="tdot"></span><span class="' + (over ? "tover" : "") + '">' +
      String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") +
      '</span><span style="color:var(--paper-faint)">/ 180:00</span>';
    timerEl.classList.toggle("paused", tPaused);
  }
  setInterval(tick, 500); tick();
  function toggleTimer() {
    if (!timerEl.classList.contains("open")) { timerEl.classList.add("open"); return; }
    if (tPaused) { tStart = Date.now() - tElapsed * 1000; tPaused = false; }
    else { tPaused = true; }
  }

  /* ---------- keys ---------- */
  document.addEventListener("keydown", function (e) {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var k = e.key;
    if (k === "Escape") { ovEl.classList.remove("open"); helpEl.classList.remove("open"); return; }
    if (helpEl.classList.contains("open") && k !== "?") { helpEl.classList.remove("open"); return; }

    switch (k) {
      case "ArrowRight": case " ": case "PageDown": e.preventDefault(); next(); break;
      case "ArrowLeft":  case "PageUp":             e.preventDefault(); prev(); break;
      case "ArrowDown":  e.preventDefault(); nextSlide(); break;
      case "ArrowUp":    e.preventDefault(); prevSlide(); break;
      case "Home":       e.preventDefault(); show(0); break;
      case "End":        e.preventDefault(); show(slides.length - 1); break;
      case "n": case "N": toggleNotes(); break;
      case "s": case "S": toggleNotes(); break;
      case "o": case "O": ovEl.classList.toggle("open"); markOverview(); break;
      case "t": case "T": toggleTimer(); break;
      case "r": case "R": tElapsed = 0; tStart = Date.now(); tick(); break;
      case "f": case "F":
        if (document.fullscreenElement) document.exitFullscreen();
        else document.documentElement.requestFullscreen();
        break;
      case "?": helpEl.classList.toggle("open"); break;
      default:
        if (/^[0-9]$/.test(k)) { jumpBuf += k; clearTimeout(jumpT); jumpT = setTimeout(doJump, 650); }
    }
  });

  var jumpBuf = "", jumpT = null;
  function doJump() {
    var n = parseInt(jumpBuf, 10); jumpBuf = "";
    if (n >= 1 && n <= slides.length) show(n - 1);
  }

  /* ---------- click / touch ---------- */
  stage.addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    (e.clientX < window.innerWidth * 0.22 ? prev : next)();
  });
  var tx = 0;
  stage.addEventListener("touchstart", function (e) { tx = e.changedTouches[0].clientX; }, { passive: true });
  stage.addEventListener("touchend", function (e) {
    var d = e.changedTouches[0].clientX - tx;
    if (Math.abs(d) > 45) (d < 0 ? next : prev)();
  }, { passive: true });

  /* test hook: lets the QA harness drive the real engine, scenes included */
  window.__deck = { goto: show, next: next, fragCount: function () { return fragMap[cur].length; } };

  /* ---------- boot ---------- */
  buildOverview();
  fit();
  var h = parseInt((location.hash || "").slice(1), 10);
  show(h >= 1 && h <= slides.length ? h - 1 : 0);
  setTimeout(function () { hintEl.classList.add("gone"); }, 5200);
})();
