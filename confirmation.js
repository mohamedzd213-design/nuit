const title = document.querySelector('[data-confirmation-title]');
const message = document.querySelector('[data-confirmation-message]');
const card = document.querySelector('[data-confirmation-card]');
const error = document.querySelector('[data-confirmation-error]');

function formatAmount(amount, currency) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: currency.toUpperCase()
  }).format(amount / 100);
}

function renderOrder(order) {
  title.textContent = 'Commande confirmée';
  message.textContent = 'Votre paiement a été accepté. Votre commande est enregistrée.';
  document.querySelector('[data-order-number]').textContent = order.orderNumber;
  document.querySelector('[data-order-email]').textContent = order.email;
  document.querySelector('[data-order-total]').textContent = formatAmount(order.amountTotal, order.currency);

  const list = document.querySelector('[data-order-items]');
  list.replaceChildren();
  order.items.forEach((item) => {
    const line = document.createElement('p');
    line.textContent = `Lit ${item.name}, ${item.size} cm, ${item.fabric}, quantité ${item.qty}`;
    list.append(line);
  });

  try {
    window.localStorage.removeItem('nuit-cart');
  } catch (storageError) {
    console.error('Unable to clear the local cart after payment.', storageError);
  }
  card.hidden = false;
}

async function verifyPayment() {
  const params = new URLSearchParams(window.location.search);
  const orderNumber = params.get('order');
  const sessionId = params.get('session_id');
  if (!orderNumber || !sessionId) {
    throw new Error('Les informations de paiement sont manquantes. Consultez Mon compte ou contactez-nous.');
  }

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const url = new URL('/api/order-confirmation', window.location.origin);
    url.searchParams.set('order', orderNumber);
    url.searchParams.set('session_id', sessionId);
    const response = await fetch(url, { cache: 'no-store' });
    const result = await response.json();

    if (response.ok && result.paid) {
      renderOrder(result);
      return;
    }
    if (response.status !== 202) throw new Error(result.error || 'Impossible de vérifier le paiement.');
    message.textContent = 'Le paiement est en cours de confirmation. Cette page se met à jour automatiquement.';
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error('Le paiement n’est pas encore confirmé. Ne repassez pas commande tout de suite. Consultez Mon compte dans quelques minutes.');
}

verifyPayment().catch((verificationError) => {
  title.textContent = 'Vérification en cours';
  message.textContent = '';
  error.textContent = verificationError instanceof Error
    ? verificationError.message
    : 'Impossible de vérifier le paiement. Consultez Mon compte ou contactez-nous.';
});
