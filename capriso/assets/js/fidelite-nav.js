/* =========================================================
   CAPRISO — solde de points dans l'en-tête + client de l'API.
   Inclus dans l'en-tête de chaque page. Sur l'accueil, il ne fait
   qu'afficher le solde ; sur les pages fidélité, il gère aussi le
   menu mobile et le compteur du panier (rôle de capriso.js à l'accueil).
   ========================================================= */
(function () {
  "use strict";

  const script = document.currentScript;
  const root = script ? script.src.replace(/assets\/js\/fidelite-nav\.js(\?.*)?$/, "") : "/";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const html = document.documentElement;

  if (!document.querySelector("link[data-fid-nav]")) {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = root + "assets/css/fidelite-nav.css";
    l.setAttribute("data-fid-nav", "");
    document.head.appendChild(l);
  }

  /* ---------- API ---------- */
  async function api(path, body) {
    const opts = { credentials: "same-origin", headers: { Accept: "application/json" } };
    if (body !== undefined) {
      opts.method = "POST";
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    let r;
    try { r = await fetch(root + "api/" + path, opts); }
    catch (e) { const err = new Error("Pas de connexion. Vérifie ton réseau et réessaie."); err.status = 0; throw err; }
    let data = {};
    try { data = await r.json(); } catch (e) { /* réponse non JSON */ }
    if (!r.ok) {
      const err = new Error(data.error || "Petit souci technique. Réessaie dans un instant.");
      err.status = r.status; err.code = data.code;
      throw err;
    }
    return data;
  }

  /* ---------- solde ---------- */
  function countUp(el, from, to, ms) {
    if (reduce || from === to) { el.textContent = to; return; }
    const t0 = performance.now();
    (function tick(now) {
      const t = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - t, 3)));
      if (t < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function setBalance(n, pop) {
    html.classList.add("fid-in");
    document.querySelectorAll(".pts-chip").forEach((c) => {
      const num = c.querySelector(".pts-chip__n");
      const wasHidden = c.hidden;
      c.hidden = false;
      c.setAttribute("aria-label", `Mes points : ${n} pts`);
      countUp(num, wasHidden ? 0 : (+num.textContent || 0), n, 900);
      if (pop && !reduce) { c.classList.remove("is-pop"); void c.offsetWidth; c.classList.add("is-pop"); }
    });
  }
  function hideBalance() {
    html.classList.remove("fid-in");
    document.querySelectorAll(".pts-chip").forEach((c) => { c.hidden = true; });
  }
  async function refresh() {
    try {
      const s = await api("me/summary");
      if (!s.loggedIn) { hideBalance(); return null; }
      setBalance(s.balance, true);
      return s;
    } catch (e) { hideBalance(); return null; }
  }

  /* ---------- pages fidélité : menu mobile + panier ---------- */
  function subpage() {
    const body = document.body;
    const burger = document.querySelector(".burger");
    const drawer = document.getElementById("drawer");
    if (burger && drawer) {
      const menu = (open) => {
        body.classList.toggle("menu-open", open);
        burger.setAttribute("aria-expanded", open ? "true" : "false");
        burger.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
        drawer.setAttribute("aria-hidden", open ? "false" : "true");
      };
      burger.addEventListener("click", () => menu(!body.classList.contains("menu-open")));
      drawer.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => menu(false)));
      addEventListener("keydown", (e) => { if (e.key === "Escape" && body.classList.contains("menu-open")) menu(false); });
    }
    // comme à l'accueil : l'en-tête se cache en descendant, revient en remontant
    const nav = document.querySelector(".nav");
    let lastY = scrollY;
    if (nav) addEventListener("scroll", () => {
      const y = scrollY, d = y - lastY;
      if (!body.classList.contains("menu-open") && !body.classList.contains("is-modal")) {
        if (y > innerHeight * .6 && d > 4) nav.classList.add("is-hidden");
        else if (d < -4 || y < innerHeight * .6) nav.classList.remove("is-hidden");
      }
      lastY = y;
    }, { passive: true });

    // même compteur que le panier de l'accueil (stocké dans ce navigateur)
    const cart = document.querySelector(".cart-btn");
    if (cart) {
      let count = 0;
      try { (JSON.parse(localStorage.getItem("capriso:order")) || []).forEach((it) => { count += +it.q || 0; }); } catch (e) { /* stockage indisponible */ }
      cart.classList.toggle("has-items", count > 0);
      const n = cart.querySelector(".cart-btn__n");
      if (n) n.textContent = count;
    }
  }
  if (!document.querySelector(".hero")) subpage();

  window.CapFid = { root, api, refresh, setBalance, hideBalance, countUp };
  refresh();
})();
