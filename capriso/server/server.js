/* =========================================================
   CAPRISO — serveur : site statique + API fidélité.
   Lancement : node capriso/server/server.js  (Node ≥ 22.13)
   ========================================================= */
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const C = require("./config");
const { open, createService, normalizePhone, UserError } = require("./db");
const { sendSms } = require("./sms");

const svc = createService(open(C.dbFile));

/* ---------- utilitaires HTTP ---------- */
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".jpg": "image/jpeg",
  ".webp": "image/webp", ".ico": "image/x-icon", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".md": "text/plain; charset=utf-8"
};
const COOKIE_CLIENT = "cap_sess";
const COOKIE_CAISSE = "cap_caisse";

function securityHeaders(res) {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(self), microphone=(), geolocation=()");
}

function json(res, status, body) {
  const s = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(s) });
  res.end(s);
}

function cookies(req) {
  const out = {};
  String(req.headers.cookie || "").split(";").forEach((p) => {
    const i = p.indexOf("=");
    if (i > 0) { try { out[p.slice(0, i).trim()] = decodeURIComponent(p.slice(i + 1).trim()); } catch (e) { /* cookie illisible */ } }
  });
  return out;
}

const isHttps = (req) => req.socket.encrypted || String(req.headers["x-forwarded-proto"] || "").split(",")[0].trim() === "https";

function setCookie(req, res, name, value, maxAge) {
  const parts = [`${name}=${encodeURIComponent(value)}`, "Path=/", "HttpOnly", "SameSite=Lax", `Max-Age=${maxAge}`];
  if (C.cookieSecure || isHttps(req)) parts.push("Secure");
  const prev = res.getHeader("Set-Cookie") || [];
  res.setHeader("Set-Cookie", [].concat(prev, parts.join("; ")));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 16 * 1024) { reject(new UserError("Requête trop volumineuse.")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (!chunks.length) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8")) || {}); }
      catch (e) { reject(new UserError("Requête illisible.")); }
    });
    req.on("error", reject);
  });
}

// petit limiteur en mémoire : max essais par fenêtre
const buckets = new Map();
function allow(key, max, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.reset < now) { buckets.set(key, { n: 1, reset: now + windowMs }); return true; }
  b.n += 1;
  return b.n <= max;
}
setInterval(() => { const now = Date.now(); for (const [k, b] of buckets) if (b.reset < now) buckets.delete(k); }, 6e4).unref();

const ip = (req) => String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || req.socket.remoteAddress || "?";
const baseUrl = (req) => C.publicUrl || `${isHttps(req) ? "https" : "http"}://${req.headers.host}`;

function clientSession(req) {
  const s = svc.readSession(cookies(req)[COOKIE_CLIENT], "client");
  return s && s.client_id ? s : null;
}
const caisseSession = (req) => svc.readSession(cookies(req)[COOKIE_CAISSE], "caisse");

function publicConfig() {
  return {
    pointsPerDirham: C.pointsPerDirham,
    products: C.products,
    rewards: C.rewards,
    birthday: C.birthday,
    referral: C.referral,
    pointsValidityMonths: C.pointsValidityMonths,
    qrValiditySeconds: C.qrValiditySeconds,
    passwordMinLength: C.passwordMinLength
  };
}

function validBirthdate(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s))) return false;
  const d = new Date(s + "T00:00:00Z");
  if (isNaN(d) || d.toISOString().slice(0, 10) !== s) return false;
  const y = +s.slice(0, 4);
  return y >= 1900 && d <= new Date();
}

/* ---------- API ---------- */
async function api(req, res, url) {
  const p = url.pathname;
  const m = req.method;
  const now = new Date();

  // Anti-CSRF : les écritures exigent du JSON et la même origine.
  if (m === "POST") {
    if (!String(req.headers["content-type"] || "").startsWith("application/json")) return json(res, 415, { error: "Format non accepté." });
    const origin = req.headers.origin;
    if (origin) {
      let host = "";
      try { host = new URL(origin).host; } catch (e) { /* origine illisible */ }
      if (host !== req.headers.host) return json(res, 403, { error: "Origine refusée." });
    }
  } else if (m !== "GET") return json(res, 405, { error: "Méthode non autorisée." });

  const body = m === "POST" ? await readJson(req) : {};

  if (p === "/api/config" && m === "GET") return json(res, 200, publicConfig());

  /* ----- comptes clients ----- */
  if (p === "/api/auth/register" && m === "POST") {
    if (!allow("reg:" + ip(req), 10, 36e5)) return json(res, 429, { error: "Trop de tentatives. Réessaie dans un moment." });
    const phone = normalizePhone(body.phone);
    const name = String(body.name || "").trim().replace(/\s+/g, " ");
    const birthdate = String(body.birthdate || "");
    const password = String(body.password || "");
    if (!phone) throw new UserError("Ce numéro de téléphone n'a pas l'air valide (ex. 06 12 34 56 78).");
    if (name.length < 2 || name.length > 60) throw new UserError("Indique ton prénom et ton nom.");
    if (!validBirthdate(birthdate)) throw new UserError("Ta date de naissance n'a pas l'air valide.");
    if (password.length < C.passwordMinLength) throw new UserError(`Ton mot de passe doit faire au moins ${C.passwordMinLength} caractères.`);
    if (svc.getClientByPhone(phone)) throw new UserError("Ce numéro a déjà un compte. Connecte-toi !", "exists");
    const id = svc.createClient({ phone, name, birthdate, password, referralCode: String(body.referralCode || "").trim() || null, now });
    const s = svc.createSession("client", id, now);
    setCookie(req, res, COOKIE_CLIENT, s.token, s.maxAge);
    return json(res, 201, { ok: true });
  }

  if (p === "/api/auth/login" && m === "POST") {
    const phone = normalizePhone(body.phone);
    if (!allow("login:" + ip(req), 30, 9e5) || (phone && !allow("login:" + phone, 8, 9e5))) {
      return json(res, 429, { error: "Trop d'essais. Patiente 15 minutes ou réinitialise ton mot de passe." });
    }
    const c = phone && svc.getClientByPhone(phone);
    if (!c || !svc.checkPassword(String(body.password || ""), c.password_hash)) throw new UserError("Numéro ou mot de passe incorrect.");
    const s = svc.createSession("client", c.id, now);
    setCookie(req, res, COOKIE_CLIENT, s.token, s.maxAge);
    return json(res, 200, { ok: true });
  }

  if (p === "/api/auth/logout" && m === "POST") {
    svc.deleteSession(cookies(req)[COOKIE_CLIENT]);
    setCookie(req, res, COOKIE_CLIENT, "", 0);
    return json(res, 200, { ok: true });
  }

  if (p === "/api/auth/reset/request" && m === "POST") {
    const phone = normalizePhone(body.phone);
    if (!phone) throw new UserError("Ce numéro de téléphone n'a pas l'air valide.");
    const generic = { ok: true, message: "Si ce numéro a un compte, tu vas recevoir un SMS avec un code à 6 chiffres." };
    if (!allow("reset:" + ip(req), 10, 36e5) || !allow("reset:" + phone, 3, 36e5)) return json(res, 429, { error: "Trop de demandes. Réessaie dans une heure." });
    const c = svc.getClientByPhone(phone);
    if (c) {
      const code = svc.createResetCode(c.id, now);
      try { await sendSms(phone, `Capriso : ton code pour changer de mot de passe est ${code}. Il est valable ${C.resetCodeMinutes} minutes.`); }
      catch (e) { console.error("SMS non envoyé :", e.message); return json(res, 502, { error: "Le SMS n'a pas pu partir. Réessaie ou appelle-nous au +212 618 401 509." }); }
    }
    return json(res, 200, generic);
  }

  if (p === "/api/auth/reset/confirm" && m === "POST") {
    const phone = normalizePhone(body.phone);
    const password = String(body.password || "");
    if (password.length < C.passwordMinLength) throw new UserError(`Ton mot de passe doit faire au moins ${C.passwordMinLength} caractères.`);
    const c = phone && svc.getClientByPhone(phone);
    if (!c) throw new UserError("Code incorrect.");
    const ok = svc.useResetCode(c.id, String(body.code || ""), password, now);
    if (!ok) throw new UserError("Code incorrect.");
    const s = svc.createSession("client", c.id, now);
    setCookie(req, res, COOKIE_CLIENT, s.token, s.maxAge);
    return json(res, 200, { ok: true });
  }

  /* ----- espace client ----- */
  // solde de l'en-tête : répond aussi aux visiteurs anonymes (pas d'erreur 401 dans la console)
  if (p === "/api/me/summary" && m === "GET" && !clientSession(req)) return json(res, 200, { loggedIn: false });
  if (p === "/api/me" || p === "/api/me/summary" || p === "/api/scan") {
    const s = clientSession(req);
    if (!s) return json(res, 401, { error: "Connecte-toi pour voir tes points." });
    const id = s.client_id;

    if (p === "/api/me/summary" && m === "GET") {
      svc.refresh(id, now);
      const c = svc.getClient(id);
      return json(res, 200, { loggedIn: true, firstName: c.name.split(" ")[0], balance: svc.balance(id, now) });
    }
    if (p === "/api/me" && m === "GET") {
      const r = svc.refresh(id, now);
      return json(res, 200, { ...svc.profile(id, now), justGranted: r.birthday, justExpired: r.expired });
    }
    if (p === "/api/scan" && m === "POST") {
      if (!allow("scan:" + id, 12, 6e4)) return json(res, 429, { error: "Doucement ! Réessaie dans une minute." });
      const result = svc.claimQr(id, body.code, now);
      return json(res, 200, result);
    }
  }

  /* ----- caisse ----- */
  if (p === "/api/caisse/login" && m === "POST") {
    if (!allow("caisse:" + ip(req), 10, 9e5)) return json(res, 429, { error: "Trop d'essais. Patiente 15 minutes." });
    const a = crypto.createHash("sha256").update(String(body.password || "")).digest();
    const b = crypto.createHash("sha256").update(C.caissePassword).digest();
    if (!crypto.timingSafeEqual(a, b)) throw new UserError("Mot de passe incorrect.");
    const s = svc.createSession("caisse", null, now);
    setCookie(req, res, COOKIE_CAISSE, s.token, s.maxAge);
    return json(res, 200, { ok: true });
  }
  if (p.startsWith("/api/caisse/")) {
    if (!caisseSession(req)) return json(res, 401, { error: "Accès caisse requis." });
    if (p === "/api/caisse/me" && m === "GET") return json(res, 200, { ok: true, config: publicConfig() });
    if (p === "/api/caisse/logout" && m === "POST") {
      svc.deleteSession(cookies(req)[COOKIE_CAISSE]);
      setCookie(req, res, COOKIE_CAISSE, "", 0);
      return json(res, 200, { ok: true });
    }
    if (p === "/api/caisse/qr" && m === "POST") {
      const qr = svc.createQr({ kind: body.kind, scoops: +body.scoops, now });
      return json(res, 201, { ...qr, url: `${baseUrl(req)}/points/?scan=${qr.token}`, serverNow: now.toISOString() });
    }
    const mm = p.match(/^\/api\/caisse\/qr\/(\d+)(\/cancel)?$/);
    if (mm) {
      if (mm[2] && m === "POST") svc.cancelQr(+mm[1], now);
      const st = svc.qrStatus(+mm[1], now);
      return st ? json(res, 200, { ...st, serverNow: now.toISOString() }) : json(res, 404, { error: "QR introuvable." });
    }
  }

  return json(res, 404, { error: "Route inconnue." });
}

/* ---------- fichiers statiques ---------- */
function serveStatic(req, res, url) {
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  let rel;
  try { rel = path.posix.normalize(decodeURIComponent(url.pathname).replace(/\\/g, "/")); } catch (e) { res.writeHead(400); return res.end(); }
  if (!rel.startsWith("/")) rel = "/" + rel;
  // le code serveur, la base et les fichiers cachés ne sont jamais servis
  if (/^\/server(\/|$)/.test(rel) || rel.split("/").some((seg) => seg.startsWith("."))) { res.writeHead(404); return res.end("Introuvable"); }
  let file = path.join(C.webRoot, rel);
  if (file !== C.webRoot && !file.startsWith(C.webRoot + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      if (!rel.endsWith("/")) { res.writeHead(301, { Location: rel + "/" + url.search }); return res.end(); }
      file = path.join(file, "index.html");
    }
    fs.stat(file, (err2, st2) => {
      if (err2 || !st2.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); return res.end("Introuvable"); }
      const ext = path.extname(file).toLowerCase();
      const headers = {
        "Content-Type": MIME[ext] || "application/octet-stream",
        "Content-Length": st2.size,
        "Cache-Control": ext === ".html" ? "no-cache" : "public, max-age=3600"
      };
      if (rel.startsWith("/caisse")) headers["X-Robots-Tag"] = "noindex, nofollow";
      res.writeHead(200, headers);
      if (req.method === "HEAD") return res.end();
      fs.createReadStream(file).pipe(res);
    });
  });
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  const url = new URL(req.url, "http://x");
  if (url.pathname.startsWith("/api/")) {
    try { await api(req, res, url); }
    catch (e) {
      if (e.userError) return json(res, 400, { error: e.message, code: e.code });
      console.error(e);
      if (!res.headersSent) json(res, 500, { error: "Petit souci technique. Réessaie dans un instant." });
    }
    return;
  }
  serveStatic(req, res, url);
});

setInterval(() => svc.cleanup(new Date()), 36e5).unref();

server.listen(C.port, () => {
  console.log(`Capriso est servi sur http://localhost:${C.port}/`);
  console.log(`  Mes points : http://localhost:${C.port}/points/`);
  console.log(`  Caisse     : http://localhost:${C.port}/caisse/`);
  if (C.caissePassword === "caisse-capriso-2026") console.log("  ⚠ Mot de passe caisse par défaut : définis CAISSE_PASSWORD en production.");
  if (C.sms.provider === "console") console.log("  SMS en mode console : les codes s'affichent ici.");
});
