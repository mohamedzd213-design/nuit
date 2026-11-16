import { db } from '../../lib/server/db.js';
import { json, methodNotAllowed, parseCookies, handleError } from '../../lib/server/http.js';
import { tokenHash } from '../../lib/server/tokens.js';

export default async function handler(req, res) {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET']);

  try {
    const token = parseCookies(req).maisonlune_session;
    if (!token) return json(res, 401, { error: 'Connectez-vous pour consulter vos commandes.' });

    const sql = db();
    const sessions = await sql`
      SELECT email FROM account_sessions
      WHERE token_hash = ${tokenHash(token)} AND expires_at > now()
      LIMIT 1
    `;
    if (!sessions.length) return json(res, 401, { error: 'Votre session a expiré. Connectez-vous à nouveau.' });

    const orders = await sql`
      SELECT order_number, amount_total, currency, status, items_json,
        customer_name, shipping_json, created_at
      FROM orders
      WHERE lower(email) = ${sessions[0].email} AND status = 'paid'
      ORDER BY created_at DESC
      LIMIT 100
    `;
    return json(res, 200, {
      email: sessions[0].email,
      orders: orders.map((order) => ({
        orderNumber: order.order_number,
        amountTotal: Number(order.amount_total),
        currency: order.currency,
        status: order.status,
        items: order.items_json,
        customerName: order.customer_name,
        shippingAddress: order.shipping_json?.address || null,
        createdAt: order.created_at
      }))
    });
  } catch (error) {
    handleError(res, error, 'Impossible de charger votre compte. Réessayez plus tard.');
  }
}
