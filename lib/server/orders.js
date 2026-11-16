import { db } from './db.js';
import { newToken, tokenHash, escapeHtml } from './tokens.js';
import { sendEmail } from './services.js';
import { siteUrl } from './http.js';

export async function deliverOrderAccess(order, eventId) {
  const sql = db();
  const claims = await sql`
    UPDATE orders
    SET confirmation_email_claimed_at = now()
    WHERE id = ${order.id}
      AND confirmation_email_sent_at IS NULL
      AND (confirmation_email_claimed_at IS NULL
        OR confirmation_email_claimed_at < now() - interval '10 minutes')
    RETURNING order_number, email
  `;
  if (!claims.length) return;

  const token = newToken();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  await sql`
    INSERT INTO account_magic_links (token_hash, email, expires_at)
    VALUES (${tokenHash(token)}, ${claims[0].email}, ${expiresAt})
  `;

  const accountUrl = new URL('/compte.html', siteUrl());
  accountUrl.searchParams.set('token', token);
  const safeOrderNumber = escapeHtml(claims[0].order_number);
  const safeUrl = escapeHtml(accountUrl.toString());

  try {
    await sendEmail({
      to: claims[0].email,
      subject: `Votre commande ${claims[0].order_number} est confirmée`,
      idempotencyKey: `order-confirmation-${eventId}`,
      text: `Votre paiement est confirmé. Numéro de commande : ${claims[0].order_number}.\nConsultez votre commande et accédez à votre compte : ${accountUrl}`,
      html: `<p>Votre paiement est confirmé.</p><p>Numéro de commande : <strong>${safeOrderNumber}</strong></p><p><a href="${safeUrl}">Consulter ma commande et accéder à mon compte</a></p><p>Ce lien de connexion expire dans 15 minutes. Vous pourrez en demander un nouveau depuis la page Mon compte.</p>`
    });
    await sql`
      UPDATE orders
      SET confirmation_email_sent_at = now(), confirmation_email_claimed_at = NULL
      WHERE id = ${order.id}
    `;
  } catch (error) {
    await sql`UPDATE orders SET confirmation_email_claimed_at = NULL WHERE id = ${order.id}`;
    throw error;
  }
}

export function orderItems(items) {
  return items.map((item) => ({
    name: item.name,
    size: item.size,
    fabric: item.fabric,
    qty: item.qty,
    unitAmount: item.unitAmount
  }));
}
