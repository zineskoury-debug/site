/* =========================================================
   CAPRISO — base SQLite et règles de fidélité.
   SQLite est intégré à Node (≥ 22.13) : aucune dépendance.
   ========================================================= */
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const C = require("./config");

// Node signale SQLite comme « expérimental » : on masque ce seul avertissement.
process.removeAllListeners("warning");
process.on("warning", (w) => { if (!/SQLite/.test(w.message)) console.warn(`${w.name}: ${w.message}`); });
const { DatabaseSync } = require("node:sqlite");

function open(file) {
  if (file !== ":memory:") fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    PRAGMA busy_timeout = 5000;

    CREATE TABLE IF NOT EXISTS clients (
      id                  INTEGER PRIMARY KEY,
      phone               TEXT NOT NULL UNIQUE,
      name                TEXT NOT NULL,
      birthdate           TEXT NOT NULL,             -- AAAA-MM-JJ
      password_hash       TEXT NOT NULL,
      referral_code       TEXT NOT NULL UNIQUE,
      birthday_bonus_year INTEGER,
      first_purchase_at   TEXT,
      created_at          TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token_hash TEXT PRIMARY KEY,
      kind       TEXT NOT NULL CHECK (kind IN ('client', 'caisse')),
      client_id  INTEGER REFERENCES clients(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    -- QR générés par la caisse (usage unique, durée limitée)
    CREATE TABLE IF NOT EXISTS qr_codes (
      id           INTEGER PRIMARY KEY,
      token        TEXT NOT NULL UNIQUE,
      short_code   TEXT NOT NULL,
      kind         TEXT NOT NULL CHECK (kind IN ('gain', 'recompense')),
      scoops       INTEGER NOT NULL,
      amount_dh    INTEGER NOT NULL,
      points       INTEGER NOT NULL,
      label        TEXT NOT NULL,
      created_at   TEXT NOT NULL,
      expires_at   TEXT NOT NULL,
      used_at      TEXT,
      used_by      INTEGER REFERENCES clients(id),
      cancelled_at TEXT,
      refused_note TEXT                                -- dernier refus (ex. solde insuffisant)
    );
    CREATE INDEX IF NOT EXISTS qr_short ON qr_codes (short_code);

    -- Historique : chaque mouvement de points. Les crédits forment des
    -- « lots » (remaining, expires_at) consommés du plus ancien au plus récent.
    CREATE TABLE IF NOT EXISTS movements (
      id         INTEGER PRIMARY KEY,
      client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      type       TEXT NOT NULL CHECK (type IN ('achat', 'recompense', 'anniversaire', 'parrainage', 'expiration')),
      points     INTEGER NOT NULL,
      remaining  INTEGER NOT NULL DEFAULT 0,
      expires_at TEXT,
      label      TEXT NOT NULL,
      qr_id      INTEGER REFERENCES qr_codes(id),
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS mv_client ON movements (client_id, created_at);

    CREATE TABLE IF NOT EXISTS referrals (
      id          INTEGER PRIMARY KEY,
      referrer_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      referee_id  INTEGER NOT NULL UNIQUE REFERENCES clients(id) ON DELETE CASCADE,
      code        TEXT NOT NULL,
      created_at  TEXT NOT NULL,
      rewarded_at TEXT
    );

    CREATE TABLE IF NOT EXISTS reset_codes (
      id         INTEGER PRIMARY KEY,
      client_id  INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
      code_hash  TEXT NOT NULL,
      attempts   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      used_at    TEXT
    );
  `);
  return db;
}

/* ---------- utilitaires ---------- */
const iso = (d) => (d || new Date()).toISOString();
const sha = (s) => crypto.createHash("sha256").update(String(s)).digest("hex");
function addMonths(d, m) {
  const r = new Date(d.getTime());
  const day = r.getUTCDate();
  r.setUTCMonth(r.getUTCMonth() + m);
  if (r.getUTCDate() < day) r.setUTCDate(0); // 31 mai + 3 mois → 31 août, 30 nov. + 3 → 28/29 fév.
  return r;
}
// date « locale » (Casablanca) au format AAAA-MM-JJ
function localDay(d) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: C.timezone, year: "numeric", month: "2-digit", day: "2-digit" }).format(d || new Date());
}
const dayNum = (s) => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10)) / 864e5;

function normalizePhone(raw) {
  let p = String(raw || "").replace(/[\s.\-()]/g, "");
  if (p.startsWith("00")) p = "+" + p.slice(2);
  if (/^0[5-7]\d{8}$/.test(p)) p = "+212" + p.slice(1);          // 06 12 34 56 78
  else if (/^212[5-7]\d{8}$/.test(p)) p = "+" + p;
  else if (/^[5-7]\d{8}$/.test(p)) p = "+212" + p;
  return /^\+\d{9,15}$/.test(p) ? p : null;
}

function hashPassword(pw) {
  const salt = crypto.randomBytes(16);
  const h = crypto.scryptSync(String(pw), salt, 64);
  return "scrypt$" + salt.toString("hex") + "$" + h.toString("hex");
}
function checkPassword(pw, stored) {
  const [alg, salt, hash] = String(stored).split("$");
  if (alg !== "scrypt" || !salt || !hash) return false;
  const h = crypto.scryptSync(String(pw), Buffer.from(salt, "hex"), 64);
  const ref = Buffer.from(hash, "hex");
  return ref.length === h.length && crypto.timingSafeEqual(h, ref);
}

const ALPHA = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // sans 0/O, 1/I/L
function randomCode(n) {
  let s = "";
  const b = crypto.randomBytes(n);
  for (let i = 0; i < n; i++) s += ALPHA[b[i] % ALPHA.length];
  return s;
}

/* =========================================================
   Service de fidélité
   ========================================================= */
function createService(db) {
  const q = (sql) => db.prepare(sql);

  function tx(fn) {
    db.exec("BEGIN IMMEDIATE");
    try { const r = fn(); db.exec("COMMIT"); return r; }
    catch (e) { db.exec("ROLLBACK"); throw e; }
  }

  /* ---------- clients ---------- */
  function referralCodeFor(name) {
    const base = firstName(name).normalize("NFD").replace(/[̀-ͯ]/g, "").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 6) || "GELATO";
    for (;;) {
      const code = base + "-" + (1000 + crypto.randomInt(9000));
      if (!q("SELECT 1 FROM clients WHERE referral_code = ?").get(code)) return code;
    }
  }

  function createClient({ phone, name, birthdate, password, referralCode, now, code }) {
    now = now || new Date();
    return tx(() => {
      let referrer = null;
      if (referralCode) {
        referrer = q("SELECT id, referral_code FROM clients WHERE referral_code = ?").get(String(referralCode).trim().toUpperCase());
        if (!referrer) throw new UserError("Ce code de parrainage n'existe pas. Vérifie l'orthographe ou laisse le champ vide.");
      }
      const r = q(`INSERT INTO clients (phone, name, birthdate, password_hash, referral_code, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
        .run(phone, name, birthdate, hashPassword(password), code || referralCodeFor(name), iso(now));
      const id = Number(r.lastInsertRowid);
      if (referrer) q("INSERT INTO referrals (referrer_id, referee_id, code, created_at) VALUES (?, ?, ?, ?)").run(referrer.id, id, referrer.referral_code, iso(now));
      return id;
    });
  }

  const getClient = (id) => q("SELECT * FROM clients WHERE id = ?").get(id);
  const getClientByPhone = (phone) => q("SELECT * FROM clients WHERE phone = ?").get(phone);

  /* ---------- sessions ---------- */
  function createSession(kind, clientId, now) {
    now = now || new Date();
    const token = crypto.randomBytes(32).toString("base64url");
    const ms = kind === "caisse" ? C.caisseSessionHours * 36e5 : C.clientSessionDays * 864e5;
    q("INSERT INTO sessions (token_hash, kind, client_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)")
      .run(sha(token), kind, clientId || null, iso(now), iso(new Date(now.getTime() + ms)));
    return { token, maxAge: Math.floor(ms / 1000) };
  }
  function readSession(token, kind) {
    if (!token) return null;
    const s = q("SELECT * FROM sessions WHERE token_hash = ? AND kind = ?").get(sha(token), kind);
    if (!s) return null;
    if (s.expires_at <= iso()) { q("DELETE FROM sessions WHERE token_hash = ?").run(s.token_hash); return null; }
    return s;
  }
  const deleteSession = (token) => token && q("DELETE FROM sessions WHERE token_hash = ?").run(sha(token));
  const deleteClientSessions = (clientId) => q("DELETE FROM sessions WHERE client_id = ?").run(clientId);

  /* ---------- points ---------- */
  function credit(clientId, type, points, label, qrId, now) {
    q(`INSERT INTO movements (client_id, type, points, remaining, expires_at, label, qr_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(clientId, type, points, points, iso(addMonths(now, C.pointsValidityMonths)), label, qrId || null, iso(now));
  }

  // Les lots arrivés à échéance sont soldés par un mouvement « expiration ».
  function expire(clientId, now) {
    const lots = q("SELECT id, remaining FROM movements WHERE client_id = ? AND remaining > 0 AND expires_at <= ?").all(clientId, iso(now));
    if (!lots.length) return 0;
    let total = 0;
    for (const l of lots) { total += l.remaining; q("UPDATE movements SET remaining = 0 WHERE id = ?").run(l.id); }
    q(`INSERT INTO movements (client_id, type, points, label, created_at) VALUES (?, 'expiration', ?, ?, ?)`)
      .run(clientId, -total, "Points expirés", iso(now));
    return total;
  }

  const balance = (clientId, now) =>
    Number(q("SELECT COALESCE(SUM(remaining), 0) AS b FROM movements WHERE client_id = ? AND remaining > 0 AND expires_at > ?").get(clientId, iso(now)).b);

  // consomme les points les plus anciens d'abord
  function debit(clientId, points, label, qrId, now) {
    let left = points;
    const lots = q("SELECT id, remaining FROM movements WHERE client_id = ? AND remaining > 0 AND expires_at > ? ORDER BY expires_at, id").all(clientId, iso(now));
    for (const l of lots) {
      if (!left) break;
      const take = Math.min(left, l.remaining);
      q("UPDATE movements SET remaining = remaining - ? WHERE id = ?").run(take, l.id);
      left -= take;
    }
    q(`INSERT INTO movements (client_id, type, points, label, qr_id, created_at) VALUES (?, 'recompense', ?, ?, ?, ?)`)
      .run(clientId, -points, label, qrId || null, iso(now));
  }

  // Bonus anniversaire : une fois par an, pendant la fenêtre autour de la date.
  function birthdayCheck(clientId, now) {
    const c = getClient(clientId);
    if (!c) return null;
    const today = localDay(now);
    const y = +today.slice(0, 4);
    const [, mm, dd] = c.birthdate.split("-");
    for (const year of [y - 1, y, y + 1]) {
      let md = mm + "-" + dd;
      const leap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
      if (md === "02-29" && !leap) md = "02-28";
      const diff = dayNum(today) - dayNum(year + "-" + md);
      if (diff >= -C.birthday.daysBefore && diff <= C.birthday.daysAfter) {
        if (c.birthday_bonus_year === year) return null;
        q("UPDATE clients SET birthday_bonus_year = ? WHERE id = ?").run(year, clientId);
        credit(clientId, "anniversaire", C.birthday.points, "Bonus anniversaire", null, now);
        return { points: C.birthday.points, label: "Bonus anniversaire" };
      }
    }
    return null;
  }

  // À chaque visite : expiration + éventuel bonus anniversaire.
  function refresh(clientId, now) {
    return tx(() => ({ expired: expire(clientId, now), birthday: birthdayCheck(clientId, now) }));
  }

  /* ---------- QR ---------- */
  function createQr({ kind, scoops, now }) {
    now = now || new Date();
    let points, amount, label;
    if (kind === "gain") {
      const p = C.products[scoops];
      if (!p) throw new UserError("Produit inconnu.");
      amount = p.priceDh;
      points = p.priceDh * C.pointsPerDirham + (p.bonusPoints || 0);
      label = `Achat · ${p.label} (${p.priceDh} DH)`;
    } else if (kind === "recompense") {
      const r = C.rewards.find((x) => x.scoops === +scoops);
      if (!r) throw new UserError("Récompense inconnue.");
      amount = 0; points = r.points; label = `Récompense · ${r.label}`;
    } else throw new UserError("Type de QR inconnu.");

    return tx(() => {
      const token = crypto.randomBytes(18).toString("base64url");
      let short;
      do { short = randomCode(6); }
      while (q("SELECT 1 FROM qr_codes WHERE short_code = ? AND used_at IS NULL AND cancelled_at IS NULL AND expires_at > ?").get(short, iso(now)));
      const expires = new Date(now.getTime() + C.qrValiditySeconds * 1000);
      const r = q(`INSERT INTO qr_codes (token, short_code, kind, scoops, amount_dh, points, label, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(token, short, kind, +scoops, amount, points, label, iso(now), iso(expires));
      return { id: Number(r.lastInsertRowid), token, shortCode: short, kind, scoops: +scoops, points, label, expiresAt: iso(expires) };
    });
  }

  function qrStatus(id, now) {
    const r = q("SELECT * FROM qr_codes WHERE id = ?").get(id);
    if (!r) return null;
    const base = { id: r.id, kind: r.kind, points: r.points, label: r.label, expiresAt: r.expires_at };
    if (r.used_at) {
      const c = getClient(r.used_by);
      return { ...base, status: "used", client: c ? firstName(c.name) : "", balance: c ? balance(c.id, now) : null, usedAt: r.used_at };
    }
    if (r.cancelled_at) return { ...base, status: "cancelled" };
    if (r.expires_at <= iso(now)) return { ...base, status: "expired" };
    return { ...base, status: "pending", refused: r.refused_note ? JSON.parse(r.refused_note) : null };
  }

  function cancelQr(id, now) {
    q("UPDATE qr_codes SET cancelled_at = ? WHERE id = ? AND used_at IS NULL AND cancelled_at IS NULL").run(iso(now), id);
  }

  // Le client scanne : le QR est consommé une seule fois, dans une transaction.
  function claimQr(clientId, code, now) {
    now = now || new Date();
    const raw = String(code || "").trim();
    const out = tx(() => {
      let r = q("SELECT * FROM qr_codes WHERE token = ?").get(raw);
      if (!r && /^[A-Za-z0-9]{6}$/.test(raw)) {
        r = q("SELECT * FROM qr_codes WHERE short_code = ? ORDER BY id DESC LIMIT 1").get(raw.toUpperCase());
      }
      if (!r) throw new UserError("Ce code n'existe pas. Demande un nouveau QR en caisse.", "unknown");
      if (r.used_at) throw new UserError("Ce QR a déjà été utilisé. Chaque QR ne sert qu'une fois.", "used");
      if (r.cancelled_at) throw new UserError("Ce QR a été annulé par la caisse.", "cancelled");
      if (r.expires_at <= iso(now)) throw new UserError("Ce QR a expiré (2 minutes max). Demande un nouveau code en caisse.", "expired");

      const c = getClient(clientId);
      expire(clientId, now);
      const extras = [];

      if (r.kind === "recompense") {
        const b = balance(clientId, now);
        if (b < r.points) {
          const note = { client: firstName(c.name), balance: b, missing: r.points - b, at: iso(now) };
          q("UPDATE qr_codes SET refused_note = ? WHERE id = ?").run(JSON.stringify(note), r.id);
          // on valide la transaction (le refus reste visible en caisse), puis on signale l'erreur
          return { refused: `Il te manque ${r.points - b} pts pour cette récompense (tu as ${b} pts).` };
        }
      }

      const upd = q("UPDATE qr_codes SET used_at = ?, used_by = ? WHERE id = ? AND used_at IS NULL").run(iso(now), clientId, r.id);
      if (upd.changes !== 1) throw new UserError("Ce QR a déjà été utilisé. Chaque QR ne sert qu'une fois.", "used");

      if (r.kind === "gain") {
        credit(clientId, "achat", r.points, r.label, r.id, now);
        if (!c.first_purchase_at) {
          q("UPDATE clients SET first_purchase_at = ? WHERE id = ?").run(iso(now), clientId);
          const ref = q("SELECT * FROM referrals WHERE referee_id = ? AND rewarded_at IS NULL").get(clientId);
          if (ref) {
            const parrain = getClient(ref.referrer_id);
            credit(clientId, "parrainage", C.referral.refereePoints, `Parrainage · bienvenue de la part de ${firstName(parrain.name)}`, null, now);
            credit(ref.referrer_id, "parrainage", C.referral.referrerPoints, `Parrainage · ${firstName(c.name)} a pris sa première glace`, null, now);
            q("UPDATE referrals SET rewarded_at = ? WHERE id = ?").run(iso(now), ref.id);
            extras.push({ label: "Bonus parrainage", points: C.referral.refereePoints });
          }
        }
      } else {
        debit(clientId, r.points, r.label, r.id, now);
      }
      return { kind: r.kind, points: r.points, label: r.label, scoops: r.scoops, extras, balance: balance(clientId, now) };
    });
    if (out.refused) throw new UserError(out.refused, "insufficient");
    return out;
  }

  /* ---------- profil ---------- */
  function profile(clientId, now) {
    const c = getClient(clientId);
    const b = balance(clientId, now);
    const rewards = C.rewards.map((r) => ({ ...r, unlocked: b >= r.points, missing: Math.max(0, r.points - b) }));
    const next = rewards.find((r) => !r.unlocked) || null;
    const soonLimit = iso(new Date(now.getTime() + C.expiringSoonDays * 864e5));
    const soon = q("SELECT COALESCE(SUM(remaining), 0) AS p, MIN(expires_at) AS d FROM movements WHERE client_id = ? AND remaining > 0 AND expires_at > ? AND expires_at <= ?").get(clientId, iso(now), soonLimit);
    const history = q("SELECT type, points, label, created_at FROM movements WHERE client_id = ? ORDER BY created_at DESC, id DESC LIMIT 60").all(clientId)
      .map((m) => ({ type: m.type, points: m.points, label: m.label, date: m.created_at }));
    const ref = q("SELECT COUNT(*) AS n, SUM(rewarded_at IS NOT NULL) AS ok FROM referrals WHERE referrer_id = ?").get(clientId);
    // bonus anniversaire récent (pour la fête à l'écran, même s'il a été crédité ailleurs)
    const bday = q("SELECT points, created_at FROM movements WHERE client_id = ? AND type = 'anniversaire' AND created_at > ? ORDER BY id DESC LIMIT 1")
      .get(clientId, iso(new Date(now.getTime() - (C.birthday.daysBefore + C.birthday.daysAfter + 1) * 864e5)));
    return {
      name: c.name,
      firstName: firstName(c.name),
      phone: c.phone,
      birthdate: c.birthdate,
      referralCode: c.referral_code,
      referrals: { invited: Number(ref.n || 0), rewarded: Number(ref.ok || 0) },
      balance: b,
      rewards,
      nextReward: next,
      expiringSoon: Number(soon.p) > 0 ? { points: Number(soon.p), date: soon.d } : null,
      birthdayBonus: bday ? { points: bday.points, date: bday.created_at } : null,
      history
    };
  }

  /* ---------- mot de passe oublié ---------- */
  function createResetCode(clientId, now) {
    const code = String(crypto.randomInt(0, 1e6)).padStart(6, "0");
    q("UPDATE reset_codes SET used_at = ? WHERE client_id = ? AND used_at IS NULL").run(iso(now), clientId);
    q("INSERT INTO reset_codes (client_id, code_hash, created_at, expires_at) VALUES (?, ?, ?, ?)")
      .run(clientId, sha(clientId + ":" + code), iso(now), iso(new Date(now.getTime() + C.resetCodeMinutes * 6e4)));
    return code;
  }
  function useResetCode(clientId, code, newPassword, now) {
    return tx(() => {
      const r = q("SELECT * FROM reset_codes WHERE client_id = ? AND used_at IS NULL ORDER BY id DESC LIMIT 1").get(clientId);
      if (!r || r.expires_at <= iso(now)) throw new UserError("Ce code a expiré. Demande un nouveau SMS.");
      if (r.attempts >= C.resetCodeMaxAttempts) throw new UserError("Trop d'essais. Demande un nouveau SMS.");
      q("UPDATE reset_codes SET attempts = attempts + 1 WHERE id = ?").run(r.id);
      const ok = crypto.timingSafeEqual(Buffer.from(sha(clientId + ":" + String(code).trim())), Buffer.from(r.code_hash));
      if (!ok) return false;
      q("UPDATE reset_codes SET used_at = ? WHERE id = ?").run(iso(now), r.id);
      q("UPDATE clients SET password_hash = ? WHERE id = ?").run(hashPassword(newPassword), clientId);
      q("DELETE FROM sessions WHERE client_id = ?").run(clientId);
      return true;
    });
  }

  function cleanup(now) {
    q("DELETE FROM sessions WHERE expires_at <= ?").run(iso(now));
    q("DELETE FROM reset_codes WHERE expires_at <= ?").run(iso(new Date(now.getTime() - 864e5)));
  }

  return {
    db, tx, createClient, getClient, getClientByPhone, checkPassword,
    createSession, readSession, deleteSession, deleteClientSessions,
    credit, debit, expire, balance, refresh, birthdayCheck,
    createQr, qrStatus, cancelQr, claimQr, profile,
    createResetCode, useResetCode, cleanup
  };
}

class UserError extends Error {
  constructor(message, code) { super(message); this.userError = true; this.code = code || "invalid"; }
}
const firstName = (name) => String(name).trim().split(/\s+/)[0];

module.exports = { open, createService, normalizePhone, hashPassword, localDay, addMonths, UserError, firstName, iso };
