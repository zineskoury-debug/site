# Capriso — Passione per il gelato

Site vitrine one-page du glacier **Capriso** (N°37 Résidence Fatine, Bachkou, Casablanca). Il est statique (HTML, CSS et JS vanilla), sans build : ouvre `index.html` ou sers le dossier.

Inspirations : la vidéo « Creamy » (le hero change de parfum et de couleur, vague crème, cartes produit, FAQ verte, cartes inclinées) et la maquette « Frosted Delights » (verre dépoli, pastels, ingrédients flottants, panier). Le tout est décliné dans les couleurs du logo, jaune Capriso et bordeaux.

## Animations

- **Loader** : le cornet du logo se remplit avec le pourcentage, puis l'écran jaune remonte en dégoulinant.
- **Hero** : 5 parfums défilent. La carte change de couleur, les boules sautent hors du pot rayé et de nouvelles tombent en s'écrasant. Le nom géant change lettre par lettre et les ingrédients explosent puis réapparaissent. Il y a aussi une parallaxe souris, un swipe sur mobile, un badge « dès 15 DH » qui tourne et une sortie au scroll.
- **Bandeaux** croisés : vitesse et inclinaison suivent le scroll.
- **Manifeste** : le chocolat coule au scroll et les mots s'allument un à un.
- **Notre histoire** : tuiles en verre avec inclinaison 3D et reflet, fruits en parallaxe.
- **Parfums** : scroll horizontal épinglé, cartes en arc, ruban qui se dessine, favoris (cœurs) et ajout direct d'un cornet au panier, qui s'envole vers le sac.
- **Compose ta glace** : 1 à 3 parfums, cornet ou pot. Le prix roule comme un compteur (15 / 25 / 35 DH). Le panier envoie la commande pré-remplie sur WhatsApp.
- **FAQ** en accordéon, **Le petit code du gelato** en cartes inclinées, **boutique** illustrée (store qui ondule, ampoules), **footer** « A presto! » aux lettres en gelée.
- Partout : curseur boule, vermicelles au clic, boutons magnétiques avec texte qui roule, fond de page qui change de couleur par section, grain léger. `prefers-reduced-motion` est respecté.

## Structure

```
index.html
assets/
  css/capriso.css    tokens + composants
  js/art.js          illustrations SVG générées (boules, pot rayé, cornet, ingrédients)
  js/capriso.js      toutes les interactions
  img/               logo (mot-symbole en masque CSS), favicons
  fonts/             Fraunces (axe SOFT) + Bricolage Grotesque, licence SIL OFL
```

## À vérifier / personnaliser

- **Parfums** : la liste (Fragola, Pistacchio, Cioccolato, Stracciatella, Nocciola, Mango, Limone, Frutti di bosco) est un exemple. Modifie l'objet `FL` dans `assets/js/art.js` et les cartes `.fcard` dans `index.html`.
- **Prix** : ce sont ceux de la story Instagram. La règle « 1 parfum = cornet » vient de la mention « 1 parfum (cornet) » : le pot est proposé à partir de 2 parfums.
- **WhatsApp** : la commande part vers le +212 618 401 509. Change le numéro dans `index.html` et `capriso.js` (`wa.me/212618401509`) s'il n'est pas sur WhatsApp.
