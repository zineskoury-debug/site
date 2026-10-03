/* =========================================================
   ANMA — interactions & scroll animations (vanilla)
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;
  let vw = innerWidth, vh = innerHeight;
  let mx = vw / 2, my = vh / 2, seen = false;
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; seen = true; }, { passive: true });

  /* ---------- words (philosophy) ---------- */
  const pText = $("[data-words]");
  const words = [];
  {
    const frag = document.createDocumentFragment();
    [...pText.childNodes].forEach((n) => {
      const hl = n.nodeType === 1;
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(" ");
        const w = document.createElement("span");
        w.className = hl ? "w hl" : "w";
        w.textContent = part;
        frag.append(w); words.push(w);
      });
    });
    pText.textContent = ""; pText.append(frag);
  }

  /* ---------- loader ---------- */
  const minTime = new Promise((r) => setTimeout(r, reduce ? 0 : 2100));
  const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  Promise.all([minTime, fonts]).then(() => {
    body.classList.remove("is-loading");
    body.classList.add("is-loaded");
    measure();
    setTimeout(() => {
      $(".hero").classList.add("is-in");
      $$(".hero .reveal").forEach((el) => el.classList.add("is-in"));
    }, reduce ? 0 : 500);
    setTimeout(() => $(".loader") && $(".loader").remove(), 2000);
    observe();
  });

  /* ---------- cursor + magnetic ---------- */
  const cursor = $(".cursor");
  const cLabel = $(".cursor__label");
  let cx = mx, cy = my;
  if (fine && !reduce) {
    body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, .ritual");
      cursor.classList.toggle("is-label", !!lab);
      cursor.classList.toggle("is-hover", !!hov && !lab);
      if (lab) cLabel.textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.25}px, ${(e.clientY - r.top - r.height / 2) * 0.35}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- mobile drawer ---------- */
  const toggle = $(".nav__toggle"), drawer = $(".drawer");
  const setMenu = (o) => { body.classList.toggle("menu-open", o); toggle.setAttribute("aria-expanded", o); drawer.setAttribute("aria-hidden", !o); };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- petals (plum blossom) ---------- */
  const canvas = $(".petals");
  const ctx = canvas.getContext("2d");
  const COLORS = ["#cda9a0", "#e7c3b8", "#a8322a", "#bc864a", "#f1d9cf"];
  let petals = [], dpr = 1;
  function sizeCanvas() {
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    const n = reduce ? 0 : Math.round(clamp(canvas.clientWidth / 40, 12, 34));
    petals = Array.from({ length: n }, () => newPetal(true));
  }
  function newPetal(anywhere) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    return {
      x: Math.random() * w, y: anywhere ? Math.random() * h : -20,
      s: 5 + Math.random() * 8, r: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.03, vy: 0.25 + Math.random() * 0.55,
      sway: Math.random() * Math.PI * 2, c: COLORS[(Math.random() * COLORS.length) | 0], vx: 0,
      a: 0.45 + Math.random() * 0.45,
    };
  }
  function drawPetals(t, heroTop) {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const lx = mx, ly = my - heroTop;
    for (const p of petals) {
      const dx = p.x - lx, dy = p.y - ly, d2 = dx * dx + dy * dy;
      if (seen && d2 < 14000) { const f = (14000 - d2) / 14000; p.vx += (dx / Math.sqrt(d2 + 1)) * f * 0.9; p.y += (dy > 0 ? 1 : -1) * f * 0.6; }
      p.vx *= 0.94;
      p.sway += 0.012;
      p.x += Math.sin(p.sway) * 0.5 + p.vx;
      p.y += p.vy;
      p.r += p.vr;
      if (p.y > h + 20 || p.x < -30 || p.x > w + 30) Object.assign(p, newPetal(false));
      ctx.save();
      ctx.translate(p.x, p.y); ctx.rotate(p.r);
      ctx.globalAlpha = p.a;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.moveTo(0, -p.s);
      ctx.bezierCurveTo(p.s * 0.9, -p.s * 0.6, p.s * 0.7, p.s * 0.7, 0, p.s);
      ctx.bezierCurveTo(-p.s * 0.7, p.s * 0.7, -p.s * 0.9, -p.s * 0.6, 0, -p.s);
      ctx.fill();
      ctx.restore();
    }
  }

  /* ---------- rituals preview ---------- */
  const preview = $(".preview"), pImg = $("img", preview);
  let px = mx, py = my;
  if (fine) $$(".ritual").forEach((r) => {
    r.addEventListener("pointerenter", () => { if (!pImg.src.endsWith(r.dataset.img)) pImg.src = r.dataset.img; preview.classList.add("is-on"); });
    r.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
  });

  /* ---------- five elements ---------- */
  const EL = JSON.parse($("#eldata").textContent);
  const info = $(".elinfo");
  const setEl = (i) => {
    const e = EL[i];
    $$(".el").forEach((b, j) => b.classList.toggle("is-on", j === i));
    info.style.setProperty("--el", e.col);
    $(".elinfo__zh", info).textContent = e.c;
    $(".elinfo__fr", info).textContent = e.fr;
    $(".elinfo__py", info).textContent = e.py;
    $(".elinfo__txt", info).textContent = e.t;
    $(".elinfo__rit b", info).textContent = e.r;
    info.style.borderColor = e.col;
    info.classList.remove("swap"); void info.offsetWidth; info.classList.add("swap");
  };
  $$(".el").forEach((b) => {
    b.addEventListener("click", () => setEl(+b.dataset.i));
    if (fine) b.addEventListener("pointerenter", () => setEl(+b.dataset.i));
  });
  setEl(0);

  /* ---------- observers ---------- */
  function observe() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach((el) => !el.closest(".hero") && io.observe(el));
    // the figures are fully clipped before they reveal, so watch their grid instead
    const gio = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      $$(".g", e.target).forEach((g, i) => setTimeout(() => g.classList.add("is-in"), reduce ? 0 : i * 140));
      gio.unobserve(e.target);
    }), { threshold: 0.15 });
    gio.observe($(".gallery__grid"));
  }

  /* ---------- measure ---------- */
  const nav = $(".nav");
  const hero = $(".hero"), moon = $(".moon"), heroCopy = $(".hero__copy");
  const glyphs = $$("[data-ink]");
  const journey = $(".journey"), track = $(".journey__track"), jBar = $(".journey__bar span");
  const stages = $$(".stage").map((el) => ({ el, svg: $("svg", el), c: 0 }));
  const wheel = $(".wheel"), wLines = $(".wheel__lines"), wNodes = $(".wheel__nodes");
  const gal = $$(".g[data-speed]").map((el) => ({ el, s: +el.dataset.speed }));
  const ctaBg = $(".cta__bg");
  let jDist = 0;
  function measure() {
    vw = innerWidth; vh = innerHeight;
    jDist = Math.max(0, track.scrollWidth - vw);
    journey.style.height = `${jDist + vh}px`;
    stages.forEach((s) => (s.c = s.el.offsetLeft + s.el.offsetWidth / 2));
    sizeCanvas();
  }
  addEventListener("resize", measure);
  addEventListener("load", measure);
  measure();

  /* ---------- loop ---------- */
  let lastY = scrollY, acc = 0, wr = 0;
  function frame(t) {
    const y = scrollY, dy = y - lastY; lastY = y;

    nav.classList.toggle("is-solid", y > vh * 0.75 && !body.classList.contains("menu-open"));
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (y < 200 || acc < -40) nav.classList.remove("is-hidden");
    else if (acc > 70 && !body.classList.contains("menu-open")) nav.classList.add("is-hidden");

    if (body.classList.contains("has-cursor")) {
      cx = lerp(cx, mx, 0.16); cy = lerp(cy, my, 0.16);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      cursor.classList.toggle("is-hidden", !seen);
    }

    // hero
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const p = clamp(-hr.top / hr.height);
      if (!reduce) {
        const ox = fine ? (mx / vw - 0.5) * 18 : 0, oy = fine ? (my / vh - 0.5) * 18 : 0;
        moon.style.transform = `translate3d(${ox}px, ${oy + y * 0.12}px, 0) scale(${1 + p * 0.12})`;
        heroCopy.style.transform = `translate3d(0, ${y * 0.22}px, 0)`;
        heroCopy.style.opacity = 1 - p * 1.2;
        drawPetals(t, hr.top);
      }
    }

    // ink fills the two characters
    glyphs.forEach((g) => {
      const r = g.getBoundingClientRect();
      const p = clamp((vh * 0.9 - r.top) / (vh * 0.6));
      g.style.setProperty("--ink-fill", `${ease(p) * 100}%`);
    });

    // philosophy words
    const tr = pText.getBoundingClientRect();
    if (tr.top < vh && tr.bottom > 0) {
      const p = clamp((vh * 0.85 - tr.top) / (tr.height + vh * 0.35));
      const n = p * words.length * 1.05;
      words.forEach((w, i) => { const on = i < n; if (on !== w._on) { w._on = on; w.classList.toggle("on", on); } });
    }

    // rituals preview
    if (fine) {
      px = lerp(px, mx, 0.12); py = lerp(py, my, 0.12);
      preview.style.transform = `translate3d(${px + 24}px, ${py - 110}px, 0) scale(${preview.classList.contains("is-on") ? 1 : 0.6}) rotate(${clamp((mx - px) * 0.1, -12, 12)}deg)`;
    }

    // journey (horizontal)
    const jr = journey.getBoundingClientRect();
    if (jr.top < vh && jr.bottom > 0) {
      const p = clamp(-jr.top / Math.max(1, jr.height - vh));
      const x = -p * jDist;
      track.style.transform = `translate3d(${x}px,0,0)`;
      jBar.style.transform = `scaleX(${p})`;
      stages.forEach((s) => {
        const d = clamp((s.c + x - vw / 2) / vw, -1, 1);
        s.svg.style.transform = `translateY(${Math.abs(d) * 30}px) scale(${1 - Math.abs(d) * 0.15})`;
      });
    }

    // wheel rotates gently with scroll; nodes stay upright
    const wrc = wheel.getBoundingClientRect();
    if (wrc.top < vh && wrc.bottom > 0 && !reduce) {
      const target = (wrc.top - vh / 2) * -0.12;
      wr = lerp(wr, target, 0.08);
      wLines.style.transform = `rotate(${wr}deg)`;
      wNodes.style.transform = `rotate(${wr}deg)`;
      wNodes.style.setProperty("--wr", `${wr}deg`);
    }

    // gallery parallax
    gal.forEach((g) => {
      const r = g.el.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0 && !reduce) g.el.style.translate = `0 ${(r.top + r.height / 2 - vh / 2) * g.s}px`;
    });

    // cta background drift
    const cr = ctaBg.parentElement.getBoundingClientRect();
    if (cr.top < vh && cr.bottom > 0 && !reduce) ctaBg.style.transform = `translate3d(0, ${(cr.top - vh / 2) * -0.15}px, 0) scale(1.05)`;

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
