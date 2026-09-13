/* Builds deck/index.html (linked assets) and ../AI-Fundamentals-Workshop.html (single file). */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const css    = readFileSync(join(here, "styles.css"), "utf8");
const js     = readFileSync(join(here, "deck.js"), "utf8");
const scenes = readFileSync(join(here, "scenes.js"), "utf8");
const gsap   = readFileSync(join(here, "vendor", "gsap.min.js"), "utf8");

// real measured data, baked in so the deck needs no network
const DATA = JSON.stringify({
  embeddings: JSON.parse(readFileSync(join(here, "data-embeddings.json"), "utf8")),
  retrieval:  JSON.parse(readFileSync(join(here, "data-retrieval.json"), "utf8")),
  trace:      JSON.parse(readFileSync(join(here, "data-trace.json"), "utf8")),
});
let slides = readFileSync(join(here, "slides.html"), "utf8");

/* Wrap each slide's body (everything after the subtitle, before the notes) in
   .sbody so it centers in the space under the anchored title block. */
slides = slides.replace(/<section class="slide(?! is-cover)([\s\S]*?)<\/section>/g, (whole) => {
  if (whole.includes('class="sbody"')) return whole;
  const m = whole.match(/^([\s\S]*?<p class="s-sub"[^>]*>[\s\S]*?<\/p>)([\s\S]*?)(\s*<aside class="notes">[\s\S]*)$/);
  if (!m) return whole;
  return m[1] + '\n  <div class="sbody">' + m[2] + '</div>' + m[3];
});

const chrome = `
<div id="chrome">
  <div id="brand"><span class="dot"></span>AI Fundamentals · Data Sense</div>
  <div id="partlbl"></div>
  <div id="counter"></div>
  <div id="progress"></div>
</div>
<aside class="panel" id="notes"></aside>
<div class="panel" id="overview"></div>
<div class="panel" id="help"><div class="hbox">
  <h2>Presenter controls</h2>
  <div class="hrow"><kbd>→ / Space</kbd><span>Next step, then next slide</span></div>
  <div class="hrow"><kbd>←</kbd><span>Previous step or slide</span></div>
  <div class="hrow"><kbd>↑ / ↓</kbd><span>Skip a whole slide</span></div>
  <div class="hrow"><kbd>N or S</kbd><span>Speaker notes panel</span></div>
  <div class="hrow"><kbd>O</kbd><span>Overview of all slides</span></div>
  <div class="hrow"><kbd>T</kbd><span>Show timer, then start / pause it</span></div>
  <div class="hrow"><kbd>R</kbd><span>Reset the timer</span></div>
  <div class="hrow"><kbd>F</kbd><span>Fullscreen</span></div>
  <div class="hrow"><kbd>1 2 3 …</kbd><span>Jump to slide number</span></div>
  <div class="hrow"><kbd>?</kbd><span>This help</span></div>
</div></div>
<div id="timer"></div>
<div id="hint">Press <strong>?</strong> for controls · <strong>N</strong> for speaker notes · <strong>F</strong> for fullscreen</div>`;

const page = (head, tail) => `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>AI Fundamentals in 3 Hours &middot; Data Sense</title>
${head}
</head><body>
<div id="stage">
${slides}
</div>
${chrome}
${tail}
</body></html>`;

const dataTag = `<script>window.DECK_DATA = ${DATA};</script>`;

writeFileSync(join(here, "index.html"),
  page(`<link rel="stylesheet" href="styles.css">`,
       `${dataTag}\n<script src="vendor/gsap.min.js"></script>\n<script src="scenes.js"></script>\n<script src="deck.js"></script>`));

writeFileSync(join(here, "..", "AI-Fundamentals-Workshop.html"),
  page(`<style>\n${css}\n</style>`,
       `${dataTag}\n<script>${gsap}</script>\n<script>\n${scenes}\n</script>\n<script>\n${js}\n</script>`));

const n = (slides.match(/<section class="slide/g) || []).length;
console.log(`built ${n} slides -> deck/index.html + AI-Fundamentals-Workshop.html`);
