/* ============================================================
   GSAP scenes for the worked-example slides.
   Every number shown here is measured, not invented:
   window.DECK_DATA carries real embeddings, real cosine scores
   and a real agent trace captured from the notebooks.
   ============================================================ */
(function () {
  "use strict";
  if (!window.gsap) return;
  var D = window.DECK_DATA || {};
  window.SCENES = window.SCENES || {};

  var cache = new WeakMap();
  function tl(el, build) {
    var t = cache.get(el);
    if (!t) { t = build(); cache.set(el, t); }
    return t;
  }
  var q = function (el, sel) { return Array.prototype.slice.call(el.querySelectorAll(sel)); };

  /* ---------------------------------------------------------
     1. TEXT -> NUMBERS
     Real first-8 dimensions of real text-embedding-3-small vectors.
     --------------------------------------------------------- */
  window.SCENES.embedNumbers = function (el, step) {
    var t = tl(el, function () {
      var rows = q(el, "[data-erow]");
      // paint the real numbers once
      rows.forEach(function (row) {
        var word = row.getAttribute("data-erow");
        var vec = (D.embeddings && D.embeddings.sample_vectors[word]) || [];
        var out = row.querySelector("[data-nums]");
        if (out && !out.childElementCount) {
          out.innerHTML = vec.map(function (n) {
            return '<span class="vnum">' + (n >= 0 ? "+" : "") + n.toFixed(3) + "</span>";
          }).join("") + '<span class="vmore">… 1,528 more</span>';
        }
      });

      var t = gsap.timeline({ paused: true });
      rows.forEach(function (row, i) {
        var base = i * 1.05;
        t.fromTo(row.querySelector(".vword"),
          { opacity: 0, x: -22, scale: .9 }, { opacity: 1, x: 0, scale: 1, duration: .45, ease: "back.out(2)" }, base)
         .fromTo(row.querySelector(".varrow"),
          { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1, duration: .35, ease: "power2.out", transformOrigin: "left center" }, base + .25)
         .fromTo(row.querySelectorAll(".vnum"),
          { opacity: 0, y: 9 }, { opacity: 1, y: 0, duration: .3, stagger: .055, ease: "power2.out" }, base + .45)
         .fromTo(row.querySelector(".vmore"),
          { opacity: 0 }, { opacity: 1, duration: .35 }, base + .95);
      });
      t.fromTo(el.querySelector("[data-punch]"),
        { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .55, ease: "power3.out" }, "+=0.15");
      return t;
    });
    step ? t.play() : t.restart();
  };

  /* ---------------------------------------------------------
     2. SEMANTIC MAP
     Real PCA of real embeddings. Points carry measured coordinates.
     --------------------------------------------------------- */
  window.SCENES.semanticMap = function (el, step) {
    var t = tl(el, function () {
      var svg = el.querySelector("[data-map]");
      var pts = (D.embeddings && D.embeddings.points) || [];
      var W = 560, H = 360, PAD = 46;
      var COL = { refund: "var(--clay)", ship: "var(--slate)", pay: "var(--sage)", other: "var(--paper-faint)" };

      if (!svg.querySelector(".pt")) {
        // Real coordinates, so labels WILL collide. Place each one greedily in the
        // first candidate slot that does not overlap a label already placed.
        var placed = [];
        // every dot is an obstacle as well, so a label never sits on a point
        pts.forEach(function (p) {
          var px = PAD + p.x * (W - PAD * 2), py = H - PAD - p.y * (H - PAD * 2);
          placed.push({ l: px - 9, r: px + 9, t: py - 9, b: py + 9 });
        });
        var dotCount = placed.length;
        var CW = 6.55, LH = 15;                       // approx char width / line height at 12.5px
        var CAND = [[13, 4, "start"], [-13, 4, "end"], [0, -14, "middle"], [0, 21, "middle"],
                    [13, -12, "start"], [-13, -12, "end"], [13, 20, "start"], [-13, 20, "end"],
                    [0, -26, "middle"], [0, 33, "middle"], [26, 4, "start"], [-26, 4, "end"]];
        function boxOf(x, y, anchor, w) {
          var left = anchor === "start" ? x : anchor === "end" ? x - w : x - w / 2;
          return { l: left, r: left + w, t: y - LH * 0.78, b: y + LH * 0.3 };
        }
        function clashes(b) {
          // keep labels inside the plotted frame, not just inside the svg
          if (b.l < 50 || b.r > W - 50 || b.t < 34 || b.b > H - 34) return true;
          return placed.some(function (o) { return b.l < o.r + 3 && b.r > o.l - 3 && b.t < o.b + 2 && b.b > o.t - 2; });
        }

        var frag = "";
        pts.forEach(function (p) {
          var x = PAD + p.x * (W - PAD * 2), y = H - PAD - p.y * (H - PAD * 2);
          var w = p.w.length * CW + 4, chosen = null;
          for (var c = 0; c < CAND.length && !chosen; c++) {
            var b = boxOf(x + CAND[c][0], y + CAND[c][1], CAND[c][2], w);
            if (!clashes(b)) chosen = { dx: CAND[c][0], dy: CAND[c][1], a: CAND[c][2], box: b };
          }
          if (!chosen) {          // nowhere clean: take the least-bad slot rather than overlap a dot
            var best = null;
            for (var k = 0; k < CAND.length; k++) {
              var bb = boxOf(x + CAND[k][0], y + CAND[k][1], CAND[k][2], w);
              var over = placed.reduce(function (acc, o) {
                var ow = Math.min(bb.r, o.r) - Math.max(bb.l, o.l);
                var oh = Math.min(bb.b, o.b) - Math.max(bb.t, o.t);
                return acc + (ow > 0 && oh > 0 ? ow * oh : 0);
              }, 0);
              if (bb.l >= 50 && bb.r <= W - 50 && bb.t >= 34 && bb.b <= H - 34 && (!best || over < best.over))
                best = { dx: CAND[k][0], dy: CAND[k][1], a: CAND[k][2], box: bb, over: over };
            }
            chosen = best || { dx: 0, dy: 21, a: "middle", box: boxOf(x, y + 21, "middle", w) };
          }
          placed.push(chosen.box);
          frag += '<g class="pt" data-g="' + p.g + '" opacity="0">' +
                  '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="6.5" fill="' + COL[p.g] + '"/>' +
                  '<text x="' + (x + chosen.dx).toFixed(1) + '" y="' + (y + chosen.dy).toFixed(1) +
                  '" text-anchor="' + chosen.a + '" class="ptlabel" style="fill:' + COL[p.g] + '">' + p.w + "</text></g>";
        });
        // rings drawn around the real centroid of each cluster, not guessed
        var rings = "";
        ["refund", "ship", "pay"].forEach(function (g) {
          var m = pts.filter(function (p) { return p.g === g; })
                     .map(function (p) { return [PAD + p.x * (W - PAD * 2), H - PAD - p.y * (H - PAD * 2)]; });
          if (m.length < 2) return;
          var cx = m.reduce(function (a, c) { return a + c[0]; }, 0) / m.length;
          var cy = m.reduce(function (a, c) { return a + c[1]; }, 0) / m.length;
          var rx = Math.max.apply(null, m.map(function (c) { return Math.abs(c[0] - cx); })) + 30;
          var ry = Math.max.apply(null, m.map(function (c) { return Math.abs(c[1] - cy); })) + 26;
          rx = Math.min(rx, cx - 50, (W - 50) - cx);        // keep the ring inside the frame
          ry = Math.min(ry, cy - 34, (H - 34) - cy);
          if (rx < 18 || ry < 14) return;
          rings += '<ellipse class="ring" cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) +
                   '" rx="' + rx.toFixed(1) + '" ry="' + ry.toFixed(1) +
                   '" fill="none" stroke="' + COL[g] + '" stroke-dasharray="5 5" opacity="0"/>';
        });
        svg.insertAdjacentHTML("afterbegin", rings);
        svg.insertAdjacentHTML("beforeend", frag);
      }

      var t = gsap.timeline({ paused: true });
      t.fromTo(svg.querySelectorAll(".axis"), { opacity: 0 }, { opacity: 1, duration: .5, stagger: .08 })
       .fromTo(svg.querySelectorAll('.pt[data-g="refund"]'), { opacity: 0, scale: 0, transformOrigin: "center" },
               { opacity: 1, scale: 1, duration: .5, stagger: .1, ease: "back.out(2.4)" }, .3)
       .fromTo(svg.querySelectorAll('.pt[data-g="ship"]'), { opacity: 0, scale: 0, transformOrigin: "center" },
               { opacity: 1, scale: 1, duration: .5, stagger: .1, ease: "back.out(2.4)" }, "-=0.25")
       .fromTo(svg.querySelectorAll('.pt[data-g="pay"]'), { opacity: 0, scale: 0, transformOrigin: "center" },
               { opacity: 1, scale: 1, duration: .5, stagger: .1, ease: "back.out(2.4)" }, "-=0.25")
       .fromTo(svg.querySelectorAll('.pt[data-g="other"]'), { opacity: 0, scale: 0, transformOrigin: "center" },
               { opacity: 1, scale: 1, duration: .5, stagger: .1, ease: "back.out(2.4)" }, "-=0.15")
       .fromTo(svg.querySelectorAll(".ring"), { opacity: 0, scale: .55, transformOrigin: "center" },
               { opacity: .75, scale: 1, duration: .8, stagger: .16, ease: "power2.out" }, "-=0.2")
       .fromTo(el.querySelectorAll("[data-legend] > *"), { opacity: 0, x: 14 },
               { opacity: 1, x: 0, duration: .4, stagger: .1 }, "-=0.6");
      return t;
    });
    step ? t.play() : t.restart();
  };

  /* ---------------------------------------------------------
     3. SIMILARITY SEARCH
     Real cosine scores for a real query against the real corpus.
     --------------------------------------------------------- */
  window.SCENES.similarity = function (el, step) {
    var t = tl(el, function () {
      var list = el.querySelector("[data-hits]");
      var hits = (D.retrieval && D.retrieval.hits) || [];
      var max = hits.length ? hits[0].score : 1;

      if (!list.childElementCount) {
        list.innerHTML = hits.map(function (h, i) {
          var pct = Math.max(6, (h.score / max) * 100);
          return '<div class="hitrow' + (i < 2 ? " top" : "") + '">' +
                   '<div class="hitmeta"><b>' + h.heading.replace(/^Nimbus Retail\s*[:\u2014\u2013-]\s*/, "") + "</b><span>" + h.source + "</span></div>" +
                   '<div class="hitbar"><i style="--w:' + pct.toFixed(1) + '%"></i></div>' +
                   '<div class="hitscore">' + h.score.toFixed(3) + "</div>" +
                 "</div>";
        }).join("");
      }

      var rows = q(el, ".hitrow");
      var t = gsap.timeline({ paused: true });
      t.fromTo(el.querySelector("[data-query]"), { opacity: 0, y: -18 },
               { opacity: 1, y: 0, duration: .5, ease: "back.out(1.8)" })
       .fromTo(el.querySelector("[data-scan]"), { opacity: 0, y: 0 },
               { opacity: 1, duration: .2 }, .35)
       .to(el.querySelector("[data-scan]"), { y: 268, duration: 1.5, ease: "power1.inOut" }, .45)
       .to(el.querySelector("[data-scan]"), { opacity: 0, duration: .3 }, 1.85)
       .fromTo(rows, { opacity: 0, x: -16 }, { opacity: 1, x: 0, duration: .35, stagger: .13 }, .5)
       .fromTo(q(el, ".hitbar i"), { scaleX: 0 },
               { scaleX: 1, duration: .65, stagger: .13, ease: "power2.out", transformOrigin: "left center" }, .62)
       .fromTo(q(el, ".hitscore"), { opacity: 0 }, { opacity: 1, duration: .3, stagger: .13 }, .8)
       .to(rows.slice(2), { opacity: .48, duration: .5 }, "+=0.25")
       .to(rows.slice(0, 2), { scale: 1.025, duration: .4, ease: "back.out(2)", transformOrigin: "left center" }, "<")
       .fromTo(el.querySelector("[data-into]"), { opacity: 0, y: 18 },
               { opacity: 1, y: 0, duration: .55, ease: "power3.out" }, "-=0.1");
      return t;
    });
    step ? t.play() : t.restart();
  };

  /* ---------------------------------------------------------
     4. THE REACT AGENT LOOP
     A real captured trace. Steps through think / act / observe,
     and the loop gate, one press at a time.
     --------------------------------------------------------- */
  window.SCENES.reactLoop = function (el, step) {
    var built = tl(el, function () {
      var steps = q(el, "[data-step]");
      gsap.set(steps, { opacity: 0, y: 18 });
      // track shown-state ourselves: reading it back off GSAP is unreliable when
      // several steps are advanced within a single frame (held arrow key).
      return { steps: steps, last: -1, shown: steps.map(function () { return false; }) };
    });

    var target = Math.max(0, step);
    if (target === built.last) return;
    built.last = target;

    built.steps.forEach(function (s, i) {
      var on = i < target;
      if (on === built.shown[i]) return;
      built.shown[i] = on;
      gsap.killTweensOf(s);
      if (on) {
        gsap.fromTo(s, { opacity: 0, y: 18, scale: .98 },
          { opacity: 1, y: 0, scale: 1, duration: .5, ease: "back.out(1.6)" });
      } else {
        gsap.to(s, { opacity: 0, y: 18, scale: .98, duration: .2 });
      }
    });

    // highlight whichever node the loop is sitting on - no floating marker to collide
    var NODE_FOR = [null, null, "think", "act", "obs", "think", "act", "obs", "gate"];
    var want = NODE_FOR[Math.min(target, NODE_FOR.length - 1)];
    q(el, "[data-node]").forEach(function (n) {
      var on = n.getAttribute("data-node") === want;
      gsap.to(n, { attr: { "stroke-width": on ? 3 : 1.5 }, opacity: on ? 1 : .5, duration: .35 });
    });
    q(el, "[data-halo]").forEach(function (h) {
      var on = h.getAttribute("data-halo") === want;
      gsap.to(h, { opacity: on ? 1 : 0, duration: .35 });
      if (on) gsap.fromTo(h, { scale: .82, transformOrigin: "center" },
                             { scale: 1, duration: .5, ease: "back.out(2)" });
    });

    // round counter
    var rounds = el.querySelectorAll("[data-round]");
    rounds.forEach(function (r) {
      var need = parseInt(r.getAttribute("data-round"), 10);
      gsap.to(r, { opacity: target >= need ? 1 : .18, duration: .35 });
    });
  };
})();
