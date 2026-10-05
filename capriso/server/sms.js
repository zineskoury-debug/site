/* =========================================================
   CAPRISO — envoi des SMS (code « mot de passe oublié »).
   provider "console" : le SMS est écrit dans la console (tests).
   provider "twilio"  : envoi réel via l'API Twilio.
   ========================================================= */
const C = require("./config");

async function sendSms(to, body) {
  const s = C.sms;
  if (s.provider === "twilio") {
    if (!s.twilioSid || !s.twilioToken || !s.twilioFrom) throw new Error("Twilio n'est pas configuré (TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM).");
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(s.twilioSid)}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(s.twilioSid + ":" + s.twilioToken).toString("base64"),
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: new URLSearchParams({ To: to, From: s.twilioFrom, Body: body })
    });
    if (!res.ok) throw new Error("Twilio a refusé l'envoi (" + res.status + ")");
    return;
  }
  console.log(`[SMS → ${to}] ${body}`);
}

module.exports = { sendSms };
