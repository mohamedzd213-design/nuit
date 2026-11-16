import { db } from '../../lib/server/db.js';
import { json, methodNotAllowed, readJson, handleError } from '../../lib/server/http.js';
import { cookie, newToken, tokenHash } from '../../lib/server/tokens.js';

const SESSION_MAX_AGE = 30 * 24 * 60 * 60;

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const body = await readJson(req);
    if (typeof body.token !== 'string' || body.token.length < 40 || body.token.length > 100) {
      return json(res, 400, { error: 'Lien de connexion invalide ou expiré.' });
    }

    const sql = db();
    const links = await sql`
      UPDATE account_magic_links
      SET used_at = now()
      WHERE token_hash = ${tokenHash(body.token)}
        AND used_at IS NULL
        AND expires_at > now()
      RETURNING email
    `;
    if (!links.length) return json(res, 401, { error: 'Lien de connexion invalide ou expiré. Demandez-en un nouveau.' });

    const sessionToken = newToken();
    await sql`
      INSERT INTO account_sessions (token_hash, email, expires_at)
      VALUES (
        ${tokenHash(sessionToken)},
        ${links[0].email},
        now() + interval '30 days'
      )
    `;
    return json(res, 200, { connected: true }, {
      'Set-Cookie': cookie('maisonlune_session', sessionToken, SESSION_MAX_AGE)
    });
  } catch (error) {
    handleError(res, error, 'Impossible de vérifier le lien de connexion.');
  }
}
