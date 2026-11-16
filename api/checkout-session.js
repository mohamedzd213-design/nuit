import { randomBytes, randomUUID } from 'node:crypto';
import { db, rateLimit } from '../lib/server/db.js';
import { json, methodNotAllowed, readJson, siteUrl, handleError } from '../lib/server/http.js';
import { validateItems } from '../lib/server/catalog.js';
import { stripe } from '../lib/server/services.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const origin = req.headers.origin;
    if (!origin || origin !== siteUrl()) {
      return json(res, 403, { error: 'Origine de la requête non autorisée.' });
    }

    if (!await rateLimit(req, 'checkout', 10)) {
      return json(res, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    }

    const body = await readJson(req);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email) || email.length > 254) {
      return json(res, 400, { error: 'Saisissez une adresse e-mail valide.' });
    }

    let orderItems;
    let total;
    try {
      ({ items: orderItems, total } = validateItems(body.items));
    } catch (error) {
      return json(res, 400, { error: error.message });
    }

    const sql = db();
    const id = randomUUID();
    const orderNumber = `ML-${new Date().toISOString().slice(0, 10).replaceAll('-', '')}-${randomBytes(4).toString('hex').toUpperCase()}`;
    const baseUrl = siteUrl();
    const itemsJson = JSON.stringify(orderItems);

    await sql`
      INSERT INTO orders (id, order_number, email, amount_total, currency, status, items_json)
      VALUES (${id}, ${orderNumber}, ${email}, ${total}, 'eur', 'checkout_pending', ${itemsJson}::jsonb)
    `;

    try {
      const session = await stripe().checkout.sessions.create({
        mode: 'payment',
        locale: 'fr',
        customer_email: email,
        billing_address_collection: 'required',
        phone_number_collection: { enabled: true },
        shipping_address_collection: { allowed_countries: ['FR'] },
        shipping_options: [{
          shipping_rate_data: {
            type: 'fixed_amount',
            fixed_amount: { amount: 0, currency: 'eur' },
            display_name: 'Livraison et installation offertes'
          }
        }],
        line_items: orderItems.map((item) => ({
          quantity: item.qty,
          price_data: {
            currency: 'eur',
            unit_amount: item.unitAmount,
            tax_behavior: 'inclusive',
            product_data: {
              name: `Lit ${item.name}`,
              description: `${item.size} cm · ${item.fabric}`
            }
          }
        })),
        metadata: { orderId: id, orderNumber },
        payment_intent_data: { metadata: { orderId: id, orderNumber } },
        success_url: `${baseUrl}/confirmation.html?order=${encodeURIComponent(orderNumber)}&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/panier.html?paiement=annule`
      });

      await sql`
        UPDATE orders SET stripe_session_id = ${session.id}, updated_at = now()
        WHERE id = ${id}
      `;
      return json(res, 200, { url: session.url });
    } catch (error) {
      await sql`UPDATE orders SET status = 'checkout_error', updated_at = now() WHERE id = ${id}`;
      throw error;
    }
  } catch (error) {
    handleError(res, error, 'Impossible de préparer le paiement. Réessayez ou contactez-nous.');
  }
}
