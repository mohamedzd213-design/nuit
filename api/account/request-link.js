import { db, rateLimit } from '../../lib/server/db.js';
import { json, methodNotAllowed, readJson, siteUrl, handleError } from '../../lib/server/http.js';
import { escapeHtml, newToken, tokenHash, validEmail } from '../../lib/server/tokens.js';
import { sendEmail } from '../../lib/server/services.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    if (!await rateLimit(req, 'account-link', 5)) {
      return json(res, 429, { error: 'Trop de tentatives. Réessayez dans quelques minutes.' });
    }

    const body = await readJson(req);
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    if (!validEmail(email)) return json(res, 400, { error: 'Saisissez une adresse e-mail valide.' });

    const sql = db();
    const orders = await sql`
      SELECT 1 FROM orders WHERE lower(email) = ${email} AND status = 'paid' LIMIT 1
    `;

    if (orders.length) {
      const token = newToken();
      const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await sql`
        INSERT INTO account_magic_links (token_hash, email, expires_at)
        VALUES (${tokenHash(token)}, ${email}, ${expiry})
      `;
      const link = new URL('/compte.html', siteUrl());
      link.searchParams.set('token', token);
      const safeLink = escapeHtml(link.toString());
      await sendEmail({
        to: email,
        subject: 'Votre lien de connexion Maison Lune',
        idempotencyKey: `account-login-${tokenHash(token)}`,
        text: `Connectez-vous à votre compte Maison Lune : ${link}\nCe lien expire dans 15 minutes.`,
        html: `<p>Vous avez demandé à accéder à votre compte Maison Lune.</p><p><a href="${safeLink}">Accéder à mon compte</a></p><p>Ce lien expire dans 15 minutes. Si vous n’êtes pas à l’origine de cette demande, ignorez cet e-mail.</p>`
      });
    }

    return json(res, 200, {
      message: 'Si une commande payée correspond à cette adresse, un lien de connexion vient de vous être envoyé.'
    });
  } catch (error) {
    handleError(res, error, 'Impossible d’envoyer le lien de connexion. Réessayez plus tard.');
  }
}
