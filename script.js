// SUPERHERO site: hero demo, copy button, small scroll niceties.
document.documentElement.classList.add("js");

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const $ = (sel, root = document) => root.querySelector(sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---------- Hero demo: look, wink, speak ---------- */
const screen = $("#screen");
const laser = $("#laser");
const hud = $("#hud");
const face = $("#face");
const typed = $("#typed");
const search = $('[data-target="search"]');
const PHRASE = "webcam eye tracking";

function moveTo(name) {
  const el = $(`[data-target="${name}"]`, screen);
  const box = screen.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  // Aim slightly off-centre, like a real gaze point.
  const x = r.left - box.left + r.width * 0.6;
  const y = r.top - box.top + r.height * 0.55;
  laser.style.transform = `translate(${x}px, ${y}px)`;
  return el;
}

function setHud(text, mode = "") {
  hud.textContent = text;
  face.classList.toggle("is-wink", mode === "wink");
  face.classList.toggle("is-speak", mode === "speak");
}

async function wink(el) {
  setHud("Wink → click", "wink");
  laser.classList.remove("is-click");
  void laser.offsetWidth; // restart the ripple animation
  laser.classList.add("is-click");
  el.classList.add("is-pressed", "is-active");
  await sleep(160);
  el.classList.remove("is-pressed");
  face.classList.remove("is-wink");
}

async function speak(text) {
  setHud("Mouth open → speak", "speak");
  await sleep(500);
  for (const ch of text) {
    typed.textContent += ch;
    await sleep(55 + Math.random() * 50);
  }
  face.classList.remove("is-speak");
}

function reset() {
  typed.textContent = "";
  search.classList.remove("is-focused");
  screen.querySelectorAll(".is-active").forEach((el) => el.classList.remove("is-active"));
}

async function runDemo() {
  // Start on the first target without animating in from the corner.
  laser.style.transition = "none";
  moveTo("mail");
  void laser.offsetWidth;
  laser.style.transition = "";
  await sleep(600);
  for (;;) {
    if (document.hidden) { await sleep(500); continue; }
    reset();

    setHud("Look");
    moveTo("mail"); await sleep(1100);
    moveTo("files"); await sleep(1200);
    await wink($('[data-target="files"]')); await sleep(1100);

    setHud("Look");
    moveTo("search"); await sleep(1200);
    await wink(search);
    search.classList.remove("is-active");
    search.classList.add("is-focused");
    await sleep(700);
    await speak(PHRASE); await sleep(800);

    setHud("Look");
    moveTo("go"); await sleep(1200);
    await wink($('[data-target="go"]')); await sleep(2000);
  }
}

if (screen) {
  if (reduceMotion) {
    // Static frame: the moment after speaking.
    laser.style.transition = "none";
    moveTo("search");
    search.classList.add("is-focused");
    typed.textContent = PHRASE;
    setHud("Mouth open → speak");
    const place = () => moveTo("search");
    window.addEventListener("load", place);
    window.addEventListener("resize", place);
  } else {
    runDemo();
  }
}

/* ---------- Copy the install commands ---------- */
const copyBtn = $("#copy");
copyBtn?.addEventListener("click", async () => {
  const text = $("#cmds").textContent.replace(/^\$ /gm, "");
  try {
    await navigator.clipboard.writeText(text);
    copyBtn.textContent = "Copied";
  } catch {
    copyBtn.textContent = "Select and copy";
  }
  setTimeout(() => (copyBtn.textContent = "Copy"), 1600);
});

/* ---------- Nav border once scrolled ---------- */
const nav = $(".nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ---------- Section titles: the laser types them, once ---------- */
const TYPE_MS = 2000;

// Split every text node into per-character spans, in place, so markup inside
// the title (line spans, the red full stops) keeps its structure and styling.
function splitChars(node, chars) {
  for (const child of [...node.childNodes]) {
    if (child.nodeType === Node.ELEMENT_NODE) { splitChars(child, chars); continue; }
    if (child.nodeType !== Node.TEXT_NODE || !child.textContent.trim()) continue;
    const frag = document.createDocumentFragment();
    child.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) { frag.append(part); return; }
      const w = document.createElement("span");
      w.className = "type__word";
      for (const c of part) {
        const ch = document.createElement("span");
        ch.className = "type__ch";
        ch.textContent = c;
        w.append(ch);
        chars.push(ch);
      }
      frag.append(w);
    });
    child.replaceWith(frag);
  }
}

function prepareType(h) {
  const label = document.createElement("span");
  label.className = "sr-only";
  label.textContent = h.textContent.replace(/\s+/g, " ").trim();
  const visual = document.createElement("span");
  visual.className = "type__visual";
  visual.setAttribute("aria-hidden", "true");
  visual.append(...h.childNodes);
  const chars = [];
  splitChars(visual, chars);
  const dot = document.createElement("span");
  dot.className = "type__dot";
  h.replaceChildren(label, visual, dot);
  return { chars, dot };
}

function playType({ chars, dot }) {
  const start = performance.now();
  let shown = 0;
  dot.classList.add("is-on");
  const frame = (now) => {
    const target = Math.min(chars.length, Math.ceil(((now - start) / TYPE_MS) * chars.length));
    while (shown < target) chars[shown++].classList.add("is-on");
    const last = chars[Math.max(shown - 1, 0)];
    const x = last.offsetLeft + (shown ? last.offsetWidth : 0);
    const y = last.offsetTop + last.offsetHeight * 0.55 - dot.offsetHeight / 2;
    dot.style.transform = `translate(${x}px, ${y}px)`;
    if (shown < chars.length) requestAnimationFrame(frame);
    else setTimeout(() => dot.classList.remove("is-on"), 350);
  };
  requestAnimationFrame(frame);
}

if (!reduceMotion && "IntersectionObserver" in window) {
  const typers = new Map();
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      io.unobserve(e.target);
      playType(typers.get(e.target));
    }
  }, { rootMargin: "0px 0px -20% 0px" });
  document.querySelectorAll(".type").forEach((h) => { typers.set(h, prepareType(h)); io.observe(h); });
}

/* ---------- Reveal sections as they enter ---------- */
if (!reduceMotion && "IntersectionObserver" in window) {
  const targets = document.querySelectorAll(".section__sub, .step, .card, .stats, .legend, .terminal, .checklist, .tips, .asks li");
  const io = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    }
  }, { rootMargin: "0px 0px -8% 0px" });
  targets.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
}
