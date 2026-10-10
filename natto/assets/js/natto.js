/* =========================================================
   NATTO — interactions & animations au scroll (vanilla, sans librairie)
   ========================================================= */
(() => {
  "use strict";
  window.__nattoOK = true;

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeIO = (t) => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;
  const NS = "http://www.w3.org/2000/svg";
  let vw = innerWidth, vh = innerHeight;
  let mx = vw / 2, my = vh / 2, mouseSeen = false;
  if (fine) body.classList.add("has-cursor");

  /* ---------- PRNG (graine fixe : les vagues restent identiques) ---------- */
  const rng = (seed) => () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  /* =========================================================
     1. VAGUES DE PLÂTRE RÉTROÉCLAIRÉES (SVG + filtres)
     ========================================================= */
  const fx = document.createElementNS(NS, "svg");
  fx.setAttribute("class", "sprite");
  fx.setAttribute("aria-hidden", "true");
  fx.innerHTML = `<defs>
    <filter id="rbGlow" x="-30%" y="-140%" width="160%" height="380%" color-interpolation-filters="sRGB">
      <feMorphology in="SourceAlpha" operator="dilate" radius="2" result="d"/>
      <feGaussianBlur in="d" stdDeviation="3.2" result="b1"/>
      <feGaussianBlur in="d" stdDeviation="22" result="b2"/>
      <feFlood flood-color="#ffe2b6" result="c"/>
      <feComposite in="c" in2="b1" operator="in" result="g1"/>
      <feComposite in="c" in2="b2" operator="in" result="g2"/>
      <feMerge><feMergeNode in="g2"/><feMergeNode in="g2"/><feMergeNode in="g1"/><feMergeNode in="g1"/></feMerge>
    </filter>
    ${[3, 17, 41].map((s, i) => `<filter id="rbPlaster${i}" x="-4%" y="-40%" width="108%" height="180%" color-interpolation-filters="sRGB">
      <feTurbulence type="fractalNoise" baseFrequency=".6" numOctaves="2" seed="${s}" result="fine"/>
      <feDisplacementMap in="SourceGraphic" in2="fine" scale="5" xChannelSelector="R" yChannelSelector="G" result="shape"/>
      <feTurbulence type="fractalNoise" baseFrequency=".014 .03" numOctaves="5" seed="${s + 5}" result="relief"/>
      <feDiffuseLighting in="relief" surfaceScale="7" diffuseConstant="1.16" lighting-color="#fff8ee" result="lit"><feDistantLight azimuth="245" elevation="50"/></feDiffuseLighting>
      <feComposite in="lit" in2="shape" operator="in"/>
    </filter>`).join("")}
  </defs>`;
  body.prepend(fx);

  // silhouette : épaisse au centre, pointue aux extrémités, crête irrégulière en haut
  function ribbonPath(w, h, seed, thick) {
    const R = rng(seed * 9973 + 11);
    const n = Math.max(16, Math.round(w / 20));
    const ph = [R() * 6.283, R() * 6.283, R() * 6.283, R() * 6.283];
    const cy = h / 2;
    const top = [], bot = [];
    let walk = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = t * w + (i && i < n ? (R() - .5) * (w / n) * .7 : 0);
      const c = cy + (Math.sin(t * 6.283 * .8 + ph[0]) * .55 + Math.sin(t * 6.283 * 2.1 + ph[1]) * .2) * h * .13;
      const env = Math.pow(Math.sin(Math.PI * t), .62) * (.8 + .2 * Math.sin(t * 6.283 * 1.4 + ph[2]));
      const e = env * h * thick * .5;
      walk = walk * .6 + (R() - .42) * .8;
      const peak = R() < .15 ? R() * .6 : 0;
      const up = e * (1 + .3 * walk + peak);
      const dn = e * (.72 + .2 * Math.sin(t * 6.283 * 3.3 + ph[3]) + (R() - .5) * .3);
      top.push([x, clamp(c - Math.max(.5, up), 2, h - 2)]);
      bot.push([x, clamp(c + Math.max(.5, dn), 2, h - 2)]);
    }
    const f = (p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`;
    let d = `M${f(top[0])}`;
    for (let i = 1; i < top.length; i++) {
      const a = top[i - 1], b = top[i];
      const span = Math.abs(b[0] - a[0]);
      const thin = Math.min(a[1] < cy ? cy - a[1] : 0, 999);
      const lift = (R() - .3) * span * .45 * clamp(thin / 10);
      d += `L${f([(a[0] + b[0]) / 2, clamp((a[1] + b[1]) / 2 - lift, 2, h - 2)])}L${f(b)}`;
    }
    for (let i = bot.length - 1; i >= 0; i--) d += `L${f(bot[i])}`;
    return d + "Z";
  }

  const ribbons = $$(".ribbon");
  function buildRibbon(el) {
    const w = Math.round(el.offsetWidth), h = Math.round(el.offsetHeight);
    if (!w || !h || Math.abs((el._w || 0) - w) < 40) return;
    el._w = w;
    const seed = +el.dataset.seed || 1;
    const d = ribbonPath(w, h, seed, +el.dataset.thick || .5);
    el.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path class="rb-glow" d="${d}" filter="url(#rbGlow)"/><path class="rb-body" d="${d}" fill="#fff" filter="url(#rbPlaster${seed % 3})"/></svg>`;
    el._glow = $(".rb-glow", el);
    el._body = $(".rb-body", el);
  }
  ribbons.forEach(buildRibbon);
  const lightUp = (el, delay = 0) => setTimeout(() => el.classList.add("is-lit"), delay);

  /* =========================================================
     2. DÉCOUPAGES DE TEXTE
     ========================================================= */
  $$("[data-lines]").forEach((el) => {
    el.innerHTML = el.innerHTML.split(/<br\s*\/?>/i).map((l, i) =>
      `<span class="line"><span class="line__in" style="--i:${i}">${l.trim()}</span></span>`).join("");
  });

  const words = [];
  const statement = $("[data-words]");
  if (statement) {
    const frag = document.createDocumentFragment();
    [...statement.childNodes].forEach((node) => {
      const isEm = node.nodeType === 1;
      const wrap = isEm ? document.createElement("em") : frag;
      node.textContent.split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return wrap.append(" ");
        const w = document.createElement("span");
        w.className = "w";
        w.textContent = part;
        wrap.append(w);
        words.push(w);
      });
      if (isEm) frag.append(wrap);
    });
    statement.textContent = "";
    statement.append(frag);
  }

  function roll(el) {
    const text = el.textContent.trim();
    if (!text || el.querySelector(".roll")) return;
    const row = (b) => `<span class="roll__row${b ? " roll__row--b" : ""}">${[...text].map((c, i) =>
      `<span class="ch" style="--i:${i}">${c === " " ? "&nbsp;" : esc(c)}</span>`).join("")}</span>`;
    el.innerHTML = `<span class="sr-only">${esc(text)}</span><span class="roll" aria-hidden="true">${row(0)}${row(1)}</span>`;
  }
  if (!reduce) $$("[data-roll]").forEach(roll);

  /* =========================================================
     3. LOADER
     ========================================================= */
  const loader = $(".loader");
  const heroRibbons = $$(".hero__ribbons .ribbon");
  function startHero() {
    body.classList.add("is-ready");
    $$(".hero [data-lines]").forEach((el) => el.classList.add("is-in"));
    heroRibbons.forEach((rb, k) => lightUp(rb, reduce ? 0 : 300 + k * 480));
  }
  if (loader) {
    const R = rng(4242);
    const pts = [];
    for (let i = 0, n = 28; i <= n; i++) {
      const x = (i / n) * 100;
      const y = 50 + Math.sin(i * .85) * 1.4 + (i && i < n ? (R() - .5) * 5 : (R() - .5) * 2);
      pts.push([+x.toFixed(2), +y.toFixed(2)]);
    }
    $(".loader__crack polyline").setAttribute("points", pts.map((p) => p.join(",")).join(" "));
    $(".loader__half--top").style.clipPath = `polygon(0 0, 100% 0, ${pts.slice().reverse().map(([x, y]) => `${x}% ${y}%`).join(", ")})`;
    $(".loader__half--bot").style.clipPath = `polygon(${pts.map(([x, y]) => `${x}% ${y}%`).join(", ")}, 100% 100%, 0 100%)`;

    const num = $(".loader__num");
    const t0 = performance.now();
    const minT = reduce ? 0 : 1900;
    let loaded = false, shown = 0, opened = false;
    const heroImg = $(".hero__frame img");
    Promise.race([
      Promise.all([
        document.fonts ? document.fonts.ready : Promise.resolve(),
        new Promise((r) => (heroImg.complete ? r() : (heroImg.addEventListener("load", r, { once: true }), heroImg.addEventListener("error", r, { once: true })))),
      ]),
      new Promise((r) => setTimeout(r, 4500)),
    ]).then(() => { loaded = true; });

    const open = () => {
      if (opened) return;
      opened = true;
      num.textContent = "100";
      loader.classList.add("is-crack");
      setTimeout(() => {
        loader.classList.add("is-open");
        body.classList.remove("is-loading");
        startHero();
      }, reduce ? 0 : 720);
      setTimeout(() => loader.classList.add("is-done"), reduce ? 0 : 2100);
    };
    const tick = (now) => {
      const el = now - t0;
      const goal = Math.min(minT ? el / minT : 1, loaded ? 1 : .9) * 100;
      shown += (goal - shown) * .14 + (goal > shown ? .4 : 0);
      shown = Math.min(shown, goal);
      num.textContent = Math.floor(shown);
      if (loaded && el >= minT && shown > 99.4) return open();
      requestAnimationFrame(tick);
    };
    reduce ? Promise.resolve().then(() => { loaded = true; open(); }) : requestAnimationFrame(tick);
  } else {
    body.classList.remove("is-loading");
    startHero();
  }

  /* =========================================================
     4. NAV, TIROIR, ANCRES
     ========================================================= */
  const nav = $(".nav");
  const burger = $(".nav__burger");
  const drawer = $("#drawer");
  const darkZones = $$(".hero, .sig, .aperture, .contact");
  const navLinks = $$(".nav__link");
  const spy = navLinks.map((a) => $(a.getAttribute("href"))).filter(Boolean);
  let lastY = scrollY;

  function setMenu(open) {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open);
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    drawer.setAttribute("aria-hidden", !open);
    if (open) { const rb = $(".ribbon", drawer); buildRibbon(rb); lightUp(rb, 350); }
    else $$(".ribbon", drawer).forEach((r) => r.classList.remove("is-lit"));
  }
  burger.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("menu-open")) setMenu(false); });

  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href");
    const target = id === "#top" ? document.documentElement : $(id);
    if (!target) return;
    e.preventDefault();
    if (body.classList.contains("menu-open")) setMenu(false);
    const y = id === "#top" ? 0 : target.getBoundingClientRect().top + scrollY;
    scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    history.replaceState(null, "", id === "#top" ? location.pathname : id);
  });

  function updateNav(y) {
    const probe = 30;
    const dark = darkZones.some((z) => { const r = z.getBoundingClientRect(); return r.top <= probe && r.bottom > probe; });
    nav.classList.toggle("is-dark", dark);
    nav.classList.toggle("is-light", !dark);
    nav.classList.toggle("is-solid", y > 30);
    const goingDown = y > lastY + 2, goingUp = y < lastY - 2;
    if (goingDown && y > vh * .9) nav.classList.add("is-hidden");
    else if (goingUp || y < vh * .5) nav.classList.remove("is-hidden");
    lastY = y;
    let active = null;
    spy.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * .45) active = navLinks[i]; });
    navLinks.forEach((a) => a.classList.toggle("is-active", a === active));
  }

  /* =========================================================
     5. CURSEUR
     ========================================================= */
  const cursor = $(".cursor");
  const cFollow = $(".cursor__f"), cDot = $(".cursor__d"), label = $(".cursor__label");
  let cx = mx, cy = my;
  addEventListener("pointermove", (e) => {
    mx = e.clientX; my = e.clientY;
    if (!mouseSeen) { mouseSeen = true; cx = mx; cy = my; }
  }, { passive: true });
  if (fine) {
    document.addEventListener("pointerover", (e) => {
      const media = e.target.closest("[data-cursor]");
      const link = e.target.closest("a, button, input, label, .tab, .chip, .mat");
      cursor.classList.toggle("is-media", !!media);
      cursor.classList.toggle("is-link", !media && !!link);
      if (media) label.textContent = media.dataset.cursor;
    });
    document.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
  }

  /* ---------- boutons magnétiques ---------- */
  if (fine && !reduce) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .28, y = (e.clientY - r.top - r.height / 2) * .38;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    // cartes signatures : inclinaison 3D
    $$(".dish").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
        el.style.transform = `perspective(900px) rotateY(${x * 7}deg) rotateX(${-y * 7}deg) translateY(-6px)`;
      });
      el.addEventListener("pointerleave", () => { el.style.transform = ""; });
    });
    // logo du hero : chaque lettre glisse à sa profondeur
    const heroLogo = $(".logo--hero");
    const parts = heroLogo ? [[".lg-n", 6], [".lg-a", 10], [".lg-t", 14], [".lg-o", 20], [".lg-bar", 26], [".lg-dot", 30], [".lg-tag", 4]].map(([s, k]) => [$(s, heroLogo), k]) : [];
    const hero = $(".hero");
    hero && hero.addEventListener("pointermove", (e) => {
      const x = e.clientX / vw - .5, y = e.clientY / vh - .5;
      parts.forEach(([p, k]) => p && (p.style.translate = `${(-x * k).toFixed(2)}px ${(-y * k * .6).toFixed(2)}px`));
    });
    hero && hero.addEventListener("pointerleave", () => parts.forEach(([p]) => p && (p.style.translate = "")));
  }

  /* =========================================================
     6. APPARITIONS AU SCROLL
     ========================================================= */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      const el = en.target;
      if (el.classList.contains("ribbon")) lightUp(el, 150 + Math.random() * 350);
      else el.classList.add("is-in");
      if (el.dataset.count) countUp(el);
      io.unobserve(el);
    });
  }, { threshold: .18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .reveal-img, .sec-head, [data-lines]:not(.hero [data-lines]), .logo--footer, [data-count]").forEach((el) => io.observe(el));
  $$(".ribbon--sig, .ribbon--c1, .ribbon--c2").forEach((el) => io.observe(el));

  function countUp(el) {
    const to = +el.dataset.count;
    if (reduce) { el.textContent = to; return; }
    const t0 = performance.now(), dur = 1700;
    const step = (now) => {
      const t = clamp((now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(2, -10 * t)));
      if (t < 1) requestAnimationFrame(step); else el.textContent = to;
    };
    requestAnimationFrame(step);
  }
  if (!reduce) $$("[data-count]").forEach((el) => { el.textContent = "0"; });

  /* =========================================================
     7. LA CARTE
     ========================================================= */
  const DATA = window.NATTO_CARTE || [];
  const tabsEl = $(".tabs"), ink = $(".tabs__ink"), listEl = $(".carte__list");
  const chipsEl = $(".carte__chips"), plate = $(".plate"), plateImg = $(".plate__img");
  const plateName = $(".plate__name"), plateNote = $(".plate__note");
  const search = $(".search input");
  let group = DATA[0] && DATA[0].id;
  let query = "";
  const rubIndex = {};
  DATA.forEach((g) => g.rubriques.forEach((r) => { rubIndex[r.id] = r; }));

  // recherche insensible aux accents (œ → oe), avec correspondance d'index pour surligner
  function fold(str) {
    let out = "";
    const map = [];
    [...str].forEach((c, i) => {
      let n = c.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
      if (n === "œ") n = "oe"; else if (n === "æ") n = "ae";
      for (let k = 0; k < n.length; k++) { out += n[k]; map.push(i); }
    });
    return { out, map };
  }
  const plain = (s) => fold(s).out;
  // correspondance en début de mot : « oeuf » trouve « œufs de saumon », pas « bœuf »
  const wordAt = (out, q) => {
    for (let at = out.indexOf(q); at > -1; at = out.indexOf(q, at + 1)) {
      if (at === 0 || !/[a-z0-9]/.test(out[at - 1])) return at;
    }
    return -1;
  };
  const has = (s, q) => wordAt(plain(s), q) > -1;
  function hl(text, q) {
    if (!q) return esc(text);
    const { out, map } = fold(text);
    const at = wordAt(out, q);
    if (at < 0) return esc(text);
    const chars = [...text];
    const s = map[at], e = map[at + q.length - 1] + 1;
    return esc(chars.slice(0, s).join("")) + "<mark>" + esc(chars.slice(s, e).join("")) + "</mark>" + esc(chars.slice(e).join(""));
  }
  const split = (p) => (p.length === 3 ? p : [p[0], "", p[1]]);
  const itemHTML = (p, q) => {
    const [nom, desc, prix] = split(p);
    return `<li class="item"><p class="item__name">${hl(nom, q)}</p>${desc ? `<p class="item__desc">${hl(desc, q)}</p>` : ""}<p class="item__price">${prix}<small>DH</small></p></li>`;
  };
  const rubHTML = (r, items, q, i) => `
    <section class="rub" id="rub-${r.id}" data-rub="${r.id}" style="--d:${Math.min(i, 6) * .07}s">
      <header class="rub__head">
        <h3 class="rub__title">${esc(r.nom)}</h3>
        ${r.img ? `<img class="rub__thumb" src="assets/img/carte/${r.img}.webp" alt="" loading="lazy">` : ""}
        <p class="rub__meta">${r.note ? `<span>${esc(r.note)}</span>` : ""}<span>${items.length} ${items.length > 1 ? "plats" : "plat"}</span></p>
      </header>
      <ul class="items">${items.map((p) => itemHTML(p, q)).join("")}</ul>
    </section>`;

  // onglets
  DATA.forEach((g, i) => {
    const b = document.createElement("button");
    const count = g.rubriques.reduce((a, r) => a + r.plats.length, 0);
    b.type = "button";
    b.className = "tab";
    b.id = `tab-${g.id}`;
    b.dataset.group = g.id;
    b.setAttribute("role", "tab");
    b.setAttribute("aria-controls", "carte-list");
    b.setAttribute("aria-selected", i === 0);
    b.tabIndex = i === 0 ? 0 : -1;
    b.innerHTML = `<span class="tab__jp" aria-hidden="true">${g.jp}</span><span>${esc(g.nom)}</span><sup class="tab__count">${count}</sup>`;
    tabsEl.insertBefore(b, ink);
  });
  const tabs = $$(".tab", tabsEl);
  listEl.id = "carte-list";
  listEl.setAttribute("role", "tabpanel");

  function moveInk() {
    const t = tabs.find((x) => x.dataset.group === group);
    if (!t) return;
    ink.style.width = `${t.offsetWidth - 22}px`;
    ink.style.transform = `translateX(${t.offsetLeft}px)`;
  }

  // assiette (photo de la rubrique)
  const imgCache = {};
  let plateCurrent = null;
  function setPlate(r) {
    if (!r || plateCurrent === r.id) return;
    plateCurrent = r.id;
    plateName.textContent = r.nom;
    plateNote.textContent = r.note || "";
    $$(".chip", chipsEl).forEach((c) => c.classList.toggle("is-active", c.dataset.rub === r.id));
    const old = $$("img.is-on", plateImg);
    old.forEach((im) => { im.classList.remove("is-on"); im.classList.add("is-off"); });
    plate.classList.toggle("is-empty", !r.img);
    if (!r.img) return;
    let im = imgCache[r.img];
    if (!im) {
      im = imgCache[r.img] = new Image();
      im.alt = "";
      im.decoding = "async";
      im.src = `assets/img/carte/${r.img}.webp`;
    }
    im.classList.remove("is-off");
    plateImg.append(im);
    requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add("is-on")));
    setTimeout(() => old.forEach((o) => { if (!o.classList.contains("is-on")) o.remove(); }), 900);
  }

  const rubObserver = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) setPlate(rubIndex[en.target.dataset.rub]); });
  }, { rootMargin: "-35% 0px -60% 0px" });

  function showList(html) {
    rubObserver.disconnect();
    listEl.innerHTML = html;
    const rubs = $$(".rub", listEl);
    rubs.forEach((r) => rubObserver.observe(r));
    requestAnimationFrame(() => requestAnimationFrame(() => rubs.forEach((r) => r.classList.add("is-shown"))));
    plateCurrent = null;
    return rubs;
  }

  function renderGroup(id, scroll) {
    group = id;
    const g = DATA.find((x) => x.id === id);
    if (!g) return;
    tabs.forEach((t) => {
      const on = t.dataset.group === id;
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
    });
    listEl.setAttribute("aria-labelledby", `tab-${id}`);
    tabsEl.classList.remove("is-search");
    moveInk();
    showList(g.rubriques.map((r, i) => rubHTML(r, r.plats, "", i)).join(""));
    chipsEl.innerHTML = g.rubriques.map((r) => `<button type="button" class="chip" data-rub="${r.id}">${esc(r.nom)}</button>`).join("");
    setPlate(g.rubriques[0]);
    g.rubriques.forEach((r) => { if (r.img && !imgCache[r.img]) { const im = imgCache[r.img] = new Image(); im.alt = ""; im.src = `assets/img/carte/${r.img}.webp`; } });
    if (scroll) {
      const top = tabsEl.getBoundingClientRect().top + scrollY - (parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--nav-h")) || 84) - 12;
      if (scrollY > top + 40) scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
    }
  }

  function renderSearch(q) {
    tabsEl.classList.add("is-search");
    tabs.forEach((t) => t.setAttribute("aria-selected", "false"));
    let total = 0;
    const blocks = [];
    DATA.forEach((g) => g.rubriques.forEach((r) => {
      const rubHit = has(r.nom, q);
      const items = rubHit ? r.plats : r.plats.filter((p) => { const [n, d] = split(p); return has(n, q) || has(d, q); });
      if (items.length) { total += items.length; blocks.push([r, items]); }
    }));
    chipsEl.innerHTML = blocks.slice(0, 14).map(([r]) => `<button type="button" class="chip" data-rub="${r.id}">${esc(r.nom)}</button>`).join("");
    if (!total) {
      showList(`<p class="carte__empty">Aucun plat ne correspond à « ${esc(search.value.trim())} ».<br>Essayez <button type="button" data-q="saumon">saumon</button>, <button type="button" data-q="crunchy">crunchy</button> ou <button type="button" data-q="matcha">matcha</button>.</p>`);
      plate.classList.add("is-empty");
      $$("img", plateImg).forEach((im) => im.classList.remove("is-on"));
      plateName.textContent = "—";
      plateNote.textContent = "";
      return;
    }
    showList(`<p class="carte__count">${total} ${total > 1 ? "plats" : "plat"} pour « ${esc(search.value.trim())} »</p>` + blocks.map(([r, items], i) => rubHTML(r, items, q, i)).join(""));
    setPlate(blocks[0][0]);
  }

  if (DATA.length) {
    renderGroup(group, false);
    tabsEl.addEventListener("click", (e) => {
      const t = e.target.closest(".tab");
      if (!t) return;
      if (search.value) search.value = "";
      query = "";
      renderGroup(t.dataset.group, true);
    });
    tabsEl.addEventListener("keydown", (e) => {
      if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
      const i = tabs.findIndex((t) => t.dataset.group === group);
      const n = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + (e.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
      e.preventDefault();
      search.value = "";
      renderGroup(tabs[n].dataset.group, false);
      tabs[n].focus();
    });
    chipsEl.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      const sec = c && $(`#rub-${c.dataset.rub}`);
      if (!sec) return;
      scrollTo({ top: sec.getBoundingClientRect().top + scrollY - 110, behavior: reduce ? "auto" : "smooth" });
    });
    listEl.addEventListener("click", (e) => {
      const b = e.target.closest("[data-q]");
      if (!b) return;
      search.value = b.dataset.q;
      search.dispatchEvent(new Event("input"));
    });
    let st;
    search.addEventListener("input", () => {
      clearTimeout(st);
      st = setTimeout(() => {
        const q = plain(search.value.trim());
        if (q === query) return;
        query = q;
        q.length < 2 ? renderGroup(group, false) : renderSearch(q);
      }, 140);
    });
    search.addEventListener("keydown", (e) => { if (e.key === "Escape") { search.value = ""; search.dispatchEvent(new Event("input")); search.blur(); } });
    addEventListener("keydown", (e) => {
      if (e.key !== "/" || /input|textarea/i.test(document.activeElement.tagName)) return;
      e.preventDefault();
      search.focus({ preventScroll: true });
      const top = search.getBoundingClientRect().top;
      if (top < 0 || top > vh) scrollTo({ top: top + scrollY - vh / 3, behavior: reduce ? "auto" : "smooth" });
    });
  }

  /* =========================================================
     8. LE LIEU : aperçu flottant des matières
     ========================================================= */
  const preview = $(".mat-preview"), previewIn = $(".mat-preview__in");
  let px = mx, py = my, pvx = 0, pOn = false, pSrc = "";
  if (fine && preview) {
    $$(".mat").forEach((li) => {
      li.addEventListener("pointerenter", () => {
        pOn = true;
        preview.classList.add("is-on");
        if (pSrc === li.dataset.img) return;
        pSrc = li.dataset.img;
        const old = $$("img", previewIn);
        const im = new Image();
        im.src = pSrc;
        im.alt = "";
        previewIn.append(im);
        requestAnimationFrame(() => requestAnimationFrame(() => im.classList.add("is-on")));
        setTimeout(() => old.forEach((o) => o.remove()), 850);
      });
    });
    $(".materials").addEventListener("pointerleave", () => { pOn = false; preview.classList.remove("is-on"); });
  }

  /* =========================================================
     9. MOTIF DU PIED DE PAGE (canvas) : les ō du fond du logo
     ========================================================= */
  const cv = $(".footer__pattern");
  const ctx = cv && cv.getContext("2d");
  let marks = [], fW = 0, fH = 0, fdpr = 1, footVisible = false, footStart = 0, fmx = -999, fmy = -999;
  function layoutPattern() {
    if (!cv) return;
    fdpr = Math.min(2, devicePixelRatio || 1);
    fW = cv.offsetWidth; fH = cv.offsetHeight;
    cv.width = Math.round(fW * fdpr); cv.height = Math.round(fH * fdpr);
    const gap = clamp(fW / 20, 44, 68);
    marks = [];
    const rows = Math.ceil(fH / gap) + 1, cols = Math.ceil(fW / gap) + 2;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      marks.push({ x: c * gap - (r % 2) * gap / 2, y: fH - gap * .45 - r * gap, r: gap * .2, row: r });
    }
  }
  function drawPattern(t) {
    ctx.setTransform(fdpr, 0, 0, fdpr, 0, 0);
    ctx.clearRect(0, 0, fW, fH);
    const since = t - footStart;
    for (const m of marks) {
      const fade = clamp((m.y / fH) * 1.25 - .15);
      if (fade <= 0) continue;
      const appear = reduce ? 1 : easeOut(clamp((since - m.x * .5 - m.row * 90) / 800));
      if (appear <= 0) continue;
      const d = Math.hypot(fmx - m.x, fmy - m.y);
      const k = clamp(1 - d / 150);
      const wave = reduce ? 0 : Math.sin(t / 700 - m.x / 140 - m.row * .6) * .06;
      const s = appear * (1 + wave + k * .4);
      const R = m.r * s;
      ctx.globalAlpha = fade * appear;
      ctx.lineWidth = R * .3;
      ctx.strokeStyle = k > .05 ? `rgb(${lerp(168, 42, k) | 0},${lerp(158, 22, k) | 0},${lerp(148, 26, k) | 0})` : "#a89e94";
      ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 6.2832); ctx.stroke();
      ctx.fillStyle = `rgba(200,40,60,${.32 + .68 * k})`;
      ctx.beginPath(); ctx.arc(m.x, m.y, R * .34, 0, 6.2832); ctx.fill();
      ctx.save();
      ctx.translate(m.x, m.y - R * 1.7);
      ctx.rotate(k * .6);
      ctx.fillStyle = `rgba(214,140,150,${.55 + .45 * k})`;
      ctx.fillRect(-R * .62, -R * .12, R * 1.24, R * .24);
      ctx.restore();
    }
    ctx.globalAlpha = 1;
  }
  if (cv) {
    layoutPattern();
    new IntersectionObserver(([en]) => {
      footVisible = en.isIntersecting;
      if (footVisible && !footStart) footStart = performance.now();
    }, { threshold: .05 }).observe(cv);
    $(".footer").addEventListener("pointermove", (e) => { const r = cv.getBoundingClientRect(); fmx = e.clientX - r.left; fmy = e.clientY - r.top; });
    $(".footer").addEventListener("pointerleave", () => { fmx = fmy = -999; });
  }

  /* =========================================================
     10. BOUCLE PRINCIPALE (scroll + souris)
     ========================================================= */
  const hero = $(".hero"), heroCopy = $(".hero__copy"), heroImg = $(".hero__frame img"), heroLight = $(".hero__light");
  const heroRibbonWrap = heroRibbons.map((el) => [el, +el.dataset.depth || .5]);
  const parallax = $$("[data-speed]").map((el) => [el, +el.dataset.speed]);
  const mqRows = $$(".marquee__row").map((row, i) => {
    const track = $(".marquee__track", row);
    row.append(track.cloneNode(true), track.cloneNode(true));
    return { row, track, x: i ? -track.offsetWidth : 0, dir: i ? 1 : -1, speed: i ? 34 : 46 };
  });
  const mqOs = $$(".mq-o");
  const sig = $(".sig"), sigTrack = $(".sig__track"), sigBar = $(".sig__bar"), sigCur = $(".sig__cur");
  const sigRibbon = $(".ribbon--sig");
  const dishes = $$(".dish:not(.dish--more)");
  const lieuStage = $(".lieu__stage"), lieuSticky = $(".lieu__sticky"), lieuSweep = $(".lieu__sweep");
  const lieuRibbons = $$(".ribbon--lieu, .ribbon--lieu2");
  const ap = $(".aperture"), apSticky = $(".aperture__sticky"), apWin = $(".aperture__win");
  const progress = $(".progress"), progressFill = $(".progress__fill");
  let sigMax = 0, sigOn = false, dishCentres = [];

  function layoutSig() {
    sigOn = !reduce && vw > 700;
    if (!sigOn) { sig.style.removeProperty("--sig-h"); sigTrack.style.transform = ""; return; }
    sigMax = Math.max(0, sigTrack.scrollWidth - vw);
    dishCentres = dishes.map((d) => d.offsetLeft + d.offsetWidth / 2);
    sig.style.setProperty("--sig-h", `${sigMax + vh}px`);
  }
  layoutSig();
  // mobile : la piste défile au doigt, le compteur suit
  const sigViewport = $(".sig__viewport");
  sigViewport.addEventListener("scroll", () => {
    if (sigOn) return;
    const max = sigViewport.scrollWidth - sigViewport.clientWidth;
    sigBar.style.setProperty("--p", clamp(sigViewport.scrollLeft / Math.max(1, max)).toFixed(4));
    let best = 0, bestD = 1e9;
    dishes.forEach((d, i) => {
      const r = d.getBoundingClientRect();
      const dd = Math.abs(r.left + r.width / 2 - vw / 2);
      if (dd < bestD) { bestD = dd; best = i; }
    });
    sigCur.textContent = String(best + 1).padStart(2, "0");
  }, { passive: true });

  const prog = (el) => {
    const r = el.getBoundingClientRect();
    return { p: clamp(-r.top / Math.max(1, r.height - vh)), vis: r.bottom > 0 && r.top < vh };
  };

  let last = performance.now(), sySmooth = scrollY, vel = 0;
  let lastWordCount = -1;
  function frame(now) {
    const dt = Math.min(64, now - last) / 1000;
    last = now;
    const y = scrollY;
    const dy = y - sySmooth;
    sySmooth = y;
    vel = lerp(vel, dy / Math.max(dt, .001), .1);

    updateNav(y);

    // curseur
    if (fine) {
      cx = lerp(cx, mx, .18); cy = lerp(cy, my, .18);
      cFollow.style.transform = `translate3d(${cx.toFixed(1)}px, ${cy.toFixed(1)}px, 0)`;
      cDot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }

    // hero
    const heroVis = y < hero.offsetHeight;
    if (heroVis && !reduce) {
      heroImg.style.setProperty("--py", `${(y * .14).toFixed(1)}px`);
      heroCopy.style.transform = `translate3d(0, ${(y * .1).toFixed(1)}px, 0)`;
      heroCopy.style.opacity = clamp(1 - y / (vh * .6)).toFixed(3);
      const ox = mouseSeen ? (mx / vw - .5) : 0, oy = mouseSeen ? (my / vh - .5) : 0;
      heroRibbonWrap.forEach(([el, k]) => {
        el.style.transform = `translate3d(${(-ox * 40 * k).toFixed(1)}px, ${(-oy * 26 * k + y * .22 * k).toFixed(1)}px, 0)`;
      });
      if (fine && heroLight) heroLight.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
    }

    // marquee : la vitesse suit le scroll, le sens aussi
    const boost = clamp(Math.abs(vel) / 1400, 0, 4);
    const sense = vel < -20 ? -1 : 1;
    mqRows.forEach((m) => {
      const w = m.track.offsetWidth;
      if (!w) return;
      m.x += m.dir * sense * (m.speed + m.speed * boost * 3) * dt * (reduce ? 0 : 1);
      if (m.x <= -w) m.x += w;
      if (m.x > 0) m.x -= w;
      m.row.style.transform = `translate3d(${m.x.toFixed(1)}px, 0, 0)`;
      if (m.dir < 0) mqOs.forEach((o) => o.style.setProperty("--spin", `${(Math.sin(m.x / 160) * 16).toFixed(1)}deg`));
    });

    // parallaxe douce
    parallax.forEach(([el, k]) => {
      const r = el.getBoundingClientRect();
      if (r.bottom < -200 || r.top > vh + 200) return;
      const off = (r.top + r.height / 2 - vh / 2) * k;
      el.style.transform = `translate3d(0, ${off.toFixed(1)}px, 0)`;
    });

    // manifeste : les mots s'allument
    if (statement && !reduce) {
      const r = statement.getBoundingClientRect();
      const p = clamp((vh * .82 - r.top) / (r.height + vh * .35));
      const count = Math.round(p * words.length);
      if (count !== lastWordCount) {
        words.forEach((w, i) => w.classList.toggle("on", i < count));
        lastWordCount = count;
      }
    }

    // signatures : scroll horizontal épinglé
    if (sigOn) {
      const { p, vis } = prog(sig);
      if (vis) {
        const x = -p * sigMax;
        sigTrack.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        sigBar.style.setProperty("--p", p.toFixed(4));
        if (sigRibbon) sigRibbon.style.transform = `translate3d(${(x * .25).toFixed(1)}px, 0, 0)`;
        let best = 0, bestD = 1e9;
        dishCentres.forEach((c, i) => {
          const dd = Math.abs(c + x - vw / 2);
          if (dd < bestD) { bestD = dd; best = i; }
        });
        sigCur.textContent = String(best + 1).padStart(2, "0");
      }
    }

    // le lieu : les lumières s'allument au fil du scroll
    if (lieuStage) {
      const { p, vis } = prog(lieuStage);
      if (vis) {
        const g = reduce ? 1 : easeIO(clamp((p - .02) / .5));
        lieuRibbons.forEach((rb, i) => {
          if (rb._glow) rb._glow.style.opacity = clamp(g * 1.15 - i * .15).toFixed(3);
          if (rb._body) rb._body.style.opacity = (.5 + .5 * g).toFixed(3);
          rb.style.transform = `translate3d(${((p - .5) * (i ? 9 : -7)).toFixed(2)}vw, 0, 0)`;
        });
        lieuSticky.style.setProperty("--g", g.toFixed(3));
        lieuSweep.style.transform = `translate3d(${lerp(-50, 110, p).toFixed(2)}vw, 0, 0)`;
      }
    }

    // le cercle du ō s'ouvre sur le mur végétal
    if (ap) {
      const { p, vis } = prog(ap);
      if (vis) {
        const o = reduce ? 1 : easeIO(clamp(p / .72));
        const rPct = lerp(5.5, 72, o);
        const w = apWin.offsetWidth, h = apWin.offsetHeight;
        const rPx = (rPct / 100) * Math.hypot(w, h) / Math.SQRT2;
        apSticky.style.setProperty("--r", `${rPct.toFixed(2)}%`);
        apSticky.style.setProperty("--s", lerp(1.32, 1, o).toFixed(3));
        apSticky.style.setProperty("--ring", ((rPx * 2) / 96).toFixed(3));
        apSticky.style.setProperty("--ring-o", clamp(1 - (o - .55) / .3).toFixed(3));
        apSticky.style.setProperty("--bar-y", `${(-rPx - 30).toFixed(1)}px`);
        apSticky.style.setProperty("--bar-o", clamp(1 - o * 1.8).toFixed(3));
        apSticky.style.setProperty("--dot", clamp(1 - o * 2.2).toFixed(3));
        apSticky.style.setProperty("--txt", clamp((p - .5) / .3).toFixed(3));
        apSticky.style.setProperty("--bgs", lerp(1.15, 1, p).toFixed(3));
        apSticky.style.setProperty("--shift", vw > 960 ? `${(easeIO(clamp((p - .5) / .32)) * vw * .17).toFixed(1)}px` : "0px");
      }
    }

    // aperçu des matières
    if (fine && preview && (pOn || preview.classList.contains("is-on"))) {
      const nx = lerp(px, mx, .14), ny = lerp(py, my, .14);
      pvx = lerp(pvx, nx - px, .2);
      px = nx; py = ny;
      preview.style.left = `${px}px`;
      preview.style.top = `${py}px`;
      previewIn.style.setProperty("--tilt", `${clamp(pvx * .6, -12, 12).toFixed(2)}deg`);
    }

    // progression (ō)
    const max = document.documentElement.scrollHeight - vh;
    progress.classList.toggle("is-on", y > vh * .9);
    progress.classList.toggle("is-end", y > max - vh * .35);
    progressFill.style.setProperty("--off", (1 - clamp(y / Math.max(1, max))).toFixed(4));

    if (footVisible && ctx) drawPattern(now);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  /* ---------- redimensionnement ---------- */
  let rt;
  addEventListener("resize", () => {
    clearTimeout(rt);
    rt = setTimeout(() => {
      vw = innerWidth; vh = innerHeight;
      ribbons.forEach(buildRibbon);
      $$(".ribbon.is-lit").forEach((el) => el.classList.add("is-steady"));
      layoutSig();
      layoutPattern();
      moveInk();
    }, 160);
  });
  if (document.fonts) document.fonts.ready.then(() => { layoutSig(); moveInk(); });
  addEventListener("load", () => { layoutSig(); moveInk(); });

  const year = $(".year");
  if (year) year.textContent = new Date().getFullYear();
})();
