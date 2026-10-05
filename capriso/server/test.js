/* =========================================================
   CAPRISO — tests de bout en bout de l'API fidélité.
   node capriso/server/test.js
   Lance un serveur sur une base temporaire et rejoue tout le parcours.
   ========================================================= */
const { spawn } = require("node:child_process");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "capriso-test-"));
const DB = path.join(dir, "test.db");
const PORT = 18000 + Math.floor(Math.random() * 1000);
const BASE = `http://localhost:${PORT}`;
const CAISSE = "test-caisse-pw";
let out = "";

const srv = spawn(process.execPath, [path.join(__dirname, "server.js")], {
  env: { ...process.env, PORT, DB_FILE: DB, QR_TTL: "3", CAISSE_PASSWORD: CAISSE, SMS_PROVIDER: "console" },
  stdio: ["ignore", "pipe", "pipe"]
});
srv.stdout.on("data", (d) => { out += d; });
srv.stderr.on("data", (d) => { out += d; });

// petit navigateur avec cookies
function agent() {
  const jar = {};
  return async function call(method, url, body, headers) {
    const h = { ...(headers || {}) };
    if (body !== undefined) h["Content-Type"] = h["Content-Type"] || "application/json";
    const ck = Object.entries(jar).map(([k, v]) => `${k}=${v}`).join("; ");
    if (ck) h.Cookie = ck;
    const r = await fetch(BASE + url, { method, headers: h, body: body === undefined ? undefined : (typeof body === "string" ? body : JSON.stringify(body)), redirect: "manual" });
    for (const c of r.headers.getSetCookie()) {
      const [kv] = c.split(";");
      const i = kv.indexOf("=");
      const v = kv.slice(i + 1);
      if (v) jar[kv.slice(0, i)] = v; else delete jar[kv.slice(0, i)];
    }
    const t = await r.text();
    let j = null;
    try { j = JSON.parse(t); } catch (e) { /* page HTML */ }
    return { status: r.status, body: j, text: t, headers: r.headers };
  };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let n = 0;
async function step(name, fn) {
  try { await fn(); n++; console.log("  ✓ " + name); }
  catch (e) { console.log("  ✗ " + name); console.log(e); console.log(out); srv.kill(); process.exit(1); }
}

(async () => {
  for (let i = 0; i < 50; i++) { try { await fetch(BASE + "/api/config"); break; } catch (e) { await sleep(100); } }
  require("./db"); // masque l'avertissement « SQLite expérimental »
  const { DatabaseSync } = require("node:sqlite");

  const anon = agent(), salma = agent(), karim = agent(), caisse = agent(), bday = agent();
  console.log("Capriso — tests fidélité");

  await step("le site public reste servi sans compte", async () => {
    const r = await anon("GET", "/");
    assert.equal(r.status, 200);
    assert.match(r.text, /Cède à ton/);
    assert.equal((await anon("GET", "/points")).status, 301);
    assert.equal((await anon("GET", "/caisse/")).status, 200);
  });

  await step("le code serveur et la base ne sont jamais servis", async () => {
    for (const u of ["/server/config.js", "/server/data/test.db", "/server/", "/server/../server/db.js", "/.git/config", "/%2fserver/config.js"]) {
      assert.notEqual((await anon("GET", u)).status, 200, u);
    }
    // les « .. » ne sortent jamais du dossier du site
    const r = await anon("GET", "/%2e%2e/%2e%2e/README.md");
    assert.ok(!/Ladoze/.test(r.text));
  });

  await step("Mes points exige une connexion", async () => {
    const r = await anon("GET", "/api/me");
    assert.equal(r.status, 401);
  });

  await step("anti-CSRF : JSON obligatoire et même origine", async () => {
    assert.equal((await anon("POST", "/api/auth/login", "phone=1", { "Content-Type": "application/x-www-form-urlencoded" })).status, 415);
    assert.equal((await anon("POST", "/api/auth/login", { phone: "0600000000" }, { Origin: "https://evil.example" })).status, 403);
  });

  await step("inscription de Salma (validation des champs)", async () => {
    assert.equal((await salma("POST", "/api/auth/register", { phone: "12", name: "Salma", birthdate: "1998-04-12", password: "Gelato2026!" })).status, 400);
    assert.equal((await salma("POST", "/api/auth/register", { phone: "0600000000", name: "Salma", birthdate: "1998-02-31", password: "Gelato2026!" })).status, 400);
    assert.equal((await salma("POST", "/api/auth/register", { phone: "0600000000", name: "Salma", birthdate: "1998-04-12", password: "court" })).status, 400);
    const r = await salma("POST", "/api/auth/register", { phone: "06 00 00 00 00", name: "Salma Bennani", birthdate: "1998-04-12", password: "Gelato2026!" });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    const dup = await anon("POST", "/api/auth/register", { phone: "+212600000000", name: "Autre", birthdate: "1990-01-01", password: "Gelato2026!" });
    assert.equal(dup.status, 400);
    assert.equal(dup.body.code, "exists");
  });

  let salmaCode;
  await step("profil de Salma : 0 pt, code de parrainage, prochaine récompense 150", async () => {
    const r = await salma("GET", "/api/me");
    assert.equal(r.status, 200);
    assert.equal(r.body.balance, 0);
    assert.equal(r.body.nextReward.points, 150);
    assert.match(r.body.referralCode, /^SALMA-\d{4}$/);
    salmaCode = r.body.referralCode;
  });

  await step("connexion : mauvais mot de passe refusé, bon accepté", async () => {
    const a = agent();
    assert.equal((await a("POST", "/api/auth/login", { phone: "0600000000", password: "faux-mdp" })).status, 400);
    assert.equal((await a("POST", "/api/auth/login", { phone: "+212 6 00 00 00 00", password: "Gelato2026!" })).status, 200);
    assert.equal((await a("GET", "/api/me/summary")).body.firstName, "Salma");
  });

  await step("caisse : accès refusé sans mot de passe, accepté avec", async () => {
    assert.equal((await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).status, 401);
    assert.equal((await salma("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).status, 401, "un client n'est pas caissier");
    assert.equal((await caisse("POST", "/api/caisse/login", { password: "nope" })).status, 400);
    assert.equal((await caisse("POST", "/api/caisse/login", { password: CAISSE })).status, 200);
  });

  let qr;
  await step("QR 3 boules : 35 DH = 35 pts + 5 bonus = 40 pts", async () => {
    const r = await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 3 });
    assert.equal(r.status, 201);
    qr = r.body;
    assert.equal(qr.points, 40);
    assert.match(qr.url, /\/points\/\?scan=/);
    assert.match(qr.shortCode, /^[A-Z2-9]{6}$/);
    assert.equal((await caisse("GET", "/api/caisse/qr/" + qr.id)).body.status, "pending");
  });

  await step("Salma scanne : +40 pts, la caisse voit « Points ajoutés à Salma »", async () => {
    const r = await salma("POST", "/api/scan", { code: qr.token });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.points, 40);
    assert.equal(r.body.balance, 40);
    const st = await caisse("GET", "/api/caisse/qr/" + qr.id);
    assert.equal(st.body.status, "used");
    assert.equal(st.body.client, "Salma");
  });

  await step("un QR ne sert qu'une seule fois", async () => {
    const r = await salma("POST", "/api/scan", { code: qr.token });
    assert.equal(r.status, 400);
    assert.equal(r.body.code, "used");
  });

  await step("le code court à 6 caractères marche aussi (saisie manuelle)", async () => {
    const q2 = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 2 })).body;
    const r = await salma("POST", "/api/scan", { code: q2.shortCode.toLowerCase() });
    assert.equal(r.status, 200);
    assert.equal(r.body.balance, 65);
  });

  await step("un QR expire après sa durée de validité", async () => {
    const q3 = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).body;
    await sleep(3200);
    assert.equal((await caisse("GET", "/api/caisse/qr/" + q3.id)).body.status, "expired");
    const r = await salma("POST", "/api/scan", { code: q3.token });
    assert.equal(r.body.code, "expired");
  });

  await step("un QR annulé par la caisse est refusé", async () => {
    const q4 = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).body;
    assert.equal((await caisse("POST", "/api/caisse/qr/" + q4.id + "/cancel", {})).body.status, "cancelled");
    assert.equal((await salma("POST", "/api/scan", { code: q4.token })).body.code, "cancelled");
  });

  await step("parrainage : Karim s'inscrit avec le code de Salma, rien avant son 1er achat", async () => {
    assert.equal((await karim("POST", "/api/auth/register", { phone: "0611111111", name: "Karim", birthdate: "1995-09-03", password: "Gelato2026!", referralCode: "NOPE-0000" })).status, 400);
    const r = await karim("POST", "/api/auth/register", { phone: "0611111111", name: "Karim Alaoui", birthdate: "1995-09-03", password: "Gelato2026!", referralCode: salmaCode.toLowerCase() });
    assert.equal(r.status, 201, JSON.stringify(r.body));
    assert.equal((await karim("GET", "/api/me")).body.balance, 0);
    assert.equal((await salma("GET", "/api/me")).body.balance, 65);
  });

  await step("1er achat de Karim : +15, +20 pour lui et +20 pour Salma (une seule fois)", async () => {
    const q = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).body;
    const r = await karim("POST", "/api/scan", { code: q.token });
    assert.equal(r.body.balance, 35);
    assert.equal(r.body.extras[0].points, 20);
    assert.equal((await salma("GET", "/api/me")).body.balance, 85);
    const q2 = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).body;
    await karim("POST", "/api/scan", { code: q2.token });
    assert.equal((await salma("GET", "/api/me")).body.balance, 85, "pas de second bonus");
    const me = (await salma("GET", "/api/me")).body;
    assert.equal(me.referrals.rewarded, 1);
  });

  await step("chaque client ne voit que ses propres points", async () => {
    const s = (await salma("GET", "/api/me")).body, k = (await karim("GET", "/api/me")).body;
    assert.equal(s.name, "Salma Bennani");
    assert.equal(k.name, "Karim Alaoui");
    assert.ok(!k.history.some((h) => /3 boules/.test(h.label)));
  });

  await step("récompense refusée si solde insuffisant (et la caisse le voit)", async () => {
    const q = (await caisse("POST", "/api/caisse/qr", { kind: "recompense", scoops: 1 })).body;
    assert.equal(q.points, 150);
    const r = await salma("POST", "/api/scan", { code: q.token });
    assert.equal(r.body.code, "insufficient");
    const st = (await caisse("GET", "/api/caisse/qr/" + q.id)).body;
    assert.equal(st.status, "pending");
    assert.equal(st.refused.client, "Salma");
    assert.equal(st.refused.missing, 65);
  });

  await step("récompense : 150 pts déduits, les plus anciens d'abord", async () => {
    const db = new DatabaseSync(DB);
    const sid = db.prepare("SELECT id FROM clients WHERE phone = '+212600000000'").get().id;
    db.close();
    for (let i = 0; i < 2; i++) {
      const q = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 3 })).body;
      await salma("POST", "/api/scan", { code: q.token });
    }
    assert.equal((await salma("GET", "/api/me")).body.balance, 165);
    const q = (await caisse("POST", "/api/caisse/qr", { kind: "recompense", scoops: 1 })).body;
    const r = await salma("POST", "/api/scan", { code: q.token });
    assert.equal(r.status, 200, JSON.stringify(r.body));
    assert.equal(r.body.balance, 15);
    const db2 = new DatabaseSync(DB);
    const lots = db2.prepare("SELECT points, remaining FROM movements WHERE client_id = ? AND points > 0 ORDER BY id").all(sid);
    db2.close();
    // 40 + 25 + 20 + 40 consommés entièrement, il reste 15 sur le dernier lot de 40
    assert.deepEqual(lots.map((l) => l.remaining), [0, 0, 0, 0, 15]);
    assert.equal((await caisse("GET", "/api/caisse/qr/" + q.id)).body.status, "used");
  });

  await step("les points expirent après 3 mois et apparaissent dans l'historique", async () => {
    const db = new DatabaseSync(DB);
    db.prepare("UPDATE movements SET expires_at = ? WHERE remaining > 0 AND client_id = (SELECT id FROM clients WHERE phone = '+212600000000')").run(new Date(Date.now() - 1000).toISOString());
    db.close();
    const me = (await salma("GET", "/api/me")).body;
    assert.equal(me.balance, 0);
    assert.equal(me.justExpired, 15);
    assert.equal(me.history[0].type, "expiration");
    assert.equal(me.history[0].points, -15);
  });

  await step("bonus anniversaire : +30 pts une seule fois dans la semaine", async () => {
    const today = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Casablanca" }).format(new Date());
    const r = await bday("POST", "/api/auth/register", { phone: "0622222222", name: "Yassine", birthdate: "2001-" + today.slice(5), password: "Gelato2026!" });
    assert.equal(r.status, 201);
    const me = (await bday("GET", "/api/me")).body;
    assert.equal(me.justGranted.points, 30);
    assert.equal(me.balance, 30);
    const again = (await bday("GET", "/api/me")).body;
    assert.equal(again.justGranted, null);
    assert.equal(again.balance, 30);
  });

  await step("pas de bonus hors de la semaine d'anniversaire", async () => {
    const me = (await karim("GET", "/api/me")).body;
    assert.ok(!me.history.some((h) => h.type === "anniversaire"));
  });

  await step("mot de passe oublié : code par SMS, nouveau mot de passe, anciennes sessions coupées", async () => {
    const a = agent();
    const r = await a("POST", "/api/auth/reset/request", { phone: "06 00 00 00 00" });
    assert.equal(r.status, 200);
    await sleep(200);
    const m = out.match(/\[SMS → \+212600000000\][^\n]*? est (\d{6})/g);
    assert.ok(m, "SMS envoyé");
    const code = m[m.length - 1].match(/ est (\d{6})/)[1];
    assert.equal((await a("POST", "/api/auth/reset/confirm", { phone: "0600000000", code: code === "000000" ? "111111" : "000000", password: "Nouveau2026!" })).status, 400);
    assert.equal((await a("POST", "/api/auth/reset/confirm", { phone: "0600000000", code, password: "Nouveau2026!" })).status, 200);
    assert.equal((await a("GET", "/api/me/summary")).status, 200);
    assert.equal((await salma("GET", "/api/me")).status, 401, "l'ancienne session est coupée");
    assert.equal((await salma("POST", "/api/auth/login", { phone: "0600000000", password: "Nouveau2026!" })).status, 200);
    // numéro inconnu : même réponse (pas de fuite d'information)
    assert.equal((await anon("POST", "/api/auth/reset/request", { phone: "0699999999" })).status, 200);
  });

  await step("déconnexion", async () => {
    assert.equal((await karim("POST", "/api/auth/logout", {})).status, 200);
    assert.equal((await karim("GET", "/api/me")).status, 401);
  });

  await step("deux scans simultanés du même QR : un seul crédit", async () => {
    const q = (await caisse("POST", "/api/caisse/qr", { kind: "gain", scoops: 1 })).body;
    const before = (await salma("GET", "/api/me")).body.balance;
    const rs = await Promise.all([salma("POST", "/api/scan", { code: q.token }), bday("POST", "/api/scan", { code: q.token })]);
    assert.equal(rs.filter((r) => r.status === 200).length, 1);
    const after = (await salma("GET", "/api/me")).body.balance + (await bday("GET", "/api/me")).body.balance;
    assert.equal(after, before + 30 + 15);
  });

  console.log(`\n${n} tests réussis.`);
  srv.kill();
  fs.rmSync(dir, { recursive: true, force: true });
})();
