/* =========================================================
   CAPRISO — règles du programme de fidélité.
   Toutes les valeurs modifiables sont ici. Redémarre le serveur
   après un changement.
   ========================================================= */
const path = require("node:path");

module.exports = {
  /* ---------- Gains ---------- */
  pointsPerDirham: 1,                 // 1 DH dépensé = 1 point
  products: {                         // boutons de la caisse
    1: { label: "1 boule", priceDh: 15, bonusPoints: 0 },
    2: { label: "2 boules", priceDh: 25, bonusPoints: 0 },
    3: { label: "3 boules", priceDh: 35, bonusPoints: 5 }   // +5 pts bonus pour 3 boules
  },

  /* ---------- Récompenses ---------- */
  rewards: [
    { scoops: 1, points: 150, label: "1 boule offerte" },
    { scoops: 2, points: 250, label: "2 boules offertes" },
    { scoops: 3, points: 350, label: "3 boules offertes" }
  ],

  /* ---------- Bonus ---------- */
  birthday: {
    points: 30,          // +30 pts, une fois par an
    daysBefore: 3,       // « la semaine de l'anniversaire » :
    daysAfter: 3         //   de 3 jours avant à 3 jours après
  },
  referral: {
    referrerPoints: 20,  // pour le parrain
    refereePoints: 20    // pour le filleul, crédités au 1er achat du filleul
  },

  /* ---------- Durées ---------- */
  pointsValidityMonths: 3,               // les points expirent après 3 mois
  expiringSoonDays: 14,                  // alerte « bientôt expirés »
  qrValiditySeconds: +(process.env.QR_TTL || 120),   // QR valable 2 minutes
  clientSessionDays: 180,                // session client persistante (6 mois)
  caisseSessionHours: 12,
  resetCodeMinutes: 10,                  // code SMS « mot de passe oublié »
  resetCodeMaxAttempts: 5,
  passwordMinLength: 8,
  timezone: "Africa/Casablanca",

  /* ---------- Caisse ---------- */
  // À définir en production : CAISSE_PASSWORD=... node server.js
  caissePassword: process.env.CAISSE_PASSWORD || "caisse-capriso-2026",

  /* ---------- Serveur ---------- */
  port: +(process.env.PORT || 8080),
  publicUrl: process.env.PUBLIC_URL || "",        // ex. https://capriso.ma (sinon déduit de la requête)
  cookieSecure: process.env.COOKIE_SECURE === "1", // à activer en HTTPS
  dbFile: process.env.DB_FILE || path.join(__dirname, "data", "capriso.db"),
  webRoot: path.join(__dirname, ".."),

  /* ---------- SMS (mot de passe oublié) ---------- */
  // "console" : le code s'affiche dans la console du serveur (tests).
  // "twilio"  : envoi réel, renseigner les 3 variables ci-dessous.
  sms: {
    provider: process.env.SMS_PROVIDER || "console",
    twilioSid: process.env.TWILIO_ACCOUNT_SID || "",
    twilioToken: process.env.TWILIO_AUTH_TOKEN || "",
    twilioFrom: process.env.TWILIO_FROM || ""
  }
};
