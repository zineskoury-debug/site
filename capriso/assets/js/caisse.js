/* =========================================================
   CAPRISO — caisse : génère les QR (achat ou récompense),
   suit le scan du client et confirme à l'écran.
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, burst, toast, say, enhance } = window.CapUI;
  const api = window.CapFid.api;
  const A = window.CaprisoArt;
  const FLAVORS = [["fragola"], ["pistacchio", "mangue"], ["cioccolato", "stracciatella", "bosco"]];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const loginEl = $(".cz-login");
  const appEl = $(".cz-app");
  const logoutBtn = $(".cz-logout");
  const ov = $(".cz-qr");
  let cfg = null, current = null, lastReq = null, pollT = 0, tickT = 0, closeT = 0, offset = 0, wake = null;

  /* ---------- accès ---------- */
  async function init() {
    try {
      const r = await api("caisse/me");
      cfg = r.config;
      showApp();
    } catch (e) {
      if (e.status === 401) showLogin();
      else toast(esc(e.message));
    }
  }

  function showLogin() {
    closeQr(true);
    appEl.hidden = true;
    logoutBtn.hidden = true;
    loginEl.hidden = false;
    setTimeout(() => $("input", loginEl).focus(), 50);
  }

  $(".cz-login__f").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.currentTarget, msg = $(".form__msg", f), btn = $("button[type=submit]", f);
    if (btn.disabled) return;
    btn.disabled = true;
    try {
      await api("caisse/login", { password: $("input", f).value });
      $("input", f).value = "";
      say(msg, "");
      init();
    } catch (err) { say(msg, err.message); }
    finally { btn.disabled = false; }
  });

  $$(".pw__eye").forEach((b) => b.addEventListener("click", () => {
    const i = b.parentElement.querySelector("input");
    const show = i.type === "password";
    i.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", show ? "true" : "false");
  }));

  logoutBtn.addEventListener("click", async () => {
    try { await api("caisse/logout", {}); } catch (e) { /* on ferme quand même */ }
    if (wake) { try { wake.release(); } catch (e) { /* déjà libéré */ } wake = null; }
    showLogin();
  });

  /* ---------- boutons ---------- */
  function showApp() {
    loginEl.hidden = true;
    appEl.hidden = false;
    logoutBtn.hidden = false;

    const sale = $(".cz__grid--sale");
    sale.innerHTML = Object.entries(cfg.products).map(([n, p], i) => {
      const pts = p.priceDh * cfg.pointsPerDirham + (p.bonusPoints || 0);
      const f = A.FL[FLAVORS[n - 1][0]];
      return `<button class="cz-btn reveal" type="button" data-kind="gain" data-scoops="${n}" style="--c:${f.base};--d:${i * .08}s" data-cursor="QR !">
        <span class="cz-btn__art">${A.cone(FLAVORS[n - 1])}</span>
        <span class="cz-btn__t">${esc(p.label)}</span>
        <span class="cz-btn__p">${p.priceDh} DH</span>
        <span class="cz-btn__pts">+${pts} pts${p.bonusPoints ? ` (dont ${p.bonusPoints} bonus)` : ""}</span>
      </button>`;
    }).join("");

    const rw = $(".cz__grid--reward");
    rw.innerHTML = cfg.rewards.map((r, i) => `<button class="cz-btn cz-btn--reward" type="button" data-kind="recompense" data-scoops="${r.scoops}" style="--c:#A3203A;--d:${i * .08}s">
        <span class="cz-btn__art">${A.cone(FLAVORS[r.scoops - 1])}</span>
        <span class="cz-btn__t">${esc(r.label.charAt(0).toUpperCase() + r.label.slice(1))}</span>
        <span class="cz-btn__p">−${r.points} pts</span>
        <span class="cz-btn__pts">Récompense</span>
      </button>`).join("");

    enhance(appEl);
    // l'écran de la tablette reste allumé pendant le service
    if ("wakeLock" in navigator && !wake) navigator.wakeLock.request("screen").then((w) => { wake = w; }).catch(() => {});
  }

  const toggle = $(".cz-reward-toggle");
  toggle.addEventListener("click", () => {
    const grid = $(".cz__grid--reward");
    const open = grid.hidden;
    grid.hidden = !open;
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    if (open) grid.scrollIntoView({ behavior: "smooth", block: "center" });
  });

  appEl.addEventListener("click", (e) => {
    const b = e.target.closest(".cz-btn");
    if (!b) return;
    const r = b.getBoundingClientRect();
    burst(r.left + r.width / 2, r.top + r.height / 3, 16);
    createQr(b.dataset.kind, +b.dataset.scoops);
  });

  /* ---------- QR ---------- */
  function qrSvg(text) {
    const q = window.qrcode(0, "Q");
    q.addData(text);
    q.make();
    const n = q.getModuleCount();
    let d = "";
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (q.isDark(r, c)) d += `M${c} ${r}h1v1h-1z`;
    return `<svg viewBox="-2 -2 ${n + 4} ${n + 4}" shape-rendering="crispEdges" role="img" aria-label="QR code à scanner"><rect x="-2" y="-2" width="${n + 4}" height="${n + 4}" fill="#fff"/><path d="${d}" fill="#3A0B18"/></svg>` +
      `<span class="cz-qr__logo" aria-hidden="true"><svg><use href="#cap-mark"/></svg></span>`;
  }

  async function createQr(kind, scoops) {
    lastReq = { kind, scoops };
    try {
      const r = await api("caisse/qr", { kind, scoops });
      current = r;
      offset = Date.parse(r.serverNow) - Date.now();
      openQr(r);
    } catch (e) {
      if (e.status === 401) return showLogin();
      toast(esc(e.message));
    }
  }

  function openQr(r) {
    clearTimers();
    ov.classList.remove("is-done", "is-expired");
    $(".cz-qr__kick", ov).textContent = r.kind === "gain" ? "Achat · à scanner par le client" : "Récompense · à scanner par le client";
    $(".cz-qr__label", ov).textContent = r.kind === "gain" ? `${r.label.replace("Achat · ", "")} · +${r.points} pts` : `${r.label.replace("Récompense · ", "")} · −${r.points} pts`;
    $(".cz-qr__code", ov).innerHTML = qrSvg(r.url);
    $(".cz-qr__code", ov).dataset.url = r.url;
    $(".cz-qr__short b", ov).textContent = r.shortCode;
    setStatus("En attente du scan…");
    $(".cz-qr__cancel .btn__t", ov).innerHTML = '<span data-t="Annuler">Annuler</span>';
    $(".cz-qr__cancel", ov).hidden = false;
    $(".cz-qr__again", ov).hidden = true;
    $(".cz-qr__next", ov).hidden = true;
    ov.hidden = false;
    document.body.classList.add("is-modal");
    requestAnimationFrame(() => ov.classList.add("is-on"));
    tick();
    tickT = setInterval(tick, 250);
    pollT = setInterval(poll, 1500);
  }

  function setStatus(t, warn) {
    const s = $(".cz-qr__status", ov);
    s.textContent = t;
    s.classList.toggle("is-warn", !!warn);
  }

  function tick() {
    if (!current) return;
    const ttl = (cfg && cfg.qrValiditySeconds) || 120;
    const leftMs = Date.parse(current.expiresAt) - (Date.now() + offset);
    const left = Math.max(0, leftMs);
    const s = Math.ceil(left / 1000);
    $(".cz-qr__time", ov).textContent = `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    $(".cz-qr__ring", ov).style.setProperty("--left", (left / (ttl * 1000)).toFixed(4));
    $(".cz-qr__timer", ov).classList.toggle("is-late", s <= 20);
    if (left <= 0) { clearInterval(tickT); poll(); }
  }

  async function poll() {
    if (!current) return;
    let st;
    try { st = await api("caisse/qr/" + current.id); }
    catch (e) { if (e.status === 401) showLogin(); return; }
    if (!current || st.id !== current.id) return;
    if (st.status === "used") return done(st);
    if (st.status === "expired") return expired();
    if (st.status === "cancelled") return closeQr();
    if (st.refused) setStatus(`Solde insuffisant pour ${st.refused.client} : ${st.refused.balance} pts, il en manque ${st.refused.missing}.`, true);
  }

  function done(st) {
    clearTimers();
    ov.classList.add("is-done");
    $(".cz-qr__kick", ov).textContent = st.kind === "gain" ? "Scan réussi" : "Récompense servie";
    $(".cz-qr__done-t", ov).textContent = st.kind === "gain" ? `Points ajoutés à ${st.client} !` : `Récompense validée pour ${st.client} !`;
    $(".cz-qr__done-s", ov).textContent = st.kind === "gain"
      ? `+${st.points} pts · nouveau solde : ${st.balance} pts`
      : `${st.label.replace("Récompense · ", "")} · −${st.points} pts · solde : ${st.balance} pts`;
    $(".cz-qr__cancel", ov).hidden = true;
    $(".cz-qr__again", ov).hidden = true;
    $(".cz-qr__next", ov).hidden = false;
    $(".cz-qr__next", ov).focus();
    const cx = innerWidth / 2, cy = innerHeight * .4;
    [0, 300, 700].forEach((t, i) => setTimeout(() => burst(cx + (i - 1) * 70, cy, 30, 1.6), t));
    closeT = setTimeout(() => closeQr(), 12000);
    current = null;
  }

  function expired() {
    clearTimers();
    ov.classList.add("is-expired");
    setStatus("QR expiré. Regénère-le si le client est toujours là.", true);
    $(".cz-qr__cancel .btn__t", ov).innerHTML = '<span data-t="Fermer">Fermer</span>';
    $(".cz-qr__again", ov).hidden = false;
    current = null;
  }

  function clearTimers() {
    clearInterval(pollT); clearInterval(tickT); clearTimeout(closeT);
  }

  function closeQr(silent) {
    clearTimers();
    current = null;
    ov.classList.remove("is-on");
    document.body.classList.remove("is-modal");
    setTimeout(() => { ov.hidden = true; }, silent ? 0 : 400);
  }

  $(".cz-qr__cancel", ov).addEventListener("click", async () => {
    if (current) { try { await api(`caisse/qr/${current.id}/cancel`, {}); } catch (e) { /* le QR expirera de lui-même */ } }
    closeQr();
  });
  $(".cz-qr__again", ov).addEventListener("click", () => { if (lastReq) createQr(lastReq.kind, lastReq.scoops); });
  $(".cz-qr__next", ov).addEventListener("click", () => closeQr());
  addEventListener("keydown", (e) => { if (e.key === "Escape" && !ov.hidden && !current) closeQr(); });
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && wake === null && !appEl.hidden && "wakeLock" in navigator) {
      navigator.wakeLock.request("screen").then((w) => { wake = w; }).catch(() => {});
    }
  });

  init();
})();
