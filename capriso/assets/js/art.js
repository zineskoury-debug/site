/* =========================================================
   CAPRISO — illustrations « soft 3D » générées en SVG.
   Boules de gelato par parfum, pot rayé Capriso, cornet gaufré
   et ingrédients flottants. Tout est dessiné ici pour que le hero,
   les cartes et le composeur partagent le même trait.
   ========================================================= */
(function () {
  "use strict";

  let uid = 0;
  const id = (p) => p + (++uid).toString(36);
  const n = (v) => Math.round(v * 10) / 10;

  /* ---------- parfums ---------- */
  const FL = {
    fragola:       { name: "Fragola",        fr: "Fraise",          base: "#F7A1B5", light: "#FFD6E0", dark: "#D35E7C", hero: "#FF8BA7", pastel: "#FFE1E9", top: "seeds",   ing: ["strawberry", "raspberry", "strawberry", "raspberry"] },
    pistacchio:    { name: "Pistacchio",     fr: "Pistache",        base: "#B8D27A", light: "#E3EFB9", dark: "#7C9E42", hero: "#86BA48", pastel: "#E3F1CF", top: "pista",   ing: ["pistachio", "pistachio", "mint", "pistachio"] },
    cioccolato:    { name: "Cioccolato",     fr: "Chocolat",        base: "#7D4932", light: "#B4805F", dark: "#46200F", hero: "#BE7C4B", pastel: "#F1DECD", top: "drizzle", ing: ["choc", "hazelnut", "wafer", "choc"] },
    stracciatella: { name: "Stracciatella",  fr: "Vanille & copeaux", base: "#FFF3DC", light: "#FFFFFF", dark: "#E2CDA6", hero: "#6DB2E8", pastel: "#E4F1FC", top: "flakes",  ing: ["choc", "wafer", "almond", "choc"] },
    mangue:        { name: "Mango",          fr: "Mangue",          base: "#FFB84B", light: "#FFDC93", dark: "#E9861B", hero: "#FF9A3D", pastel: "#FFE7C6", top: "none",    ing: ["mango", "mango", "mint", "mango"] },
    nocciola:      { name: "Nocciola",       fr: "Noisette",        base: "#D3A170", light: "#EECDA4", dark: "#9E6C3C", hero: "#C98E55", pastel: "#F4E4D1", top: "hazel",   ing: ["hazelnut", "almond", "hazelnut", "wafer"] },
    limone:        { name: "Limone",         fr: "Citron",          base: "#FBE98D", light: "#FFF9D2", dark: "#DDC23A", hero: "#F2CF2E", pastel: "#FFF5C4", top: "zest",    ing: ["lemon", "mint", "lemon", "mint"] },
    bosco:         { name: "Frutti di bosco", fr: "Fruits des bois", base: "#B99BE3", light: "#E1D3F8", dark: "#7F5EC0", hero: "#9B7FE2", pastel: "#ECE4FC", top: "berries", ing: ["blueberry", "raspberry", "blueberry", "raspberry"] }
  };

  /* ---------- une boule ----------
     (cx, by) = centre de la base, w = largeur. Dessinée dans une
     boîte unitaire de 100 de large puis mise à l'échelle. */
  const SCOOP_PATH =
    "M-50,-8C-54,-32-40,-64-12,-73C3,-79 23,-77 35,-65C51,-53 56,-28 50,-8" +
    "C48,1 41,6 35,0C31,8 21,9 16,2C12,9 2,10-2,2C-6,9-16,9-20,2C-24,8-34,7-38,0C-42,5-50,4-50,-8Z";

  function toppings(f, g) {
    switch (f.top) {
      case "seeds":
        return [[-24, -44], [-6, -58], [14, -48], [28, -30], [-30, -22], [4, -30], [-14, -18], [22, -12]]
          .map(([x, y], i) => `<path d="M${x},${y}l4,-2l3,3l-3,3z" fill="${i % 2 ? "#C2244A" : "#E8476A"}" opacity=".85"/>`).join("");
      case "pista":
        return [[-26, -40], [-4, -60], [18, -44], [30, -24], [-12, -22], [8, -26], [-34, -16]]
          .map(([x, y], i) => `<path d="M${x},${y}l5,-1l2,4l-4,3l-4,-2z" fill="${i % 2 ? "#5E8A2A" : "#8DB04C"}"/>`).join("") +
          `<g transform="translate(6,-74) rotate(-18)"><ellipse rx="10" ry="6.5" fill="#E9DDBF"/><ellipse rx="7" ry="4.6" fill="#7DB23F"/><ellipse cx="-2" cy="-1.5" rx="2.5" ry="1.4" fill="#C6E39A"/></g>`;
      case "drizzle":
        return `<path d="M-40,-46C-28,-58-16,-34-4,-50S18,-60 26,-44S40,-40 44,-50" fill="none" stroke="#3A170A" stroke-width="5" stroke-linecap="round" opacity=".7"/>` +
          `<path d="M-44,-24C-30,-34-18,-14-6,-28S16,-36 28,-22S42,-24 48,-30" fill="none" stroke="#3A170A" stroke-width="4" stroke-linecap="round" opacity=".55"/>` +
          `<g transform="translate(4,-76) rotate(12)"><rect x="-9" y="-7" width="18" height="14" rx="3" fill="#4A2214"/><rect x="-7" y="-6" width="14" height="5" rx="2" fill="#7A4128"/></g>`;
      case "flakes":
        return [[-28, -42, 20], [-8, -60, -30], [14, -50, 40], [30, -30, -10], [-34, -20, 60], [-4, -32, 15], [18, -16, -40], [-18, -10, 80], [4, -66, 70]]
          .map(([x, y, r]) => `<path d="M${x},${y}l7,-2l2,4l-6,3z" fill="#3E1A0C" transform="rotate(${r} ${x} ${y})"/>`).join("");
      case "hazel":
        return `<g transform="translate(-4,-76)"><ellipse cy="3" rx="11" ry="10" fill="#9A5E2C"/><path d="M-11,0C-10,-10 10,-10 11,0Z" fill="#E7C08C"/><ellipse cx="-4" cy="4" rx="3" ry="2" fill="#C98A50" opacity=".8"/></g>` +
          [[-26, -40], [16, -46], [30, -22], [-12, -24]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.6" fill="#8A5428" opacity=".7"/>`).join("");
      case "zest":
        return [[-24, -46], [-2, -60], [18, -42], [30, -26], [-30, -24], [6, -28]]
          .map(([x, y]) => `<rect x="${x}" y="${y}" width="7" height="2.4" rx="1.2" fill="#C9A60E" opacity=".8" transform="rotate(-25 ${x} ${y})"/>`).join("");
      case "berries":
        return `<g transform="translate(2,-78)"><circle r="9" fill="#3B3F9A"/><circle cx="-3" cy="-3" r="3" fill="#8C92E8" opacity=".7"/><path d="M-3,-8l3,2l3,-2l-1,3l3,2h-4l-1,3l-1,-3h-4l3,-2z" fill="#22265E"/></g>` +
          [[-26, -40], [16, -48], [28, -24], [-14, -22], [-34, -18]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 2 ? 3 : 2.4}" fill="${i % 2 ? "#6A3CA8" : "#C23A6E"}" opacity=".8"/>`).join("");
      default:
        return "";
    }
  }

  function scoop(key, cx, by, w, cls) {
    const f = FL[key] || FL.fragola;
    const s = w / 100;
    const g = id("g"), sh = id("s");
    return `<g class="scoop ${cls || ""}" data-f="${key}" transform="translate(${n(cx)} ${n(by)}) scale(${n(s * 100) / 100})">` +
      `<defs><radialGradient id="${g}" cx=".34" cy=".26" r=".85"><stop offset="0" stop-color="${f.light}"/><stop offset=".5" stop-color="${f.base}"/><stop offset="1" stop-color="${f.dark}"/></radialGradient>` +
      `<linearGradient id="${sh}" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="${f.dark}" stop-opacity="0"/><stop offset="1" stop-color="${f.dark}" stop-opacity=".55"/></linearGradient></defs>` +
      `<g class="scoop__body">` +
      `<path d="${SCOOP_PATH}" fill="url(#${g})"/>` +
      `<path d="${SCOOP_PATH}" fill="url(#${sh})"/>` +
      `<g fill="none" stroke-linecap="round">` +
      `<path d="M-38,-50C-20,-63 10,-65 32,-52" stroke="${f.dark}" stroke-width="3" opacity=".28"/>` +
      `<path d="M-38,-53C-20,-66 10,-68 32,-55" stroke="#fff" stroke-width="2.4" opacity=".45"/>` +
      `<path d="M-47,-28C-22,-41 20,-43 47,-27" stroke="${f.dark}" stroke-width="3.2" opacity=".3"/>` +
      `<path d="M-47,-31C-22,-44 20,-46 47,-30" stroke="#fff" stroke-width="2.4" opacity=".35"/>` +
      `<path d="M-49,-11C-22,-21 22,-23 49,-10" stroke="${f.dark}" stroke-width="3" opacity=".3"/>` +
      `</g>` +
      `<ellipse cx="-20" cy="-56" rx="15" ry="7" fill="#fff" opacity=".5" transform="rotate(-24 -20 -56)"/>` +
      `<ellipse cx="-31" cy="-40" rx="4" ry="2.4" fill="#fff" opacity=".6"/>` +
      toppings(f) +
      `</g></g>`;
  }

  /* ---------- pot rayé Capriso ---------- */
  const W = 300, H = 380;

  function cupBody(cx, ty, tw, bw, h) {
    const st = id("st"), cl = id("c"), lg = id("l");
    const half = tw / 2, bhalf = bw / 2;
    const body = `M${cx - half},${ty} L${cx + half},${ty} L${cx + bhalf},${ty + h - 10} Q${cx + bhalf - 2},${ty + h} ${cx + bhalf - 12},${ty + h} L${cx - bhalf + 12},${ty + h} Q${cx - bhalf + 2},${ty + h} ${cx - bhalf},${ty + h - 10} Z`;
    let stripes = "";
    const k = 9;
    for (let i = 0; i < k; i += 2) {
      const t0 = i / k, t1 = (i + 1) / k;
      const x0 = cx - half + tw * t0, x1 = cx - half + tw * t1;
      const b0 = cx - bhalf + bw * t0, b1 = cx - bhalf + bw * t1;
      stripes += `<path d="M${n(x0)},${ty} L${n(x1)},${ty} L${n(b1)},${ty + h} L${n(b0)},${ty + h}Z"/>`;
    }
    return `<defs><clipPath id="${cl}"><path d="${body}"/></clipPath>` +
      `<linearGradient id="${lg}" x1="0" x2="1"><stop offset="0" stop-color="#6E1027" stop-opacity=".32"/><stop offset=".22" stop-color="#6E1027" stop-opacity="0"/><stop offset=".4" stop-color="#fff" stop-opacity=".38"/><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset=".85" stop-color="#6E1027" stop-opacity=".12"/><stop offset="1" stop-color="#6E1027" stop-opacity=".38"/></linearGradient>` +
      `<linearGradient id="${st}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFD84A"/><stop offset="1" stop-color="#F5B91C"/></linearGradient></defs>` +
      `<path d="${body}" fill="#FFF8EA"/>` +
      `<g clip-path="url(#${cl})" fill="url(#${st})">${stripes}</g>` +
      `<path d="${body}" fill="url(#${lg})"/>` +
      `<g transform="translate(${cx} ${ty + h * .55})"><circle r="${n(tw * .11)}" fill="#A3203A"/><circle r="${n(tw * .11 - 3)}" fill="none" stroke="#FFF3DA" stroke-width="1.6" stroke-dasharray="2 3"/>` +
      `<use href="#cap-mark" x="${n(-tw * .055)}" y="${n(-tw * .085)}" width="${n(tw * .11)}" height="${n(tw * .17)}" fill="#FFCD2E"/></g>`;
  }

  function cup(keys, opts) {
    opts = opts || {};
    const cx = W / 2, ty = 200, tw = 196, bw = 140, h = 150;
    const ks = keys.length ? keys : ["fragola"];
    let scoops = "";
    if (ks.length === 1) scoops = scoop(ks[0], cx, ty + 16, tw * .9, "s1");
    else if (ks.length === 2) scoops = scoop(ks[1], cx + tw * .2, ty + 16, tw * .68, "s2") + scoop(ks[0], cx - tw * .2, ty + 18, tw * .68, "s1");
    else scoops = scoop(ks[2], cx + 4, ty - tw * .3, tw * .66, "s3") + scoop(ks[1], cx + tw * .22, ty + 16, tw * .64, "s2") + scoop(ks[0], cx - tw * .22, ty + 18, tw * .64, "s1");
    return `<svg class="art art--cup" viewBox="0 0 ${W} ${H}" ${opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"'}>` +
      `<ellipse class="art__shadow" cx="${cx}" cy="${ty + h + 6}" rx="${bw * .62}" ry="9" fill="#3A0B18" opacity=".16"/>` +
      `<ellipse cx="${cx}" cy="${ty + 2}" rx="${tw / 2 - 4}" ry="12" fill="#C99A1E"/>` +
      `<g class="art__scoops">${scoops}</g>` +
      `<g class="art__vessel">${cupBody(cx, ty + 8, tw, bw, h - 8)}` +
      `<rect x="${cx - tw / 2 - 6}" y="${ty}" width="${tw + 12}" height="18" rx="9" fill="#FFF3D4"/>` +
      `<rect x="${cx - tw / 2 - 6}" y="${ty + 10}" width="${tw + 12}" height="8" rx="4" fill="#E9C46A" opacity=".55"/>` +
      `<rect x="${cx - tw / 2 + 10}" y="${ty + 3}" width="${tw * .38}" height="4" rx="2" fill="#fff" opacity=".9"/></g>` +
      `</svg>`;
  }

  /* ---------- cornet gaufré ---------- */
  function cone(keys, opts) {
    opts = opts || {};
    const cx = W / 2, ty = 196, tw = 150, h = 170;
    const cl = id("c"), cg = id("g"), sg = id("s");
    const body = `M${cx - tw / 2},${ty} L${cx + tw / 2},${ty} L${cx + 7},${ty + h - 6} Q${cx},${ty + h + 6} ${cx - 7},${ty + h - 6} Z`;
    let grid = "";
    for (let i = -6; i <= 8; i++) {
      const x = cx - tw / 2 + i * 22;
      grid += `<path d="M${x},${ty} l90,${h * 1.05}"/><path d="M${x + 60},${ty} l-90,${h * 1.05}"/>`;
    }
    const ks = keys.length ? keys : ["fragola"];
    let scoops = "";
    let by = ty + 14, w = tw * 1.12, top = 0;
    ks.forEach((k, i) => {
      scoops += scoop(k, cx + (i % 2 ? 3 : -2), by, w, "s" + (i + 1));
      top = Math.min(top, by - w * .82);
      by -= w * .52; w *= .94;
    });
    // opts.tall : cadre fixe assez haut pour 3 boules (le composeur ne saute pas)
    const vy = opts.tall ? -110 : Math.floor(top);
    return `<svg class="art art--cone" viewBox="0 ${vy} ${W} ${H - vy}" ${opts.label ? `role="img" aria-label="${opts.label}"` : 'aria-hidden="true"'}>` +
      `<defs><clipPath id="${cl}"><path d="${body}"/></clipPath>` +
      `<linearGradient id="${cg}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F7C779"/><stop offset=".5" stop-color="#E29A46"/><stop offset="1" stop-color="#B2652A"/></linearGradient>` +
      `<linearGradient id="${sg}" x1="0" x2="1"><stop offset="0" stop-color="#5A2A0E" stop-opacity=".35"/><stop offset=".35" stop-color="#fff" stop-opacity=".18"/><stop offset=".6" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#5A2A0E" stop-opacity=".4"/></linearGradient></defs>` +
      `<ellipse class="art__shadow" cx="${cx}" cy="${ty + h + 8}" rx="40" ry="7" fill="#3A0B18" opacity=".14"/>` +
      `<g class="art__vessel"><path d="${body}" fill="url(#${cg})"/>` +
      `<g clip-path="url(#${cl})" fill="none"><g stroke="#9C531E" stroke-width="3.2" opacity=".55">${grid}</g><g stroke="#FFE2AE" stroke-width="1.4" opacity=".45" transform="translate(-2 -2)">${grid}</g></g>` +
      `<path d="${body}" fill="url(#${sg})"/></g>` +
      `<g class="art__scoops">${scoops}</g>` +
      `<rect x="${cx - tw / 2 - 4}" y="${ty - 2}" width="${tw + 8}" height="16" rx="8" fill="#E9A552"/>` +
      `<rect x="${cx - tw / 2 + 6}" y="${ty + 1}" width="${tw * .45}" height="3.5" rx="2" fill="#FFE0A8" opacity=".9"/>` +
      `</svg>`;
  }

  /* ---------- ingrédients ---------- */
  function rg(stops, cx, cy) {
    const g = id("r");
    return [g, `<radialGradient id="${g}" cx="${cx || .35}" cy="${cy || .3}" r=".8">${stops.map((c, i) => `<stop offset="${i / (stops.length - 1)}" stop-color="${c}"/>`).join("")}</radialGradient>`];
  }

  const ING = {
    strawberry() {
      const [g, d] = rg(["#FF8A98", "#EE3F58", "#A8182F"]);
      const [l, dl] = rg(["#9BE07E", "#3F8F37"], .5, .2);
      const seeds = [[36, 42], [50, 38], [64, 42], [30, 56], [44, 54], [58, 54], [70, 56], [38, 68], [52, 68], [64, 68], [46, 80], [56, 80]]
        .map(([x, y]) => `<ellipse cx="${x}" cy="${y}" rx="1.6" ry="2.6" fill="#FFE39A"/>`).join("");
      return `<defs>${d}${dl}</defs><path d="M50,94C30,88 12,64 14,44C16,28 32,22 50,28C68,22 84,28 86,44C88,64 70,88 50,94Z" fill="url(#${g})"/>${seeds}` +
        `<ellipse cx="34" cy="40" rx="8" ry="4" fill="#fff" opacity=".45" transform="rotate(-30 34 40)"/>` +
        `<path d="M50,30L36,18L46,24L42,8L52,22L60,8L58,24L68,16L58,30Z" fill="url(#${l})"/>`;
    },
    raspberry() {
      const [g, d] = rg(["#FF8FB0", "#E2336A", "#9E1546"]);
      const pts = [[38, 34], [50, 30], [62, 34], [32, 46], [44, 44], [56, 44], [68, 46], [36, 58], [48, 56], [60, 58], [42, 70], [54, 70], [48, 82]];
      return `<defs>${d}</defs>` + pts.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8.5" fill="url(#${g})"/><circle cx="${x - 2.5}" cy="${y - 2.5}" r="2" fill="#fff" opacity=".5"/>`).join("") +
        `<path d="M50,26L42,16L50,20L58,16Z" fill="#5E9C3A"/>`;
    },
    blueberry() {
      const [g, d] = rg(["#8D9BEA", "#4552B4", "#1E2566"]);
      return `<defs>${d}</defs><circle cx="50" cy="52" r="40" fill="url(#${g})"/><circle cx="50" cy="52" r="40" fill="#fff" opacity=".08"/>` +
        `<path d="M50,8l5,7l8,-3l-3,8l7,5l-8,2l0,8l-6,-5l-6,5l0,-8l-8,-2l7,-5l-3,-8l8,3z" fill="#1A1F52" transform="translate(0 6) scale(.8) translate(12 0)"/>` +
        `<ellipse cx="34" cy="38" rx="10" ry="6" fill="#fff" opacity=".35" transform="rotate(-30 34 38)"/>`;
    },
    cherry() {
      const [g, d] = rg(["#FF7A7A", "#D61F31", "#7C0A17"]);
      return `<defs>${d}</defs><path d="M48,40C50,24 60,12 76,6" fill="none" stroke="#6B8E23" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M72,8C82,2 94,6 96,14C86,18 76,16 72,8Z" fill="#5DAA45"/>` +
        `<circle cx="46" cy="64" r="32" fill="url(#${g})"/><path d="M46,34C42,36 42,40 46,42" stroke="#7C0A17" stroke-width="2" fill="none"/>` +
        `<ellipse cx="32" cy="52" rx="9" ry="5" fill="#fff" opacity=".55" transform="rotate(-35 32 52)"/>`;
    },
    pistachio() {
      const [s, ds] = rg(["#FBF1DA", "#D9C090", "#A88956"]);
      const [k, dk] = rg(["#C8E58A", "#82B43E", "#4C7A1E"]);
      return `<defs>${ds}${dk}</defs><g transform="rotate(-25 50 50)"><path d="M50,12C74,14 86,38 82,60C78,82 60,92 50,90C40,92 22,82 18,60C14,38 26,14 50,12Z" fill="url(#${s})"/>` +
        `<path d="M50,24C66,28 72,46 68,62C64,76 56,80 50,80C44,80 36,76 32,62C28,46 34,28 50,24Z" fill="url(#${k})"/>` +
        `<path d="M40,40C46,34 56,36 58,44C52,48 44,48 40,40Z" fill="#8E5170" opacity=".45"/>` +
        `<ellipse cx="42" cy="54" rx="5" ry="9" fill="#fff" opacity=".3"/></g>`;
    },
    hazelnut() {
      const [b, db] = rg(["#D89A5E", "#A2622E", "#5E3214"]);
      return `<defs>${db}</defs><path d="M50,26C74,26 86,48 82,66C78,84 62,92 50,92C38,92 22,84 18,66C14,48 26,26 50,26Z" fill="url(#${b})"/>` +
        `<path d="M24,40C28,24 40,16 50,16C60,16 72,24 76,40C66,34 34,34 24,40Z" fill="#E9C996"/>` +
        `<g fill="#C8A270">${[[36, 26], [46, 22], [56, 24], [64, 30], [42, 32], [58, 32]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8"/>`).join("")}</g>` +
        `<path d="M50,16L50,8" stroke="#8A5428" stroke-width="3" stroke-linecap="round"/>` +
        `<ellipse cx="34" cy="60" rx="6" ry="12" fill="#fff" opacity=".22"/>`;
    },
    almond() {
      const [b, db] = rg(["#E7B585", "#B9783F", "#7A4620"]);
      return `<defs>${db}</defs><g transform="rotate(30 50 50)"><path d="M50,6C70,24 76,52 70,72C64,90 36,90 30,72C24,52 30,24 50,6Z" fill="url(#${b})"/>` +
        `<g fill="none" stroke="#7A4620" stroke-width="1.4" opacity=".4"><path d="M42,30C40,50 42,70 46,84"/><path d="M56,28C58,48 58,66 56,84"/><path d="M50,16V86"/></g>` +
        `<ellipse cx="42" cy="44" rx="4" ry="14" fill="#fff" opacity=".3"/></g>`;
    },
    mint() {
      const [g, d] = rg(["#9BF0BD", "#3DB06A", "#1D6E3E"], .4, .3);
      return `<defs>${d}</defs><g transform="rotate(-30 50 50)"><path d="M50,4C76,20 84,52 66,78C60,86 54,92 50,96C46,92 40,86 34,78C16,52 24,20 50,4Z" fill="url(#${g})"/>` +
        `<path d="M50,14V90" stroke="#C9FFE0" stroke-width="2.4" opacity=".7"/>` +
        `<g fill="none" stroke="#C9FFE0" stroke-width="1.6" opacity=".55"><path d="M50,30L64,22M50,44L70,36M50,58L70,52M50,72L64,68M50,30L36,22M50,44L30,36M50,58L30,52M50,72L36,68"/></g></g>`;
    },
    lemon() {
      const [g, d] = rg(["#FFF59A", "#FFE04A", "#F2C21A"], .5, .5);
      let seg = "";
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI * 2 + .06, a1 = ((i + 1) / 8) * Math.PI * 2 - .06;
        seg += `<path d="M50,50L${n(50 + 32 * Math.cos(a0))},${n(50 + 32 * Math.sin(a0))}A32,32 0 0 1 ${n(50 + 32 * Math.cos(a1))},${n(50 + 32 * Math.sin(a1))}Z" fill="url(#${g})"/>`;
      }
      return `<defs>${d}</defs><circle cx="50" cy="50" r="44" fill="#F5C518"/><circle cx="50" cy="50" r="38" fill="#FFF8D6"/>${seg}<circle cx="50" cy="50" r="4" fill="#FFF8D6"/>` +
        `<path d="M22,30A36,36 0 0 1 44,14" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>`;
    },
    mango() {
      return `<g transform="rotate(14 50 50)"><path d="M28,30L60,18L84,36L52,48Z" fill="#FFD467"/><path d="M28,30L52,48L52,86L28,68Z" fill="#FFAA2E"/><path d="M52,48L84,36L84,72L52,86Z" fill="#EE8516"/>` +
        `<path d="M34,32L58,24" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".6"/></g>`;
    },
    choc() {
      return `<g transform="rotate(-12 50 50)"><path d="M22,34L58,22L84,38L48,52Z" fill="#8C5233"/><path d="M22,34L48,52L48,84L22,66Z" fill="#5C2E18"/><path d="M48,52L84,38L84,68L48,84Z" fill="#43200F"/>` +
        `<path d="M38,32L60,28L70,36L48,42Z" fill="#A86A48" opacity=".7"/><path d="M28,36L52,28" stroke="#C99274" stroke-width="2.4" stroke-linecap="round" opacity=".8"/></g>`;
    },
    wafer() {
      const lg = id("w");
      return `<defs><linearGradient id="${lg}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FAD79A"/><stop offset=".5" stop-color="#E7A653"/><stop offset="1" stop-color="#B76E2C"/></linearGradient></defs>` +
        `<g transform="rotate(-38 50 50)"><rect x="8" y="40" width="84" height="20" rx="10" fill="url(#${lg})"/>` +
        `<g stroke="#A85F22" stroke-width="2.4" opacity=".6">${[20, 32, 44, 56, 68, 80].map((x) => `<path d="M${x},41l-6,18"/>`).join("")}</g>` +
        `<ellipse cx="88" cy="50" rx="4" ry="9" fill="#7A4318"/></g>`;
    }
  };

  function ing(type, label) {
    const fn = ING[type] || ING.strawberry;
    return `<svg class="ing__svg" viewBox="0 0 100 100" ${label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"'}>${fn()}</svg>`;
  }

  window.CaprisoArt = { FL, scoop, cup, cone, ing };
})();
