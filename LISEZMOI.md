# Site Maison Lune — mode d’emploi

## Modifier le site

- **Produits, prix, coordonnées** : tout est dans `data.js`.
- **Textes des pages** : directement dans les fichiers `.html` (accueil, histoire, FAQ…).
- **En-tête, pied de page, cartes et fiches produit** : dans `templates.js`.
- **Couleurs, polices, mise en page** : dans `styles.css`.

## Après chaque modification de `data.js` ou `templates.js`

Lancer dans le terminal de VS Code, depuis ce dossier :

```
node outils/generer.mjs
```

Cette commande réécrit l’en-tête, le pied de page et les fiches `lit-*.html` en HTML « en dur »
(lisible par Google et par les IA comme ChatGPT ou Perplexity), et met à jour `sitemap.xml`,
`robots.txt` et `llms.txt`. Sans elle, le site reste juste pour les visiteurs, mais Google
continue de voir l’ancienne version.

Node.js s’installe depuis nodejs.org (version LTS).

## Déployer les paiements et l’espace client

Le paiement utilise Stripe Checkout. Les commandes et les sessions de compte sont conservées dans Neon. Les e-mails de confirmation et les liens de connexion sont envoyés par Resend.

1. Installer les dépendances avec `npm install`.
2. Créer une base PostgreSQL Neon et exécuter le contenu de `database/schema.sql` dans son éditeur SQL.
3. Vérifier le domaine d’envoi dans Resend, puis choisir une adresse `EMAIL_FROM` sur ce domaine.
4. Ajouter dans les variables d’environnement Vercel les clés de `.env.example`. `SITE_URL` doit être exactement le domaine public du site. Commencer par une clé Stripe de test (`sk_test_…`).
5. Dans Stripe, créer un webhook vers `https://votre-domaine/api/stripe-webhook` pour les événements `checkout.session.completed`, `checkout.session.async_payment_succeeded` et `checkout.session.async_payment_failed`. Copier sa clé de signature `whsec_…` dans `STRIPE_WEBHOOK_SECRET`.
6. Déployer sur Vercel et tester le parcours en mode test Stripe. Le numéro de carte de test Stripe est `4242 4242 4242 4242`; utiliser une date future et un CVC quelconque.
7. Avant l’ouverture aux clients, remplacer la clé de test par la clé Stripe live et créer le webhook live correspondant dans Vercel.

Les clés Stripe et Resend doivent rester uniquement dans les variables d’environnement Vercel. Ne les ajoutez jamais au code ou à un dépôt. La validation métier des prix est faite côté serveur; après un paiement confirmé, le client reçoit son numéro de commande et un lien de connexion à usage limité dans le temps. `npm test` vérifie la cohérence des prix des quatre produits et des trois tailles.

## Ajouter un lit

1. Copier un bloc produit dans `PRODUCTS` (`data.js`) et changer son `id` (sans accent ni espace).
2. Ajouter sa photo dans `images-lits/` (format WebP, 1200 px de large maximum, moins de 200 Ko).
3. Lancer `node outils/generer.mjs` : la page `lit-<id>.html` est créée.

## À remplacer avant la mise en ligne

- `data.js` : `url` (votre nom de domaine), téléphone, e-mail, adresse, liens Instagram et Pinterest.
- `legal.html` : tous les champs entre crochets (société, SIRET, hébergeur, médiateur…).
- `faq.html` : pays de fabrication entre crochets.
- `index.html` : les trois avis clients sont des exemples (à remplacer par de vrais avis ou à retirer).

## Fichiers

| Fichier | Rôle |
|---|---|
| `logo/` | Logos, icônes du site, image de partage, PNG et `planche-logo.html` |
| `fonts/` | Polices du site hébergées localement (Manrope, DM Serif Display) et licences OFL |
| `outils/` | Générateur et modèle des fiches produit (non publiés) |
| `api/` | Paiement Stripe, confirmation et accès sécurisé au compte client |
| `database/schema.sql` | Tables des commandes, liens de connexion et sessions |
| `compte.html` | Connexion client par lien sécurisé et historique des commandes |
| `confirmation.html` | Confirmation du paiement et numéro de commande |
| `llms.txt` | Résumé du site pour les moteurs de réponse IA |
| `404.html` | Page « introuvable » |
