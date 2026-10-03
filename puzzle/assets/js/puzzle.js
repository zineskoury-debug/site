/* =========================================================
   PUZZLE PIZZA — interactions & scroll animations (vanilla)
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;
  let vw = innerWidth, vh = innerHeight;

  /* ---------- split chars ---------- */
  $$("[data-split]").forEach((el) => {
    const text = el.textContent.trim();
    el.textContent = "";
    [...text].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "char";
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch === " " ? " " : ch;
      s.style.setProperty("--ci", i);
      el.append(s);
    });
  });

  /* ---------- manifesto words ---------- */
  const mText = $("[data-words]");
  const words = [];
  if (mText) {
    const frag = document.createDocumentFragment();
    [...mText.childNodes].forEach((node) => {
      const hl = node.nodeType === 1;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(" ");
        const w = document.createElement("span");
        w.className = hl ? "w hl" : "w";
        w.textContent = part;
        frag.append(w);
        words.push(w);
      });
    });
    mText.textContent = "";
    mText.append(frag);
  }

  /* ---------- hero puzzle pieces ---------- */
  const pieces = $$(".pz-piece").map((g, i) => {
    const dir = [[-1, -1], [1, -1], [1, 1], [-1, 1]][i];
    return { g, dx: dir[0], dy: dir[1], rot: [-24, 18, -14, 22][i], hover: 0, h: 0 };
  });
  let intro = 1; // 1 = scattered, 0 = assembled
  pieces.forEach((p) => {
    p.g.addEventListener("pointerenter", () => (p.hover = 1));
    p.g.addEventListener("pointerleave", () => (p.hover = 0));
    p.g.addEventListener("click", () => {
      p.g.animate([{ transform: p.g.style.transform }, { transform: p.g.style.transform + " rotate(20deg) scale(1.08)" }, { transform: p.g.style.transform }], { duration: 500, easing: "cubic-bezier(.34,1.6,.64,1)" });
    });
  });

  /* ---------- loader ---------- */
  const nEl = $(".loader__n");
  const count = new Promise((res) => {
    if (reduce) return res();
    const t0 = performance.now(), dur = 1900;
    const tick = (t) => {
      const p = clamp((t - t0) / dur);
      nEl.textContent = Math.round(easeOut(p) * 100);
      p < 1 ? requestAnimationFrame(tick) : setTimeout(res, 150);
    };
    requestAnimationFrame(tick);
  });
  const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  Promise.all([count, fonts]).then(() => {
    body.classList.remove("is-loading");
    body.classList.add("is-loaded");
    measure();
    $(".hero").classList.add("is-in");
    $$(".hero .reveal, .hero .zig").forEach((el) => el.classList.add("is-in"));
    // pieces fly together
    const t0 = performance.now();
    const assemble = (t) => {
      intro = 1 - easeOut(clamp((t - t0 - 250) / 1300));
      if (intro > 0) requestAnimationFrame(assemble);
    };
    reduce ? (intro = 0) : requestAnimationFrame(assemble);
    setTimeout(() => body.classList.add("intro-done"), reduce ? 0 : 2000);
    observe();
  });

  /* ---------- cursor ---------- */
  const cursor = $(".cursor");
  const cLabel = $(".cursor__label");
  let mx = vw / 2, my = vh / 2, cx = mx, cy = my, crot = 0, seen = false;
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; seen = true; }, { passive: true });
  if (fine && !reduce) {
    body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, .pz, .pz-piece");
      cursor.classList.toggle("is-label", !!lab);
      cursor.classList.toggle("is-hover", !!hov && !lab);
      if (lab) cLabel.textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.3}px, ${(e.clientY - r.top - r.height / 2) * 0.4}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- mobile menu ---------- */
  const toggle = $(".nav__toggle");
  const overlay = $(".overlay");
  const setMenu = (open) => {
    body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    overlay.setAttribute("aria-hidden", !open);
  };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", overlay).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- tape ---------- */
  const track = $(".tape__track");
  const orig = track.innerHTML;
  let guard = 0;
  while (track.scrollWidth < vw * 1.3 && guard++ < 10) track.innerHTML += orig;
  track.innerHTML += track.innerHTML;
  let tapeX = 0, tapeHalf = track.scrollWidth / 2;

  /* ---------- menu: filters + size ---------- */
  const items = $$(".pz");
  let busy = false;
  $$(".chip").forEach((chip) =>
    chip.addEventListener("click", () => {
      if (busy || chip.classList.contains("is-on")) return;
      busy = true;
      $$(".chip").forEach((c) => c.classList.toggle("is-on", c === chip));
      const f = chip.dataset.f;
      const show = (el) => f === "all" || el.dataset.tags.split(" ").includes(f);
      const out = items.filter((el) => !el.hidden && !show(el));
      out.forEach((el) => el.classList.add("is-out"));
      setTimeout(() => {
        out.forEach((el) => { el.hidden = true; el.classList.remove("is-out"); });
        const incoming = items.filter((el) => el.hidden && show(el));
        incoming.forEach((el) => { el.hidden = false; el.classList.add("is-out"); });
        void document.body.offsetHeight;
        incoming.forEach((el, i) => setTimeout(() => el.classList.remove("is-out"), i * 60));
        busy = false;
      }, reduce ? 0 : 380);
    })
  );
  const size = $(".size");
  $$(".size__btn").forEach((b) =>
    b.addEventListener("click", () => {
      const large = b.dataset.size === "large";
      size.classList.toggle("is-large", large);
      $$(".size__btn").forEach((x) => { x.classList.toggle("is-on", x === b); x.setAttribute("aria-pressed", x === b); });
      $$(".price").forEach((p, i) => {
        setTimeout(() => {
          p.classList.remove("flip");
          void p.offsetWidth;
          p.classList.add("flip");
          setTimeout(() => (p.textContent = large ? p.dataset.large : p.dataset.solo), reduce ? 0 : 250);
        }, reduce ? 0 : i * 25);
      });
    })
  );

  /* ---------- observers ---------- */
  function observe() {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$(".reveal, [data-split], .zig").forEach((el) => !el.closest(".hero") && io.observe(el));
    const pio = new IntersectionObserver((es) => es.filter((e) => e.isIntersecting).forEach((e, i) => {
      e.target.style.transitionDelay = `${i * 70}ms`;
      e.target.classList.add("is-in");
      setTimeout(() => (e.target.style.transitionDelay = ""), 1200);
      pio.unobserve(e.target);
    }), { threshold: 0.1 });
    items.forEach((el) => pio.observe(el));
  }

  /* ---------- measure ---------- */
  const nav = $(".nav");
  const progress = $(".nav__progress");
  const hero = $(".hero");
  const stage = $(".hero__stage");
  const floats = $$(".floatpiece").map((el) => ({ el, speed: +el.dataset.speed, base: getComputedStyle(el).transform }));
  const manifesto = $(".manifesto");
  const statement = $(".statement");
  const rows = $$(".statement__row").map((el) => ({ el, dir: +el.dataset.dir }));
  const flame = $(".flame");
  const fire = $(".fire");
  let docH = 0;
  function measure() {
    vw = innerWidth; vh = innerHeight;
    docH = document.documentElement.scrollHeight;
    tapeHalf = track.scrollWidth / 2;
  }
  addEventListener("resize", measure);
  addEventListener("load", measure);
  measure();

  /* ---------- loop ---------- */
  let lastY = scrollY, vel = 0, dir = 1, acc = 0;
  function frame(now) {
    const y = scrollY, dy = y - lastY;
    lastY = y;
    if (dy) dir = dy > 0 ? 1 : -1;
    vel = lerp(vel, dy, 0.12);

    progress.style.transform = `scaleX(${clamp(y / Math.max(1, docH - vh))})`;
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (y < 200 || acc < -40) nav.classList.remove("is-hidden");
    else if (acc > 60 && !body.classList.contains("menu-open")) nav.classList.add("is-hidden");

    if (body.classList.contains("has-cursor")) {
      const px = cx, py = cy;
      cx = lerp(cx, mx, 0.22); cy = lerp(cy, my, 0.22);
      crot = lerp(crot, (cx - px) * 3 + (cy - py), 0.15);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) rotate(${crot}deg)`;
      cursor.classList.toggle("is-hidden", !seen);
    }

    // hero pieces: intro scatter + scroll explode + hover lift
    const hr = hero.getBoundingClientRect();
    if (hr.bottom > 0) {
      const sp = reduce ? 0 : clamp(-hr.top / (hr.height * 0.9));
      const spread = intro * 260 + sp * 120;
      const ox = fine && !reduce ? (mx / vw - 0.5) : 0, oy = fine && !reduce ? (my / vh - 0.5) : 0;
      pieces.forEach((p) => {
        p.h = lerp(p.h, p.hover, 0.18);
        const tx = p.dx * (spread + p.h * 14) + ox * 10 * p.dx;
        const ty = p.dy * (spread + p.h * 14) + oy * 10 * p.dy;
        p.g.style.transform = `translate(${tx}px, ${ty}px) rotate(${p.rot * (intro * 3 + sp)}deg)`;
      });
      stage.style.transform = `rotate(${sp * 25 + Math.sin(now / 2400) * 2}deg)`;
      floats.forEach((f) => { if (f.el.closest(".hero")) f.el.style.translate = `0 ${y * f.speed}px`; });
    }

    // tape
    if (!reduce) {
      tapeX -= (1.4 + Math.min(Math.abs(vel) * 0.4, 16)) * dir;
      if (tapeX <= -tapeHalf) tapeX += tapeHalf;
      if (tapeX > 0) tapeX -= tapeHalf;
      track.style.transform = `translate3d(${tapeX}px,0,0) skewX(${clamp(-vel * 0.5, -14, 14)}deg)`;
    }

    // manifesto
    const mr = manifesto.getBoundingClientRect();
    if (mr.top < vh && mr.bottom > 0) {
      const t = mText.getBoundingClientRect();
      const p = clamp((vh * 0.85 - t.top) / (t.height + vh * 0.4));
      const n = p * words.length * 1.05;
      words.forEach((w, i) => { const on = i < n; if (on !== w._on) { w._on = on; w.classList.toggle("on", on); } });
      floats.forEach((f) => { if (f.el.closest(".manifesto")) f.el.style.transform = `translateY(${(mr.top - vh / 2) * f.speed}px) rotate(${(mr.top) * f.speed * 0.2}deg)`; });
    }

    // fire: flame grows with scroll
    const fr = fire.getBoundingClientRect();
    if (fr.top < vh && fr.bottom > 0) {
      const p = clamp((vh - fr.top) / (vh + fr.height * 0.4));
      flame.style.transform = `scale(${0.6 + easeOut(p) * 0.5})`;
    }

    // statement rows
    const sr = statement.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      const p = clamp((vh - sr.top) / (vh + sr.height));
      rows.forEach((r) => (r.el.style.transform = `translate3d(calc(-50% + ${(p - 0.5) * -50 * r.dir}vw),0,0)`));
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
