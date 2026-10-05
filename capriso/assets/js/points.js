/* =========================================================
   CAPRISO — « Mes points » : solde, progression, récompenses,
   historique, parrainage, scanner et animation de gain.
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, burst, toast, setOdo, say, enhance, reduce } = window.CapUI;
  const { api, setBalance, hideBalance, countUp, root } = window.CapFid;
  const A = window.CaprisoArt;
  const FL = A.FL;
  const body = document.body;
  const params = new URLSearchParams(location.search);
  let me = null;
  let firstRender = true;

  const TYPE = {
    achat: { ic: "i-cone", c: "#FFE1E9" },
    recompense: { ic: "i-gift", c: "#FFE7C6" },
    anniversaire: { ic: "i-cake", c: "#ECE4FC" },
    parrainage: { ic: "i-users", c: "#E3F1CF" },
    expiration: { ic: "i-clock", c: "#EFE6DC" }
  };
  const REWARD_FLAVORS = [["fragola"], ["pistacchio", "mangue"], ["cioccolato", "stracciatella", "bosco"]];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fmtDate = (iso, opts) => new Date(iso).toLocaleDateString("fr-FR", opts || { day: "numeric", month: "short" });

  function toLogin(scanCode) {
    const next = location.pathname + (scanCode ? "?scan=" + encodeURIComponent(scanCode) : location.search);
    location.replace(new URL("../connexion/?next=" + encodeURIComponent(next), location.href).href);
  }

  async function load() {
    try { me = await api("me"); }
    catch (e) {
      if (e.status === 401) { toLogin(); return null; }
      toast(esc(e.message));
      return null;
    }
    render();
    return me;
  }

  /* ---------- rendu ---------- */
  function render() {
    const hello = $(".pts-hello");
    if (firstRender) {
      $(".pts-name").textContent = me.firstName;
      hello.setAttribute("data-split", "");
      enhance(hello.parentElement);
    }

    // solde + en-tête
    setOdo($(".pts-balance .odo"), me.balance);
    setBalance(me.balance, false);

    // texte « prochaine récompense »
    const unlocked = me.rewards.filter((r) => r.unlocked);
    const last = unlocked[unlocked.length - 1];
    const next = me.nextReward;
    let txt;
    if (!unlocked.length) txt = `Encore <b>${next.missing} pts</b> et la boule est pour nous.`;
    else if (next) txt = `<b>${esc(cap(last.label))}</b> t'attend en caisse. Encore <b>${next.missing} pts</b> pour ${esc(next.label)}.`;
    else txt = `<b>${esc(cap(last.label))}</b> t'attendent en caisse. Le grand jeu !`;
    $(".pts-next").innerHTML = txt;

    // barre de progression animée
    const max = me.rewards[me.rewards.length - 1].points;
    const bar = $(".pts-bar");
    bar.setAttribute("aria-valuemax", max);
    bar.setAttribute("aria-valuenow", me.balance);
    bar.setAttribute("aria-valuetext", `${me.balance} points sur ${max}`);
    $(".pts-bar__marks").innerHTML = me.rewards.map((r) =>
      `<span class="pts-mark${r.unlocked ? " is-reached" : ""}" style="--at:${(r.points / max).toFixed(4)}"><b>${r.points}</b>${r.scoops} boule${r.scoops > 1 ? "s" : ""}</span>`).join("");
    if (!$(".pts-bar__thumb svg")) $(".pts-bar__thumb").innerHTML = `<svg viewBox="-58 -86 116 100" aria-hidden="true">${A.scoop("fragola", 0, 6, 100)}</svg>`;
    const p = Math.min(1, me.balance / max);
    setTimeout(() => bar.style.setProperty("--p", p.toFixed(4)), firstRender ? 350 : 0);

    // points bientôt expirés
    const ex = $(".pts-expire");
    ex.hidden = !me.expiringSoon;
    if (me.expiringSoon) $("span", ex).textContent = `${me.expiringSoon.points} pts expirent le ${fmtDate(me.expiringSoon.date, { day: "numeric", month: "long" })}. File les dépenser !`;

    // illustration du hero : la prochaine récompense
    const target = next || last;
    const art = $(".pts-hero__art");
    if (art.dataset.n !== String(target.scoops)) {
      art.dataset.n = target.scoops;
      art.innerHTML = A.cone(REWARD_FLAVORS[target.scoops - 1] || REWARD_FLAVORS[2]);
      if (!reduce) $(".art", art).classList.add("is-drop");
    }

    renderRewards();
    renderReferral();
    renderHistory();
    renderProfile();
    firstRender = false;
  }
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  function renderRewards() {
    const list = $(".rw__list");
    list.innerHTML = me.rewards.map((r, i) => {
      const fl = REWARD_FLAVORS[r.scoops - 1] || REWARD_FLAVORS[0];
      const f = FL[fl[0]];
      return `<li class="fcard rw-card reveal ${r.unlocked ? "is-unlocked" : "is-locked"}" style="--c:${f.base};--p:${f.pastel};--d:${i * .1}s">
        <span class="rw-card__ribbon">Débloquée</span>
        <div class="fcard__glow"></div>
        <div class="fcard__art" data-cursor="${r.unlocked ? "À toi !" : "Bientôt"}">${A.cone(fl, { label: r.label })}</div>
        <h3 class="fcard__name">${esc(cap(r.label))}</h3>
        <p class="fcard__fr">${r.points} pts</p>
        <p class="fcard__desc">${r.unlocked ? "Demande-la en caisse : on te montre un QR, tu le scannes, c'est servi." : "Patience, chaque boule te rapproche du but."}</p>
        <span class="rw-card__state"><svg class="ic" aria-hidden="true"><use href="#${r.unlocked ? "i-gift" : "i-lock"}"/></svg>${r.unlocked ? "Débloquée !" : `Encore ${r.missing} pts`}</span>
      </li>`;
    }).join("");
    if (!firstRender) $$(".reveal", list).forEach((el) => el.classList.add("is-in"));
    enhance(list);
  }

  function renderReferral() {
    const code = me.referralCode;
    $(".parrain__val").textContent = code;
    const link = new URL(`../connexion/?parrain=${encodeURIComponent(code)}#inscription`, location.href).href;
    const msg = `Ciao ! Rejoins le club fidélité de Capriso Gelato avec mon code ${code} : on gagne chacun 20 pts dès ta première glace 🍦 ${link}`;
    $(".parrain__share").href = "https://wa.me/?text=" + encodeURIComponent(msg);
    const n = me.referrals.invited, ok = me.referrals.rewarded;
    $(".parrain__stats").textContent = n
      ? `${n} ami${n > 1 ? "s" : ""} inscrit${n > 1 ? "s" : ""} avec ton code · ${ok} ${ok > 1 ? "ont" : "a"} déjà pris sa glace.`
      : "Personne n'a encore utilisé ton code. Lance l'invitation !";
  }

  function renderHistory() {
    const list = $(".hist__list");
    $(".hist__empty").hidden = me.history.length > 0;
    $(".hist__n").textContent = me.history.length ? `${me.history.length} mouvement${me.history.length > 1 ? "s" : ""}` : "";
    list.innerHTML = me.history.map((h, i) => {
      const t = TYPE[h.type] || TYPE.achat;
      const plus = h.points > 0;
      return `<li class="oi${h.type === "expiration" ? " is-expired" : ""}" style="--i:${Math.min(i, 12)}">
        <span class="hist__ic" style="--c:${t.c}"><svg class="ic" aria-hidden="true"><use href="#${t.ic}"/></svg></span>
        <div class="oi__t">${esc(h.label)}<small>${fmtDate(h.date, { day: "numeric", month: "long", year: "numeric" })}</small></div>
        <div class="oi__r"><span class="oi__p ${plus ? "is-plus" : "is-minus"}">${plus ? "+" : "−"}${Math.abs(h.points)} pts</span></div>
      </li>`;
    }).join("");
  }

  function renderProfile() {
    $(".prof__name").textContent = me.name;
    const ph = me.phone.startsWith("+212") ? ("0" + me.phone.slice(4)).replace(/(\d{2})(?=\d)/g, "$1 ") : me.phone;
    $(".prof__phone").textContent = ph;
    $(".prof__bday").textContent = `Anniversaire le ${fmtDate(me.birthdate + "T12:00:00Z", { day: "numeric", month: "long" })} · +30 pts la semaine de ton anniversaire`;
    $(".prof__rule").textContent = "Tes points restent valables 3 mois après chaque achat.";
  }

  /* ---------- copie / déconnexion ---------- */
  $(".parrain__copy").addEventListener("click", async (e) => {
    const b = e.currentTarget;
    try { await navigator.clipboard.writeText(me.referralCode); }
    catch (err) {
      const r = document.createRange(); r.selectNodeContents($(".parrain__val"));
      const s = getSelection(); s.removeAllRanges(); s.addRange(r);
    }
    b.classList.add("is-done");
    toast(`Code <b>${esc(me.referralCode)}</b> copié !`);
    setTimeout(() => b.classList.remove("is-done"), 1600);
  });

  $(".prof__logout").addEventListener("click", async () => {
    try { await api("auth/logout", {}); } catch (e) { /* on sort quand même */ }
    hideBalance();
    location.replace(new URL("../", location.href).href);
  });

  /* =========================================================
     Animation de gain
     ========================================================= */
  const gain = $(".gain");
  let lastFocus = null;
  function celebrate(r, mode) {
    const isReward = r.kind === "recompense";
    const scoops = r.scoops || (isReward ? 1 : 3);
    const fl = mode === "birthday" ? ["fragola", "bosco", "mangue"] : (REWARD_FLAVORS[scoops - 1] || REWARD_FLAVORS[2]);
    $(".gain__art", gain).innerHTML = mode === "birthday" ? A.cup(fl) : A.cone(fl);
    if (!reduce) $(".gain__art .art", gain).classList.add("is-drop");
    $(".gain__kick", gain).textContent = mode === "birthday" ? "Buon compleanno !" : isReward ? "Buon appetito !" : "Bravissimo !";
    $(".gain__sign", gain).textContent = isReward ? "−" : "+";
    $(".gain__label", gain).textContent = r.label;
    $(".gain__extras", gain).innerHTML = (r.extras || []).map((x, i) => `<li style="--i:${i}">+${x.points} pts · ${esc(x.label)}</li>`).join("");
    const before = +($(".gain__bal", gain).dataset.v || 0);
    const total = r.balance;
    $(".gain__n", gain).textContent = "0";
    $(".gain__bal", gain).textContent = before;

    lastFocus = document.activeElement;
    gain.hidden = false;
    body.classList.add("is-modal");
    requestAnimationFrame(() => gain.classList.add("is-on"));
    setTimeout(() => countUp($(".gain__n", gain), 0, r.points, 1300), 300);
    setTimeout(() => countUp($(".gain__bal", gain), before, total, 1100), 1100);
    $(".gain__bal", gain).dataset.v = total;
    const cx = innerWidth / 2, cy = innerHeight * .42;
    [0, 260, 620, 1100].forEach((t, i) => setTimeout(() => burst(cx + (i % 2 ? 60 : -60), cy, 28, 1.7), t));
    setBalance(total, true);
    setTimeout(() => $(".gain__ok", gain).focus(), 400);
  }
  function closeGain() {
    gain.classList.remove("is-on");
    body.classList.remove("is-modal");
    setTimeout(() => { gain.hidden = true; }, 400);
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  $(".gain__ok", gain).addEventListener("click", closeGain);

  /* =========================================================
     Scanner
     ========================================================= */
  const scan = $(".scan");
  const video = $("video", scan);
  const scanMsg = $(".scan__msg", scan);
  const manual = $(".scan__manual", scan);
  const manualMsg = $(".form__msg", manual);
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  let stream = null, raf = 0, detector = null, busy = false, lastT = 0, claiming = false;

  const setMsg = (t) => { scanMsg.textContent = t || ""; };

  function loadJsQR() {
    if (window.jsQR) return Promise.resolve();
    return new Promise((res, rej) => {
      const s = document.createElement("script");
      s.src = root + "assets/vendor/jsQR.js";
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
  }

  async function startCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMsg("Caméra indisponible ici : tape le code sous le QR.");
      return;
    }
    setMsg("Ouverture de la caméra…");
    try {
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 } }, audio: false });
    } catch (e) {
      setMsg(e && e.name === "NotAllowedError" ? "Autorise la caméra pour scanner, ou tape le code." : "Caméra indisponible : tape le code sous le QR.");
      return;
    }
    if (scan.hidden) { stopCamera(); return; }
    video.srcObject = stream;
    try { await video.play(); } catch (e) { /* lecture auto bloquée : l'image arrive quand même */ }
    setMsg("");
    if (!detector && "BarcodeDetector" in window) {
      try {
        const f = await window.BarcodeDetector.getSupportedFormats();
        if (f.includes("qr_code")) detector = new window.BarcodeDetector({ formats: ["qr_code"] });
      } catch (e) { /* pas de détecteur natif */ }
    }
    if (!detector) { try { await loadJsQR(); } catch (e) { setMsg("Lecteur QR indisponible : tape le code."); return; } }
    raf = requestAnimationFrame(loop);
  }

  async function loop(now) {
    raf = requestAnimationFrame(loop);
    if (busy || claiming || !stream || video.readyState < 2 || now - lastT < 140) return;
    lastT = now;
    let text = null;
    busy = true;
    try {
      if (detector) {
        const r = await detector.detect(video);
        if (r && r[0]) text = r[0].rawValue;
      } else if (window.jsQR) {
        const w = video.videoWidth, h = video.videoHeight;
        const k = Math.min(1, 720 / Math.max(w, h));
        canvas.width = Math.round(w * k); canvas.height = Math.round(h * k);
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const r = window.jsQR(img.data, canvas.width, canvas.height, { inversionAttempts: "dontInvert" });
        if (r && r.data) text = r.data;
      }
    } catch (e) { /* image illisible, on continue */ }
    busy = false;
    if (text) onText(text);
  }

  function codeFrom(text) {
    try {
      const u = new URL(text);
      const c = u.searchParams.get("scan");
      if (c) return c;
    } catch (e) { /* pas une URL */ }
    const t = String(text).trim();
    return /^[A-Za-z0-9_-]{6,64}$/.test(t) ? t : null;
  }

  function onText(text) {
    const code = codeFrom(text);
    if (!code) { setMsg("Ce QR n'est pas un QR Capriso."); return; }
    if (navigator.vibrate) navigator.vibrate(60);
    claim(code, true, true);
  }

  function stopCamera() {
    cancelAnimationFrame(raf);
    if (stream) stream.getTracks().forEach((t) => t.stop());
    stream = null;
    video.srcObject = null;
  }

  function openScan() {
    lastFocus = document.activeElement;
    scan.hidden = false;
    body.classList.add("is-modal");
    say(manualMsg, "");
    $("input", manual).value = "";
    requestAnimationFrame(() => scan.classList.add("is-on"));
    startCamera();
    setTimeout(() => $(".scan__close", scan).focus(), 50);
  }
  function closeScan() {
    stopCamera();
    scan.classList.remove("is-on", "is-busy");
    setTimeout(() => { scan.hidden = true; }, 400);
    if (gain.hidden) body.classList.remove("is-modal");
    if (lastFocus && lastFocus.focus && gain.hidden) lastFocus.focus();
  }

  // fromScan : depuis la fenêtre du scanner ; camera : lu par la caméra (pause avant relecture)
  async function claim(code, fromScan, camera) {
    if (claiming) return;
    claiming = true;
    if (fromScan) { scan.classList.add("is-busy"); setMsg("Validation…"); }
    try {
      const r = await api("scan", { code });
      if (fromScan) closeScan();
      celebrate(r);
      await load();
    } catch (e) {
      if (e.status === 401) { toLogin(code); return; }
      if (fromScan && !scan.hidden) {
        scan.classList.remove("is-busy");
        setMsg("");
        say(manualMsg, e.message);
      } else toast(esc(e.message));
    } finally {
      // la caméra marque une pause avant de relire un QR (évite de rescanner le même en boucle)
      if (camera) setTimeout(() => { claiming = false; }, 1500);
      else claiming = false;
    }
  }

  $(".pts-scan-btn").addEventListener("click", openScan);
  $(".scan__close", scan).addEventListener("click", closeScan);
  manual.addEventListener("submit", (e) => {
    e.preventDefault();
    const v = $("input", manual).value.trim().toUpperCase();
    if (!/^[A-Z0-9]{6}$/.test(v)) { say(manualMsg, "Le code fait 6 caractères (lettres et chiffres)."); return; }
    claim(v, true);
  });
  addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!gain.hidden) closeGain();
    else if (!scan.hidden) closeScan();
  });

  /* =========================================================
     Démarrage
     ========================================================= */
  (async () => {
    const scanCode = params.get("scan");
    const ok = await load();
    if (!ok) return;
    body.classList.remove("is-loading-pts");
    $(".pts").setAttribute("aria-busy", "false");
    $(".gain__bal", gain).dataset.v = me.balance;

    if (scanCode) {
      history.replaceState(null, "", location.pathname);
      claim(scanCode, false);
    } else if (me.birthdayBonus) {
      // on fête le bonus une seule fois sur cet appareil
      const key = "capriso:bday-seen";
      let seen = null;
      try { seen = localStorage.getItem(key); } catch (e) { /* stockage indisponible */ }
      if (seen !== me.birthdayBonus.date) {
        try { localStorage.setItem(key, me.birthdayBonus.date); } catch (e) { /* tant pis */ }
        celebrate({ kind: "anniversaire", points: me.birthdayBonus.points, label: "Bonus anniversaire, une fois par an", extras: [], balance: me.balance }, "birthday");
      }
    }
    if (me.justExpired) toast(`${me.justExpired} pts ont expiré (plus de 3 mois). Les autres t'attendent !`);
  })();
})();
