/* =========================================================
   CAPRISO — effets partagés des pages fidélité.
   Mêmes gestes que l'accueil : titres qui montent mot à mot,
   reveals, texte qui roule dans les boutons, boutons magnétiques,
   curseur boule, vermicelles au clic, ingrédients flottants.
   ========================================================= */
(function () {
  "use strict";

  const $ = (s, c) => (c || document).querySelector(s);
  const $$ = (s, c) => Array.from((c || document).querySelectorAll(s));
  const lerp = (a, b, t) => a + (b - a) * t;
  const root = document.documentElement;
  const body = document.body;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const A = window.CaprisoArt;

  /* ---------- titres découpés ---------- */
  function split(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = "1";
    let wi = 0;
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \t\n\r]+)/).forEach((part) => {
            if (!part) return;
            if (/^[ \t\n\r]+$/.test(part)) { frag.appendChild(document.createTextNode(" ")); return; }
            const w = document.createElement("span");
            w.className = "w"; w.style.setProperty("--wi", wi++);
            const i = document.createElement("span");
            i.className = "w__i"; i.textContent = part;
            w.appendChild(i); frag.appendChild(w);
          });
          node.replaceChild(frag, n);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); } });
  }, { rootMargin: "0px 0px -8% 0px", threshold: .1 });

  function enhance(scope) {
    $$("[data-split]", scope).forEach((el) => { split(el); io.observe(el); });
    $$(".reveal, .rule", scope).forEach((el) => io.observe(el));
    $$(".btn__t", scope).forEach((t) => {
      if (t.firstElementChild) return;
      t.innerHTML = `<span data-t="${t.textContent.replace(/"/g, "&quot;")}">${t.textContent}</span>`;
    });
    $$("[data-ing]", scope).forEach((el, i) => {
      if (el.firstChild || !A) return;
      el.innerHTML = A.ing(el.dataset.ing);
      el.style.setProperty("--bd", (4.2 + (i % 5) * .7) + "s");
      el.style.setProperty("--bdl", (-i * .9) + "s");
    });
    $$("[data-cone]", scope).forEach((el) => {
      if (el.firstChild || !A) return;
      el.innerHTML = A.cone(el.dataset.cone.split(","));
    });
    $$("[data-jelly]", scope).forEach(jelly);
    if (fine && !reduce) $$(".magnetic", scope).forEach(magnetic);
  }

  /* ---------- lettres « gelée » du footer ---------- */
  function jelly(el) {
    if (el.dataset.jellyDone) return;
    el.dataset.jellyDone = "1";
    el.innerHTML = Array.from(el.textContent).map((c, i) => c === " " ? " " : `<span class="ch" style="--ci:${i}">${c}</span>`).join("");
    const colors = ["#FF8BA7", "#B8D27A", "#FFF3DC", "#6DB2E8", "#FF9A3D", "#B99BE3", "#FFCD2E"];
    $$(".ch", el).forEach((ch, i) => {
      ch.addEventListener("mouseenter", () => {
        ch.classList.remove("jelly"); void ch.offsetWidth; ch.classList.add("jelly");
        ch.style.color = colors[(i + Math.floor(Math.random() * colors.length)) % colors.length];
      });
      ch.addEventListener("animationend", () => ch.classList.remove("jelly"));
    });
  }

  /* ---------- boutons magnétiques ---------- */
  function magnetic(el) {
    if (el.dataset.mag) return;
    el.dataset.mag = "1";
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.transform = `translate(${((e.clientX - r.left - r.width / 2) * .3).toFixed(1)}px,${((e.clientY - r.top - r.height / 2) * .4).toFixed(1)}px)`;
    });
    el.addEventListener("pointerleave", () => {
      el.style.transition = "transform .6s cubic-bezier(.34,1.56,.64,1)";
      el.style.transform = "";
      setTimeout(() => { el.style.transition = ""; }, 600);
    });
  }

  /* ---------- curseur boule ---------- */
  if (fine && !reduce) {
    root.classList.add("has-cursor");
    const cur = $(".cursor"), dot = $(".cursor__dot"), lab = $(".cursor__label");
    if (cur) {
      let cx = -100, cy = -100, tx = -100, ty = -100;
      addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; }, { passive: true });
      (function loop() {
        cx = lerp(cx, tx, .2); cy = lerp(cy, ty, .2);
        dot.style.transform = lab.style.transform = `translate3d(${cx.toFixed(1)}px,${cy.toFixed(1)}px,0)`;
        requestAnimationFrame(loop);
      })();
      document.addEventListener("pointerover", (e) => {
        const l = e.target.closest("[data-cursor]");
        const h = e.target.closest("a, button, input, label");
        cur.classList.toggle("is-label", !!l);
        cur.classList.toggle("is-hover", !l && !!h);
        if (l) lab.textContent = l.dataset.cursor;
      });
    }
  }

  /* ---------- ingrédients : parallaxe souris ---------- */
  if (fine && !reduce) {
    let mx = 0, my = 0, sx = 0, sy = 0;
    addEventListener("pointermove", (e) => { mx = e.clientX / innerWidth * 2 - 1; my = e.clientY / innerHeight * 2 - 1; }, { passive: true });
    (function loop() {
      sx = lerp(sx, mx, .06); sy = lerp(sy, my, .06);
      $$(".floaters .ing").forEach((el, i) => {
        const d = (i % 2 ? -1 : 1) * (10 + (i % 4) * 7);
        el.style.setProperty("--mx", (sx * d).toFixed(1) + "px");
        el.style.setProperty("--py", (sy * d).toFixed(1) + "px");
      });
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- vermicelles ---------- */
  const SPR = ["#FF8BA7", "#86BA48", "#FFCD2E", "#6DB2E8", "#A3203A", "#FF9A3D", "#FFFFFF", "#B99BE3"];
  function burst(x, y, count, power) {
    if (reduce) return;
    power = power || 1;
    for (let i = 0; i < count; i++) {
      const s = document.createElement("span");
      s.className = "sprinkle";
      s.style.background = SPR[i % SPR.length];
      body.appendChild(s);
      const a = Math.random() * Math.PI * 2, v = (60 + Math.random() * 110) * power;
      const dx = Math.cos(a) * v, dy = Math.sin(a) * v - 40 * power, rot = Math.random() * 720 - 360;
      s.animate([
        { transform: `translate(${x}px,${y}px) rotate(0deg)`, opacity: 1 },
        { transform: `translate(${x + dx}px,${y + dy}px) rotate(${rot / 2}deg)`, opacity: 1, offset: .55 },
        { transform: `translate(${x + dx * 1.2}px,${y + dy + 140 * power}px) rotate(${rot}deg) scale(.6)`, opacity: 0 }
      ], { duration: (900 + Math.random() * 500) * Math.sqrt(power), easing: "cubic-bezier(.2,.7,.4,1)" }).onfinish = () => s.remove();
    }
  }
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0 || e.target.closest("input, label, video, .scan, .gain")) return;
    burst(e.clientX, e.clientY, 12);
  });

  /* ---------- toast ---------- */
  let toastT;
  function toast(htmlStr) {
    const t = $(".toast");
    if (!t) return;
    t.innerHTML = htmlStr;
    t.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("is-on"), 4200);
  }

  /* ---------- compteur qui roule (même rendu que le prix du composeur) ---------- */
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

  function countUp(el, from, to, ms) {
    if (window.CapFid) return window.CapFid.countUp(el, from, to, ms);
    el.textContent = to;
  }

  // messages d'erreur : secousse + texte
  function say(el, msg, ok) {
    if (!el) return;
    el.textContent = msg || "";
    el.classList.toggle("is-ok", !!ok);
    el.classList.remove("shake"); void el.offsetWidth;
    if (msg && !ok) el.classList.add("shake");
  }

  enhance(document);
  window.CapUI = { $, $$, enhance, burst, toast, setOdo, countUp, say, reduce, fine };
})();
