/* =========================================================
   NICE KOOP — interactions, booking & scroll animations (vanilla)
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

  /* ---------- salons (edit numbers here) ---------- */
  const SALONS = {
    californie: { name: "Porte Californie", city: "Casablanca", tel: "+212522875332", telTxt: "05 22 87 53 32", wa: "" },
    villeverte: { name: "La Ville Verte", city: "Bouskoura", tel: "+212632402408", telTxt: "06 32 40 24 08", wa: "212632402408" },
  };
  const OPEN = 9 * 60, CLOSE = 21 * 60, STEP = 30;

  /* ---------- Casablanca clock ---------- */
  const TZ = "Africa/Casablanca";
  let fmt;
  try { fmt = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }); }
  catch (_) { fmt = new Intl.DateTimeFormat("en-GB", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }); }
  const now = () => {
    const p = Object.fromEntries(fmt.formatToParts(new Date()).map((x) => [x.type, x.value]));
    return { y: +p.year, m: +p.month, d: +p.day, min: (+p.hour % 24) * 60 + +p.minute };
  };

  /* ---------- live open / closed ---------- */
  function paintStatus() {
    const { min } = now();
    const open = min >= OPEN && min < CLOSE;
    const soon = open && CLOSE - min <= 60;
    const label = !open ? (min < OPEN ? "Fermé · ouvre à 9h" : "Fermé · ouvre demain à 9h") : soon ? "Ferme bientôt · 21h" : "Ouvert · ferme à 21h";
    $$("[data-status]").forEach((el) => {
      el.classList.toggle("is-open", open && !soon);
      el.classList.toggle("is-soon", soon);
      el.classList.toggle("is-closed", !open);
      const t = $("span", el);
      if (t) t.textContent = el.dataset.status === "all" ? (open ? "Ouvert maintenant · jusqu'à 21h" : label) : label;
    });
  }
  paintStatus();
  setInterval(paintStatus, 30000);

  /* ---------- manifesto words ---------- */
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
  $$(".foot__word span").forEach((s, i) => s.style.setProperty("--i", i));
  $$("[data-year]").forEach((el) => (el.textContent = now().y));

  /* ---------- loader ---------- */
  const loader = $(".loader"), num = $(".loader__num"), lStripe = $(".loader__stripe");
  const fontsReady = Promise.race([document.fonts ? document.fonts.ready : Promise.resolve(), new Promise((r) => setTimeout(r, 2500))]);
  let fontsDone = false;
  fontsReady.then(() => (fontsDone = true));
  const t0 = performance.now(), DUR = reduce ? 0 : 1700;
  (function count(t) {
    // the counter runs on time, but waits at 90% for the fonts
    let p = DUR ? clamp((t - t0) / DUR) : 1;
    if (!fontsDone) p = Math.min(p, 0.9);
    const v = ease(p);
    num.textContent = Math.round(v * 100);
    lStripe.style.setProperty("--p", v);
    if (p < 1) return requestAnimationFrame(count);
    body.classList.add("is-cut");
    setTimeout(() => {
      body.classList.remove("is-loading");
      body.classList.add("is-loaded");
      measure();
      $(".hero").classList.add("is-in");
      $$(".hero .reveal").forEach((el) => el.classList.add("is-in"));
      observe();
      setTimeout(() => loader.remove(), 1600);
    }, reduce ? 0 : 480);
  })(t0);

  /* ---------- cursor + magnetic ---------- */
  const cursor = $(".cursor"), cLabel = $(".cursor__label");
  let cx = mx, cy = my;
  $$(".item").forEach((el) => (el.dataset.cursor = "Ajouter"));
  if (fine && !reduce) {
    body.classList.add("has-cursor");
    document.addEventListener("pointerover", (e) => {
      const lab = e.target.closest("[data-cursor]");
      const hov = e.target.closest("a, button, label, select, input");
      cursor.classList.toggle("is-label", !!lab);
      cursor.classList.toggle("is-hover", !!hov && !lab);
      if (lab) cLabel.textContent = lab.dataset.cursor;
    });
    document.documentElement.addEventListener("pointerleave", () => cursor.classList.add("is-hidden"));
    document.documentElement.addEventListener("pointerenter", () => cursor.classList.remove("is-hidden"));
    $$(".magnetic").forEach((el) => {
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width / 2) * 0.22}px, ${(e.clientY - r.top - r.height / 2) * 0.32}px)`;
      });
      el.addEventListener("pointerleave", () => (el.style.transform = ""));
    });
  }

  /* ---------- mobile drawer ---------- */
  const toggle = $(".nav__toggle"), drawer = $(".drawer");
  const setMenu = (o) => { body.classList.toggle("menu-open", o); toggle.setAttribute("aria-expanded", o); toggle.setAttribute("aria-label", o ? "Fermer le menu" : "Ouvrir le menu"); drawer.setAttribute("aria-hidden", !o); };
  toggle.addEventListener("click", () => setMenu(!body.classList.contains("menu-open")));
  $$("a", drawer).forEach((a) => a.addEventListener("click", () => setMenu(false)));
  addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

  /* ---------- toast ---------- */
  const toast = $(".toast");
  let toastT;
  function say(html) {
    toast.innerHTML = html;
    toast.classList.add("is-on");
    clearTimeout(toastT);
    toastT = setTimeout(() => toast.classList.remove("is-on"), 3600);
  }

  /* ---------- carte: tabs ---------- */
  const tabs = $$(".tab"), pill = $(".tabs__pill");
  const vis = $(".carte__visual"), visImgs = $$("img", vis), cat = $(".carte__cat");
  let visFront = 0;
  $$(".panel").forEach((p) => $$("li", p).forEach((li, i) => li.style.setProperty("--i", i)));
  function placePill() {
    const t = $(".tab.is-on");
    pill.style.width = `${t.offsetWidth}px`;
    pill.style.height = `${t.offsetHeight}px`;
    pill.style.transform = `translate(${t.offsetLeft}px, ${t.offsetTop}px)`;
  }
  function selectTab(tab, focus) {
    if (tab.classList.contains("is-on")) return;
    tabs.forEach((t) => {
      const on = t === tab;
      t.classList.toggle("is-on", on);
      t.setAttribute("aria-selected", on);
      t.tabIndex = on ? 0 : -1;
      const panel = document.getElementById(t.getAttribute("aria-controls"));
      panel.hidden = !on;
      panel.classList.toggle("is-on", on);
    });
    if (focus) tab.focus();
    placePill();
    tab.scrollIntoView({ block: "nearest", inline: "center", behavior: reduce ? "auto" : "smooth" });
    // crossfade: the back image is loaded with the new photo, then wiped in over the front one
    const back = visImgs[1 - visFront], front = visImgs[visFront];
    back.src = tab.dataset.img;
    const swap = () => {
      front.classList.remove("is-on"); front.classList.add("is-out");
      back.classList.remove("is-out"); void back.offsetWidth; back.classList.add("is-on");
      visFront = 1 - visFront;
      setTimeout(() => front.classList.remove("is-out"), 1000);
    };
    back.complete ? swap() : back.addEventListener("load", swap, { once: true });
    cat.textContent = tab.textContent;
  }
  tabs.forEach((t, i) => {
    t.addEventListener("click", () => selectTab(t));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); selectTab(tabs[(i + d + tabs.length) % tabs.length], true); }
    });
  });

  /* ---------- booking ---------- */
  const form = $(".book"), sel = $("select", form), daysEl = $(".days", form), slotsEl = $(".slots", form), nameEl = $("[name=name]", form);
  const out = Object.fromEntries($$("[data-r]").map((el) => [el.dataset.r, el]));
  const send = $(".ticket__send"), sendTxt = $(".ticket__send-txt"), note = $(".ticket__note");
  const PRICES = {}, VIP = "Expérience salon privé VIP";
  let touched = false;

  // service list comes from the carte, so prices live in one place
  $$(".items").forEach((ul) => {
    const g = document.createElement("optgroup");
    g.label = ul.dataset.group;
    $$(".item", ul).forEach((it) => {
      PRICES[it.dataset.svc] = +it.dataset.price;
      g.append(new Option(`${it.dataset.svc} · ${it.dataset.price} Dhs`, it.dataset.svc));
    });
    sel.append(g);
  });
  {
    const g = document.createElement("optgroup");
    g.label = "Salon privé · La Ville Verte";
    g.append(new Option(`${VIP} · sur devis`, VIP));
    sel.append(g);
  }

  const DOW = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
  const pad = (n) => String(n).padStart(2, "0");
  const hhmm = (m) => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
  const today = now();
  const base = Date.UTC(today.y, today.m - 1, today.d, 12);
  const days = Array.from({ length: 14 }, (_, i) => new Date(base + i * 864e5));
  days.forEach((d, i) => {
    const lab = document.createElement("label");
    lab.className = "chip";
    lab.innerHTML = `<input type="radio" name="day" value="${i}"><span><small>${i === 0 ? "Auj." : i === 1 ? "Demain" : DOW[d.getUTCDay()]}</small><b>${d.getUTCDate()}</b></span>`;
    daysEl.append(lab);
  });
  for (let m = OPEN; m < CLOSE; m += STEP) {
    const lab = document.createElement("label");
    lab.className = "chip";
    lab.innerHTML = `<input type="radio" name="time" value="${m}"><span>${hhmm(m)}</span>`;
    slotsEl.append(lab);
  }

  function refreshSlots() {
    const di = +(form.elements.day.value || 0);
    const cut = di === 0 ? now().min + 30 : -1;
    $$("input", slotsEl).forEach((inp) => {
      inp.disabled = +inp.value < cut;
      if (inp.disabled && inp.checked) inp.checked = false;
    });
  }
  // nothing left today: start on tomorrow
  {
    const anyToday = CLOSE - STEP >= now().min + 30;
    $$("input", daysEl)[anyToday ? 0 : 1].checked = true;
  }
  refreshSlots();

  function setText(el, v) {
    if (el.textContent === v) return;
    el.textContent = v;
    el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop");
  }
  function update() {
    let salonKey = form.elements.salon.value;
    const svc = sel.value;
    if (svc === VIP && salonKey !== "villeverte") {
      form.elements.salon.value = "villeverte";
      salonKey = "villeverte";
    }
    const salon = SALONS[salonKey];
    const price = PRICES[svc];
    const di = form.elements.day.value, tm = form.elements.time.value;
    const d = di !== "" ? days[+di] : null;
    const dayTxt = d ? d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" }) : "";
    const when = d && tm !== "" ? `${dayTxt} à ${hhmm(+tm)}` : d ? `${dayTxt}, choisissez l'heure` : "Choisissez un créneau";
    setText(out.salon, `${salon.name} · ${salon.city}`);
    setText(out.svc, svc);
    setText(out.when, when);
    setText(out.price, price ? `${price} Dhs` : "Sur devis");

    // the carte only shows a tick once the visitor has actually chosen something
    if (touched) $$(".item").forEach((it) => it.classList.toggle("is-picked", it.dataset.svc === svc));

    const name = nameEl.value.trim();
    const ready = d && tm !== "";
    if (salon.wa) {
      const msg = [
        "Bonjour Nice Koop, je souhaite réserver :",
        `• Salon : ${salon.name} (${salon.city})`,
        `• Prestation : ${svc}${price ? ` (${price} Dhs)` : ""}`,
        `• Créneau : ${ready ? `${dayTxt} à ${hhmm(+tm)}` : "à convenir"}`,
        name ? `• Nom : ${name}` : "",
        "Merci de me confirmer.",
      ].filter(Boolean).join("\n");
      send.href = `https://wa.me/${salon.wa}?text=${encodeURIComponent(msg)}`;
      send.target = "_blank";
      sendTxt.textContent = "Envoyer sur WhatsApp";
      send.classList.toggle("is-off", !ready);
      note.textContent = ready ? "Le salon vous confirme le créneau sur WhatsApp." : "Choisissez un jour et une heure.";
    } else {
      send.href = `tel:${salon.tel}`;
      send.removeAttribute("target");
      sendTxt.textContent = `Appeler · ${salon.telTxt}`;
      send.classList.remove("is-off");
      note.textContent = "Ce salon prend les rendez-vous par téléphone : votre récapitulatif est prêt.";
    }
  }
  form.addEventListener("change", (e) => {
    if (e.target === sel) touched = true;
    // the private room only exists at La Ville Verte: picking the other salon drops it
    if (e.target.name === "salon" && e.target.value !== "villeverte" && sel.value === VIP) sel.selectedIndex = 0;
    if (e.target.name === "day") refreshSlots();
    update();
  });
  nameEl.addEventListener("input", update);
  form.addEventListener("submit", (e) => e.preventDefault());
  setInterval(() => { refreshSlots(); update(); }, 60000);
  update();

  // picking from the carte, the forfaits and the VIP section
  function pick(svc, salon) {
    touched = true;
    sel.value = svc;
    if (salon) form.elements.salon.value = salon;
    update();
  }
  $$(".item").forEach((it) => it.addEventListener("click", () => {
    pick(it.dataset.svc);
    say(`<span><b>${it.dataset.svc}</b> ajouté</span><a href="#reserver">Choisir l'heure</a>`);
  }));
  $$("[data-book]").forEach((b) => b.addEventListener("click", () => {
    pick(b.dataset.book, b.dataset.salon);
    $("#reserver").scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
  }));
  toast.addEventListener("click", (e) => { if (e.target.closest("a")) toast.classList.remove("is-on"); });

  /* ---------- forfaits tilt ---------- */
  if (fine && !reduce) $$("[data-tilt]").forEach((c) => {
    c.addEventListener("pointermove", (e) => {
      if (!c.classList.contains("is-in")) return;
      const r = c.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      c.style.transform = `rotateX(${(0.5 - y) * 9}deg) rotateY(${(x - 0.5) * 11}deg) translateZ(0)`;
      c.style.setProperty("--gx", `${x * 100}%`);
      c.style.setProperty("--gy", `${y * 100}%`);
    });
    c.addEventListener("pointerleave", () => (c.style.transform = ""));
  });

  /* ---------- lookbook drag (mouse); touch keeps native scrolling ---------- */
  const lb = $(".lb");
  if (fine) {
    let down = false, sx = 0, sl = 0, v = 0, lx = 0, moved = false, glide = 0;
    lb.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = false; sx = lx = e.clientX; sl = lb.scrollLeft; v = 0;
      cancelAnimationFrame(glide);
    });
    addEventListener("pointermove", (e) => {
      if (!down) return;
      if (Math.abs(e.clientX - sx) > 5 && !moved) { moved = true; lb.classList.add("is-drag"); }
      lb.scrollLeft = sl - (e.clientX - sx);
      v = e.clientX - lx; lx = e.clientX;
    });
    addEventListener("pointerup", () => {
      if (!down) return;
      down = false;
      lb.classList.remove("is-drag");
      if (reduce) return;
      (function go() { if (Math.abs(v) < 0.5) return; lb.scrollLeft -= v; v *= 0.93; glide = requestAnimationFrame(go); })();
    });
  }

  /* ---------- counters ---------- */
  function countUp(el) {
    const to = +el.dataset.count, suf = el.dataset.suffix || "", t1 = performance.now(), D = reduce ? 0 : 1400;
    (function tick(t) {
      const p = D ? clamp((t - t1) / D) : 1;
      el.textContent = Math.round(ease(p) * to) + suf;
      if (p < 1) requestAnimationFrame(tick);
    })(t1);
  }

  /* ---------- observers ---------- */
  function observe() {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$("[data-count]", e.target).forEach(countUp);
      if (e.target.matches("[data-count]")) countUp(e.target);
      io.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach((el) => !el.closest(".hero") && io.observe(el));
    io.observe($(".foot__word"));
  }

  /* ---------- measure ---------- */
  const nav = $(".nav");
  const hero = $(".hero"), heroCopy = $(".hero__copy"), heroMedia = $(".hero__media"), heroLight = $(".hero__light"), badge = $(".badge__ring");
  const band = $(".band"), bandTrack = $(".band__track"), bandP = $("p", bandTrack);
  const rituel = $(".rituel"), track = $(".rituel__track"), rBar = $(".rituel__bar span");
  const steps = $$(".step__img").map((el) => ({ el, img: $("img", el) }));
  const vip = $(".vip"), vipSticky = $(".vip__sticky");
  const booking = $("#reserver"), dock = $(".dock");
  const footWord = $(".foot__word"), footLetters = $$("span", footWord);
  let rDist = 0, bandW = 1;
  function measure() {
    vw = innerWidth; vh = innerHeight;
    rDist = Math.max(0, track.scrollWidth - vw);
    rituel.style.height = `${rDist + vh}px`;
    bandW = bandP.offsetWidth || 1;
    placePill();
    // the giant wordmark fills the footer edge to edge
    footWord.style.fontSize = "100px";
    const w = footLetters.reduce((s, l) => s + l.offsetWidth, 0);
    if (w) footWord.style.fontSize = `${(100 * footWord.clientWidth / w) * 0.99}px`;
  }
  addEventListener("resize", measure);
  addEventListener("load", measure);
  if (document.fonts) { document.fonts.ready.then(measure); document.fonts.addEventListener("loadingdone", measure); }
  measure();

  /* ---------- loop ---------- */
  let lastY = scrollY, acc = 0, vel = 0, bandX = 0, rot = 0, hlx = vw * 0.7, hly = vh * 0.4, spx = 64, spy = 50;
  function frame() {
    const y = scrollY, dy = y - lastY; lastY = y;
    vel = lerp(vel, dy, 0.12);

    // nav: solid after the hero, hides while scrolling down
    const menu = body.classList.contains("menu-open");
    nav.classList.toggle("is-solid", y > vh * 0.6 && !menu);
    acc = Math.sign(dy) === Math.sign(acc) ? acc + dy : dy;
    if (y < 200 || acc < -40) nav.classList.remove("is-hidden");
    else if (acc > 70 && !menu) nav.classList.add("is-hidden");

    if (body.classList.contains("has-cursor")) {
      cx = lerp(cx, mx, 0.18); cy = lerp(cy, my, 0.18);
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      if (!seen) cursor.classList.add("is-hidden");
    }

    // hero: light follows the pointer, video and copy drift apart
    if (y < vh * 1.2) {
      const p = clamp(y / vh);
      if (!reduce) {
        heroMedia.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
        heroCopy.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        heroCopy.style.opacity = 1 - p * 1.25;
        if (fine) {
          hlx = lerp(hlx, mx, 0.08); hly = lerp(hly, my, 0.08);
          heroLight.style.setProperty("--mx", `${hlx}px`);
          heroLight.style.setProperty("--my", `${hly}px`);
        }
        rot += 0.12 + Math.abs(vel) * 0.25;
        badge.style.setProperty("--rot", `${rot}deg`);
      }
    }

    // barber band: marquee speed and skew follow scroll velocity
    const br = band.getBoundingClientRect();
    if (br.bottom > 0 && br.top < vh && !reduce) {
      bandX -= 0.9 + Math.abs(vel) * 0.6;
      if (bandX <= -bandW) bandX += bandW;
      bandTrack.style.transform = `translate3d(${bandX}px,0,0) skewX(${clamp(-vel * 0.5, -12, 12)}deg)`;
    }

    // manifesto: words light up
    const tr = pText.getBoundingClientRect();
    if (tr.top < vh && tr.bottom > 0) {
      const p = clamp((vh * 0.85 - tr.top) / (tr.height + vh * 0.3));
      const n = p * words.length * 1.05;
      words.forEach((w, i) => { const on = i < n; if (on !== w._on) { w._on = on; w.classList.toggle("on", on); } });
    }

    // ritual: vertical scroll drives the horizontal track
    const rr = rituel.getBoundingClientRect();
    if (rr.top < vh && rr.bottom > 0) {
      const p = clamp(-rr.top / Math.max(1, rr.height - vh));
      const x = -p * rDist;
      track.style.transform = `translate3d(${x}px,0,0)`;
      rBar.style.transform = `scaleX(${p})`;
      if (!reduce) steps.forEach((s) => {
        const r = s.el.getBoundingClientRect();
        const d = clamp((r.left + r.width / 2 - vw / 2) / vw, -1, 1);
        s.img.style.setProperty("--px", `${d * -40}px`);
      });
    }

    // VIP: a keyhole that opens into the private room
    const vr = vip.getBoundingClientRect();
    if (vr.top < vh && vr.bottom > 0) {
      const p = clamp(-vr.top / Math.max(1, vr.height - vh));
      const q = reduce ? 1 : ease(clamp(p / 0.6));
      vipSticky.style.setProperty("--r", `${14 + q * 76}%`);
      vipSticky.style.setProperty("--s", 1.25 - q * 0.25);
      vipSticky.style.setProperty("--o", reduce ? 1 : clamp((p - 0.3) / 0.3));
      if (fine) {
        const sr = vipSticky.getBoundingClientRect();
        spx = lerp(spx, ((mx - sr.left) / sr.width) * 100, 0.08);
        spy = lerp(spy, ((my - sr.top) / sr.height) * 100, 0.08);
        vipSticky.style.setProperty("--sx", `${spx}%`);
        vipSticky.style.setProperty("--sy", `${spy}%`);
      }
    }

    // dock: after the hero, out of the way of the booking form
    const bk = booking.getBoundingClientRect();
    dock.classList.toggle("is-on", y > vh * 0.8 && !(bk.top < vh * 0.9 && bk.bottom > vh * 0.1) && !menu);

    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
