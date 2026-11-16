const loginPanel = document.querySelector('[data-account-login-panel]');
const loginForm = document.querySelector('[data-account-login]');
const loginError = document.querySelector('[data-account-error]');
const loginMessage = document.querySelector('[data-account-message]');
const loginButton = document.querySelector('[data-account-submit]');
const verifyPanel = document.querySelector('[data-account-verify]');
const verifyButton = document.querySelector('[data-verify-submit]');
const verifyError = document.querySelector('[data-verify-error]');
const ordersPanel = document.querySelector('[data-account-orders]');
const ordersList = document.querySelector('[data-orders-list]');
const identity = document.querySelector('[data-account-identity]');
const token = new URLSearchParams(window.location.search).get('token');
if (token) window.history.replaceState({}, '', 'compte.html');

async function requestJson(url, options = {}) {
  const response = await fetch(url, { credentials: 'same-origin', ...options });
  const result = await response.json();
  return { response, result };
}

function formatAmount(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount / 100);
}

function renderOrders(data) {
  identity.textContent = data.email;
  ordersList.replaceChildren();

  if (!data.orders.length) {
    const empty = document.createElement('p');
    empty.textContent = 'Aucune commande payée n’est associée à ce compte.';
    ordersList.append(empty);
    return;
  }

  data.orders.forEach((order) => {
    const card = document.createElement('article');
    card.className = 'account-order';
    const heading = document.createElement('h3');
    heading.textContent = `Commande ${order.orderNumber}`;
    const status = document.createElement('p');
    status.className = 'helper';
    status.textContent = `Paiement confirmé · ${new Date(order.createdAt).toLocaleDateString('fr-FR')}`;
    const items = document.createElement('ul');
    order.items.forEach((item) => {
      const line = document.createElement('li');
      line.textContent = `Lit ${item.name}, ${item.size} cm, ${item.fabric}, quantité ${item.qty}`;
      items.append(line);
    });
    const total = document.createElement('p');
    total.className = 'order-total';
    total.textContent = `Total payé : ${formatAmount(order.amountTotal)}`;
    card.append(heading, status, items, total);

    const address = order.shippingAddress;
    if (address) {
      const shipping = document.createElement('p');
      shipping.className = 'helper';
      shipping.textContent = [
        address.line1,
        address.line2,
        [address.postal_code, address.city].filter(Boolean).join(' ')
      ].filter(Boolean).join(', ');
      card.append(shipping);
    }
    ordersList.append(card);
  });
}

async function loadAccount() {
  const { response, result } = await requestJson('/api/account/orders');
  if (response.status === 401) return false;
  if (!response.ok) throw new Error(result.error || 'Impossible de charger votre compte.');
  renderOrders(result);
  loginPanel.hidden = true;
  ordersPanel.hidden = false;
  return true;
}

loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  loginError.textContent = '';
  loginMessage.hidden = true;
  const email = loginForm.elements.email.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    loginError.textContent = 'Saisissez une adresse e-mail valide.';
    loginForm.elements.email.focus();
    return;
  }

  loginButton.disabled = true;
  try {
    const { response, result } = await requestJson('/api/account/request-link', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    if (!response.ok) throw new Error(result.error || 'Impossible d’envoyer le lien.');
    loginMessage.textContent = result.message;
    loginMessage.hidden = false;
  } catch (error) {
    loginError.textContent = error instanceof Error ? error.message : 'Une erreur est survenue.';
  } finally {
    loginButton.disabled = false;
  }
});

verifyButton.addEventListener('click', async () => {
  verifyError.textContent = '';
  verifyButton.disabled = true;
  try {
    const { response, result } = await requestJson('/api/account/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    if (!response.ok) throw new Error(result.error || 'Lien de connexion invalide ou expiré.');
    verifyPanel.hidden = true;
    await loadAccount();
  } catch (error) {
    verifyError.textContent = error instanceof Error ? error.message : 'Une erreur est survenue.';
    verifyButton.disabled = false;
  }
});

document.querySelector('[data-account-logout]').addEventListener('click', async () => {
  try {
    const { response, result } = await requestJson('/api/account/logout', { method: 'POST' });
    if (!response.ok) throw new Error(result.error || 'Impossible de fermer la session.');
    window.location.reload();
  } catch (error) {
    loginError.textContent = error instanceof Error ? error.message : 'Impossible de fermer la session.';
  }
});

if (token) verifyPanel.hidden = false;
loadAccount().catch((error) => {
  loginError.textContent = error instanceof Error ? error.message : 'Impossible de charger votre compte.';
});
