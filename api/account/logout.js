import { db } from '../../lib/server/db.js';
import { json, methodNotAllowed, parseCookies, handleError } from '../../lib/server/http.js';
import { cookie, tokenHash } from '../../lib/server/tokens.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST']);

  try {
    const token = parseCookies(req).maisonlune_session;
    if (token) await db()`DELETE FROM account_sessions WHERE token_hash = ${tokenHash(token)}`;
    return json(res, 200, { disconnected: true }, {
      'Set-Cookie': cookie('maisonlune_session', '', 0)
    });
  } catch (error) {
    handleError(res, error, 'Impossible de fermer la session.');
  }
}
