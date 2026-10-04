/* =========================================================
   MATRANEG — interactions & scroll animations (vanilla)
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
  const YEAR = new Date().getFullYear();
  let vw = innerWidth, vh = innerHeight, mx = vw * 0.2, my = vh * 0.4;
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; }, { passive: true });

  $$("[data-year]").forEach((el) => (el.textContent = YEAR));
  $$("[data-years]").forEach((el) => (el.dataset.count = YEAR - 2005));

  /* ---------- about: words light up while scrolling ---------- */
  const pText = $("[data-words]");
  const words = [];
  {
    const frag = document.createDocumentFragment();
    pText.textContent.split(/(\s+)/).forEach((part) => {
      if (!part) return;
      if (/^\s+$/.test(part)) return frag.append(" ");
      const w = document.createElement("span");
      w.className = "w"; w.textContent = part;
      frag.append(w); words.push(w);
    });
    pText.textContent = ""; pText.append(frag);
  }

  /* ---------- hero title: letters ---------- */
  const heroTitle = $(".hero__title"), heroChars = [];
  heroTitle.setAttribute("aria-label", heroTitle.textContent.replace(/\s+/g, " ").trim());
  function splitChars(el) {
    const frag = document.createDocumentFragment();
    [...el.childNodes].forEach((n) => {
      if (n.nodeType === 1) { splitChars(n); frag.append(n); return; }
      n.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return frag.append(" ");
        const w = document.createElement("span");
        w.className = "word";
        [...part].forEach((c) => {
          const ch = document.createElement("span");
          ch.className = "ch"; ch.textContent = c;
          ch.style.setProperty("--i", heroChars.length);
          heroChars.push(ch); w.append(ch);
        });
        frag.append(w);
      });
    });
    el.textContent = ""; el.append(frag);
  }
  $$(".line", heroTitle).forEach((l) => { l.setAttribute("aria-hidden", "true"); splitChars(l.firstElementChild); });

  /* ---------- loader ---------- */
  const beam = $(".loader__beam"), num = $(".loader__num");
  let fontsDone = false;
  Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]).then(() => (fontsDone = true));
  const t0 = performance.now(), DUR = reduce ? 0 : 1500;
  (function count(t) {
    let p = DUR ? clamp((t - t0) / DUR) : 1;
    if (!fontsDone) p = Math.min(p, 0.9);
    num.textContent = Math.round(ease(p) * 100);
    beam.style.setProperty("--p", ease(p));
    if (p < 1) return requestAnimationFrame(count);
    body.classList.add("is-done-load");
    setTimeout(() => {
      body.classList.remove("is-loading");
      body.classList.add("is-loaded");
      measure();
      $(".hero").classList.add("is-in");
      setTimeout(() => $(".hero").classList.add("is-done"), reduce ? 0 : 1700);
      if (!reduce) slideT = setTimeout(() => goSlide(1), SLIDE);
      $$(".hero .reveal").forEach((el) => el.classList.add("is-in"));
      observe();
      setTimeout(() => $(".loader") && $(".loader").remove(), 1400);
    }, reduce ? 0 : 350);
  })(t0);

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) $$(".magnetic").forEach((el) => {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.2}px, ${(e.clientY - r.top - r.height / 2) * 0.3}px)`;
    });
    el.addEventListener("pointerleave", () => (el.style.transform = ""));
  });

  /* ---------- ripples ---------- */
  document.addEventListener("pointerdown", (e) => {
    if (reduce) return;
    const host = e.target.closest(".btn, .chip span");
    if (!host) return;
    const r = host.getBoundingClientRect(), d = Math.max(r.width, r.height) * 2.2;
    const rp = document.createElement("span");
    rp.className = "ripple";
    rp.style.cssText = `width:${d}px;height:${d}px;left:${e.clientX - r.left - d / 2}px;top:${e.clientY - r.top - d / 2}px`;
    host.append(rp);
    rp.addEventListener("animationend", () => rp.remove());
  });

  /* ---------- expertise cards: dark fill grows from the pointer ---------- */
  $$(".x").forEach((x) => x.addEventListener("pointerenter", (e) => {
    const r = x.getBoundingClientRect();
    x.style.setProperty("--cx", `${e.clientX - r.left}px`);
    x.style.setProperty("--cy", `${e.clientY - r.top}px`);
  }));

  /* ---------- 3D tilt + glare: photos, cards ---------- */
  $$(".p__img, .safety__list li").forEach((el) => (el.dataset.tilt = ""));
  $$(".p__img, .safety__list li").forEach((el) => { const g = document.createElement("span"); g.className = "glare"; el.append(g); });
  if (fine && !reduce) $$("[data-tilt]").forEach((c) => {
    const wrap = c.closest(".reveal");
    c.addEventListener("pointermove", (e) => {
      if (wrap && !wrap.classList.contains("is-in")) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 7}deg) rotateY(${(x - 0.5) * 9}deg)`;
      c.style.setProperty("--gx", `${x * 100}%`);
      c.style.setProperty("--gy", `${y * 100}%`);
      c.classList.add("is-tilt");
    });
    c.addEventListener("pointerleave", () => { c.style.transform = ""; c.classList.remove("is-tilt"); });
  });

  /* ---------- mobile drawer ---------- */
  const toggle = $(".nav__toggle"), drawer = $(".drawer");
  const setMenu = (o) => { body.classList.toggle("menu-open", o); toggle.setAttribute("aria-expanded", o); toggle.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu"); drawer.setAttribute("aria-hidden", !o); };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- counters ---------- */
  function countUp(el) {
    if (el.counting) return;
    el.counting = true;
    const to = +el.dataset.count, from = +(el.dataset.from || 0), t1 = performance.now(), D = reduce ? 0 : 1600;
    (function tick(t) {
      const p = D ? clamp((t - t1) / D) : 1;
      el.textContent = Math.round(from + ease(p) * (to - from));
      if (p < 1) requestAnimationFrame(tick); else el.counting = false;
    })(t1);
  }

  /* ---------- observers ---------- */
  function observe() {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$("[data-count]", e.target).forEach(countUp);
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach((el) => !el.closest(".hero") && io.observe(el));
  }

  /* ---------- quote form → pre-filled email ---------- */
  const form = $(".quote"), note = $(".quote__note");
  $$("[data-type]").forEach((a) => a.addEventListener("click", () => {
    const r = $(`input[name=type][value="${a.dataset.type}"]`, form);
    if (r) r.checked = true;
  }));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    let bad = false;
    ["name", "phone"].forEach((n) => {
      const f = form.elements[n], wrap = f.closest(".field");
      const ko = !f.value.trim();
      wrap.classList.toggle("is-bad", ko);
      if (ko && !bad) { f.focus(); bad = true; }
    });
    if (bad) { note.textContent = "Merci d'indiquer votre nom et votre téléphone."; note.classList.remove("ok"); return; }
    const v = (n) => form.elements[n].value.trim();
    const type = form.elements.type.value;
    const bodyTxt = [
      "Bonjour MATRANEG,", "",
      "Je souhaite obtenir un devis :",
      `• Type de projet : ${type}`,
      `• Ville : ${v("city") || "—"}`,
      `• Délai : ${v("delay")}`, "",
      v("msg") || "(détails à préciser)", "",
      `${v("name")} · ${v("phone")}`,
    ].join("\n");
    location.href = `mailto:matraneg@gmail.com?subject=${encodeURIComponent(`Demande de devis · ${type}`)}&body=${encodeURIComponent(bodyTxt)}`;
    const send = $(".quote__send", form);
    send.classList.add("is-sent");
    burstAt(send, true);
    setTimeout(() => send.classList.remove("is-sent"), 2600);
    note.textContent = "Votre messagerie s'ouvre avec la demande prête à envoyer. Vous pouvez aussi appeler le 05 22 67 42 47.";
    note.classList.add("ok");
  });
  $$(".field input", form).forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("is-bad")));

  /* ---------- lightbox ---------- */
  const allShots = $$(".p"), lbx = $(".lightbox"), lImg = $(".lightbox__img"), lCap = $(".lightbox__cap");
  let shots = allShots, cur = -1, lastFocus = null;
  function show(i) {
    cur = (i + shots.length) % shots.length;
    const img = $("img", shots[cur]);
    lImg.src = img.src; lImg.alt = img.alt;
    lCap.textContent = $("figcaption b", shots[cur]).textContent;
    if (!reduce) lImg.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  function openL(i) {
    shots = allShots.filter((p) => !p.hidden);
    lastFocus = document.activeElement; show(i); lbx.classList.add("is-on");
    if (!reduce) requestAnimationFrame(() => {
      const a = $("img", shots[cur]).getBoundingClientRect(), b = lImg.getBoundingClientRect();
      lImg.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`, opacity: 1 }, { transform: "none", opacity: 1 }], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" });
    }); lbx.setAttribute("aria-hidden", "false"); body.classList.add("lbx-open"); $(".lightbox__close").focus({ preventScroll: true });
  }
  function closeL() { if (cur < 0) return; lbx.classList.remove("is-on"); lbx.setAttribute("aria-hidden", "true"); body.classList.remove("lbx-open"); cur = -1; if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  $$(".p__img").forEach((b) => b.addEventListener("click", () => openL(allShots.filter((p) => !p.hidden).indexOf(b.closest(".p")))));

  /* ---------- gallery filters (FLIP: photos glide to their new place) ---------- */
  const filters = $$(".filter"), fPill = $(".filters__pill");
  function placeFPill() {
    const f = $(".filter.is-on");
    fPill.style.width = `${f.offsetWidth}px`;
    fPill.style.height = `${f.offsetHeight}px`;
    fPill.style.transform = `translate(${f.offsetLeft}px, ${f.offsetTop}px)`;
  }
  filters.forEach((f) => f.addEventListener("click", () => {
    if (f.classList.contains("is-on")) return;
    filters.forEach((b) => { const on = b === f; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    placeFPill();
    const k = f.dataset.f;
    const before = new Map(allShots.filter((p) => !p.hidden).map((p) => [p, p.getBoundingClientRect()]));
    allShots.forEach((p) => (p.hidden = !(k === "all" || p.dataset.cat === k)));
    if (reduce) return;
    allShots.forEach((p, i) => {
      if (p.hidden) return;
      const a = before.get(p), b = p.getBoundingClientRect();
      if (a) p.animate([{ transform: `translate(${a.left - b.left}px, ${a.top - b.top}px)` }, { transform: "none" }], { duration: 700, easing: "cubic-bezier(.22,1,.36,1)" });
      else p.animate([{ opacity: 0, transform: "translateY(30px) scale(.94)" }, { opacity: 1, transform: "none" }], { duration: 650, delay: i * 40, easing: "cubic-bezier(.22,1,.36,1)", fill: "backwards" });
    });
  }));

  /* ---------- hero slideshow ---------- */
  const slides = $$(".hero__img img"), dots = $$(".hero__dots button"), tagTxt = $(".hero__tag-txt");
  const SLIDE = 6000;
  let slide = 0, slideT = null;
  document.documentElement.style.setProperty("--slide", `${SLIDE}ms`);
  function goSlide(n) {
    slide = (n + slides.length) % slides.length;
    slides.forEach((im, i) => im.classList.toggle("is-on", i === slide));
    dots.forEach((d, i) => { d.classList.remove("is-on"); if (i === slide) { void d.offsetWidth; d.classList.add("is-on"); } });
    tagTxt.classList.add("swap");
    setTimeout(() => { tagTxt.textContent = slides[slide].dataset.tag; tagTxt.classList.remove("swap"); }, 350);
    clearTimeout(slideT);
    if (!reduce) slideT = setTimeout(() => goSlide(slide + 1), SLIDE);
  }
  dots.forEach((d, i) => d.addEventListener("click", () => goSlide(i)));
  $(".lightbox__bg").addEventListener("click", closeL);
  $(".lightbox__close").addEventListener("click", closeL);
  $(".lightbox__prev").addEventListener("click", () => show(cur - 1));
  $(".lightbox__next").addEventListener("click", () => show(cur + 1));
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeL(); setMenu(false); }
    if (cur < 0) return;
    if (e.key === "ArrowRight") show(cur + 1);
    if (e.key === "ArrowLeft") show(cur - 1);
  });

  /* =========================================================
     INTERACTIONS — hover & click
     ========================================================= */

  /* ---------- cursor ---------- */
  const cursor = $(".cursor"), cLabel = $(".cursor__label"), ring = $(".cursor-ring");
  let cx = mx, cy = my, rx = mx, ry = my, seen = false;
  $$(".p__img").forEach((el) => (el.dataset.cursor = "Agrandir"));
  addEventListener("pointermove", () => (seen = true), { passive: true, once: true });
  if (fine && !reduce) {
    body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, label, input, select, textarea, .x, .counters li, .hero__facts li");
      cursor.classList.toggle("is-label", !!lab);
      cursor.classList.toggle("is-hover", !!hov && !lab);
      if (lab) cLabel.textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
  }
  addEventListener("pointerdown", () => cursor.classList.add("is-down"));
  addEventListener("pointerup", () => cursor.classList.remove("is-down"));

  /* ---------- click: survey ring + ticks, green/red chips on CTAs ---------- */
  const fx = $(".fx"), fctx = fx.getContext("2d");
  let parts = [], fdpr = 1, fxLive = false;
  function sizeFx() { fdpr = Math.min(2, devicePixelRatio || 1); fx.width = innerWidth * fdpr; fx.height = innerHeight * fdpr; }
  function burst(x, y, big) {
    if (reduce) return;
    parts.push({ t: "ring", x, y, life: 0, max: big ? 40 : 30, R: big ? 80 : 44 });
    parts.push({ t: "cross", x, y, life: 0, max: 26 });
    const n = big ? 22 : 8;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.random() * 0.3, chip = big && i % 2 === 0;
      const sp = chip ? 2.5 + Math.random() * 5 : 3 + Math.random() * 3;
      parts.push({ t: chip ? "chip" : "tick", x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (chip ? 2.5 : 0), life: 0, max: chip ? 55 + Math.random() * 25 : 22,
        c: chip ? (i % 6 === 0 ? "#e82c32" : i % 3 === 0 ? "#16181a" : "#049835") : "#049835", w: chip ? 4 + Math.random() * 4 : 1.6, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4 });
    }
  }
  function burstAt(el, big) { const r = el.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, big); }
  function drawFx() {
    fctx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
    fctx.clearRect(0, 0, innerWidth, innerHeight);
    parts = parts.filter((q) => ++q.life < q.max);
    for (const q of parts) {
      const k = q.life / q.max;
      fctx.globalAlpha = 1 - k;
      if (q.t === "ring") {
        fctx.strokeStyle = "#049835"; fctx.lineWidth = 1.6 * (1 - k) + 0.4;
        fctx.beginPath(); fctx.arc(q.x, q.y, 3 + q.R * ease(k), 0, Math.PI * 2); fctx.stroke();
        continue;
      }
      if (q.t === "cross") {
        const L = 10 + 18 * ease(k);
        fctx.strokeStyle = "#049835"; fctx.lineWidth = 1;
        fctx.beginPath(); fctx.moveTo(q.x - L, q.y); fctx.lineTo(q.x - 4, q.y); fctx.moveTo(q.x + 4, q.y); fctx.lineTo(q.x + L, q.y);
        fctx.moveTo(q.x, q.y - L); fctx.lineTo(q.x, q.y - 4); fctx.moveTo(q.x, q.y + 4); fctx.lineTo(q.x, q.y + L); fctx.stroke();
        continue;
      }
      q.x += q.vx; q.y += q.vy;
      if (q.t === "chip") {
        q.vy += 0.18; q.vx *= 0.97; q.rot += q.vr;
        fctx.save(); fctx.translate(q.x, q.y); fctx.rotate(q.rot); fctx.fillStyle = q.c; fctx.fillRect(-q.w / 2, -q.w / 2, q.w, q.w); fctx.restore();
      } else {
        q.vx *= 0.88; q.vy *= 0.88;
        fctx.strokeStyle = q.c; fctx.lineWidth = q.w; fctx.lineCap = "round";
        fctx.beginPath(); fctx.moveTo(q.x, q.y); fctx.lineTo(q.x - q.vx * 3, q.y - q.vy * 3); fctx.stroke();
      }
    }
    fctx.globalAlpha = 1;
  }
  document.addEventListener("click", (e) => {
    if (reduce || e.target.matches("input") || e.target.closest(".quote__send")) return;
    let x = e.clientX, y = e.clientY;
    if (!e.detail) { const r = e.target.getBoundingClientRect(); x = r.left + r.width / 2; y = r.top + r.height / 2; }
    burst(x, y, !!e.target.closest(".btn--green, .fab, .chip"));
  });

  /* ---------- hero title: wave on click ---------- */
  heroTitle.addEventListener("click", () => {
    if (reduce) return;
    heroTitle.classList.remove("wave"); void heroTitle.offsetWidth; heroTitle.classList.add("wave");
    setTimeout(() => heroTitle.classList.remove("wave"), 800 + heroChars.length * 20);
  });

  /* ---------- counters and facts recount on hover ---------- */
  $$(".counters li").forEach((li) => li.addEventListener(fine ? "pointerenter" : "click", () => li.classList.contains("is-in") && countUp($("b", li))));

  /* ---------- sectors: photo preview follows the pointer ---------- */
  const preview = $(".preview"), pImg = $("img", preview);
  let px = mx, py = my;
  if (fine) $$(".slist li").forEach((li) => {
    li.addEventListener("pointerenter", () => { if (!pImg.src.endsWith(li.dataset.img)) pImg.src = li.dataset.img; preview.classList.add("is-on"); });
    li.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
  });

  /* ---------- measure ---------- */
  const nav = $(".nav"), hero = $(".hero"), heroImgs = $$(".hero__img img"), heroCopy = $(".hero__copy");
  const band = $(".band__track"), bandP = $("p", band);
  const steps = $$(".step"), stepsEl = $(".steps"), stepsLine = $(".steps__line");
  const safety = $(".safety"), safetyBg = $(".safety__bg");
  const footWord = $(".foot__word"), fab = $(".fab");
  const links = $$(".nav__links a"), sections = links.map((a) => $(a.getAttribute("href")));
  let bandW = 1;
  const progress = $(".progress span");
  function measure() { vw = innerWidth; vh = innerHeight; bandW = bandP.offsetWidth || 1; sizeFx(); placeFPill(); }
  addEventListener("resize", measure);
  addEventListener("load", measure);
  measure();

  /* ---------- loop ---------- */
  let lastY = scrollY, acc = 0, vel = 0, bandX = 0, gx = mx, gy = my;
  function frame() {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = lerp(vel, dy, 0.12);
    const menu = body.classList.contains("menu-open");

    nav.classList.toggle("is-solid", y > 40);
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (y < 200 || acc < -40) nav.classList.remove("is-hidden");
    else if (acc > 80 && !menu) nav.classList.add("is-hidden");

    // current section in the nav
    let on = -1;
    sections.forEach((s, i) => { const r = s.getBoundingClientRect(); if (r.top < vh * 0.4 && r.bottom > vh * 0.4) on = i; });
    links.forEach((a, i) => a.classList.toggle("is-cur", i === on));

    // hero: green glow follows the pointer, photo drifts
    if (y < vh * 1.2 && !reduce) {
      gx = lerp(gx, mx, 0.08); gy = lerp(gy, my, 0.08);
      hero.style.setProperty("--mx", `${gx}px`);
      hero.style.setProperty("--my", `${gy}px`);
      const heroTr = `${fine ? (gx / vw - 0.5) * -14 : 0}px ${y * 0.18}px`;
      heroImgs.forEach((im) => (im.style.translate = heroTr));
      heroCopy.style.transform = `translate3d(0, ${y * 0.12}px, 0)`;
      heroCopy.style.opacity = 1 - clamp(y / vh) * 0.9;
    }

    // marquee follows scroll speed
    if (!reduce) {
      bandX -= 1 + Math.abs(vel) * 0.5;
      if (bandX <= -bandW) bandX += bandW;
      band.style.transform = `translate3d(${bandX}px,0,0)`;
    }

    // about words
    const tr = pText.getBoundingClientRect();
    if (tr.top < vh && tr.bottom > 0) {
      const p = clamp((vh * 0.85 - tr.top) / (tr.height + vh * 0.35));
      const n = p * words.length * 1.05;
      words.forEach((w, i) => { const o = i < n; if (o !== w._on) { w._on = o; w.classList.toggle("on", o); } });
    }

    // method: the line fills and the steps light up
    const sr = stepsEl.getBoundingClientRect();
    if (sr.top < vh && sr.bottom > 0) {
      const p = clamp((vh * 0.6 - sr.top) / sr.height);
      stepsLine.style.setProperty("--p", p);
      steps.forEach((s) => s.classList.toggle("on", s.getBoundingClientRect().top < vh * 0.6));
    }

    // safety: background parallax
    const fr = safety.getBoundingClientRect();
    if (fr.top < vh && fr.bottom > 0 && !reduce) safetyBg.style.transform = `translate3d(0, ${(fr.top + fr.height / 2 - vh / 2) * -0.15}px, 0)`;

    // footer: the outlined name fills with green
    const left = document.documentElement.scrollHeight - vh - y;
    if (footWord.getBoundingClientRect().top < vh) footWord.style.setProperty("--f", `${clamp(1 - left / (vh * 0.7)) * 100}%`);

    fab.classList.toggle("is-on", y > vh * 0.8 && !menu);

    // scroll progress
    progress.style.transform = `scaleX(${clamp(y / Math.max(1, document.documentElement.scrollHeight - vh))})`;

    // cursor
    if (body.classList.contains("has-cursor")) {
      cx = lerp(cx, mx, 0.25); cy = lerp(cy, my, 0.25);
      rx = lerp(rx, mx, 0.12); ry = lerp(ry, my, 0.12);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      ring.style.transform = `translate3d(${rx}px, ${ry}px, 0)`;
      if (!seen) cursor.classList.add("is-hidden");
    }

    // sector preview
    if (fine && !reduce) {
      px = lerp(px, mx, 0.14); py = lerp(py, my, 0.14);
      preview.style.transform = `translate3d(${px + 30}px, ${py - 110}px, 0) rotate(${clamp((mx - px) * 0.08, -10, 10)}deg) scale(${preview.classList.contains("is-on") ? 1 : 0.7})`;
    }

    // click particles
    if (parts.length) { drawFx(); fxLive = true; }
    else if (fxLive) { fctx.clearRect(0, 0, fx.width, fx.height); fxLive = false; }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
