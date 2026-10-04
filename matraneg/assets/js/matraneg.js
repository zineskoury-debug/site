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

  /* ---------- tilt ---------- */
  if (fine && !reduce) $$("[data-tilt]").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `perspective(1000px) rotateX(${(0.5 - y) * 6}deg) rotateY(${(x - 0.5) * 8}deg)`;
      c.style.setProperty("--gx", `${x * 100}%`);
      c.style.setProperty("--gy", `${y * 100}%`);
    });
    c.addEventListener("pointerleave", () => (c.style.transform = ""));
  });

  /* ---------- mobile drawer ---------- */
  const toggle = $(".nav__toggle"), drawer = $(".drawer");
  const setMenu = (o) => { body.classList.toggle("menu-open", o); toggle.setAttribute("aria-expanded", o); toggle.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu"); drawer.setAttribute("aria-hidden", !o); };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------- counters ---------- */
  function countUp(el) {
    const to = +el.dataset.count, from = +(el.dataset.from || 0), t1 = performance.now(), D = reduce ? 0 : 1600;
    (function tick(t) {
      const p = D ? clamp((t - t1) / D) : 1;
      el.textContent = Math.round(from + ease(p) * (to - from));
      if (p < 1) requestAnimationFrame(tick);
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
    note.textContent = "Votre messagerie s'ouvre avec la demande prête à envoyer. Vous pouvez aussi appeler le 05 22 67 42 47.";
    note.classList.add("ok");
  });
  $$(".field input", form).forEach((i) => i.addEventListener("input", () => i.closest(".field").classList.remove("is-bad")));

  /* ---------- lightbox ---------- */
  const shots = $$(".p"), lbx = $(".lightbox"), lImg = $(".lightbox__img"), lCap = $(".lightbox__cap");
  let cur = -1, lastFocus = null;
  function show(i) {
    cur = (i + shots.length) % shots.length;
    const img = $("img", shots[cur]);
    lImg.src = img.src; lImg.alt = img.alt;
    lCap.textContent = $("figcaption b", shots[cur]).textContent;
    if (!reduce) lImg.animate([{ opacity: 0, transform: "scale(.96)" }, { opacity: 1, transform: "none" }], { duration: 500, easing: "cubic-bezier(.22,1,.36,1)" });
  }
  function openL(i) { lastFocus = document.activeElement; show(i); lbx.classList.add("is-on"); lbx.setAttribute("aria-hidden", "false"); body.classList.add("lbx-open"); $(".lightbox__close").focus({ preventScroll: true }); }
  function closeL() { if (cur < 0) return; lbx.classList.remove("is-on"); lbx.setAttribute("aria-hidden", "true"); body.classList.remove("lbx-open"); cur = -1; if (lastFocus) lastFocus.focus({ preventScroll: true }); }
  $$(".p__img").forEach((b) => b.addEventListener("click", () => openL(+b.dataset.i)));
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

  /* ---------- measure ---------- */
  const nav = $(".nav"), hero = $(".hero"), heroImg = $(".hero__img img"), heroCopy = $(".hero__copy");
  const band = $(".band__track"), bandP = $("p", band);
  const steps = $$(".step"), stepsEl = $(".steps"), stepsLine = $(".steps__line");
  const safety = $(".safety"), safetyBg = $(".safety__bg");
  const footWord = $(".foot__word"), fab = $(".fab");
  const links = $$(".nav__links a"), sections = links.map((a) => $(a.getAttribute("href")));
  let bandW = 1;
  function measure() { vw = innerWidth; vh = innerHeight; bandW = bandP.offsetWidth || 1; }
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
      heroImg.style.translate = `${fine ? (gx / vw - 0.5) * -14 : 0}px ${y * 0.18}px`;
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
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
