/* =========================================================
   CAPRISO — interactions & scroll animations (vanilla)
   ========================================================= */
(() => {
  "use strict";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;
  let vw = innerWidth, vh = innerHeight, mx = vw / 2, my = vh / 2, seen = false;
  addEventListener("pointermove", (e) => { mx = e.clientX; my = e.clientY; seen = true; }, { passive: true });

  /* ---------- split hero title ---------- */
  $$("[data-split]").forEach((el, li) => {
    const t = el.textContent.trim();
    el.textContent = "";
    [...t].forEach((ch, i) => {
      const s = document.createElement("span");
      s.className = "char";
      s.setAttribute("aria-hidden", "true");
      s.textContent = ch === " " ? " " : ch;
      s.style.setProperty("--ci", i + li * 6);
      el.append(s);
    });
  });

  /* ---------- loader ---------- */
  const minTime = new Promise((r) => setTimeout(r, reduce ? 0 : 1700));
  const fonts = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  Promise.all([minTime, fonts]).then(() => {
    body.classList.remove("is-loading");
    body.classList.add("is-loaded");
    measure();
    setTimeout(() => {
      $(".hero").classList.add("is-in");
      $$(".hero .reveal").forEach((el) => el.classList.add("is-in"));
    }, reduce ? 0 : 300);
    setTimeout(() => body.classList.add("intro-done"), reduce ? 0 : 2000);
    setTimeout(() => $(".loader") && $(".loader").remove(), 1300);
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } }), { threshold: 0.15 });
    $$(".reveal").forEach((el) => !el.closest(".hero") && io.observe(el));
  });

  /* ---------- cursor + magnetic ---------- */
  const cursor = $(".cursor"), cLabel = $(".cursor__label");
  let cx = mx, cy = my;
  if (fine && !reduce) {
    body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, .ptable li");
      cursor.classList.toggle("is-label", !!lab);
      cursor.classList.toggle("is-hover", !!hov && !lab);
      if (lab) cLabel.textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.translate = `${(e.clientX - r.left - r.width / 2) * 0.25}px ${(e.clientY - r.top - r.height / 2) * 0.35}px`;
      });
      el.addEventListener("pointerleave", () => (el.style.translate = ""));
    });
  }

  /* ---------- sprinkle burst on click ---------- */
  const layer = $(".sprinkle-layer");
  const SPR = ["#e84a5f", "#fecd33", "#9fc46a", "#b08cf0", "#ff8a3d", "#a72438", "#9fd8cf"];
  function burst(x, y, n = 16) {
    if (reduce) return;
    for (let i = 0; i < n; i++) {
      const s = document.createElement("span");
      s.className = "sprinkle";
      s.style.background = SPR[i % SPR.length];
      s.style.left = x + "px"; s.style.top = y + "px";
      layer.append(s);
      const a = Math.random() * Math.PI * 2, d = 60 + Math.random() * 90;
      s.animate([
        { transform: `translate(-50%,-50%) rotate(${Math.random() * 360}deg)`, opacity: 1 },
        { transform: `translate(${Math.cos(a) * d}px, ${Math.sin(a) * d + 40}px) rotate(${Math.random() * 720}deg)`, opacity: 0 },
      ], { duration: 800 + Math.random() * 400, easing: "cubic-bezier(.2,.8,.3,1)" }).onfinish = () => s.remove();
    }
  }
  document.addEventListener("click", (e) => { if (e.target.closest(".pill, .sw, .fcard, .shape, .hf, .seg__b, .ptable li")) burst(e.clientX, e.clientY); });

  /* ---------- menu drawer ---------- */
  const toggle = $(".nav__toggle"), drawer = $(".drawer");
  const setMenu = (o) => { body.classList.toggle("menu-open", o); toggle.setAttribute("aria-expanded", o); drawer.setAttribute("aria-hidden", !o); };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- top bar marquee ---------- */
  const tb = $(".topbar__track");
  const tbHtml = tb.innerHTML;
  for (let g = 0; tb.scrollWidth < vw * 1.5 && g < 8; g++) tb.innerHTML += tbHtml;
  tb.innerHTML += tb.innerHTML;
  let tbX = 0;

  /* ---------- draggable flavour carousel (auto-drifts) ---------- */
  const car = $(".carousel"), ctrack = $(".carousel__track");
  ctrack.innerHTML += ctrack.innerHTML; // loop
  $$(".fcard", ctrack).slice(ctrack.children.length / 2).forEach((li) => li.setAttribute("aria-hidden", "true"));
  let cX = 0, cV = -0.6, dragging = false, startX = 0, startC = 0, lastPX = 0, moved = 0;
  car.addEventListener("pointerdown", (e) => { dragging = true; moved = 0; startX = lastPX = e.clientX; startC = cX; car.classList.add("is-drag"); car.setPointerCapture(e.pointerId); });
  car.addEventListener("pointermove", (e) => { if (!dragging) return; cX = startC + (e.clientX - startX); cV = e.clientX - lastPX; moved += Math.abs(e.clientX - lastPX); lastPX = e.clientX; });
  const endDrag = () => { if (!dragging) return; dragging = false; car.classList.remove("is-drag"); cV = clamp(cV, -20, 20); };
  car.addEventListener("pointerup", endDrag); car.addEventListener("pointercancel", endDrag);
  car.addEventListener("pointerenter", () => (car.hover = true));
  car.addEventListener("pointerleave", () => (car.hover = false));

  /* ---------- featured: switch slide on scroll ---------- */
  const featured = $(".featured"), slides = $$(".fslide"), fdots = $$(".fdots span");
  let fIdx = -1;
  function setSlide(i) {
    if (i === fIdx) return;
    slides.forEach((s, j) => { s.classList.toggle("was-on", j === fIdx); s.classList.toggle("is-on", j === i); });
    fdots.forEach((d, j) => d.classList.toggle("on", j === i));
    fIdx = i;
  }
  setSlide(0);

  /* ---------- builder ---------- */
  const FL = { pistacchio: "#b9d48a", stracciatella: "#fff3dc", fragola: "#f8a5b8", cioccolato: "#7a442c", nocciola: "#cf9f6e", limone: "#fbec92", mangue: "#ffb54c", tiramisu: "#f0e0c2" };
  const SH = { pistacchio: "#93b463", stracciatella: "#ecdcbc", fragola: "#e27d96", cioccolato: "#5b2f1d", nocciola: "#ad7f50", limone: "#efd45c", mangue: "#f08f22", tiramisu: "#d9c39b" };
  const PRICE = { 1: 15, 2: 25, 3: 35 };
  const svg = $(".builder__svg"), priceEl = $(".bp"), priceBox = $(".builder__price");
  const NS = "http://www.w3.org/2000/svg";
  let n = 1, base = "cone", picks = ["fragola", "pistacchio", "stracciatella"], nextPick = 0;
  const scoopD = (cx, cy, r) => {
    let d = `M${cx - r},${cy + r * 0.4}C${cx - r * 1.08},${cy - r * 0.6} ${cx - r * 0.55},${cy - r * 1.02} ${cx},${cy - r}C${cx + r * 0.6},${cy - r * 1.02} ${cx + r * 1.08},${cy - r * 0.55} ${cx + r},${cy + r * 0.4}`;
    for (let i = 1; i <= 8; i++) { const x = cx + r - (2 * r * i) / 8; d += `Q${x + r / 8},${cy + r * (i % 2 ? 0.75 : 0.5)} ${x},${cy + r * 0.4}`; }
    return d + "Z";
  };
  function drawBase() {
    if (base === "cone") {
      return `<defs><clipPath id="bcone"><path d="M80,250 L220,250 L158,410 Q150,424 142,410Z"/></clipPath></defs>
        <path d="M80,250 L220,250 L158,410 Q150,424 142,410Z" fill="#e9a955"/>
        <g clip-path="url(#bcone)" stroke="#7a1428" stroke-width="3" opacity=".5">${Array.from({ length: 14 }, (_, i) => `<path d="M${30 + i * 24},230 l110,200"/><path d="M${270 - i * 24},230 l-110,200"/>`).join("")}</g>
        <path d="M80,250 L220,250 L158,410 Q150,424 142,410Z" fill="none" stroke="#7a1428" stroke-width="6" stroke-linejoin="round"/>`;
    }
    return `<defs><clipPath id="bcup"><path d="M62,262 L238,262 L216,392 Q214,404 202,404 L98,404 Q86,404 84,392Z"/></clipPath></defs>
      <path d="M62,262 L238,262 L216,392 Q214,404 202,404 L98,404 Q86,404 84,392Z" fill="#fff"/>
      <g clip-path="url(#bcup)">${Array.from({ length: 9 }, (_, i) => `<path d="M${60 + i * 24},262 h12 l-5,150 h-12z" fill="#fecd33"/>`).join("")}</g>
      <path d="M62,262 L238,262 L216,392 Q214,404 202,404 L98,404 Q86,404 84,392Z" fill="none" stroke="#7a1428" stroke-width="6" stroke-linejoin="round"/>
      <rect x="54" y="250" width="192" height="20" rx="8" fill="#fff6e5" stroke="#7a1428" stroke-width="6"/>`;
  }
  const POS = { cone: [[150, 224, 70], [150, 140, 64], [150, 64, 58]], cup: [[150, 226, 70], [150, 144, 64], [150, 70, 58]] };
  function render(dropIndex = -1) {
    let s = drawBase();
    for (let i = 0; i < n; i++) {
      const [x, y, r] = POS[base][i];
      const k = picks[i];
      s += `<g class="scoop-g${i === dropIndex ? " drop" : ""}"><path d="${scoopD(x, y, r)}" fill="${FL[k]}" stroke="#7a1428" stroke-width="6" stroke-linejoin="round"/><path d="M${x + r * 0.15},${y + r * 0.35}C${x + r * 0.7},${y + r * 0.2} ${x + r * 0.95},${y - r * 0.2} ${x + r * 0.8},${y - r * 0.55}C${x + r},${y} ${x + r * 0.9},${y + r * 0.35} ${x + r * 0.55},${y + r * 0.45}Z" fill="${SH[k]}" opacity=".85"/><path d="M${x - r * 0.6},${y - r * 0.35}Q${x - r * 0.5},${y - r * 0.8} ${x - r * 0.1},${y - r * 0.88}" stroke="#fff" stroke-width="7" stroke-linecap="round" fill="none" opacity=".7"/></g>`;
    }
    svg.innerHTML = s;
    priceEl.textContent = PRICE[n];
    priceBox.classList.remove("bump"); void priceBox.offsetWidth; priceBox.classList.add("bump");
    $$(".ptable li").forEach((li) => li.classList.toggle("on", +li.dataset.n === n));
  }
  function moveInk(seg) {
    const on = $(".seg__b.is-on", seg), ink = $(".seg__ink", seg);
    ink.style.width = on.offsetWidth + "px";
    ink.style.transform = `translateX(${on.offsetLeft - 4}px)`;
  }
  const segN = $$(".seg")[0], segB = $(".seg--base");
  function setN(v) {
    const grow = v > n;
    n = v;
    $$(".seg__b", segN).forEach((b) => b.classList.toggle("is-on", +b.dataset.n === v));
    // 1 parfum is served in a cone, as on the shop's menu
    const cupBtn = $('[data-base="cup"]', segB);
    cupBtn.disabled = v === 1;
    if (v === 1 && base === "cup") setBase("cone", true);
    moveInk(segN); moveInk(segB);
    render(grow ? n - 1 : -1);
  }
  function setBase(b, silent) {
    base = b;
    $$(".seg__b", segB).forEach((x) => x.classList.toggle("is-on", x.dataset.base === b));
    moveInk(segB);
    if (!silent) render(n - 1);
  }
  $$(".seg__b", segN).forEach((b) => b.addEventListener("click", () => setN(+b.dataset.n)));
  $$(".seg__b", segB).forEach((b) => b.addEventListener("click", () => !b.disabled && setBase(b.dataset.base)));
  $$(".ptable li").forEach((li) => li.addEventListener("click", () => setN(+li.dataset.n)));
  $$(".sw").forEach((b) => b.addEventListener("click", () => { const i = nextPick % n; picks[i] = b.dataset.f; nextPick++; render(i); }));
  setN(1);

  /* ---------- exotic arrows ---------- */
  const etrack = $(".exotic__track"), erow = $(".exotic__row");
  let eOff = 0;
  $$(".arrow").forEach((a) => a.addEventListener("click", () => {
    const step = etrack.children[0].offsetWidth + 30;
    const max = Math.max(0, etrack.scrollWidth - erow.clientWidth);
    eOff = clamp(eOff + step * +a.dataset.dir, 0, max);
    etrack.style.transform = `translateX(${-eOff}px)`;
  }));

  /* ---------- newsletter ---------- */
  const news = $(".news");
  news.addEventListener("submit", (e) => {
    e.preventDefault();
    const inp = $("input", news);
    if (!inp.checkValidity()) return;
    news.classList.remove("sent"); void news.offsetWidth; news.classList.add("sent");
    inp.value = ""; inp.placeholder = "Grazie ! À très vite";
    const r = $("button", news).getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 2, 24);
  });

  /* ---------- measure ---------- */
  const nav = $(".nav");
  const hero = $(".hero"), heroCard = $(".hero__card"), wave = $(".wave-a"), hfs = $$(".hf").map((el) => ({ el, d: +el.dataset.depth || 0 }));
  const rays = $(".rays"), memArt = $(".memories__art");
  const finale = $(".finale"), fword = $(".finale__word"), fcups = $$(".finale__cups img");
  function measure() { vw = innerWidth; vh = innerHeight; moveInk(segN); moveInk(segB); }
  addEventListener("resize", measure);
  addEventListener("load", measure);

  /* ---------- loop ---------- */
  function frame(t) {
    const y = scrollY;
    nav.classList.toggle("is-scrolled", y > 40);

    if (body.classList.contains("has-cursor")) {
      cx = lerp(cx, mx, 0.2); cy = lerp(cy, my, 0.2);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      cursor.classList.toggle("is-hidden", !seen);
    }

    if (!reduce) {
      tbX -= 0.6;
      if (tbX <= -tb.scrollWidth / 2) tbX = 0;
      tb.style.transform = `translate3d(${tbX}px,0,0)`;
    }

    // hero: wobbly wave + parallax treats
    const hr = heroCard.getBoundingClientRect();
    if (hr.bottom > 0 && !reduce) {
      const k = Math.sin(t / 1400) * 40, k2 = Math.cos(t / 1700) * 30;
      if (vw < 980) wave.setAttribute("d", `M0,0 H1200 V${340 + k2} C900,${410 + k} 300,${270 - k} 0,${360 + k2} Z`);
      else wave.setAttribute("d", `M0,0 H1200 V${120 + k2} C1050,${180 + k} 980,${60 - k} 820,${140 + k2} C660,${220 - k} ${720 + k2},${420 + k} ${640 + k * 0.6},600 H0 Z`);
      const ox = fine ? (mx / vw - 0.5) : 0, oy = fine ? (my / vh - 0.5) : 0;
      const sp = clamp(-hr.top / hr.height);
      hfs.forEach((h) => (h.el.style.transform = `translate(${ox * h.d}px, ${oy * h.d - sp * h.d * 4}px) rotate(${ox * h.d * 0.3}deg)`));
      heroCard.style.transform = `scale(${1 - sp * 0.06})`;
      heroCard.style.borderRadius = `${28 + sp * 40}px`;
    }

    // carousel drift / inertia
    if (!dragging) {
      if (Math.abs(cV) > 0.6) cV *= 0.95; else cV = car.hover ? 0 : -0.6;
      if (!reduce) cX += cV;
    }
    const half = ctrack.scrollWidth / 2;
    if (cX < -half) cX += half; if (cX > 0) cX -= half;
    ctrack.style.transform = `translate3d(${cX}px,0,0)`;

    // featured slides by scroll progress
    const fr = featured.getBoundingClientRect();
    if (fr.top < vh && fr.bottom > 0) {
      const p = clamp(-fr.top / (fr.height - vh));
      setSlide(Math.min(slides.length - 1, Math.floor(p * slides.length)));
    }

    // memories rays spin with scroll
    const mr = memArt.getBoundingClientRect();
    if (mr.top < vh && mr.bottom > 0 && !reduce) rays.style.transform = `rotate(${t / 120 + y * 0.08}deg)`;

    // finale: outlined word slides, cups rise from behind the footer
    const fnr = finale.getBoundingClientRect();
    if (fnr.top < vh && fnr.bottom > 0) {
      const p = clamp((vh - fnr.top) / (fnr.height + vh * 0.25));
      fword.style.transform = `translateX(${(0.5 - p) * 30}vw)`;
      fcups.forEach((c, i) => c.style.setProperty("--rise", clamp(1 - (p * 1.6 - Math.abs(i - 3) * 0.08))));
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
