# Ladoze — Smash Burgers

Site vitrine one-page pour **Ladoze**, restaurant de smash burgers. Il reprend un style d'affiche punk : un fond lie-de-vin, un rouge sang et une typographie condensée géante.

Le site est statique (HTML, CSS et JS vanilla), sans build ni dépendance : il suffit d'ouvrir `index.html` ou de servir le dossier.

```bash
npx serve .        # ou : python3 -m http.server
```

## Animations

- **Preloader** : le logo s'écrit de gauche à droite, avec un compteur de 0 à 100 %, puis deux volets se lèvent.
- **Curseur custom** : il grossit sur les liens et affiche « Miam », « Crunch » ou « Slurp » au survol des visuels.
- **Hero** : le titre apparaît lettre par lettre et chaque lettre réagit au survol. Les visuels flottent en parallaxe (souris et scroll), les blobs se déforment en continu, un sticker tourne avec le scroll et un clic sur un burger l'écrase.
- **Boutons** : le texte roule au survol, la couleur se remplit et les CTA principaux sont magnétiques.
- **Bandeaux défilants** croisés : leur vitesse, leur sens et leur inclinaison suivent la vitesse du scroll.
- **Manifeste** : les mots s'allument au fil du scroll.
- **Anatomie** : vue éclatée du burger, couche par couche, en section sticky, avec des étiquettes.
- **La carte** : onglets avec une pastille qui glisse et des cartes filtrées avec des transitions en cascade. Les cartes s'inclinent en 3D au survol et la pastille de prix tourne. Le bouton « Ajouter » envoie le produit en vol vers le panier.
- **Le smash en 4 temps** : scroll horizontal épinglé, dont les illustrations tournent selon leur position.
- **Compteurs** animés, puis phrases géantes qui glissent en sens opposés.
- **Nos spots** : la ligne survolée se remplit de rouge et un visuel suit le curseur.
- **Footer** : le logo géant se révèle comme s'il était écrit à la main.
- `prefers-reduced-motion` est respecté.

## Structure

```
index.html
assets/
  css/style.css      tokens (couleurs, rayons, easing) + composants
  js/main.js         toutes les interactions (aucune librairie)
  img/               logo (rouge / blanc / rose) + illustrations SVG
  fonts/             Anton + Inter auto-hébergées (licence SIL OFL)
```

## À personnaliser

- **Photos** : les visuels sont des illustrations SVG de type sérigraphie. Pour passer à de vraies photos, remplace les fichiers de `assets/img/` ou les `src` dans `index.html`. Des PNG détourés sur fond transparent donnent le meilleur rendu.
- **Adresses, horaires, téléphone, email, réseaux sociaux, liens de commande** : ce sont des exemples à remplacer dans `index.html`.
- **Carte et prix** : les cartes sont dans la section `#carte` de `index.html`. Le compteur dans chaque onglet (`tab__badge`) doit correspondre au nombre de produits.
