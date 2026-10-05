# Capriso — programme de fidélité

Petit serveur Node.js qui sert le site Capriso **et** l'API de fidélité, avec une base SQLite (un seul fichier). Il n'a aucune dépendance : pas de `npm install`.

```bash
node capriso/server/seed.js --reset   # base de démonstration (facultatif)
node capriso/server/server.js         # http://localhost:8080/
node capriso/server/test.js           # 25 tests de bout en bout de l'API
```

Il faut **Node 22.13 ou plus récent** (SQLite est intégré à Node).

## Pages

| Adresse | Rôle |
|---|---|
| `/` | Le site. Le menu contient « Mes points » et, une fois connecté, le solde (« 85 pts ») |
| `/connexion/` | Connexion, inscription, mot de passe oublié (code par SMS) |
| `/points/` | Solde, progression, récompenses, historique, parrainage, scanner |
| `/caisse/` | Caisse, protégée par mot de passe et non liée dans le menu |

## Toutes les règles sont dans `config.js`

Points par dirham, bonus de 3 boules, récompenses (150 / 250 / 350 pts), bonus anniversaire (+30 pts, fenêtre de ±3 jours), parrainage (+20 / +20), validité des points (3 mois), durée d'un QR (2 min), sessions, etc. Après une modification, redémarre le serveur.

## Variables d'environnement (production)

| Variable | Rôle |
|---|---|
| `CAISSE_PASSWORD` | **Obligatoire en production.** Mot de passe de la page `/caisse/` |
| `PORT` | Port d'écoute (8080 par défaut) |
| `PUBLIC_URL` | Adresse publique utilisée dans les QR, ex. `https://capriso.ma` (sinon déduite de la requête) |
| `COOKIE_SECURE=1` | Cookies « Secure » (à activer en HTTPS) |
| `DB_FILE` | Chemin de la base (par défaut `server/data/capriso.db`, exclue de git) |
| `SMS_PROVIDER=twilio` + `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` | Envoi réel des SMS « mot de passe oublié ». Sans ces variables, le code s'affiche dans la console du serveur |

## Hébergement

- **Où héberger** : n'importe quel hébergeur Node avec un disque persistant (VPS, Render, Railway…), derrière HTTPS. La caméra du téléphone exige HTTPS.
- **Commande de démarrage** : `node capriso/server/server.js`.
- **Sauvegarde** : copier le fichier `capriso.db`.
- **Site statique seul** : il fonctionne toujours, mais sans « Mes points ».

## Sécurité

- **Mots de passe** : hachés avec scrypt.
- **Sessions** : jeton aléatoire dans un cookie httpOnly / SameSite=Lax, valable 6 mois pour un client et 12 h pour la caisse. Seul le hachage du jeton est stocké en base.
- **Isolation** : chaque appel client est lié à sa session, un client ne lit que ses propres points.
- **Attaques par force brute** : essais limités à la connexion (8 par numéro en 15 min), au scan, à la caisse et aux demandes de SMS.
- **Faux formulaires (CSRF)** : les écritures exigent du JSON et la même origine.
- **QR codes** : jeton aléatoire, valable 2 min, consommé une seule fois dans une transaction (deux scans simultanés ne créditent qu'une fois).
- **Fichiers protégés** : le dossier `server/` et la base ne sont jamais servis.
