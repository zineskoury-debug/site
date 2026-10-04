/* =========================================================
   CAPRISO — interactions. Vanilla JS, aucune librairie.
   ========================================================= */
(function () {
  "use strict";

  const A = window.CaprisoArt;
  const FL = A.FL;
  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const PRICE = { 1: 15, 2: 25, 3: 35 };

  const store = {
    get(k, d) { try { const v = localStorage.getItem("capriso:" + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem("capriso:" + k, JSON.stringify(v)); } catch (e) { /* stockage indisponible */ } }
  };

  /* ---------- illustrations statiques ---------- */
  $$("[data-ing]").forEach((el, i) => {
    el.innerHTML = A.ing(el.dataset.ing);
    el.style.setProperty("--bd", (4.2 + (i % 5) * .7) + "s");
    el.style.setProperty("--bdl", (-i * .9) + "s");
  });
  $$(".fcard").forEach((card) => {
    const f = FL[card.dataset.f];
    card.style.setProperty("--c", f.base);
    card.style.setProperty("--p", f.pastel);
    $(".fcard__art", card).innerHTML = A.cone([card.dataset.f], { label: "Cornet " + f.name });
  });
  $$("[data-cone]").forEach((el) => { el.innerHTML = A.cone([el.dataset.cone]); });

  /* ---------- texte découpé ---------- */
  function splitWords(el, chars) {
    let wi = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
            if (!part) return;
            if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w";
            w.style.setProperty("--wi", wi++);
            const inner = document.createElement("span");
            inner.className = "w__i";
            if (chars) {
              Array.from(part).forEach((c, ci) => {
                const ch = document.createElement("span");
                ch.className = "ch"; ch.textContent = c; ch.style.setProperty("--ci", ci);
                inner.appendChild(ch);
              });
            } else inner.textContent = part;
            w.appendChild(inner);
            frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }
  $$("[data-split]").forEach((el) => splitWords(el, !!el.closest(".hero__title")));

  // mots du manifeste : s'allument au scroll
  const mText = $(".manifesto__text");
  if (mText) {
    let wi = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
            if (!part) return;
            if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const s = document.createElement("span");
            s.className = "mw"; s.textContent = part; s.style.setProperty("--wi", wi++);
            frag.appendChild(s);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(mText);
    mText.style.setProperty("--n", wi);
  }

  // lettres « jelly » du footer
  $$("[data-jelly]").forEach((el) => {
    el.innerHTML = Array.from(el.textContent).map((c, i) => c === " " ? " " : `<span class="ch" style="--ci:${i}">${c}</span>`).join("");
    const colors = ["#FF8BA7", "#B8D27A", "#FFF3DC", "#6DB2E8", "#FF9A3D", "#B99BE3", "#FFCD2E"];
    $$(".ch", el).forEach((ch, i) => {
      ch.addEventListener("mouseenter", () => {
        ch.classList.remove("jelly"); void ch.offsetWidth; ch.classList.add("jelly");
        ch.style.color = colors[(i + Math.floor(Math.random() * colors.length)) % colors.length];
      });
      ch.addEventListener("animationend", () => ch.classList.remove("jelly"));
    });
  });

  // texte qui roule dans les boutons
  $$(".btn__t").forEach((t) => { t.innerHTML = `<span data-t="${t.textContent.replace(/"/g, "&quot;")}">${t.textContent}</span>`; });

  /* ---------- reveals ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -10% 0px", threshold: .12 });
  const watchReveals = () => $$(".reveal, [data-split], .rule").forEach((el) => { if (!el.closest(".hero")) io.observe(el); });

  /* ---------- fond de page par section ---------- */
  const meta = $('meta[name="theme-color"]');
  const bgIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const bg = e.target.dataset.bg;
      root.style.setProperty("--page", bg);
      if (meta) meta.setAttribute("content", bg);
      const id = e.target.id;
      $$(".nav__link").forEach((a) => a.classList.toggle("is-current", !!id && a.getAttribute("href") === "#" + id));
    });
  }, { rootMargin: "-48% 0px -48% 0px" });
  $$("[data-bg]").forEach((s) => bgIO.observe(s));
  const find = $(".find");
  if (find) new IntersectionObserver((es) => es.forEach((e) => find.classList.toggle("is-lit", e.isIntersecting)), { threshold: .3 }).observe(find);

  /* =========================================================
     HERO : switch de parfums
     ========================================================= */
  const HERO = ["fragola", "pistacchio", "cioccolato", "stracciatella", "mangue"];
  const card = $(".hero__card");
  const cupBox = $(".hero__cup");
  const word = $(".hero__word");
  const ingBox = $(".hero__ings");
  const minis = $(".hero__minis");
  const tag = $(".hero__tag");
  const bar = $(".hero__bar");
  const HDUR = 5500;
  const ING_POS = [[-2, 6, 84], [70, -2, 66], [88, 46, 92], [0, 62, 70], [44, 84, 58], [82, 84, 50]];
  let hIdx = 0, hTimer = 0, hPaused = false, hVisible = true, hBusy = false;

  function setWord(text) {
    word.style.setProperty("--len", text.length);
    word.innerHTML = Array.from(text).map((c, i) => `<span class="ch" style="--ci:${i}">${c === " " ? "&nbsp;" : c}</span>`).join("");
  }
  function heroIngs(key, first) {
    const f = FL[key];
    $$(".ing", ingBox).forEach((el) => {
      el.style.setProperty("--ox", (Math.random() * 160 - 80) + "px");
      el.style.setProperty("--oy", (-60 - Math.random() * 120) + "px");
      el.classList.remove("is-in"); el.classList.add("is-out");
      setTimeout(() => el.remove(), 650);
    });
    ING_POS.forEach(([x, y, s], i) => {
      const el = document.createElement("span");
      el.className = "ing is-in";
      el.dataset.depth = (i % 2 ? -1 : 1) * (14 + i * 6);
      el.style.cssText = `--x:${x}%;--y:${y}%;--s:${s}px;--r:${Math.round(Math.random() * 60 - 30)}deg;--bd:${4 + i * .6}s`;
      el.innerHTML = A.ing(f.ing[i % f.ing.length]);
      el.firstChild.style.animationDelay = first ? `${1.2 + i * .08}s, ${2.1 + i * .08}s` : `${.25 + i * .07}s, ${1.15 + i * .07}s`;
      ingBox.appendChild(el);
    });
  }
  function heroMinis() {
    minis.innerHTML = "";
    [1, 2].forEach((d) => {
      const k = HERO[(hIdx + d) % HERO.length];
      const b = document.createElement("button");
      b.className = "mini glass"; b.dataset.go = (hIdx + d) % HERO.length;
      b.setAttribute("aria-label", "Voir " + FL[k].name);
      b.innerHTML = A.cup([k]) + `<span class="mini__l">${FL[k].name}</span>`;
      minis.appendChild(b);
    });
  }
  function applyHero(first) {
    const k = HERO[hIdx], f = FL[k];
    root.style.setProperty("--hero", f.hero);
    root.style.setProperty("--accent", f.hero);
    $(".hero__idx").textContent = String(hIdx + 1).padStart(2, "0");
    $(".hero__name").textContent = f.name;
    $(".hero__fr").textContent = f.fr;
    tag.classList.remove("pop"); void tag.offsetWidth; tag.classList.add("pop");
    heroIngs(k, first);
    heroMinis();
  }
  function renderHeroCup(drop) {
    const k = HERO[hIdx];
    cupBox.innerHTML = A.cup([k, k, k], { label: "Pot rayé Capriso, trois boules " + FL[k].name });
    if (drop) $(".art", cupBox).classList.add("is-drop");
  }
  function goHero(i) {
    if (hBusy) return;
    hBusy = true;
    hIdx = (i + HERO.length) % HERO.length;
    const art = $(".art", cupBox);
    if (art && !reduce) art.classList.add("is-out");
    word.classList.add("is-out");
    applyHero(false);
    setTimeout(() => {
      renderHeroCup(!reduce);
      setWord(FL[HERO[hIdx]].name);
      word.classList.remove("is-out"); word.classList.add("is-pre");
      void word.offsetWidth; word.classList.remove("is-pre");
      hBusy = false;
    }, reduce ? 0 : 420);
    restartTimer();
  }
  function restartTimer() {
    clearTimeout(hTimer);
    bar.classList.remove("is-run"); void bar.offsetWidth;
    if (reduce || hPaused || !hVisible || document.hidden) return;
    bar.style.setProperty("--hdur", HDUR + "ms");
    bar.classList.add("is-run");
    hTimer = setTimeout(() => goHero(hIdx + 1), HDUR);
  }
  setWord(FL[HERO[0]].name);
  renderHeroCup(false);
  applyHero(true);
  $$("[data-hero]").forEach((b) => b.addEventListener("click", () => goHero(hIdx + +b.dataset.hero)));
  minis.addEventListener("click", (e) => { const b = e.target.closest(".mini"); if (b) goHero(+b.dataset.go); });
  const stage = $(".hero__stage");
  [stage, minis].forEach((el) => {
    el.addEventListener("mouseenter", () => { hPaused = true; restartTimer(); });
    el.addEventListener("mouseleave", () => { hPaused = false; restartTimer(); });
  });
  stage.addEventListener("click", () => goHero(hIdx + 1));
  new IntersectionObserver((es) => { hVisible = es[0].isIntersecting; restartTimer(); }, { threshold: .35 }).observe(card);
  document.addEventListener("visibilitychange", restartTimer);
  // swipe sur mobile
  let tx0 = null;
  card.addEventListener("touchstart", (e) => { tx0 = e.touches[0].clientX; }, { passive: true });
  card.addEventListener("touchend", (e) => {
    if (tx0 === null) return;
    const dx = e.changedTouches[0].clientX - tx0;
    if (Math.abs(dx) > 50) goHero(hIdx + (dx < 0 ? 1 : -1));
    tx0 = null;
  });

  /* =========================================================
     Moteur de scroll (une seule boucle rAF)
     ========================================================= */
  const nav = $(".nav");
  const prog = $(".progress__bar");
  const hero = $(".hero");
  const manifesto = $(".manifesto");
  const faq = $(".faq");
  const flavors = $(".flavors");
  const rail = $(".flavors__rail");
  const track = $(".flavors__track");
  const fcards = $$(".fcard");
  const meter = $(".flavors__meter");
  const bands = $$(".band__track");
  let vh = innerHeight, vw = innerWidth, docH = 1;
  let sy = scrollY, lastSy = sy, vel = 0;
  let mx = 0, my = 0, smx = 0, smy = 0;
  let pinned = false, dist = 0, flTop = 0;

  // chocolat qui coule
  const dripG = $(".choco__drips");
  const drips = [];
  if (dripG) {
    for (let i = 0; i < 18; i++) {
      const x = 30 + i * 80 + (i % 3) * 14;
      const w = 22 + ((i * 37) % 26);
      const len = 50 + ((i * 53) % 170);
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.innerHTML = `<rect x="${x - w / 2}" y="20" width="${w}" height="40" /><circle cx="${x}" cy="60" r="${w / 2 + 3}"/>`;
      dripG.appendChild(g);
      drips.push({ rect: g.firstChild, circ: g.lastChild, len, w });
    }
  }

  // floaters (parallaxe)
  const floaters = $$(".floaters .ing").map((el) => ({ el, speed: parseFloat(el.dataset.speed) || 0, sec: el.closest("section"), top: 0, h: 0 }));

  // bandeaux : contenu doublé pour boucler
  const bandState = bands.map((t) => {
    t.innerHTML += t.innerHTML + t.innerHTML;
    return { t, x: 0, dir: +t.dataset.speedX || 1, w: 0 };
  });

  const offTop = (el) => el.getBoundingClientRect().top + scrollY;

  function measure() {
    vh = innerHeight; vw = innerWidth;
    pinned = !reduce && vw > 900 && fine;
    flavors.classList.toggle("is-pinned", pinned);
    if (pinned) {
      flavors.style.height = "";
      dist = Math.max(0, track.scrollWidth - vw);
      flavors.style.height = (vh + dist) + "px";
    } else {
      flavors.style.height = "";
      track.style.removeProperty("--tx");
      rail.style.removeProperty("--tx");
      dist = 0;
    }
    rail.style.setProperty("--tw", track.scrollWidth + "px");
    flTop = offTop(flavors);
    floaters.forEach((f) => { f.top = offTop(f.sec); f.h = f.sec.offsetHeight; });
    bandState.forEach((b) => { b.w = b.t.scrollWidth / 3; });
    docH = document.documentElement.scrollHeight - vh;
  }

  const secP = (el) => {
    const r = el.getBoundingClientRect();
    return clamp((vh - r.top) / (r.height + vh), 0, 1);
  };

  function frame() {
    sy = scrollY;
    vel = lerp(vel, sy - lastSy, .2);
    lastSy = sy;
    smx = lerp(smx, mx, .08); smy = lerp(smy, my, .08);

    // barre de progression + nav
    prog.style.setProperty("--sp", docH > 0 ? sy / docH : 0);
    if (!body.classList.contains("menu-open")) {
      if (sy > vh * .6 && vel > 2) nav.classList.add("is-hidden");
      else if (vel < -2 || sy < vh * .6) nav.classList.remove("is-hidden");
    }

    // hero : sortie au scroll + parallaxe souris
    const hp = clamp(sy / (vh * .9), 0, 1);
    if (hp < 1) {
      card.style.setProperty("--hp", hp.toFixed(4));
      card.style.setProperty("--mxn", smx.toFixed(3));
      card.style.setProperty("--myn", smy.toFixed(3));
      $$(".ing", ingBox).forEach((el) => {
        const d = +el.dataset.depth || 0;
        el.style.setProperty("--mx", (smx * d).toFixed(1) + "px");
        el.style.setProperty("--py", (smy * d - hp * d * 4).toFixed(1) + "px");
      });
    }

    // bandeaux : vitesse liée au scroll
    bandState.forEach((b) => {
      b.x -= (1.1 + Math.abs(vel) * .35) * b.dir * (reduce ? 0 : 1);
      if (b.w) { if (b.x <= -b.w) b.x += b.w; if (b.x > 0) b.x -= b.w; }
      b.t.style.transform = `translate3d(${b.x.toFixed(1)}px,0,0) skewX(${clamp(-vel * .4, -12, 12).toFixed(2)}deg)`;
    });

    // manifeste : chocolat + mots
    if (manifesto) {
      const p = secP(manifesto);
      const mp = clamp((p - .18) / .5, 0, 1);
      mText.style.setProperty("--mp", mp.toFixed(3));
      const dp = clamp(p * 1.8, 0, 1);
      drips.forEach((d) => {
        const h = 20 + d.len * dp;
        d.rect.setAttribute("height", h.toFixed(1));
        d.circ.setAttribute("cy", (20 + h).toFixed(1));
      });
    }

    // floaters : parallaxe par section
    floaters.forEach((f) => {
      const c = f.top + f.h / 2 - (sy + vh / 2);
      if (Math.abs(c) > vh * 1.6) return;
      f.el.style.setProperty("--py", (c * f.speed * -.35).toFixed(1) + "px");
      f.el.style.setProperty("--pr", (c * f.speed * .04).toFixed(1) + "deg");
    });

    // parfums : scroll horizontal épinglé + arc des cartes
    if (pinned) {
      const fp = clamp((sy - flTop) / (dist || 1), 0, 1);
      flavors.style.setProperty("--fp", fp.toFixed(4));
      const tx = -fp * dist;
      track.style.setProperty("--tx", tx.toFixed(1) + "px");
      rail.style.setProperty("--tx", tx.toFixed(1) + "px");
      const r0 = flavors.getBoundingClientRect();
      if (r0.top < vh && r0.bottom > 0) {
        fcards.forEach((c) => {
          const r = c.getBoundingClientRect();
          const o = (r.left + r.width / 2 - vw / 2) / vw;
          c.style.setProperty("--cy", (o * o * 120).toFixed(1) + "px");
          c.style.setProperty("--cr", (o * 9).toFixed(2) + "deg");
        });
      }
    } else if (rail) {
      const max = rail.scrollWidth - rail.clientWidth;
      meter.style.setProperty("--fp", max > 0 ? (rail.scrollLeft / max).toFixed(3) : 0);
    }

    // FAQ : la ligne se dessine
    if (faq) faq.style.setProperty("--p", secP(faq).toFixed(3));

    requestAnimationFrame(frame);
  }
  if (meter && !pinned) meter.style.setProperty("--fp", 0);
  $(".flavors__meter i") && (flavors.style.setProperty("--fp", 0));
  // la jauge mobile lit la variable posée sur .flavors__meter
  if (meter) meter.querySelector("i").style.transform = "scaleX(var(--fp, 0))";

  addEventListener("pointermove", (e) => {
    mx = e.clientX / vw * 2 - 1;
    my = e.clientY / vh * 2 - 1;
  }, { passive: true });
  let rT;
  addEventListener("resize", () => { clearTimeout(rT); rT = setTimeout(measure, 120); });

  /* ---------- curseur ---------- */
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    const cur = $(".cursor"), dot = $(".cursor__dot"), lab = $(".cursor__label");
    let cx = -100, cy = -100, tx = -100, ty = -100;
    addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
    (function loop() {
      cx = lerp(cx, tx, .2); cy = lerp(cy, ty, .2);
      dot.style.transform = lab.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
      requestAnimationFrame(loop);
    })();
    document.addEventListener("pointerover", (e) => {
      const l = e.target.closest("[data-cursor]");
      const h = e.target.closest("a, button, input, .fcard, .tile");
      cur.classList.toggle("is-label", !!l);
      cur.classList.toggle("is-hover", !l && !!h);
      if (l) lab.textContent = l.dataset.cursor;
    });
  }

  /* ---------- boutons magnétiques ---------- */
  if (fine && !reduce) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * .3, y = (e.clientY - r.top - r.height / 2) * .4;
        el.style.transform = `translate(${x.toFixed(1)}px,${y.toFixed(1)}px)`;
      });
      el.addEventListener("pointerleave", () => {
        el.style.transition = "transform .6s cubic-bezier(.34,1.56,.64,1)";
        el.style.transform = "";
        setTimeout(() => { el.style.transition = ""; }, 600);
      });
    });

    // tuiles : inclinaison 3D + reflet
    $$("[data-tilt]").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", ((px - .5) * 16).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((.5 - py) * 16).toFixed(2) + "deg");
        el.style.setProperty("--gx", (px * 100).toFixed(1) + "%");
        el.style.setProperty("--gy", (py * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", () => { el.style.setProperty("--rx", "0deg"); el.style.setProperty("--ry", "0deg"); });
    });
  }

  /* ---------- sprinkles au clic ---------- */
  const SPR = ["#FF8BA7", "#86BA48", "#FFCD2E", "#6DB2E8", "#A3203A", "#FF9A3D", "#FFFFFF", "#B99BE3"];
  function sprinkles(x, y, count) {
    if (reduce) return;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "sprinkle";
      s.style.background = SPR[i % SPR.length];
      body.appendChild(s);
      const a = Math.random() * Math.PI * 2, v = 60 + Math.random() * 110;
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 40, rot = Math.random() * 720 - 360;
      s.animate([
        { transform: `translate(${x}px,${y}px) rotate(0deg) scale(1)`, opacity: 1 },
        { transform: `translate(${x + dx}px,${y + dy}px) rotate(${rot / 2}deg) scale(1)`, opacity: 1, offset: .55 },
        { transform: `translate(${x + dx * 1.2}px,${y + dy + 120}px) rotate(${rot}deg) scale(.6)`, opacity: 0 }
      ], { duration: 900 + Math.random() * 400, easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => s.remove();
    }
  }
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("input, label, .qa__a")) return;
    sprinkles(e.clientX, e.clientY, 12);
  });

  /* ---------- toast ---------- */
  const toastEl = $(".toast");
  let toastT;
  function toast(html) {
    toastEl.innerHTML = html;
    toastEl.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove("is-on"), 3800);
  }

  /* ---------- envol vers le panier ---------- */
  function fly(fromEl, svg, toEl, done) {
    if (reduce || !fromEl || !toEl) { done && done(); return; }
    const a = fromEl.getBoundingClientRect(), b = toEl.getBoundingClientRect();
    const s = Math.min(a.width, 120);
    const f = document.createElement("div");
    f.className = "flyer"; f.innerHTML = svg;
    f.style.width = s + "px"; f.style.height = s * 1.25 + "px";
    body.appendChild(f);
    const x0 = a.left + a.width / 2 - s / 2, y0 = a.top + a.height / 2 - s * .6;
    const x1 = b.left + b.width / 2 - s / 2, y1 = b.top + b.height / 2 - s * .6;
    const mxp = (x0 + x1) / 2, myp = Math.min(y0, y1) - 160;
    f.animate([
      { transform: `translate(${x0}px,${y0}px) scale(1) rotate(0deg)` },
      { transform: `translate(${mxp}px,${myp}px) scale(.8) rotate(-30deg)`, offset: .45 },
      { transform: `translate(${x1}px,${y1}px) scale(.18) rotate(-60deg)`, opacity: .6 }
    ], { duration: 900, easing: "cubic-bezier(.5,0,.3,1)" }).onfinish = () => { f.remove(); done && done(); };
  }

  /* =========================================================
     Commande (panier)
     ========================================================= */
  const orderEl = $(".order");
  const list = $(".order__list");
  const cartBtn = $(".cart-btn");
  const sendBtn = $(".order__send");
  const nameIn = $(".order__field input");
  let order = (store.get("order", []) || []).filter((it) => it && Array.isArray(it.fl) && it.fl.length >= 1 && it.fl.length <= 3 && it.fl.every((k) => FL[k]) && (it.base === "cone" || it.base === "cup"));

  const keyOf = (it) => it.base + ":" + it.fl.join(",");
  const itemPrice = (it) => PRICE[it.fl.length] * it.q;
  const itemTitle = (it) => (it.base === "cone" ? "Cornet" : "Pot") + " · " + it.fl.length + " parfum" + (it.fl.length > 1 ? "s" : "");

  function setOdo(el, value) {
    const str = String(value);
    if (reduce) { el.textContent = str; return; }
    let cols = $$(".odo__d", el);
    if (cols.length !== str.length) {
      el.innerHTML = Array.from(str).map(() => `<span class="odo__d" aria-hidden="true">${"0123456789".split("").map((d) => `<span>${d}</span>`).join("")}</span>`).join("") + '<span class="sr"></span>';
      cols = $$(".odo__d", el);
      void el.offsetWidth;
    }
    $(".sr", el).textContent = str;
    Array.from(str).forEach((d, i) => { cols[i].style.transform = `translateY(-${+d * 10}%)`; });
  }

  function renderOrder(newKey) {
    list.innerHTML = "";
    let total = 0, count = 0;
    order.forEach((it) => {
      total += itemPrice(it); count += it.q;
      const li = document.createElement("li");
      li.className = "oi";
      if (newKey && keyOf(it) !== newKey) li.style.animation = "none";
      li.innerHTML = `<div class="oi__art">${it.base === "cone" ? A.cone(it.fl) : A.cup(it.fl)}</div>` +
        `<div class="oi__t">${itemTitle(it)}<small>${it.fl.map((k) => FL[k].name).join(", ")}</small></div>` +
        `<div class="oi__r"><span class="oi__p">${itemPrice(it)} DH</span><div class="qty">` +
        `<button data-q="-1" aria-label="Retirer une glace"><svg aria-hidden="true"><use href="#i-minus"/></svg></button><span>${it.q}</span>` +
        `<button data-q="1" aria-label="Ajouter une glace"><svg aria-hidden="true"><use href="#i-plus"/></svg></button></div></div>`;
      li.dataset.key = keyOf(it);
      list.appendChild(li);
    });
    orderEl.classList.toggle("has-items", order.length > 0);
    $(".order__n").textContent = count + (count > 1 ? " glaces" : " glace");
    setOdo($(".order__total .odo"), total);
    cartBtn.classList.toggle("has-items", count > 0);
    $(".cart-btn__n").textContent = count;
    updateSend(total);
    store.set("order", order);
  }

  function updateSend(total) {
    if (total === undefined) total = order.reduce((s, it) => s + itemPrice(it), 0);
    if (!order.length) { sendBtn.setAttribute("aria-disabled", "true"); sendBtn.href = "https://wa.me/212618401509"; return; }
    sendBtn.removeAttribute("aria-disabled");
    const lines = order.map((it) => `• ${it.q} × ${itemTitle(it)} (${it.fl.map((k) => FL[k].name).join(", ")}) = ${itemPrice(it)} DH`);
    const name = nameIn.value.trim();
    const msg = `Ciao Capriso ! Je voudrais commander :\n${lines.join("\n")}\nTotal : ${total} DH` + (name ? `\nPrénom : ${name}` : "") + "\nÀ récupérer en boutique. Merci !";
    sendBtn.href = "https://wa.me/212618401509?text=" + encodeURIComponent(msg);
  }
  nameIn.addEventListener("input", () => updateSend());

  function addToOrder(it) {
    const k = keyOf(it);
    const ex = order.find((o) => keyOf(o) === k);
    if (ex) ex.q += 1; else order.push({ base: it.base, fl: it.fl.slice(), q: 1 });
    renderOrder(k);
    cartBtn.classList.remove("bump"); void cartBtn.offsetWidth; cartBtn.classList.add("bump");
  }

  list.addEventListener("click", (e) => {
    const b = e.target.closest("[data-q]");
    if (!b) return;
    const li = b.closest(".oi");
    const it = order.find((o) => keyOf(o) === li.dataset.key);
    if (!it) return;
    it.q += +b.dataset.q;
    if (it.q <= 0) {
      li.classList.add("is-leaving");
      order = order.filter((o) => o !== it);
      setTimeout(() => renderOrder("-"), reduce ? 0 : 340);
    } else renderOrder("-");
  });
  sendBtn.addEventListener("click", (e) => { if (!order.length) e.preventDefault(); });

  // « Cornet · 15 DH » depuis une carte parfum
  $$(".fcard__add").forEach((b) => {
    b.addEventListener("click", () => {
      const k = b.dataset.add;
      const art = $(".fcard__art", b.closest(".fcard"));
      fly(art, A.cone([k]), cartBtn, () => addToOrder({ base: "cone", fl: [k] }));
      toast(`Cornet ${FL[k].name} ajouté · 15 DH <a href="#commande">Voir</a>`);
    });
  });

  /* ---------- favoris ---------- */
  const favs = new Set(store.get("favs", []));
  $$(".fcard__fav").forEach((b) => {
    const k = b.closest(".fcard").dataset.f;
    b.setAttribute("aria-pressed", favs.has(k) ? "true" : "false");
    b.addEventListener("click", () => {
      const on = !favs.has(k);
      on ? favs.add(k) : favs.delete(k);
      b.setAttribute("aria-pressed", on ? "true" : "false");
      store.set("favs", Array.from(favs));
      if (on && !reduce) {
        const r = b.getBoundingClientRect();
        for (let i = 0; i < 7; i++) {
          const h = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          h.setAttribute("class", "heart-p"); h.setAttribute("viewBox", "0 0 24 24");
          h.innerHTML = '<use href="#i-heart"/>';
          body.appendChild(h);
          const a = -Math.PI / 2 + (i - 3) * .45, d = 40 + Math.random() * 30;
          const x = r.left + r.width / 2 - 7, y = r.top + r.height / 2 - 7;
          h.animate([
            { transform: `translate(${x}px,${y}px) scale(.3)`, opacity: 1 },
            { transform: `translate(${x + Math.cos(a) * d}px,${y + Math.sin(a) * d}px) scale(1)`, opacity: 0 }
          ], { duration: 700, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => h.remove();
        }
      }
    });
  });

  /* =========================================================
     Composeur
     ========================================================= */
  const swBox = $(".swatches");
  const artBox = $(".builder__art");
  const priceOdo = $(".builder__price .odo");
  const countEl = $(".builder__count");
  const noteEl = $(".builder__note");
  const addBtn = $(".builder__add");
  const segBtns = $$(".seg__b");
  const ink = $(".seg__ink");
  const tiers = $$(".tiers li");
  let base = "cone";
  let sel = ["fragola"];

  Object.keys(FL).forEach((k) => {
    const b = document.createElement("button");
    b.className = "sw"; b.dataset.f = k;
    b.setAttribute("aria-pressed", "false");
    b.innerHTML = `<svg viewBox="-58 -86 116 100" aria-hidden="true">${A.scoop(k, 0, 6, 100)}</svg><span>${FL[k].name}</span><i class="sw__n"></i>`;
    swBox.appendChild(b);
  });

  function moveInk() {
    const on = segBtns.find((b) => b.classList.contains("is-on"));
    if (!on) return;
    ink.style.width = on.offsetWidth + "px";
    ink.style.transform = `translateX(${on.offsetLeft}px)`;
  }

  function renderBuilder(dropIndex, swap) {
    const n = sel.length;
    // 1 parfum : servi en cornet, comme sur la carte
    const cupBtn = segBtns.find((b) => b.dataset.base === "cup");
    if (n === 1 && base === "cup") { base = "cone"; noteEl.textContent = "1 parfum : servi en cornet, comme sur la carte."; swap = true; }
    else if (n !== 1) noteEl.textContent = "";
    cupBtn.disabled = n === 1;
    cupBtn.title = n === 1 ? "Le pot commence à 2 parfums" : "";
    segBtns.forEach((b) => { const on = b.dataset.base === base; b.classList.toggle("is-on", on); b.setAttribute("aria-pressed", on); });
    moveInk();

    const label = (base === "cone" ? "Cornet" : "Pot") + (n ? " : " + sel.map((k) => FL[k].name).join(", ") : " vide");
    artBox.innerHTML = n ? (base === "cone" ? A.cone(sel, { tall: true, label }) : A.cup(sel, { label })) : (base === "cone" ? A.cone([], { tall: true, label }) : A.cup([], { label }));
    if (!n) $$(".scoop", artBox).forEach((s) => s.style.opacity = ".15");
    if (dropIndex !== undefined && !reduce) { const s = $(".scoop.s" + (dropIndex + 1), artBox); if (s) s.classList.add("is-drop"); }
    if (swap && !reduce) { artBox.classList.remove("is-swap"); void artBox.offsetWidth; artBox.classList.add("is-swap"); }

    $$(".sw", swBox).forEach((b) => {
      const i = sel.indexOf(b.dataset.f);
      b.classList.toggle("is-on", i > -1);
      b.setAttribute("aria-pressed", i > -1 ? "true" : "false");
      $(".sw__n", b).textContent = i > -1 ? i + 1 : "";
    });
    countEl.textContent = n + " / 3";
    setOdo(priceOdo, n ? PRICE[n] : 0);
    tiers.forEach((t) => t.classList.toggle("is-on", +t.dataset.n === n));
    addBtn.disabled = !n;
  }

  swBox.addEventListener("click", (e) => {
    const b = e.target.closest(".sw");
    if (!b) return;
    const k = b.dataset.f;
    const i = sel.indexOf(k);
    if (i > -1) { sel.splice(i, 1); renderBuilder(); return; }
    if (sel.length >= 3) {
      countEl.classList.remove("shake"); void countEl.offsetWidth; countEl.classList.add("shake");
      toast("3 parfums maximum par glace. Retire-en un pour changer.");
      return;
    }
    sel.push(k);
    renderBuilder(sel.length - 1);
  });
  segBtns.forEach((b) => b.addEventListener("click", () => {
    if (b.disabled || b.dataset.base === base) return;
    base = b.dataset.base;
    renderBuilder(undefined, true);
  }));
  addBtn.addEventListener("click", () => {
    if (!sel.length) return;
    const it = { base, fl: sel.slice() };
    const svg = base === "cone" ? A.cone(sel) : A.cup(sel);
    const target = innerWidth > 1100 ? $(".order h3") : cartBtn;
    fly(artBox, svg, target, () => addToOrder(it));
    toast(`${itemTitle(it)} ajouté · ${PRICE[sel.length]} DH <a href="#commande">Voir</a>`);
  });
  addEventListener("resize", moveInk);

  /* ---------- accordéon FAQ ---------- */
  $$(".qa__q").forEach((q) => {
    q.addEventListener("click", () => {
      const item = q.closest(".qa");
      const open = !item.classList.contains("is-open");
      $$(".qa.is-open").forEach((o) => { if (o !== item) { o.classList.remove("is-open"); $(".qa__q", o).setAttribute("aria-expanded", "false"); } });
      item.classList.toggle("is-open", open);
      q.setAttribute("aria-expanded", open ? "true" : "false");
    });
  });

  /* ---------- menu mobile ---------- */
  const burger = $(".burger");
  const drawer = $("#drawer");
  function menu(open) {
    body.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    nav.classList.remove("is-hidden");
  }
  burger.addEventListener("click", () => menu(!body.classList.contains("menu-open")));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => menu(false)));
  addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("menu-open")) menu(false); });

  /* ---------- pause des animations SVG (mouvement réduit) ---------- */
  if (reduce) $$("svg").forEach((s) => s.pauseAnimations && s.pauseAnimations());

  /* =========================================================
     Loader puis départ
     ========================================================= */
  const loader = $(".loader");
  const num = $(".loader__num");
  const full = $(".loader__mark--full");
  let ready = false;
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  Promise.race([Promise.all([fontsReady, new Promise((r) => addEventListener("load", r, { once: true }))]), new Promise((r) => setTimeout(r, 4000))]).then(() => { ready = true; });

  function start() {
    renderOrder();
    renderBuilder();
    measure();
    watchReveals();
    $$(".hero [data-split], .hero .reveal").forEach((el) => el.classList.add("is-in"));
    restartTimer();
    requestAnimationFrame(frame);
    // les polices peuvent changer les largeurs : on remesure
    setTimeout(measure, 600);
    if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView(), 50); }
  }

  if (reduce) {
    loader.classList.add("is-gone");
    body.classList.remove("is-loading");
    start();
  } else {
    const t0 = performance.now();
    (function tick(now) {
      const t = Math.min(1, (now - t0) / 1400);
      const p = ready ? t : Math.min(t, .9);
      const v = Math.round((1 - Math.pow(1 - p, 3)) * 100);
      num.textContent = v;
      full.style.setProperty("--lp", v + "%");
      if (p < 1) return requestAnimationFrame(tick);
      setTimeout(() => {
        root.classList.add("loaded");
        loader.classList.add("loaded");
        body.classList.remove("is-loading");
        start();
        setTimeout(() => loader.classList.add("is-gone"), 1300);
      }, 180);
    })(t0);
  }
})();
