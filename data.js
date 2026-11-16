/* =========================================================
   MAISON LUNE — CATALOGUE & INFOS BOUTIQUE
   Modifiez ce fichier pour changer les produits, les prix
   et les coordonnées : tout le site se met à jour.
========================================================= */

const SHOP = {
  name: 'Maison Lune',
  /* [À REMPLACER] Adresse définitive du site, sans « / » final.
     Sert aux liens de partage, au sitemap et à Google. */
  url: 'https://www.maisonlune.fr',
  description: 'Lits design haut de gamme en velours, bouclé, chêne ou capitonné. Sommier inclus, livraison et installation offertes en France métropolitaine, 100 nuits d’essai, garantie 10 ans.',
  email: 'bonjour@maisonlune.fr',
  phone: '01 23 45 67 89',
  phoneHref: '+33123456789',
  address: '[12 rue de l’Exemple, 75011 Paris]',
  hours: 'Du mardi au samedi, 10h – 19h',
  instagram: '#',
  pinterest: '#',
  trialNights: 100,
  warrantyYears: 10,
  freeShipping: true
};

const SIZES = [
  { id: '140x190', label: '140 × 190', hint: 'Double classique' },
  { id: '160x200', label: '160 × 200', hint: 'Queen' },
  { id: '180x200', label: '180 × 200', hint: 'King' }
];

const PRODUCTS = [
  {
    id: 'minuit',
    name: 'Minuit',
    tagline: 'Velours côtelé bleu nuit',
    style: 'velours',
    styleLabel: 'Velours',
    badge: 'Nouveau',
    image: 'images-lits/image-lit-bleu.webp',
    imageBg: '#EDE8DF',
    alt: 'Lit Minuit en velours bleu nuit avec tête de lit à canaux verticaux, dans une chambre lumineuse',
    crops: [
      { pos: '35% 38%', zoom: 2.2, label: 'Tête de lit à canaux' },
      { pos: '70% 80%', zoom: 2.4, label: 'Pieds en bois teinté noir' },
      { pos: '50% 62%', zoom: 1.7, label: 'Cadre surpiqué' }
    ],
    prices: { '140x190': 1290, '160x200': 1490, '180x200': 1690 },
    fabrics: [
      { name: 'Bleu nuit', hex: '#2F4E78' },
      { name: 'Vert sapin', hex: '#2E4A3F' },
      { name: 'Grège', hex: '#B9AE9C' }
    ],
    delivery: '3 à 4 semaines',
    short: 'Une tête de lit à larges canaux verticaux, un velours côtelé profond et des pieds fuselés : Minuit apporte à la chambre une élégance calme, presque cinématographique.',
    description: [
      'Minuit est né d’une envie simple : retrouver dans la chambre la douceur d’un fauteuil de salon. Sa tête de lit galbée est garnie de mousse haute résilience puis habillée d’un velours côtelé dense, au toucher soyeux.',
      'Les canaux verticaux allongent visuellement la pièce et accrochent la lumière tout au long de la journée. Le cadre, entièrement tapissé, repose sur des pieds fuselés en bois massif teinté noir.'
    ],
    features: [
      'Tête de lit capitonnée à canaux verticaux',
      'Velours côtelé 100 % polyester recyclé, 60 000 cycles Martindale',
      'Sommier à lattes en hêtre multiplis inclus',
      'Pieds fuselés en bois massif, hauteur 12 cm'
    ],
    specs: [
      ['Hauteur tête de lit', '115 cm'],
      ['Hauteur du cadre', '30 cm (+ 12 cm de pieds)'],
      ['Encombrement', 'Couchage + 12 cm en largeur, + 14 cm en longueur'],
      ['Structure', 'Pin massif et panneaux de particules certifiés'],
      ['Sommier', 'Lattes en hêtre multiplis, inclus'],
      ['Matelas', 'Non inclus. Épaisseur conseillée : 20 à 25 cm'],
      ['Montage', 'Environ 30 minutes, outils fournis']
    ],
    care: 'Aspirez régulièrement avec une brosse douce dans le sens du velours. En cas de tache, tamponnez sans frotter avec un chiffon microfibre légèrement humide.'
  },
  {
    id: 'nuage',
    name: 'Nuage',
    tagline: 'Bouclé ivoire',
    style: 'boucle',
    styleLabel: 'Bouclé',
    badge: 'Best-seller',
    image: 'images-lits/image-lit-nuage.webp',
    imageBg: '#F5F5F4',
    alt: 'Lit Nuage en tissu bouclé ivoire, tête de lit et cadre formés de boudins arrondis',
    crops: [
      { pos: '45% 35%', zoom: 2.4, label: 'Tête de lit en boudins' },
      { pos: '60% 72%', zoom: 2.6, label: 'Cadre généreux et arrondi' },
      { pos: '40% 50%', zoom: 1.8, label: 'Bouclé texturé' }
    ],
    prices: { '140x190': 1490, '160x200': 1690, '180x200': 1890 },
    fabrics: [
      { name: 'Ivoire', hex: '#EDE6DA' },
      { name: 'Sable', hex: '#D6C6AE' },
      { name: 'Gris perle', hex: '#C9C7C2' }
    ],
    delivery: '4 à 5 semaines',
    short: 'Des volumes moelleux, un bouclé texturé et aucune arête : Nuage transforme la chambre en cocon. Notre modèle le plus enveloppant.',
    description: [
      'Nuage reprend le langage des canapés modulaires des années 70 : une succession de boudins généreux qui forment la tête de lit et ceinturent le couchage. Le résultat est doux au regard comme au toucher.',
      'Son tissu bouclé ivoire, tissé avec une fibre légèrement bouclée, cache les petites marques du quotidien et vieillit avec élégance. Le cadre posé au sol accentue l’effet de refuge.'
    ],
    features: [
      'Tête de lit et cadre en boudins rembourrés',
      'Tissu bouclé, 45 000 cycles Martindale',
      'Sommier à lattes inclus',
      'Cadre posé au sol, aucun pied visible'
    ],
    specs: [
      ['Hauteur tête de lit', '105 cm'],
      ['Hauteur du cadre', '38 cm'],
      ['Encombrement', 'Couchage + 36 cm en largeur, + 30 cm en longueur'],
      ['Structure', 'Bois massif et mousse haute résilience 35 kg/m³'],
      ['Sommier', 'Lattes en hêtre multiplis, inclus'],
      ['Matelas', 'Non inclus. Épaisseur conseillée : 20 à 25 cm'],
      ['Montage', 'Environ 40 minutes, outils fournis']
    ],
    care: 'Aspirez avec un embout doux. Ne frottez jamais le bouclé : tamponnez avec un chiffon humide et une goutte de savon neutre, puis laissez sécher à l’air libre.'
  },
  {
    id: 'eclipse',
    name: 'Éclipse',
    tagline: 'Chêne naturel & lumière intégrée',
    style: 'bois',
    styleLabel: 'Bois',
    badge: 'Signature',
    image: 'images-lits/lit-eclipse.webp',
    imageBg: '#E9DFD1',
    alt: 'Lit Éclipse en chêne naturel avec tête de lit panoramique éclairée par une LED chaude et chevets suspendus',
    crops: [
      { pos: '40% 32%', zoom: 2.2, label: 'Éclairage LED intégré' },
      { pos: '15% 55%', zoom: 2.6, label: 'Chevet suspendu avec tiroir' },
      { pos: '60% 70%', zoom: 2.0, label: 'Socle en chêne' }
    ],
    prices: { '140x190': 1690, '160x200': 1890, '180x200': 2090 },
    fabrics: [
      { name: 'Chêne naturel', hex: '#B9894F' },
      { name: 'Chêne fumé', hex: '#6E5039' },
      { name: 'Noyer', hex: '#5A3B28' }
    ],
    fabricLabel: 'Finition',
    delivery: '4 à 6 semaines',
    short: 'Une tête de lit panoramique en chêne, un ruban de lumière chaude et deux chevets suspendus : Éclipse est une pièce d’architecture à part entière.',
    description: [
      'Éclipse a été pensé comme un mur de chambre complet. Sa tête de lit panoramique de plus de trois mètres intègre deux chevets suspendus avec tiroir et un ruban LED à la lumière chaude, réglable en intensité.',
      'Le placage chêne, rythmé par des tasseaux verticaux, apporte de la chaleur et de la matière. Le socle en retrait donne l’illusion que le lit flotte au-dessus du sol.'
    ],
    features: [
      'Tête de lit panoramique avec ruban LED 2 700 K à intensité réglable',
      'Deux chevets suspendus avec tiroir',
      'Placage chêne sur panneaux certifiés FSC',
      'Socle en retrait, effet « lit flottant »'
    ],
    specs: [
      ['Largeur tête de lit', '310 cm (chevets inclus)'],
      ['Hauteur tête de lit', '100 cm'],
      ['Hauteur du cadre', '35 cm'],
      ['Éclairage', 'LED 2 700 K, variateur tactile, alimentation secteur'],
      ['Sommier', 'Lattes en hêtre multiplis, inclus'],
      ['Matelas', 'Non inclus. Épaisseur conseillée : 18 à 22 cm'],
      ['Montage', 'Installation par nos équipes, incluse']
    ],
    care: 'Dépoussiérez avec un chiffon sec et doux. Évitez les produits à base d’alcool ou de silicone. Une fois par an, nourrissez le bois avec une cire incolore adaptée au chêne.'
  },
  {
    id: 'aurore',
    name: 'Aurore',
    tagline: 'Capitonné ivoire tout-en-un',
    style: 'capitonne',
    styleLabel: 'Capitonné',
    badge: 'Tout-en-un',
    image: 'images-lits/image-lit-banniere.webp',
    imageBg: '#E8E0D4',
    alt: 'Lit Aurore capitonné ivoire avec grande tête de lit, chevets intégrés et liseuses',
    crops: [
      { pos: '50% 32%', zoom: 2.2, label: 'Capitonnage à boutons' },
      { pos: '82% 40%', zoom: 2.6, label: 'Chevet et liseuse intégrés' },
      { pos: '50% 78%', zoom: 1.9, label: 'Cadre tapissé' }
    ],
    prices: { '140x190': 1890, '160x200': 2090, '180x200': 2390 },
    fabrics: [
      { name: 'Ivoire', hex: '#EEE8DE' },
      { name: 'Taupe', hex: '#9C8F82' },
      { name: 'Anthracite', hex: '#45474C' }
    ],
    delivery: '4 à 5 semaines',
    short: 'Une tête de lit capitonnée XXL qui intègre chevets, liseuses et port USB : Aurore réunit tout ce dont vous avez besoin, sans un meuble de plus.',
    description: [
      'Aurore est notre réponse aux chambres où chaque centimètre compte. Sa grande tête de lit capitonnée accueille deux chevets ouverts, deux liseuses orientables et des prises USB pour recharger vos appareils.',
      'Le capitonnage à boutons, réalisé à la main, et le cadre entièrement tapissé lui donnent une allure d’hôtel particulier, tout en gardant une ligne nette et contemporaine.'
    ],
    features: [
      'Tête de lit capitonnée à boutons, réalisée à la main',
      'Deux chevets ouverts et deux liseuses LED intégrés',
      'Ports USB-A et USB-C de chaque côté',
      'Revêtement effet cuir velouté, facile d’entretien'
    ],
    specs: [
      ['Largeur tête de lit', 'Couchage + 110 cm (chevets inclus)'],
      ['Hauteur tête de lit', '125 cm'],
      ['Hauteur du cadre', '32 cm'],
      ['Connectique', '2 × USB-A, 2 × USB-C'],
      ['Sommier', 'Lattes en hêtre multiplis, inclus'],
      ['Matelas', 'Non inclus. Épaisseur conseillée : 20 à 25 cm'],
      ['Montage', 'Installation par nos équipes, incluse']
    ],
    care: 'Essuyez avec un chiffon doux légèrement humide. Pour le capitonnage, utilisez une petite brosse souple afin de déloger la poussière autour des boutons.'
  }
];

const STYLE_FILTERS = [
  { id: 'all', label: 'Tous les lits' },
  { id: 'velours', label: 'Velours' },
  { id: 'boucle', label: 'Bouclé' },
  { id: 'bois', label: 'Bois' },
  { id: 'capitonne', label: 'Capitonné' }
];
