import { db } from '../lib/server/db.js';
import { json, methodNotAllowed, handleError } from '../lib/server/http.js';
import { stripe } from '../lib/server/services.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const orderNumber = typeof req.query.order === 'string' ? req.query.order : '';
    const sessionId = typeof req.query.session_id === 'string' ? req.query.session_id : '';
    if (!/^ML-\d{8}-[A-F0-9]{8}$/.test(orderNumber) || !/^cs_(test|live)_/.test(sessionId)) {
      return json(res, 400, { error: 'Lien de confirmation invalide.' });
    }

    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.metadata?.orderNumber !== orderNumber || session.id !== sessionId) {
      return json(res, 404, { error: 'Commande introuvable.' });
    }
    if (session.payment_status !== 'paid') {
      return json(res, 202, { paid: false, status: session.status });
    }

    const sql = db();
    const rows = await sql`
      UPDATE orders
      SET status = 'paid', updated_at = now()
      WHERE order_number = ${orderNumber} AND stripe_session_id = ${sessionId}
      RETURNING order_number, amount_total, currency, email, items_json, created_at
    `;
    if (!rows.length) return json(res, 404, { error: 'Commande introuvable.' });

    const order = rows[0];
    return json(res, 200, {
      paid: true,
      orderNumber: order.order_number,
      amountTotal: Number(order.amount_total),
      currency: order.currency,
      email: order.email,
      items: order.items_json,
      createdAt: order.created_at
    });
  } catch (error) {
    handleError(res, error, 'Impossible de vérifier le paiement. Actualisez la page dans quelques instants.');
  }
}
