/* =========================================================
   LADOZE — interactions & scroll animations (vanilla, no deps)
   ========================================================= */
(() => {
  "use strict";

  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeOut = (t) => 1 - Math.pow(1 - t, 3);
  const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
  const body = document.body;

  let vw = innerWidth;
  let vh = innerHeight;

  /* ---------------------------------------------------------
     Text splitting
     --------------------------------------------------------- */
  $$('[data-split="chars"]').forEach((el) => {
    const text = el.textContent.trim().replace(/\s+/g, " ");
    el.setAttribute("aria-label", text);
    el.textContent = "";
    let i = 0;
    text.split(" ").forEach((part, wi) => {
      if (wi) el.append(" ");
      const word = document.createElement("span");
      word.className = "word";
      word.setAttribute("aria-hidden", "true");
      for (const ch of part) {
        const c = document.createElement("span");
        c.className = "char";
        c.textContent = ch;
        c.style.setProperty("--ci", i++);
        word.append(c);
      }
      el.append(word);
    });
  });

  const manifesto = $("[data-words]");
  const words = [];
  if (manifesto) {
    const frag = document.createDocumentFragment();
    [...manifesto.childNodes].forEach((node) => {
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
    manifesto.textContent = "";
    manifesto.append(frag);
  }

  /* ---------------------------------------------------------
     Preloader
     --------------------------------------------------------- */
  const loader = $(".loader");
  const countEl = $(".loader__count span");

  const counter = new Promise((resolve) => {
    if (reduce) return resolve();
    const start = performance.now();
    const dur = 1700;
    const tick = (now) => {
      const p = clamp((now - start) / dur);
      countEl.textContent = Math.round(easeInOut(p) * 100);
      if (p < 1) requestAnimationFrame(tick);
      else setTimeout(resolve, 200);
    };
    requestAnimationFrame(tick);
  });
  const fontsReady = Promise.race([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise((r) => setTimeout(r, 2500)),
  ]);

  Promise.all([counter, fontsReady]).then(() => {
    body.classList.remove("is-loading");
    body.classList.add("is-loaded");
    measure();
    setTimeout(() => $(".hero").classList.add("is-in"), reduce ? 0 : 350);
    setTimeout(() => body.classList.add("intro-done"), reduce ? 0 : 2400);
    setTimeout(() => loader && loader.remove(), 1500);
    startObservers();
  });

  /* ---------------------------------------------------------
     Custom cursor
     --------------------------------------------------------- */
  const cursor = $(".cursor");
  const cursorDot = $(".cursor-dot");
  const cursorLabel = $(".cursor__label");
  let mx = vw / 2, my = vh / 2, cx = mx, cy = my, hasPointer = false;

  addEventListener("pointermove", (e) => {
    mx = e.clientX;
    my = e.clientY;
    hasPointer = true;
    if (cursorDot) cursorDot.style.transform = `translate3d(${mx}px, ${my}px, 0)`;
  }, { passive: true });

  if (finePointer && !reduce) {
    body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const labelled = e.target.closest("[data-cursor]");
      const hoverable = e.target.closest("a, button, .tab, .spot, input, .float");
      cursor.classList.toggle("is-label", !!labelled);
      cursor.classList.toggle("is-hover", !!hoverable && !labelled);
      if (labelled) cursorLabel.textContent = labelled.dataset.cursor;
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
    addEventListener("pointerdown", () => cursor.classList.add("is-down"));
    addEventListener("pointerup", () => cursor.classList.remove("is-down"));
  }

  /* ---------------------------------------------------------
     Magnetic buttons
     --------------------------------------------------------- */
  if (finePointer && !reduce) {
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.35;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.45;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------------------------------------------------------
     Nav: mobile menu
     --------------------------------------------------------- */
  const nav = $(".nav");
  const toggle = $(".nav__toggle");
  const overlay = $(".menu-overlay");
  const setMenu = (open) => {
    body.classList.toggle("menu-open", open);
    toggle.setAttribute("aria-expanded", open);
    toggle.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
    overlay.setAttribute("aria-hidden", !open);
  };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", overlay).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------------------------------------------------------
     Hero floats: click to squish
     --------------------------------------------------------- */
  const floats = $$(".float").map((el) => ({
    el,
    depth: +el.dataset.depth || 0,
    speed: +el.dataset.speed || 0,
    rot: +el.dataset.rot || 0,
    x: 0, y: 0,
  }));
  $$(".float > img").forEach((img) => {
    img.addEventListener("click", () => {
      img.classList.remove("squish");
      void img.offsetWidth;
      img.classList.add("squish");
    });
    img.addEventListener("animationend", () => img.classList.remove("squish"));
  });

  /* ---------------------------------------------------------
     Marquee tapes
     --------------------------------------------------------- */
  const tapes = $$(".tape").map((el) => {
    const track = $(".tape__track", el);
    const original = track.innerHTML;
    let guard = 0;
    while (track.scrollWidth < vw * 1.2 && guard++ < 10) track.innerHTML += original;
    track.innerHTML += track.innerHTML;
    return { el, track, dir: +el.dataset.dir || 1, x: 0, half: track.scrollWidth / 2 };
  });

  /* ---------------------------------------------------------
     Menu tabs + filtering
     --------------------------------------------------------- */
  const tabs = $$(".tab");
  const ink = $(".tabs__ink");
  const cards = $$(".card");
  const moveInk = (t) => {
    ink.style.width = `${t.offsetWidth}px`;
    ink.style.height = `${t.offsetHeight}px`;
    ink.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop}px)`;
  };
  let filtering = false;
  const filterCards = (cat) => {
    filtering = true;
    const leaving = cards.filter((c) => !c.hidden);
    leaving.forEach((c, i) => {
      c.style.transitionDelay = `${i * 40}ms`;
      c.classList.add("is-out");
    });
    setTimeout(() => {
      leaving.forEach((c) => {
        c.hidden = true;
        c.classList.remove("is-out");
        c.style.transitionDelay = "";
      });
      const entering = cards.filter((c) => c.dataset.cat === cat);
      entering.forEach((c) => {
        c.hidden = false;
        c.classList.add("is-pre", "is-in");
      });
      void document.body.offsetHeight;
      entering.forEach((c, i) => {
        c.style.transitionDelay = `${i * 90}ms`;
        c.classList.remove("is-pre");
      });
      setTimeout(() => {
        entering.forEach((c) => (c.style.transitionDelay = ""));
        filtering = false;
      }, 1000);
    }, reduce ? 0 : 420 + leaving.length * 40);
  };
  tabs.forEach((t) =>
    t.addEventListener("click", () => {
      if (t.classList.contains("is-active") || filtering) return;
      tabs.forEach((x) => {
        x.classList.toggle("is-active", x === t);
        x.setAttribute("aria-selected", x === t);
      });
      moveInk(t);
      filterCards(t.dataset.filter);
    })
  );

  /* Card 3D tilt */
  if (finePointer && !reduce) {
    cards.forEach((card) => {
      card.addEventListener("pointermove", (e) => {
        const r = card.getBoundingClientRect();
        const px = ((e.clientX - r.left) / r.width) * 2 - 1;
        const py = ((e.clientY - r.top) / r.height) * 2 - 1;
        card.classList.add("is-tilting");
        card.style.setProperty("--ry", `${px * 7}deg`);
        card.style.setProperty("--rx", `${-py * 7}deg`);
        card.style.setProperty("--px", px.toFixed(3));
        card.style.setProperty("--py", py.toFixed(3));
      });
      card.addEventListener("pointerleave", () => {
        card.classList.remove("is-tilting");
        ["--rx", "--ry", "--px", "--py"].forEach((p) => card.style.removeProperty(p));
      });
    });
  }

  /* Add to cart: flying burger + bump */
  const cart = $(".nav__cart");
  const cartCount = $(".nav__cart-count");
  let count = 0;
  $$(".add").forEach((btn) => {
    btn.addEventListener("click", () => {
      const card = btn.closest(".card");
      const img = $(".card__media img", card);
      const label = $(".roll > span", btn);
      nav.classList.remove("is-hidden");
      btn.classList.add("is-added");
      label.textContent = "Ajouté ✓";
      setTimeout(() => {
        btn.classList.remove("is-added");
        label.textContent = "Ajouter +";
      }, 1400);

      const done = () => {
        count++;
        cartCount.textContent = count;
        cart.classList.remove("bump");
        void cart.offsetWidth;
        cart.classList.add("bump");
      };
      if (reduce || !img.animate) return done();

      const from = img.getBoundingClientRect();
      const to = cart.getBoundingClientRect();
      const clone = img.cloneNode();
      clone.removeAttribute("loading");
      clone.style.width = `${from.width}px`;
      clone.style.height = `${from.height}px`;
      $(".fly-layer").append(clone);
      const dx = to.left + to.width / 2 - (from.left + from.width / 2);
      const dy = to.top + to.height / 2 - (from.top + from.height / 2);
      clone.animate(
        [
          { transform: `translate(${from.left}px, ${from.top}px) scale(1) rotate(0deg)` },
          { transform: `translate(${from.left + dx * 0.35}px, ${from.top + dy * 0.2 - 140}px) scale(.7) rotate(-160deg)`, offset: 0.4 },
          { transform: `translate(${from.left + dx}px, ${from.top + dy}px) scale(.08) rotate(-360deg)` },
        ],
        { duration: 900, easing: "cubic-bezier(.5,0,.75,0)" }
      ).onfinish = () => {
        clone.remove();
        done();
      };
    });
  });

  /* Newsletter */
  const form = $(".newsletter");
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const input = $("input", form);
    if (!input.checkValidity()) return;
    form.classList.remove("is-sent");
    void form.offsetWidth;
    form.classList.add("is-sent");
    input.value = "";
    input.placeholder = "Bienvenue chez Bloom ✺";
  });

  /* ---------------------------------------------------------
     Spots: hover preview follows the cursor
     --------------------------------------------------------- */
  const preview = $(".spots__preview");
  const previewImg = $("img", preview);
  let px = vw / 2, py = vh / 2;
  if (finePointer) {
    $$(".spot").forEach((spot) => {
      spot.addEventListener("pointerenter", () => {
        if (!previewImg.src.endsWith(spot.dataset.img)) {
          previewImg.src = spot.dataset.img;
          previewImg.classList.remove("swap");
          void previewImg.offsetWidth;
          previewImg.classList.add("swap");
        }
        preview.classList.add("is-on");
      });
      spot.addEventListener("pointerleave", () => preview.classList.remove("is-on"));
    });
  }

  /* ---------------------------------------------------------
     Reveal on scroll + counters
     --------------------------------------------------------- */
  function startObservers() {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add("is-in");
          io.unobserve(en.target);
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    $$(".reveal, [data-split]").forEach((el) => {
      if (!el.closest(".hero")) io.observe(el);
    });
    $$(".hero .reveal").forEach((el) => el.classList.add("is-in"));

    // cards: staggered entry per row
    const cardIO = new IntersectionObserver(
      (entries) => {
        entries
          .filter((en) => en.isIntersecting)
          .forEach((en, i) => {
            en.target.style.transitionDelay = `${i * 90}ms`;
            en.target.classList.add("is-in");
            setTimeout(() => (en.target.style.transitionDelay = ""), 1200);
            cardIO.unobserve(en.target);
          });
      },
      { threshold: 0.1 }
    );
    cards.forEach((c) => (c.hidden ? c.classList.add("is-in") : cardIO.observe(c)));

    const countIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          countIO.unobserve(en.target);
          const el = en.target;
          const target = +el.dataset.count;
          const from = target === 0 ? 100 : 0;
          if (reduce) return (el.textContent = target);
          const start = performance.now();
          const dur = 1800;
          const tick = (now) => {
            const p = clamp((now - start) / dur);
            el.textContent = Math.round(lerp(from, target, easeOut(p)));
            if (p < 1) requestAnimationFrame(tick);
          };
          requestAnimationFrame(tick);
        });
      },
      { threshold: 0.6 }
    );
    $$("[data-count]").forEach((el) => countIO.observe(el));
  }

  /* ---------------------------------------------------------
     Measurements (on load / resize)
     --------------------------------------------------------- */
  const anatomy = $(".anatomy");
  const anatomySvg = $(".anatomy__svg");
  const layers = $$(".anatomy__svg .ly").map((g, i, all) => ({
    g,
    label: $(".ly__label", g),
    off: i - (all.length - 1) / 2,
  }));
  const anatomyMeter = $(".anatomy__meter span");

  const process = $(".process");
  const track = $(".process__track");
  const processBar = $(".process__bar span");
  const steps = $$(".step").map((el) => ({ el, img: $(".step__art img", el), num: $(".step__num", el), center: 0 }));
  let processDist = 0;

  const statementRows = $$(".statement__row").map((el) => ({ el, dir: +el.dataset.slide }));
  const statement = $(".statement");
  const footerLogo = $(".footer__logo img");
  const heroContent = $(".hero__content");
  const sticker = $(".float--sticker .sticker");
  const progress = $(".nav__progress");
  let docH = 0;

  function measure() {
    vw = innerWidth;
    vh = innerHeight;
    processDist = Math.max(0, track.scrollWidth - vw);
    process.style.height = `${processDist + vh}px`;
    steps.forEach((s) => (s.center = s.el.offsetLeft + s.el.offsetWidth / 2));
    tapes.forEach((t) => (t.half = t.track.scrollWidth / 2));
    const active = $(".tab.is-active");
    if (active) moveInk(active);
    docH = document.documentElement.scrollHeight;
  }
  addEventListener("resize", measure);
  addEventListener("load", measure);
  measure();

  /* ---------------------------------------------------------
     Main loop
     --------------------------------------------------------- */
  let lastY = scrollY;
  let velocity = 0;
  let scrollDir = 1;
  let navAcc = 0;

  const progressOf = (el, startFrac, endFrac) => {
    // 0 when el top hits startFrac*vh, 1 when el bottom hits endFrac*vh
    const r = el.getBoundingClientRect();
    return { r, p: clamp((vh * startFrac - r.top) / (r.height + vh * (startFrac - endFrac))) };
  };

  function frame(now) {
    const y = scrollY;
    const dy = y - lastY;
    lastY = y;
    if (dy) scrollDir = dy > 0 ? 1 : -1;
    velocity = lerp(velocity, dy, 0.12);

    /* --- reads --- */
    const aRect = anatomy.getBoundingClientRect();
    const pRect = process.getBoundingClientRect();
    const sRect = statement.getBoundingClientRect();
    const fRect = footerLogo.getBoundingClientRect();
    const mProg = manifesto ? progressOf(manifesto, 0.85, 0.45).p : 0;

    /* --- nav --- */
    progress.style.transform = `scaleX(${clamp(y / Math.max(1, docH - vh))})`;
    navAcc = Math.sign(dy) === Math.sign(navAcc) ? navAcc + dy : dy;
    if (y < 200 || navAcc < -40) nav.classList.remove("is-hidden");
    else if (navAcc > 60 && !body.classList.contains("menu-open")) nav.classList.add("is-hidden");

    /* --- cursor --- */
    if (body.classList.contains("has-cursor")) {
      cx = lerp(cx, mx, 0.2);
      cy = lerp(cy, my, 0.2);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      cursor.classList.toggle("is-hidden", !hasPointer);
    }

    /* --- hero --- */
    if (y < vh * 1.3) {
      const hp = clamp(y / vh);
      if (!reduce) {
        heroContent.style.transform = `translate3d(0, ${y * 0.35}px, 0) scale(${1 - hp * 0.12})`;
        heroContent.style.opacity = 1 - hp * 0.9;
        const ox = finePointer ? mx - vw / 2 : 0;
        const oy = finePointer ? my - vh / 2 : 0;
        floats.forEach((f) => {
          f.x = lerp(f.x, ox * f.depth, 0.08);
          f.y = lerp(f.y, oy * f.depth + y * f.speed, 0.12);
          f.el.style.transform = `translate3d(${f.x}px, ${f.y}px, 0) rotate(${f.rot + y * 0.03 * Math.sign(f.rot || 1)}deg)`;
        });
      }
      if (sticker) sticker.style.transform = `rotate(${now * 0.02 + y * 0.4}deg)`;
    }

    /* --- tapes --- */
    if (!reduce) {
      const boost = 1 + Math.min(Math.abs(velocity) * 0.35, 14);
      tapes.forEach((t) => {
        t.x -= 1.2 * boost * t.dir * scrollDir;
        if (t.x <= -t.half) t.x += t.half;
        if (t.x > 0) t.x -= t.half;
        t.track.style.transform = `translate3d(${t.x}px, 0, 0) skewX(${clamp(-velocity * 0.4, -12, 12)}deg)`;
      });
    }

    /* --- manifesto words --- */
    if (words.length) {
      const active = mProg * words.length * 1.05;
      words.forEach((w, i) => {
        const on = i < active;
        if (on !== w._on) {
          w._on = on;
          w.classList.toggle("on", on);
        }
      });
    }

    /* --- anatomy (exploded view) --- */
    if (aRect.top < vh && aRect.bottom > 0) {
      const p = clamp(-aRect.top / (aRect.height - vh));
      const e = easeInOut(clamp((p - 0.06) / 0.7));
      layers.forEach((l) => {
        l.g.style.transform = `translate3d(0, ${-l.off * 62 * e}px, 0)`;
        if (l.label) {
          const o = clamp((e - 0.35) / 0.45);
          l.label.style.opacity = o;
          l.label.style.transform = `translate3d(${(1 - o) * 40}px, 0, 0)`;
        }
      });
      anatomySvg.style.transform = `translate3d(${(1 - e) * 22}%, 0, 0) rotate(${(1 - e) * -8 + Math.sin(now / 900) * (1 - e) * 1.5}deg) scale(${1.35 - e * 0.35})`;
      anatomyMeter.style.transform = `scaleX(${p})`;
    }

    /* --- process (horizontal) --- */
    if (pRect.top < vh && pRect.bottom > 0) {
      const p = clamp(-pRect.top / Math.max(1, pRect.height - vh));
      const x = -p * processDist;
      track.style.transform = `translate3d(${x}px, 0, 0)`;
      processBar.style.transform = `scaleX(${p})`;
      steps.forEach((s) => {
        const c = s.center + x;
        const d = clamp((c - vw / 2) / (vw * 0.8), -1, 1);
        s.img.style.transform = `rotate(${d * -28}deg) scale(${1 - Math.abs(d) * 0.35})`;
        s.num.style.transform = `translate3d(${d * 80}px, 0, 0)`;
      });
    }

    /* --- sliding statement --- */
    if (sRect.top < vh && sRect.bottom > 0) {
      const p = clamp((vh - sRect.top) / (vh + sRect.height));
      statementRows.forEach((r) => {
        r.el.style.transform = `translate3d(calc(-50% + ${(p - 0.5) * -60 * r.dir}vw), 0, 0)`;
      });
    }

    /* --- footer logo: "handwritten" reveal --- */
    if (fRect.top < vh) {
      const p = easeOut(clamp((vh - fRect.top) / (fRect.height * 1.1)));
      footerLogo.style.clipPath = `inset(-10% ${(1 - p) * 100}% -10% 0)`;
      footerLogo.style.transform = `translate3d(0, ${(1 - p) * 60}px, 0) rotate(${(1 - p) * -4}deg)`;
    }

    /* --- spots preview --- */
    if (finePointer) {
      px = lerp(px, mx, 0.14);
      py = lerp(py, my, 0.14);
      const rot = clamp((mx - px) * 0.12, -25, 25);
      preview.style.transform = `translate3d(${px - 130}px, ${py - 130}px, 0) rotate(${rot}deg)`;
    }

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
