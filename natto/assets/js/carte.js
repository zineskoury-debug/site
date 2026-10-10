/* =========================================================
   NATTO — la carte complète (prix en dirhams).
   Format d'un plat : [nom, prix] ou [nom, description, prix].
   `img` renvoie à assets/img/carte/<img>.webp.
   ========================================================= */
window.NATTO_CARTE = [
  {
    id: "entrees", nom: "Pour commencer", jp: "一",
    rubriques: [
      { id: "soupes", nom: "Soupes", img: "soupes", plats: [
        ["Miso", "Tofu, poireau, wakame", 40],
        ["Miso palourdes", "Palourdes, vermicelle, champignons, poireau, wakame", 50],
        ["Fruits de mer", "Crevettes, palourdes, poisson blanc, calamars, saumon", 60],
        ["Saumon", "Saumon, asperge, champignons, brocoli", 55],
        ["Crabe", "Crabe, lait de coco", 60],
        ["Poulet", "Poulet, udon, brocoli, champignons", 50],
      ] },
      { id: "accompagnements", nom: "Accompagnements", img: "accompagnements", plats: [
        ["Edamame", 35], ["Edamame épicé", 40], ["Goma wakame", 45], ["Riz nature", 20],
        ["Riz vinaigré", 25], ["Riz sauté", 35], ["Salade de choux", 30], ["Nouilles sautées", 40],
      ] },
      { id: "starters", nom: "Starters", img: "starters", plats: [
        ["Crevettes shiitake", 70], ["Crevettes panées", 55], ["Boulettes de saumon", 45], ["Poulet karaage", 40],
        ["Beignets de crevettes", 45], ["Ebi fry", 50], ["Aubergine miso", 60],
      ] },
      { id: "nems", nom: "Nems", img: "nems", plats: [
        ["Crevette", 60], ["Poulet", 40], ["Légumes", 35], ["Fromage épinards", 45],
      ] },
      { id: "gyoza", nom: "Gyoza", img: "gyoza", plats: [
        ["Crevette", 70], ["Poulet", 60], ["Bœuf", 70], ["Saumon épinards", 70],
      ] },
      { id: "croquettes", nom: "Croquettes", img: "croquettes", plats: [
        ["Crevette", 65], ["Saumon fromage", 65], ["Crabe poisson blanc", 70],
      ] },
      { id: "bouchees", nom: "Bouchées vapeur", img: "bouchees", plats: [
        ["Crevette", 65], ["Poulet", 60], ["Crabe", 70],
      ] },
      { id: "tacos", nom: "Tacos", note: "Servis par 3 pièces", img: "tacos", plats: [
        ["Saumon avocat", 55], ["Crabe", 60], ["Saumon épicé", 60], ["Crevette champignon", 60], ["Poulet garlic", 50],
        ["Saumon ikura", 65], ["Bœuf foie gras", 75], ["Thon avocat", 55], ["Thon épicé", 60],
      ] },
      { id: "brochettes", nom: "Brochettes", note: "Servies par 2 pièces", img: "brochettes", plats: [
        ["Poulet fromage", 50], ["Boulettes de poulet", 40], ["Crevette", 55], ["Bœuf fromage", 60],
        ["Poisson blanc", 55], ["Saumon", 55], ["Cuisses de poulet", 45], ["Bœuf fromage pané", 65],
      ] },
    ],
  },
  {
    id: "cru", nom: "Le cru", jp: "二",
    rubriques: [
      { id: "chirashi", nom: "Chirashi", img: "chirashi", plats: [
        ["Saumon", 65], ["Thon", 65], ["Saumon avocat", 65], ["Saumon avocat mangue", 70], ["Thon avocat", 65],
        ["Thon saumon avocat", 70], ["Crabe ikura Saint-Jacques", 95], ["Anguille", 105],
      ] },
      { id: "salades", nom: "Salades", img: "salades", plats: [
        ["Ceviche", "Saumon, thon, crevettes, poisson blanc, avocat, tomate cerise, concombre, mangue, ananas, palourdes", 75],
        ["Wakame saumon", "Goma wakame, saumon, surimi, avocat, concombre, ikura", 80],
        ["Wakame saumon thon", "Goma wakame, saumon, thon, avocat, concombre, ikura", 80],
        ["Gambas", "Crevettes panées, mesclun, tomate cerise, avocat, radis, oignon, poivron, concombre, amandes grillées, parmesan", 70],
        ["Poulet crispy", "Poulet pané, mesclun, tomate cerise, avocat, radis, oignon, poivron, parmesan, tofu pané", 65],
        ["Exotique", "Crevettes, palourdes, calamar, mesclun, avocat, ananas, mangue, carotte, tomate cerise, saumon", 80],
        ["Quinoa saumon", "Saumon braisé, quinoa, avocat, roquette, edamame, carotte, tomate cerise", 70],
        ["Udon", "Crevettes, saumon cuit, crabe, surimi, udon, tomate cerise, shiitake, poireau, avocat, poivron, roquette", 75],
      ] },
      { id: "tartares", nom: "Tartares", img: "tartares", plats: [
        ["Saumon avocat", 65], ["Thon épicé", 70], ["Crabe", 75], ["Thon avocat", 65], ["Poisson blanc", 70], ["Saumon avocat mangue", 65],
      ] },
      { id: "carpaccio", nom: "Carpaccio", img: "carpaccio", plats: [
        ["Saumon", 75], ["Thon", 75], ["Poisson blanc", 75], ["Saint-Jacques", 80],
      ] },
      { id: "sashimi", nom: "Sashimi", note: "Servis par 4 pièces", img: "sashimi", plats: [
        ["Saumon", 50], ["Thon", 50], ["Poisson blanc", 60],
      ] },
      { id: "temaki", nom: "Temaki", note: "Servi par 1 pièce", img: "temaki", plats: [
        ["Anguille concombre", 55], ["Thon poireau", 45], ["Saumon ikura", 60], ["Crabe avocat", 45], ["Thon saumon", 55], ["Thon épicé", 45],
      ] },
      { id: "tataki", nom: "Tataki", note: "Servis par 5 pièces", img: "tataki", plats: [
        ["Thon", 70], ["Saumon", 70],
      ] },
      { id: "nigiri", nom: "Nigiri", note: "Servis par 2 pièces", img: "nigiri", plats: [
        ["Saumon", 35], ["Thon", 35], ["Ebi", 35], ["Saumon fumé cheese", 40], ["Saumon braisé", 40], ["Saumon avocat", 40],
        ["Anguille", 45], ["Poisson blanc", 40], ["Thon avocat", 40], ["Thon foie gras", 45], ["Saumon mangue", 40], ["Saint-Jacques", 50],
      ] },
      { id: "gunkan", nom: "Gunkan", note: "Servis par 2 pièces", img: "gunkan", plats: [
        ["Saumon", 50], ["Thon", 45], ["Crabe", 50], ["Ikura", 70],
      ] },
    ],
  },
  {
    id: "rolls", nom: "Les rolls", jp: "三",
    rubriques: [
      { id: "maki", nom: "Maki", note: "Servis par 6 pièces", img: "maki", plats: [
        ["Saumon", 35], ["Saumon avocat", 40], ["Surimi", 35], ["Anguille", 50], ["Saumon mangue", 35], ["Avocat cheese", 30],
        ["Concombre", 25], ["Œufs de saumon", 50], ["Thon", 35], ["Thon avocat", 40], ["Ebi", 40], ["Crabe", 45],
      ] },
      { id: "fresh-maki", nom: "Fresh maki", note: "Servis par 6 pièces", img: "fresh-maki", plats: [
        ["Saumon fumé", 45], ["Saumon avocat", 45], ["Cheese avocat", 35], ["Crevette mangue", 45],
      ] },
      { id: "classic-rolls", nom: "Classic rolls", note: "Servis par 4 pièces", img: "classic-rolls", plats: [
        ["Saumon épicé", "Saumon, cheese, avocat, shichimi", 45],
        ["Rainbow thon", "Thon, avocat", 55],
        ["Ebi tanuki", "Crevette panée, cheese, tanuki", 60],
        ["Surimi mangue", "Surimi, avocat, concombre, mangue", 45],
        ["Saumon avocat", "Saumon, avocat, cheese, sésame", 50],
        ["Red tobiko", "Crevette panée, avocat, cheese, tobiko", 65],
        ["Ebi fry", "Crevette panée, avocat, cheese, ciboulette", 45],
        ["Cream cheese", "Saumon, surimi, avocat, cheese, tobiko", 50],
        ["Poulet avocat", "Poulet, avocat, cheese, carotte, roquette", 60],
        ["Rainbow saumon", "Saumon, avocat, cheese", 55],
        ["Saumon cuit", "Saumon, avocat, saumon cuit", 50],
        ["Thon cuit", "Thon, avocat, thon cuit", 50],
      ] },
      { id: "fresh-rolls", nom: "Fresh rolls", note: "Servis par 4 pièces", img: "fresh-rolls", plats: [
        ["Saumon", 65], ["Saumon braisé", 70], ["Anguille", 85], ["Crabe", 70],
      ] },
      { id: "futomaki", nom: "Futomaki", note: "Servis par 5 pièces", img: "futomaki", plats: [
        ["Saint-Jacques", "Saint-Jacques, crabe, crevette, mangue, goma wakame, saumon", 75],
        ["Saumon fumé", "Saumon fumé, crevette panée, avocat, cheese, tobiko, surimi", 65],
        ["Ebi mangue", "Crabe, saumon, mangue, crevette ebi, tobiko", 70],
        ["Tobiko crabe", "Crabe, crevette panée, avocat, cheese, tobiko, surimi", 70],
        ["Saumon mangue", "Crabe, saumon, crevette panée, mangue, cheese, tobiko", 65],
        ["Anguille", "Crevette panée, crabe, anguille, cheese, tobiko, avocat, roquette", 80],
      ] },
      { id: "aromaki", nom: "Aromaki", note: "Servis par 6 pièces", img: "aromaki", plats: [
        ["Saumon avocat", "Saumon, surimi, avocat, cheese, tobiko", 65],
        ["Saumon cuit", "Saumon cuit, surimi, avocat, cheese, tobiko", 60],
        ["Crevette avocat", "Crevette, surimi, avocat, cheese, tobiko", 65],
        ["Saumon mangue", "Saumon, surimi, crabe, mangue, cheese, tobiko", 70],
        ["Saumon crabe ebi", "Crevette panée, saumon, surimi, crabe, cheese, tobiko", 75],
        ["Saumon gingembre", "Saumon, mangue, cheese, gingembre, tobiko, ciboulette", 70],
        ["Saumon tobiko", "Saumon, crabe, tobiko", 70],
        ["Thon avocat", "Thon rouge, avocat, concombre, salade, tobiko", 65],
        ["Crabe avocat", "Crabe, avocat, cheese, concombre, salade verte", 70],
        ["Mangue crevette", "Crevette, crabe, surimi, mangue, cheese, tobiko", 70],
        ["Thon épicé", "Thon rouge épicé, salade, épinard tempura, fil d'ange", 70],
        ["Saumon tartare", "Saumon haché, surimi, ebi, salade, tanuki, tobiko", 70],
        ["Saumon concombre", "Saumon, avocat, cheese, concombre, tobiko", 65],
        ["Poulet avocat", "Poulet, cheese, avocat, concombre, carotte, salade", 60],
        ["Anguille saumon", "Saumon, anguille, tobiko, crevette panée", 75],
        ["Goma", "Goma wakame, saumon, mangue, surimi, cheese, tobiko", 65],
      ] },
      { id: "natto-rolls", nom: "Natto rolls", note: "Servis par 4 pièces", img: "natto-rolls", plats: [
        ["Okaydo", "Crabe, crevette panée, anguille, avocat, cheese, tobiko", 70],
        ["Oshi", "Thon, crevette panée, crabe, saumon, avocat", 75],
        ["Nagoya", "Crevette panée, crabe, goma wakame, avocat, cheese, ebi", 70],
        ["Ikura", "Saumon, avocat, sésame, œufs de saumon", 80],
        ["Nara", "Saumon, thon épicé, surimi pané, avocat, épinard tempura", 70],
        ["Aburi", "Ebi, saumon braisé, crabe, mangue, cheese", 75],
        ["Akita", "Crevette panée, surimi, avocat, cheese, poireau, massago", 65],
        ["Unagi", "Anguille panée, crabe, surimi, cheese, massago, ciboulette, poireau", 70],
        ["Brie", "Surimi pané, choga, brie braisé, cheese, tobiko", 75],
        ["César", "Poulet pané, salade, parmesan, grains de pavot", 55],
        ["Ika", "Saint-Jacques, thon, saumon, crabe, roquette", 75],
        ["Kamakura", "Saumon, goma wakame, avocat, ikura, surimi pané, choga", 70],
        ["Goma", "Saumon, goma wakame, avocat, cheese, sésame", 65],
        ["Osaka", "Crevette panée, crabe, anguille panée, saumon, avocat", 70],
        ["Niigata", "Crevette panée, anguille panée, saumon pané, cheese, poireau, salade, tobiko", 80],
        ["Nagasaki", "Saumon, goma wakame, tobiko, épinard tempura, sésame", 65],
        ["Yume", "Crevette panée, cheese, brie braisé, saumon, crabe, anguille", 80],
        ["Kani", "Crevette panée, saumon pané, mangue, avocat, cheese", 65],
        ["Salmonato", "Saumon braisé, sauce anguille, cheese, chili sauce, crevette sautée", 85],
        ["Natsu", "Saumon, sauce anguille, cheese, chili sauce", 80],
        ["Enso", "Saumon, ikura", 85],
        ["Braisé", "Crevette panée, saumon, crabe, cheese, avocat braisé", 65],
        ["Iki thon", "Thon, épinard tempura, sésame", 65],
        ["Bonzai", "Crabe, crevette panée, saumon, thon, avocat", 70],
        ["Iki saumon", "Saumon, épinard tempura, sésame", 65],
        ["Quinoa", "Saumon, crabe, mangue, quinoa, cheese", 70],
        ["Kobe", "Crabe, crevette panée, avocat, tobiko", 70],
        ["Blanco", "Crabe, mangue, poisson blanc", 70],
        ["Nasu", "Crevette panée, crabe, saumon, avocat, cheese", 75],
        ["Dragon", "Crevette panée, avocat, cheese, sésame, ebi", 80],
        ["Saigon", "Saumon, crevette panée, avocat, cheese, oignon", 70],
        ["Brie ebi", "Crevette ebi, cheese, brie braisé, crabe", 75],
        ["Asaka", "Poulet pané, saumon, goma wakame, cheese, avocat", 65],
        ["Iki poulet", "Poulet garlic, épinard tempura", 65],
        ["Miyagi", "Crevette panée, surimi pané, saumon pané, cheese, tobiko, poireau, saumon braisé, goma wakame", 80],
        ["Kyoto", "Crevette panée, saumon pané, cheese, tobiko, saumon, poireau, surimi pané", 75],
      ] },
      { id: "natto-rolls-xl", nom: "Natto rolls XL", note: "Servis par 8 pièces", img: "natto-rolls-xl", plats: [
        ["Awa", "Saumon, Saint-Jacques, crabe, surimi, avocat, cheese, tobiko, crevette panée", 130],
        ["Ebiko", "Crevette panée, avocat, crevette shiitake, sésame", 125],
        ["Nagano", "Crevette tempura, crabe, asperge tempura, avocat", 120],
        ["Lobster", "Langouste tempura, asperge tempura, tanuki, goma wakame, ikura", 150],
        ["King", "Crevette panée, saumon fumé, goma wakame, avocat, cheese", 135],
        ["Bœuf foie gras", "Bœuf, foie gras, asperge tempura, poireau tempura, sésame", 125],
        ["Buffala", "Saumon, cheese, goma wakame, mangue, épinard tempura", 120],
        ["Salmon", "Saumon haché, épinard tempura, tomate, concombre, sésame", 135],
      ] },
      { id: "crunchy", nom: "Crunchy", note: "Servis par 6 pièces", img: "crunchy", plats: [
        ["Crevette avocat", 70], ["Saumon avocat", 70], ["Ebi tempura", 65], ["Ebi tobiko", 65], ["Anguille", 75],
        ["Saint-Jacques crabe", 80], ["Crevette mangue", 75], ["Saumon", 65], ["Saumon mangue", 70],
      ] },
      { id: "pizza-bora", nom: "Pizza & bora", note: "Crunchy servis par 4 pièces", img: "bora", plats: [
        ["Pizza saumon avocat", 70], ["Pizza saumon cheese", 75], ["Pizza saumon Saint-Jacques", 85],
        ["Bora saumon", 70], ["Bora crabe", 70], ["Bora ebi", 80],
      ] },
    ],
  },
  {
    id: "boxes", nom: "Les boxes", jp: "四",
    rubriques: [
      { id: "assortiments", nom: "Assortiments", note: "À partager", img: "assortiments", plats: [
        ["Solo box · 16 pièces", "6 aromaki saumon avocat, 2 nigiri saumon, 4 cream cheese, 4 ebi fry", 160],
        ["Delight box · 20 pièces", "6 aromaki saumon, 6 crunchy ebi tobiko, 4 iki saumon, 4 nagoya", 220],
        ["Classic box · 24 pièces", "4 cream cheese, 4 rainbow, 4 ebi fry, 4 surimi mangue, 4 saumon cuit, 4 thon cuit", 250],
        ["Aromaki box · 24 pièces", "6 saumon avocat, 6 crevette mangue, 6 saumon gingembre, 6 thon avocat", 260],
        ["Crunchy box · 28 pièces", "6 Saint-Jacques crabe, 6 saumon, 6 saumon avocat, 6 ebi tobiko, 4 pizza saumon avocat", 280],
        ["Salmon box · 30 pièces", "8 fresh roll saumon, 6 maki saumon, 4 nigiri, 8 sashimi, 4 natsu", 350],
        ["Natto box · 36 pièces", "6 aromaki saumon mangue, 6 aromaki saumon ebi crabe, 4 akita, 4 nara, 4 brie, 4 kamakura, 4 okaydo, 4 oshi", 450],
        ["Family box · 50 pièces", "4 surimi mangue, 4 saumon cuit, 4 ebi fry, 4 thon cuit, 4 fresh roll saumon, 6 aromaki saumon avocat, 6 aromaki crevette avocat, 6 maki saumon, 4 okaydo, 4 akita, 4 rainbow", 490],
      ] },
    ],
  },
  {
    id: "chaud", nom: "Wok & plats", jp: "五",
    rubriques: [
      { id: "nouilles", nom: "Nouilles", img: "nouilles", plats: [
        ["Crevette", 95], ["Bœuf", 85], ["Poulet", 75], ["Fruits de mer", 85],
        ["Palourde", 80], ["Crabe", 95], ["Fruits de mer", 90], ["Saumon fumé", 90],
      ] },
      { id: "riz", nom: "Riz", img: "riz", plats: [
        ["Bœuf", 75], ["Fruits de mer", 80], ["Poulet", 65], ["Crevettes", 85],
      ] },
      { id: "plats", nom: "Plats", img: "plats", plats: [
        ["Saumon teriyaki", 130], ["Tigre qui pleure", 120], ["Filet de poisson blanc", 140],
      ] },
    ],
  },
  {
    id: "douceurs", nom: "Desserts & boissons", jp: "六",
    rubriques: [
      { id: "desserts", nom: "Desserts", img: "desserts", plats: [
        ["Panna cotta gingembre", 50], ["Panna cotta vanille", 50], ["Panna cotta fruits rouges", 55],
        ["Panna cotta fruit de la passion", 60], ["Tiramisu", 60], ["Crème brûlée", 65], ["San Sebastian", 60],
        ["Tarte citron", 50], ["Fondant matcha", 70], ["Fondant chocolat", 50], ["Banofee pie", 55],
        ["Macaron matcha", 70], ["Cheesecake caramel", 60], ["San Sebastian pistache", 70], ["Cheesecake fruits rouges", 60],
      ] },
      { id: "boissons-froides", nom: "Boissons froides", img: null, plats: [
        ["Soda", 25], ["Eau minérale 75 cl", 30], ["Eau gazeuse", 20],
      ] },
      { id: "jus", nom: "Jus", img: null, plats: [
        ["Orange", 30], ["Ananas", 45], ["Mangue", 45], ["Ananas gingembre", 50], ["Citron gingembre", 40],
        ["Ananas mangue", 45], ["Litchi framboise", 60], ["Mangue framboise", 55], ["Mangue litchi", 60],
      ] },
      { id: "cafe", nom: "Café", img: null, plats: [
        ["Café Nespresso", 25], ["Café allongé", 25], ["Décaféiné", 25],
      ] },
    ],
  },
];
