import { db } from '../lib/server/db.js';
import { handleError, json, methodNotAllowed } from '../lib/server/http.js';
import { stripe } from '../lib/server/services.js';
import { deliverOrderAccess } from '../lib/server/orders.js';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET is not configured.');
    const chunks = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const rawBody = Buffer.concat(chunks);
    const signature = req.headers['stripe-signature'];
    const event = stripe().webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);

    if (event.type === 'checkout.session.completed' || event.type === 'checkout.session.async_payment_succeeded') {
      const session = event.data.object;
      if (session.payment_status === 'paid' && session.metadata?.orderId) {
        const sql = db();
        const details = session.collected_information?.shipping_details || session.shipping_details || null;
        const customer = session.customer_details || {};
        const rows = await sql`
          UPDATE orders
          SET status = 'paid',
              stripe_payment_intent_id = ${typeof session.payment_intent === 'string' ? session.payment_intent : null},
              email = COALESCE(${customer.email || null}, email),
              customer_name = ${details?.name || customer.name || null},
              shipping_json = ${details ? JSON.stringify(details) : null}::jsonb,
              updated_at = now()
          WHERE id = ${session.metadata.orderId}
            AND stripe_session_id = ${session.id}
            AND order_number = ${session.metadata.orderNumber}
          RETURNING id, order_number, email
        `;
        if (rows.length) await deliverOrderAccess(rows[0], event.id);
      }
    } else if (event.type === 'checkout.session.async_payment_failed') {
      const session = event.data.object;
      if (session.metadata?.orderId) {
        await db()`
          UPDATE orders SET status = 'payment_failed', updated_at = now()
          WHERE id = ${session.metadata.orderId} AND stripe_session_id = ${session.id}
        `;
      }
    }

    return json(res, 200, { received: true });
  } catch (error) {
    handleError(res, error, 'Webhook de paiement invalide ou traitement impossible.');
  }
}
