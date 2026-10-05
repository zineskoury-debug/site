/* =========================================================
   CAPRISO — comptes de démonstration.
   node capriso/server/seed.js          crée les comptes s'ils n'existent pas
   node capriso/server/seed.js --reset  repart d'une base vide
   ========================================================= */
const fs = require("node:fs");
const C = require("./config");
const { open, createService, localDay } = require("./db");

if (process.argv.includes("--reset")) {
  for (const f of [C.dbFile, C.dbFile + "-wal", C.dbFile + "-shm"]) if (fs.existsSync(f)) fs.unlinkSync(f);
}

const svc = createService(open(C.dbFile));
const PASSWORD = "Gelato2026!";
const daysAgo = (n) => new Date(Date.now() - n * 864e5);

if (svc.getClientByPhone("+212600000000")) {
  console.log("Les comptes de démonstration existent déjà (utilise --reset pour repartir de zéro).");
  process.exit(0);
}

// Salma : 85 pts, des achats, un parrainage et des points expirés
const salma = svc.createClient({ phone: "+212600000000", name: "Salma Test", birthdate: "1998-04-12", password: PASSWORD, code: "SALMA-2026", now: daysAgo(130) });
svc.credit(salma, "achat", 25, "Achat · 2 boules (25 DH)", null, daysAgo(120));   // expirera à la 1re visite
svc.credit(salma, "achat", 40, "Achat · 3 boules (35 DH)", null, daysAgo(50));
svc.credit(salma, "achat", 25, "Achat · 2 boules (25 DH)", null, daysAgo(21));
svc.db.prepare("UPDATE clients SET first_purchase_at = ? WHERE id = ?").run(daysAgo(120).toISOString(), salma);

// Karim : filleul de Salma, premier achat il y a 6 jours
const karim = svc.createClient({ phone: "+212611111111", name: "Karim Test", birthdate: "1995-09-03", password: PASSWORD, code: "KARIM-2026", referralCode: "SALMA-2026", now: daysAgo(7) });
svc.credit(karim, "achat", 15, "Achat · 1 boule (15 DH)", null, daysAgo(6));
svc.credit(karim, "parrainage", C.referral.refereePoints, "Parrainage · bienvenue de la part de Salma", null, daysAgo(6));
svc.credit(salma, "parrainage", C.referral.referrerPoints, "Parrainage · Karim a pris sa première glace", null, daysAgo(6));
svc.db.prepare("UPDATE clients SET first_purchase_at = ? WHERE id = ?").run(daysAgo(6).toISOString(), karim);
svc.db.prepare("UPDATE referrals SET rewarded_at = ? WHERE referee_id = ?").run(daysAgo(6).toISOString(), karim);

// Yassine : c'est son anniversaire cette semaine → +30 pts à sa 1re visite
const today = localDay(new Date());
svc.createClient({ phone: "+212622222222", name: "Yassine Test", birthdate: "2000-" + today.slice(5), password: PASSWORD, code: "YASSINE-2026", now: daysAgo(2) });

console.log("Comptes de démonstration créés (mot de passe : " + PASSWORD + ") :");
console.log("  06 00 00 00 00  Salma Test    85 pts, code SALMA-2026");
console.log("  06 11 11 11 11  Karim Test    35 pts, filleul de Salma");
console.log("  06 22 22 22 22  Yassine Test  anniversaire cette semaine (+30 pts à la 1re visite)");
console.log("Caisse : mot de passe « " + C.caissePassword + " »");
