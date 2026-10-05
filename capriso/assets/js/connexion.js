/* =========================================================
   CAPRISO — connexion, inscription, mot de passe oublié.
   Après connexion : retour automatique vers « Mes points »
   (ou vers le scan en cours si le client venait d'un QR).
   ========================================================= */
(function () {
  "use strict";

  const { $, $$, burst, say, enhance } = window.CapUI;
  const api = window.CapFid.api;
  const params = new URLSearchParams(location.search);

  // destination après connexion : même origine uniquement
  function nextUrl() {
    const n = params.get("next");
    if (n) {
      try { const u = new URL(n, location.href); if (u.origin === location.origin) return u.href; } catch (e) { /* lien illisible */ }
    }
    return new URL("../points/", location.href).href;
  }
  function go() {
    const btn = document.activeElement && document.activeElement.closest(".btn");
    if (btn) { const r = btn.getBoundingClientRect(); burst(r.left + r.width / 2, r.top + r.height / 2, 26, 1.3); }
    setTimeout(() => location.replace(nextUrl()), 450);
  }

  // déjà connecté : direction Mes points
  api("me/summary").then((s) => { if (s.loggedIn) location.replace(nextUrl()); }).catch(() => {});

  if (/[?&]scan=/.test(params.get("next") || "")) $(".auth__note").hidden = false;

  /* ---------- onglets ---------- */
  const tabs = $(".auth__tabs");
  const ink = $(".seg__ink", tabs);
  const forms = { login: $("#f-login"), register: $("#f-register"), forgot: $("#f-forgot") };

  function moveInk() {
    const on = $(".seg__b.is-on", tabs);
    if (!on || !tabs.offsetParent) return;
    ink.style.width = on.offsetWidth + "px";
    ink.style.transform = `translateX(${on.offsetLeft}px)`;
  }
  function show(view, focus) {
    Object.entries(forms).forEach(([k, f]) => {
      const on = k === view;
      f.hidden = !on;
      if (on) { f.classList.remove("is-swap"); void f.offsetWidth; f.classList.add("is-swap"); }
    });
    tabs.hidden = view === "forgot";
    $$(".seg__b", tabs).forEach((b) => {
      const on = b.dataset.tab === view;
      b.classList.toggle("is-on", on);
      b.setAttribute("aria-selected", on ? "true" : "false");
    });
    moveInk();
    $$(".form__msg").forEach((m) => say(m, ""));
    if (focus !== false) { const i = $("input", forms[view]); if (i && matchMedia("(hover: hover)").matches) i.focus(); }
  }
  $$(".seg__b", tabs).forEach((b) => b.addEventListener("click", () => show(b.dataset.tab)));
  $$("[data-go]").forEach((b) => b.addEventListener("click", () => {
    if (b.dataset.go === "forgot") $("input[name=phone]", forms.forgot).value = $("input[name=phone]", forms.login).value;
    resetForgot();
    show(b.dataset.go);
  }));
  addEventListener("resize", moveInk);
  if (document.fonts) document.fonts.ready.then(moveInk);

  // lien de parrainage : ?parrain=CODE → inscription pré-remplie
  const parrain = (params.get("parrain") || "").trim().toUpperCase();
  if (parrain) $("input[name=referralCode]", forms.register).value = parrain;
  show(parrain || location.hash === "#inscription" ? "register" : "login", false);
  requestAnimationFrame(moveInk);

  /* ---------- œil du mot de passe ---------- */
  $$(".pw__eye").forEach((b) => b.addEventListener("click", () => {
    const i = b.parentElement.querySelector("input");
    const show = i.type === "password";
    i.type = show ? "text" : "password";
    b.setAttribute("aria-pressed", show ? "true" : "false");
    b.setAttribute("aria-label", show ? "Masquer le mot de passe" : "Afficher le mot de passe");
  }));

  /* ---------- envoi ---------- */
  async function submit(form, fn) {
    const btn = $("button[type=submit]", form);
    const msg = $(".form__msg", form);
    if (btn.disabled) return;
    btn.disabled = true; btn.setAttribute("aria-busy", "true");
    try { await fn(msg); }
    catch (e) { say(msg, e.message); return e; }
    finally { btn.disabled = false; btn.removeAttribute("aria-busy"); }
  }
  const val = (form, name) => ($(`[name=${name}]`, form).value || "").trim();

  forms.login.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(forms.login, async (msg) => {
      if (!val(forms.login, "phone") || !val(forms.login, "password")) return say(msg, "Indique ton numéro et ton mot de passe.");
      await api("auth/login", { phone: val(forms.login, "phone"), password: $("[name=password]", forms.login).value });
      say(msg, "Bentornato ! On t'emmène…", true);
      go();
    });
  });

  forms.register.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(forms.register, async (msg) => {
      const f = forms.register;
      if (!val(f, "name") || !val(f, "phone") || !val(f, "birthdate") || !$("[name=password]", f).value) return say(msg, "Il manque une info : prénom, téléphone, date de naissance et mot de passe.");
      try {
        await api("auth/register", { name: val(f, "name"), phone: val(f, "phone"), birthdate: val(f, "birthdate"), password: $("[name=password]", f).value, referralCode: val(f, "referralCode") });
      } catch (err) {
        if (err.code === "exists") {
          $("input[name=phone]", forms.login).value = val(f, "phone");
          show("login");
          say($(".form__msg", forms.login), err.message);
          return;
        }
        throw err;
      }
      say(msg, "Benvenuto ! Ton compte est prêt.", true);
      go();
    });
  });

  /* ---------- mot de passe oublié ---------- */
  let step = 1;
  function resetForgot() {
    step = 1;
    $$("[data-step]", forms.forgot).forEach((el) => { el.hidden = el.dataset.step !== "1"; });
    setBtn("Recevoir le code");
  }
  function setBtn(t) {
    const s = $("button[type=submit] .btn__t", forms.forgot);
    s.innerHTML = `<span data-t="${t}">${t}</span>`;
  }
  forms.forgot.addEventListener("submit", (e) => {
    e.preventDefault();
    submit(forms.forgot, async (msg) => {
      const f = forms.forgot;
      if (step === 1) {
        if (!val(f, "phone")) return say(msg, "Indique ton numéro de téléphone.");
        const r = await api("auth/reset/request", { phone: val(f, "phone") });
        step = 2;
        $$("[data-step]", f).forEach((el) => { el.hidden = el.dataset.step !== "2"; });
        setBtn("Changer mon mot de passe");
        say(msg, r.message, true);
        $("[name=code]", f).focus();
        return;
      }
      if (!/^\d{6}$/.test(val(f, "code"))) return say(msg, "Le code fait 6 chiffres.");
      await api("auth/reset/confirm", { phone: val(f, "phone"), code: val(f, "code"), password: $("[name=password]", f).value });
      say(msg, "C'est réglé ! Tu es connecté.", true);
      go();
    });
  });

  enhance(document);
})();
