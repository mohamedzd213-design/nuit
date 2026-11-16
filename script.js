/* =========================================================
   MAISON LUNE — SCRIPT PRINCIPAL
   Header / footer partagés, menu mobile, panier,
   collection, fiche produit, formulaires, animations.
   Dépend de data.js (chargé avant ce fichier).
========================================================= */

document.documentElement.classList.add('js');


const currentPage = document.body.dataset.page || '';

const headerSlot = document.querySelector('[data-include="header"]');
const footerSlot = document.querySelector('[data-include="footer"]');

if (headerSlot) headerSlot.outerHTML = renderHeader(currentPage);
if (footerSlot) footerSlot.outerHTML = renderFooter();
document.body.insertAdjacentHTML('beforeend', renderCartShell());


/* =========================
   OVERLAYS (menu + panier)
========================= */

let lastFocus = null;

function trapFocus(container, event) {
  const focusables = container.querySelectorAll('a[href], button:not([disabled]), input, select, textarea');
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
}

const mobileMenu = document.getElementById('mobile-menu');
const menuToggle = document.querySelector('.menu-toggle');

function openMenu() {
  lastFocus = document.activeElement;
  mobileMenu.classList.add('is-open');
  menuToggle.setAttribute('aria-expanded', 'true');
  document.body.classList.add('is-locked');
  mobileMenu.querySelector('[data-menu-close]').focus();
}

function closeMenu() {
  if (!mobileMenu.classList.contains('is-open')) return;
  mobileMenu.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  document.body.classList.remove('is-locked');
  if (lastFocus) lastFocus.focus();
}

menuToggle.addEventListener('click', openMenu);
mobileMenu.querySelector('[data-menu-close]').addEventListener('click', closeMenu);
mobileMenu.querySelectorAll('nav a').forEach((link) => link.addEventListener('click', closeMenu));

const drawer = document.getElementById('cart-drawer');
const overlay = document.querySelector('[data-overlay]');

function openCart() {
  lastFocus = document.activeElement;
  closeMenu();
  drawer.classList.add('is-open');
  overlay.classList.add('is-open');
  document.body.classList.add('is-locked');
  drawer.querySelector('[data-cart-close]').focus();
}

function closeCart() {
  if (!drawer.classList.contains('is-open')) return;
  drawer.classList.remove('is-open');
  overlay.classList.remove('is-open');
  document.body.classList.remove('is-locked');
  if (lastFocus) lastFocus.focus();
}

document.querySelectorAll('[data-cart-open]').forEach((btn) => btn.addEventListener('click', openCart));
drawer.querySelector('[data-cart-close]').addEventListener('click', closeCart);
overlay.addEventListener('click', closeCart);

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeMenu();
    closeCart();
  }
  if (event.key === 'Tab') {
    if (drawer.classList.contains('is-open')) trapFocus(drawer, event);
    else if (mobileMenu.classList.contains('is-open')) trapFocus(mobileMenu, event);
  }
});

const siteHeader = document.querySelector('.site-header');

function onScroll() {
  siteHeader.classList.toggle('is-scrolled', window.scrollY > 10);
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


/* =========================
   TOAST
========================= */

const toastEl = document.querySelector('[data-toast]');
let toastTimer;

function showToast(message) {
  toastEl.innerHTML = `${icon('check')} <span>${escapeHtml(message)}</span>`;
  toastEl.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('is-visible'), 3200);
}


/* =========================
   PANIER
========================= */

const CART_KEY = 'nuit-cart';

const cart = {
  items: [],

  load() {
    try {
      const raw = JSON.parse(storage.get(CART_KEY) || '[]');
      this.items = Array.isArray(raw)
        ? raw.filter((item) => findProduct(item.id) && item.qty > 0)
        : [];
    } catch (error) {
      this.items = [];
    }
  },

  save() {
    storage.set(CART_KEY, JSON.stringify(this.items));
    renderCart();
  },

  add(id, size, fabric, qty = 1) {
    const key = `${id}|${size}|${fabric}`;
    const existing = this.items.find((item) => item.key === key);
    if (existing) existing.qty = Math.min(existing.qty + qty, 10);
    else this.items.push({ key, id, size, fabric, qty });
    this.save();
  },

  setQty(key, qty) {
    const item = this.items.find((i) => i.key === key);
    if (!item) return;
    if (qty <= 0) this.items = this.items.filter((i) => i.key !== key);
    else item.qty = Math.min(qty, 10);
    this.save();
  },

  remove(key) {
    this.items = this.items.filter((i) => i.key !== key);
    this.save();
  },

  clear() {
    this.items = [];
    this.save();
  },

  count() {
    return this.items.reduce((sum, item) => sum + item.qty, 0);
  },

  total() {
    return this.items.reduce((sum, item) => {
      const product = findProduct(item.id);
      return sum + product.prices[item.size] * item.qty;
    }, 0);
  }
};

function cartLineHtml(item) {
  const product = findProduct(item.id);
  const unit = product.prices[item.size];
  const fabricLabel = product.fabricLabel || 'Coloris';
  return `
    <div class="cart-line">
      <img src="${product.image}" alt="" style="background:${product.imageBg}" loading="lazy">
      <div>
        <h3>${product.name}</h3>
        <p class="cart-line-meta">${sizeLabel(item.size)} cm · ${fabricLabel} ${escapeHtml(item.fabric)}</p>
        <div class="cart-line-row">
          <div class="qty" aria-label="Quantité">
            <button type="button" data-qty-dec="${item.key}" aria-label="Retirer un ${product.name}">${icon('minus')}</button>
            <span aria-live="polite">${item.qty}</span>
            <button type="button" data-qty-inc="${item.key}" aria-label="Ajouter un ${product.name}">${icon('plus')}</button>
          </div>
          <span class="cart-line-price">${formatPrice(unit * item.qty)}</span>
        </div>
        <button class="remove-btn" type="button" data-remove="${item.key}">${icon('trash')} Supprimer</button>
      </div>
    </div>`;
}

function emptyCartHtml() {
  return `
    <div class="cart-empty">
      ${icon('moon')}
      <h3>Votre panier est vide</h3>
      <p>Il n’attend plus que le lit de vos rêves.</p>
      <a class="btn btn-primary" href="collection.html">Découvrir la collection ${icon('arrow')}</a>
    </div>`;
}

function renderCart() {
  const count = cart.count();
  document.querySelectorAll('[data-cart-count]').forEach((el) => {
    el.textContent = count;
    el.dataset.count = count;
  });

  const lines = drawer.querySelector('[data-cart-lines]');
  const foot = drawer.querySelector('[data-cart-foot]');

  if (!cart.items.length) {
    lines.innerHTML = emptyCartHtml();
    foot.innerHTML = '';
    foot.hidden = true;
  } else {
    lines.innerHTML = cart.items.map(cartLineHtml).join('');
    foot.hidden = false;
    foot.innerHTML = `
      <div class="total-row"><span>Sous-total</span><strong>${formatPrice(cart.total())}</strong></div>
      <p class="total-note">Livraison et installation offertes. Paiement par carte bancaire sur la page sécurisée Stripe.</p>
      <a class="btn btn-primary btn-block" href="panier.html">Commander ${icon('arrow')}</a>
      <button class="btn btn-outline btn-block" type="button" data-cart-close-2>Continuer mes achats</button>`;
    foot.querySelector('[data-cart-close-2]').addEventListener('click', closeCart);
  }

  if (currentPage === 'cart') renderCartPage();
}

document.addEventListener('click', (event) => {
  const inc = event.target.closest('[data-qty-inc]');
  const dec = event.target.closest('[data-qty-dec]');
  const rem = event.target.closest('[data-remove]');

  if (inc) {
    const item = cart.items.find((i) => i.key === inc.dataset.qtyInc);
    if (item) cart.setQty(item.key, item.qty + 1);
  }
  if (dec) {
    const item = cart.items.find((i) => i.key === dec.dataset.qtyDec);
    if (item) cart.setQty(item.key, item.qty - 1);
  }
  if (rem) {
    cart.remove(rem.dataset.remove);
    showToast('Article retiré du panier');
  }
});



/* =========================
   PAGE : ACCUEIL
========================= */

function initHome() {
  const grid = document.querySelector('[data-featured]');
  if (grid) grid.innerHTML = PRODUCTS.map((p, i) => productCardHtml(p, i)).join('');
}


/* =========================
   PAGE : COLLECTION
========================= */

function initCollection() {
  const grid = document.querySelector('[data-collection]');
  const chips = document.querySelector('[data-style-filters]');
  const sizeSelect = document.getElementById('filter-size');
  const priceSelect = document.getElementById('filter-price');
  const sortSelect = document.getElementById('sort');
  const countEl = document.querySelector('[data-result-count]');
  const compare = document.querySelector('[data-compare]');

  const params = new URLSearchParams(window.location.search);
  const state = {
    style: STYLE_FILTERS.some((f) => f.id === params.get('style')) ? params.get('style') : 'all',
    size: '160x200',
    price: 'all',
    sort: 'featured'
  };

  chips.innerHTML = STYLE_FILTERS.map((f) =>
    `<button class="chip" type="button" data-style="${f.id}" aria-pressed="${f.id === state.style}">${f.label}</button>`
  ).join('');

  sizeSelect.innerHTML = SIZES.map((s) =>
    `<option value="${s.id}"${s.id === state.size ? ' selected' : ''}>${s.label} cm</option>`
  ).join('');

  function apply() {
    let list = PRODUCTS.filter((p) => state.style === 'all' || p.style === state.style);

    if (state.price !== 'all') {
      const max = Number(state.price);
      list = list.filter((p) => p.prices[state.size] <= max);
    }

    if (state.sort === 'price-asc') list = [...list].sort((a, b) => a.prices[state.size] - b.prices[state.size]);
    if (state.sort === 'price-desc') list = [...list].sort((a, b) => b.prices[state.size] - a.prices[state.size]);
    if (state.sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

    countEl.textContent = `${list.length} lit${list.length > 1 ? 's' : ''}, prix affichés en ${sizeLabel(state.size)} cm`;

    if (!list.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <h3>Aucun lit ne correspond</h3>
          <p>Essayez un autre style ou élargissez votre budget.</p>
          <button class="btn btn-outline" type="button" data-reset>Réinitialiser les filtres</button>
        </div>`;
      grid.querySelector('[data-reset]').addEventListener('click', reset);
      return;
    }

    grid.innerHTML = list.map((p, i) => productCardHtml(p, i).replace(
      `<strong>${formatPrice(minPrice(p))}</strong>`,
      `<strong>${formatPrice(p.prices[state.size])}</strong>`
    ).replace('<small>À partir de</small>', `<small>En ${sizeLabel(state.size)}</small>`)).join('');

    grid.querySelectorAll('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  function reset() {
    state.style = 'all';
    state.price = 'all';
    priceSelect.value = 'all';
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c.dataset.style === 'all')));
    apply();
  }

  chips.addEventListener('click', (event) => {
    const chip = event.target.closest('.chip');
    if (!chip) return;
    state.style = chip.dataset.style;
    chips.querySelectorAll('.chip').forEach((c) => c.setAttribute('aria-pressed', String(c === chip)));
    apply();
  });

  sizeSelect.addEventListener('change', () => { state.size = sizeSelect.value; apply(); });
  priceSelect.addEventListener('change', () => { state.price = priceSelect.value; apply(); });
  sortSelect.addEventListener('change', () => { state.sort = sortSelect.value; apply(); });

  apply();

  if (compare) compare.innerHTML = compareTableHtml();
}


function initProduct() {
  const root = document.querySelector('[data-product]');
  const product = findProduct(root.dataset.product) || PRODUCTS[0];
  const views = productViews(product);
  const state = { size: '160x200', fabric: product.fabrics[0].name, qty: 1, view: 0 };

  root.innerHTML = productPageHtml(product);

  const mainImg = root.querySelector('[data-main-img]');
  const mainCaption = root.querySelector('[data-main-caption]');
  const thumbs = root.querySelectorAll('[data-view]');

  thumbs.forEach((thumb) => {
    thumb.addEventListener('click', () => {
      const view = views[Number(thumb.dataset.view)];
      mainImg.setAttribute('style', cropStyle(view));
      mainCaption.textContent = view.label;
      thumbs.forEach((t) => t.setAttribute('aria-current', String(t === thumb)));
    });
  });

  const form = root.querySelector('[data-buy-form]');
  const priceEl = root.querySelector('[data-price]');
  const fabricName = root.querySelector('[data-fabric-name]');
  const qtyEl = root.querySelector('[data-buy-qty]');

  form.addEventListener('change', (event) => {
    if (event.target.name === 'size') {
      state.size = event.target.value;
      priceEl.textContent = formatPrice(product.prices[state.size]);
    }
    if (event.target.name === 'fabric') {
      state.fabric = event.target.value;
      fabricName.textContent = state.fabric;
    }
  });

  root.querySelector('[data-buy-inc]').addEventListener('click', () => {
    state.qty = Math.min(state.qty + 1, 10);
    qtyEl.textContent = state.qty;
  });

  root.querySelector('[data-buy-dec]').addEventListener('click', () => {
    state.qty = Math.max(state.qty - 1, 1);
    qtyEl.textContent = state.qty;
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    cart.add(product.id, state.size, state.fabric, state.qty);
    showToast(`${product.name} ${sizeLabel(state.size)} ajouté au panier`);
    openCart();
  });

  /* Barre d’achat mobile : visible tant que le bouton principal est hors écran */
  const sticky = root.querySelector('[data-buy-sticky]');
  const stickyPrice = root.querySelector('[data-sticky-price]');
  const buyRow = root.querySelector('.buy-row');
  form.addEventListener('change', () => {
    stickyPrice.textContent = formatPrice(product.prices[state.size]);
  });
  root.querySelector('[data-sticky-add]').addEventListener('click', () => form.requestSubmit());
  if (sticky && buyRow && 'IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      sticky.classList.toggle('is-visible', !entry.isIntersecting);
    }).observe(buyRow);
  }

  const related = document.querySelector('[data-related]');
  if (related) {
    related.innerHTML = PRODUCTS.filter((p) => p.id !== product.id)
      .map((p, i) => productCardHtml(p, i)).join('');
  }
}


/* =========================
   PAGE : PANIER
========================= */

function renderCartPage() {
  const list = document.querySelector('[data-cart-page]');
  const summary = document.querySelector('[data-summary]');
  const checkout = document.querySelector('[data-checkout]');
  if (!list) return;

  if (!cart.items.length) {
    list.innerHTML = emptyCartHtml();
    summary.hidden = true;
    if (checkout && !checkout.dataset.done) checkout.hidden = true;
    return;
  }

  summary.hidden = false;
  if (checkout) checkout.hidden = false;
  list.innerHTML = cart.items.map(cartLineHtml).join('');

  const total = cart.total();
  summary.querySelector('[data-sum-sub]').textContent = formatPrice(total);
  summary.querySelector('[data-sum-total]').textContent = formatPrice(total);
  summary.querySelector('[data-sum-count]').textContent = `${cart.count()} article${cart.count() > 1 ? 's' : ''}`;
}

function initCheckout() {
  const form = document.querySelector('[data-checkout-form]');
  if (!form) return;

  const canceled = document.querySelector('[data-payment-cancel]');
  if (new URLSearchParams(window.location.search).get('paiement') === 'annule') {
    canceled.hidden = false;
  }

  const email = form.querySelector('[data-checkout-email]');
  const consent = form.querySelector('[name="cgv"]');
  const error = form.querySelector('[data-checkout-error]');
  const submit = form.querySelector('[data-checkout-submit]');

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    error.textContent = '';

    const emailError = fieldError(email);
    showFieldError(email, emailError);
    const consentError = fieldError(consent);
    showFieldError(consent, consentError);
    const firstInvalid = emailError ? email : consentError ? consent : null;
    if (firstInvalid) {
      firstInvalid.focus();
      return;
    }

    if (!cart.items.length) {
      error.textContent = 'Votre panier est vide. Ajoutez un lit avant de poursuivre.';
      return;
    }

    submit.disabled = true;
    submit.setAttribute('aria-busy', 'true');
    submit.textContent = 'Connexion au paiement sécurisé…';
    try {
      const response = await fetch('/api/checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.value.trim(),
          items: cart.items.map(({ id, size, fabric, qty }) => ({ id, size, fabric, qty }))
        })
      });
      const result = await response.json();
      if (!response.ok || typeof result.url !== 'string') {
        throw new Error(result.error || 'Le paiement est momentanément indisponible. Réessayez dans quelques instants.');
      }
      window.location.assign(result.url);
    } catch (requestError) {
      error.textContent = requestError instanceof Error
        ? requestError.message
        : 'Impossible de joindre le paiement sécurisé. Vérifiez votre connexion et réessayez.';
      submit.disabled = false;
      submit.removeAttribute('aria-busy');
      submit.innerHTML = `Continuer vers le paiement sécurisé ${icon('arrow')}`;
    }
  });
}

/* =========================
   FORMULAIRES
========================= */

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+\d][\d\s.-]{8,}$/;
const ZIP_RE = /^\d{5}$/;

function fieldError(input) {
  const value = input.value.trim();
  const label = input.dataset.label || 'Ce champ';

  if (input.type === 'checkbox') {
    return input.required && !input.checked ? 'Merci de cocher cette case pour continuer.' : '';
  }
  if (input.required && !value) return `${label} est obligatoire.`;
  if (!value) return '';
  if (input.type === 'email' && !EMAIL_RE.test(value)) return 'Adresse e-mail invalide (ex. : prenom@exemple.fr).';
  if (input.type === 'tel' && !PHONE_RE.test(value)) return 'Numéro de téléphone invalide (ex. : 06 12 34 56 78).';
  if (input.dataset.zip !== undefined && !ZIP_RE.test(value)) return 'Code postal à 5 chiffres.';
  if (input.minLength > 0 && value.length < input.minLength) return `${label} doit contenir au moins ${input.minLength} caractères.`;
  return '';
}

function showFieldError(input, message) {
  const errorEl = document.getElementById(`${input.id}-error`);
  input.setAttribute('aria-invalid', message ? 'true' : 'false');
  if (errorEl) errorEl.textContent = message;
}

function initForms() {
  document.querySelectorAll('form[data-validate]').forEach((form) => {
    const inputs = form.querySelectorAll('input, select, textarea');

    inputs.forEach((input) => {
      input.addEventListener('blur', () => {
        if (input.value || input.getAttribute('aria-invalid') === 'true') showFieldError(input, fieldError(input));
      });
      input.addEventListener('input', () => {
        if (input.getAttribute('aria-invalid') === 'true') showFieldError(input, fieldError(input));
      });
    });

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      let firstInvalid = null;

      inputs.forEach((input) => {
        const message = fieldError(input);
        showFieldError(input, message);
        if (message && !firstInvalid) firstInvalid = input;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        return;
      }

      const success = form.parentElement.querySelector('[data-success]') || form.querySelector('[data-success]');
      form.reset();
      inputs.forEach((input) => input.removeAttribute('aria-invalid'));
      if (success) {
        success.hidden = false;
        success.setAttribute('tabindex', '-1');
        success.focus();
      }
    });
  });
}


/* =========================
   ANIMATIONS AU SCROLL
========================= */

function initReveal() {
  const items = document.querySelectorAll('.reveal:not(.is-visible)');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach((el) => el.classList.add('is-visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  items.forEach((el) => observer.observe(el));
}


/* =========================
   DÉMARRAGE
========================= */

cart.load();

if (currentPage === 'home') initHome();
if (currentPage === 'collection') initCollection();
if (currentPage === 'product') initProduct();

renderCart();
hydrateIcons();
initForms();
initCheckout();
initReveal();

/* Coordonnées : toujours lues depuis SHOP (data.js) */
document.querySelectorAll('[data-shop]').forEach((el) => {
  const value = SHOP[el.dataset.shop];
  if (value) el.textContent = value;
});
document.querySelectorAll('[data-shop-tel]').forEach((el) => { el.href = `tel:${SHOP.phoneHref}`; });
document.querySelectorAll('[data-shop-mail]').forEach((el) => { el.href = `mailto:${SHOP.email}`; });

/* Contact : présélection du sujet via ?sujet=echantillons */
const subjectSelect = document.getElementById('c-subject');
if (subjectSelect) {
  const subject = new URLSearchParams(window.location.search).get('sujet');
  if (subject && subjectSelect.querySelector(`option[value="${CSS.escape(subject)}"]`)) {
    subjectSelect.value = subject;
  }
}
