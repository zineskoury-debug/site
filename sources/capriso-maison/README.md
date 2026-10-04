# Capriso — site premium (sources)

Site vitrine immersif pour **Capriso**, glacier artisanal à Bachkou (Casablanca).
Direction éditoriale : grande typographie serif, beaucoup d'espace, storytelling au scroll et une coupe de glace en 3D temps réel.

Le site compilé est publié dans [`/capriso-maison`](../../capriso-maison), à côté des autres sites du dépôt. Il est statique : aucun serveur n'est nécessaire.

## Stack

| Besoin | Outil |
| --- | --- |
| UI | React 19 + TypeScript, Vite |
| Styles | Tailwind CSS v4 (tokens dans `src/styles/index.css`) |
| 3D | Three.js via React Three Fiber (+ quelques helpers drei) |
| Scroll et animations | GSAP + ScrollTrigger, Lenis (scroll doux) |
| Polices | Fraunces (axe *SOFT*) et Manrope, auto-hébergées via Fontsource |

## Commandes

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck + build dans ../../capriso-maison
npm run stills     # régénère les images produit (serveur de dev lancé)
```

## Structure

```
src/
  3d/          scène WebGL : géométries procédurales (boule de glace, coupe, cornet, pot, ingrédients),
               textures canvas, lumières, chorégraphie (Experience.tsx) et état partagé (stage.ts)
  animations/  intégration GSAP / ScrollTrigger / Lenis, hook useGsap, révélations de texte
  components/  Nav, curseur, bouton magnétique, preloader, footer, SplitText
  sections/    Hero, Ingrédients, Transformation, Parfums, Notre glace, Savoir-faire, Histoire, Choisir, CTA
  data/        contenus éditables : infos pratiques (site.ts), parfums (flavors.ts), offres (products.ts)
  studio/      « studio photo » de dev : rend les images produit à partir des modèles 3D
brand-src/     logos PNG d'origine (sources des WebP, de l'icône et de l'image Open Graph)
public/
  brand/       logos WebP, icônes, image Open Graph
  images/      images produit (WebP) — remplaçables par de vraies photos
```

### Comment la 3D suit le scroll

Un seul canvas fixe est placé derrière la page. Chaque section écrit sa progression de scroll dans `stage` (`src/3d/stage.ts`) via ScrollTrigger, et la scène lit ces valeurs à chaque image :

1. **Hero** : la coupe flotte, suit la souris, puis tourne et zoome au scroll.
2. **Ingrédients** : elle se dissout et les ingrédients s'en échappent, avec des légendes qui suivent les objets.
3. **Transformation** : les ingrédients reconvergent et la glace se reforme.
4. **Notre glace** : le pot entre, tourne sous une lumière qui change, puis ouvre son couvercle.

Le rendu WebGL s'arrête complètement quand aucune zone 3D n'est à l'écran.

## Performance et accessibilité

- Three.js est chargé dans un chunk séparé, en parallèle du preloader. Le bundle initial pèse ~135 ko gzip.
- Sur mobile, la géométrie est allégée, la densité de pixels limitée et il y a moins d'ingrédients et de particules. La résolution baisse automatiquement si le FPS chute.
- Avec `prefers-reduced-motion` : pas de scroll doux, de parallaxe ni d'animation continue, et les textes s'affichent directement.
- Navigation clavier, lien d'évitement, focus visibles, `aria-label` sur les titres découpés, textes alternatifs.
- Sans WebGL, des images fixes remplacent la 3D.
- SEO : balises meta et Open Graph, données structurées `IceCreamShop` (adresse, horaires, prix) et contenu `<noscript>`.

## À vérifier ou personnaliser

- **Horaires** (`src/data/site.ts` et le JSON-LD de `index.html`) : ce sont des valeurs d'exemple, à confirmer.
- **Textes produits** (ingrédients, « 500 ml », « turbinée en petites quantités »…) : à valider avec la maison.
- **Images** : les visuels de `public/images` sont des rendus 3D. Pour passer à des photos, remplacez les fichiers en gardant les mêmes noms (PNG/WebP détourés sur fond transparent pour les parfums et produits).
- **Open Graph** : les URLs sont relatives. Une fois le domaine connu, mettez des URLs absolues dans `index.html`.
