/* =========================================================
   MAISON LUNE — GÉNÉRATEUR DE PAGES STATIQUES
   À relancer après chaque modification de data.js :

       node outils/generer.mjs

   Ce script :
   • écrit l’en-tête, le pied de page et les cartes produits
     directement dans le HTML (lisible par Google et les IA,
     même sans JavaScript) ;
   • crée une page par lit : lit-minuit.html, lit-nuage.html… ;
   • ajoute les balises de partage, l’adresse canonique et les
     données structurées (schema.org) ;
   • met à jour sitemap.xml, robots.txt et llms.txt.

   Sans Node, le site fonctionne quand même : le JavaScript
   affiche toujours les données à jour de data.js.
========================================================= */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file) => fs.readFileSync(path.join(ROOT, file), 'utf8');
const write = (file, content) => fs.writeFileSync(path.join(ROOT, file), content);

/* Charge data.js + templates.js comme dans le navigateur */
const T = vm.runInContext(
  `${read('data.js')}\n${read('templates.js')}\n;({ SHOP, SIZES, PRODUCTS, renderHeader, renderFooter, productCardHtml, productPageHtml, compareTableHtml, productUrl, formatPrice, minPrice })`,
  vm.createContext({ Intl, Math, String, Number, Array, Object, Date, JSON, RegExp })
);
const { SHOP, SIZES, PRODUCTS } = T;

const SITE = SHOP.url.replace(/\/$/, '');
const TODAY = new Date().toISOString().slice(0, 10);
const abs = (file = '') => `${SITE}/${file === 'index.html' ? '' : file}`;
const OG_IMAGE = abs('logo/og-image.jpg');

/* Pages éditées à la main (le contenu reste dans le HTML) */
const PAGES = [
  { file: 'index.html', page: 'home', priority: '1.0' },
  { file: 'collection.html', page: 'collection', priority: '0.9', crumb: 'Nos lits' },
  { file: 'a-propos.html', page: 'about', priority: '0.6', crumb: 'Notre histoire' },
  { file: 'guide.html', page: 'guide', priority: '0.7', crumb: 'Guide des tailles' },
  { file: 'livraison.html', page: 'livraison', priority: '0.6', crumb: 'Livraison & retours' },
  { file: 'faq.html', page: 'faq', priority: '0.6', crumb: 'FAQ' },
  { file: 'contact.html', page: 'contact', priority: '0.5', crumb: 'Contact' },
  { file: 'legal.html', page: 'legal', priority: '0.2', crumb: 'Informations légales' },
  { file: 'panier.html', page: 'cart', noindex: true },
  { file: '404.html', page: '404', noindex: true }
];


/* ---------- outils ---------- */

function fill(html, key, content) {
  const re = new RegExp(`<!-- @${key} -->[\\s\\S]*?<!-- /@${key} -->`);
  if (!re.test(html)) return html;
  return html.replace(re, () => `<!-- @${key} -->${content}\n<!-- /@${key} -->`);
}

const attr = (value) => String(value).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;|&#160;/g, ' ').replace(/\s+/g, ' ').trim();
const getTitle = (html) => (html.match(/<title>([^<]*)<\/title>/) || [])[1] || SHOP.name;
const getDescription = (html) => (html.match(/<meta name="description" content="([^"]*)"/) || [])[1] || SHOP.description;

function jsonLd(data) {
  return `\n  <script type="application/ld+json">\n${JSON.stringify(data, null, 2).replace(/</g, '\\u003c')}\n  </script>`;
}

function seoBlock({ file, title, description, type = 'website', image = OG_IMAGE, noindex = false, schemas = [] }) {
  return `${noindex ? '' : `
  <link rel="canonical" href="${abs(file)}">`}
  <meta name="robots" content="${noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large'}">
  <meta property="og:type" content="${type}">
  <meta property="og:site_name" content="${SHOP.name}">
  <meta property="og:locale" content="fr_FR">
  <meta property="og:title" content="${attr(title)}">
  <meta property="og:description" content="${attr(description)}">
  <meta property="og:url" content="${abs(file)}">
  <meta property="og:image" content="${image}">
  <meta name="twitter:card" content="summary_large_image">${schemas.map(jsonLd).join('')}`;
}

const ORG_ID = `${SITE}/#organisation`;

function organization() {
  const sameAs = [SHOP.instagram, SHOP.pinterest].filter((u) => u && u !== '#');
  const org = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': ORG_ID,
    name: SHOP.name,
    url: abs(),
    logo: abs('logo/png/nuit-monogramme-1024.png'),
    description: SHOP.description,
    email: SHOP.email,
    telephone: SHOP.phoneHref,
    contactPoint: { '@type': 'ContactPoint', contactType: 'customer service', telephone: SHOP.phoneHref, email: SHOP.email, availableLanguage: 'French', areaServed: 'FR' }
  };
  if (sameAs.length) org.sameAs = sameAs;
  /* L’adresse n’est publiée que lorsqu’elle est réelle (sans crochets) */
  if (SHOP.address && !SHOP.address.includes('[')) org.address = { '@type': 'PostalAddress', streetAddress: SHOP.address, addressCountry: 'FR' };
  return org;
}

function website() {
  return { '@context': 'https://schema.org', '@type': 'WebSite', name: SHOP.name, url: abs(), inLanguage: 'fr-FR', publisher: { '@id': ORG_ID } };
}

function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map(([name, file], i) => ({ '@type': 'ListItem', position: i + 1, name, item: abs(file) }))
  };
}

function weeksToDays(label) {
  const n = (label.match(/\d+/g) || []).map(Number);
  return n.length ? { min: n[0] * 7, max: (n[1] || n[0]) * 7 } : null;
}

function productSchema(p) {
  const days = weeksToDays(p.delivery);
  const shipping = {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: 0, currency: 'EUR' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'FR' }
  };
  if (days) {
    shipping.deliveryTime = {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: days.min - 7, maxValue: days.max - 7, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 7, unitCode: 'DAY' }
    };
  }
  const returns = {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'FR',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: SHOP.trialNights,
    returnFees: 'https://schema.org/FreeReturn'
  };
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: `Lit ${p.name}`,
    description: `${p.short} ${p.description.join(' ')}`,
    image: abs(p.image),
    sku: `ML-${p.id.toUpperCase()}`,
    brand: { '@type': 'Brand', name: SHOP.name },
    category: 'Lits',
    material: p.tagline,
    color: p.fabrics.map((f) => f.name).join(', '),
    additionalProperty: p.specs.map(([name, value]) => ({ '@type': 'PropertyValue', name, value })),
    offers: SIZES.map((s) => ({
      '@type': 'Offer',
      name: `Lit ${p.name} ${s.label} cm`,
      sku: `ML-${p.id.toUpperCase()}-${s.id}`,
      url: abs(productUrl(p)),
      price: p.prices[s.id],
      priceCurrency: 'EUR',
      availability: 'https://schema.org/MadeToOrder',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': ORG_ID },
      shippingDetails: shipping,
      hasMerchantReturnPolicy: returns
    }))
  };
}

function faqSchema(html) {
  const items = [...html.matchAll(/<details>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="answer">([\s\S]*?)<\/div>\s*<\/details>/g)];
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(([, q, a]) => ({
      '@type': 'Question',
      name: text(q),
      acceptedAnswer: { '@type': 'Answer', text: text(a) }
    }))
  };
}

const productUrl = (p) => T.productUrl(p);

function bakeShared(html, page) {
  html = fill(html, 'header', T.renderHeader(page));
  html = fill(html, 'footer', T.renderFooter());
  html = fill(html, 'featured', PRODUCTS.map((p, i) => T.productCardHtml(p, i)).join(''));
  html = fill(html, 'collection', PRODUCTS.map((p, i) => T.productCardHtml(p, i)).join(''));
  html = fill(html, 'compare', T.compareTableHtml());
  return html;
}


/* ---------- pages éditées à la main ---------- */

for (const cfg of PAGES) {
  let html = read(cfg.file);
  const title = getTitle(html);
  const description = getDescription(html);
  const schemas = [];
  if (cfg.page === 'home') schemas.push(organization(), website());
  if (cfg.crumb) schemas.push(breadcrumb([['Accueil', 'index.html'], [cfg.crumb, cfg.file]]));
  if (cfg.page === 'faq') schemas.push(faqSchema(html));
  if (cfg.page === 'collection') {
    schemas.push({
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'La collection de lits Maison Lune',
      itemListElement: PRODUCTS.map((p, i) => ({ '@type': 'ListItem', position: i + 1, url: abs(productUrl(p)), name: `Lit ${p.name}` }))
    });
  }
  html = fill(html, 'seo', seoBlock({ file: cfg.file, title, description, noindex: cfg.noindex, schemas }));
  html = bakeShared(html, cfg.page);
  write(cfg.file, html);
}


/* ---------- une page par lit ---------- */

const model = read('outils/modele-fiche.html').replace(/<!-- MODÈLE[\s\S]*?-->\n/, '');

for (const p of PRODUCTS) {
  const file = productUrl(p);
  const sizes = SIZES.map((s) => s.label.replace(/ /g, '')).join(', ');
  const title = `Lit ${p.name} : ${p.tagline} | ${SHOP.name}`;
  const description = `Lit ${p.name}, ${p.tagline.toLowerCase()} : ${p.short.replace(/[\s\u00a0]:.*$/, '').replace(/^./, (c) => c.toLowerCase())}. ${sizes} cm, dès ${T.formatPrice(T.minPrice(p))}, sommier inclus, livré et installé.`
    .replace(/\s+/g, ' ').slice(0, 300);
  let html = model
    .replaceAll('{{title}}', attr(title))
    .replaceAll('{{description}}', attr(description))
    .replaceAll('{{name}}', p.name)
    .replaceAll('{{id}}', p.id);
  html = fill(html, 'seo', seoBlock({
    file, title, description, type: 'product', image: abs(p.image),
    schemas: [productSchema(p), breadcrumb([['Accueil', 'index.html'], ['Nos lits', 'collection.html'], [`Lit ${p.name}`, file]])]
  }));
  html = fill(html, 'product', T.productPageHtml(p));
  html = fill(html, 'related', PRODUCTS.filter((o) => o.id !== p.id).map((o, i) => T.productCardHtml(o, i)).join(''));
  html = bakeShared(html, 'product');
  write(file, html);
}


/* ---------- sitemap, robots, llms.txt ---------- */

const urls = [
  ...PAGES.filter((c) => !c.noindex).map((c) => [c.file, c.priority]),
  ...PRODUCTS.map((p) => [productUrl(p), '0.8'])
];
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([file, prio]) => `  <url><loc>${abs(file)}</loc><lastmod>${TODAY}</lastmod><priority>${prio}</priority></url>`).join('\n')}
</urlset>
`);

write('robots.txt', `User-agent: *
Allow: /
Disallow: /outils/

Sitemap: ${abs('sitemap.xml')}
`);

const nb = (s) => s.replace(/\u00a0|\u202f/g, ' ');
write('llms.txt', `# ${SHOP.name}

> ${SHOP.description}

${SHOP.name} est une marque française de lits design. Chaque lit est livré avec son sommier à lattes en hêtre (matelas non inclus), existe en ${SIZES.map((s) => `${nb(s.label)} cm`).join(', ')}, et est livré puis monté à domicile par nos équipes.

## La collection

${PRODUCTS.map((p) => `- [Lit ${p.name}](${abs(productUrl(p))}) : ${p.tagline}. ${SIZES.map((s) => `${nb(s.label)} cm : ${nb(T.formatPrice(p.prices[s.id]))}`).join(' · ')}. ${p.fabricLabel || 'Coloris'} : ${p.fabrics.map((f) => f.name).join(', ')}. Livraison sous ${p.delivery}. ${p.short}`).join('\n')}

## Services

- Livraison et installation offertes en France métropolitaine (hors Corse), sur rendez-vous, emballages repris.
- ${SHOP.trialNights} nuits d’essai : reprise gratuite et remboursement intégral si le lit ne convient pas.
- Garantie ${SHOP.warrantyYears} ans sur la structure et le sommier, 2 ans sur les tissus, l’éclairage et la connectique.
- Paiement par carte ou virement, en 3 ou 4 fois sans frais dès 500 €.
- Échantillons de tissus et de bois gratuits (jusqu’à 4).

## Pages utiles

- [Comparer les lits](${abs('collection.html')})
- [Guide des tailles et de l’entretien](${abs('guide.html')})
- [Livraison, retours et garantie](${abs('livraison.html')})
- [Questions fréquentes](${abs('faq.html')})
- [Notre histoire](${abs('a-propos.html')})
- [Contact](${abs('contact.html')}) : ${SHOP.email} · ${SHOP.phone} · ${SHOP.hours}
`);

console.log(`✓ ${PAGES.length} pages mises à jour, ${PRODUCTS.length} fiches produit créées, sitemap.xml, robots.txt et llms.txt écrits.`);
