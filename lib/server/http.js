export function json(res, status, body, headers = {}) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store');
  Object.entries(headers).forEach(([name, value]) => res.setHeader(name, value));
  res.end(JSON.stringify(body));
}

export function methodNotAllowed(res, allowed) {
  res.setHeader('Allow', allowed.join(', '));
  json(res, 405, { error: 'Méthode non autorisée.' });
}

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export async function readJson(req) {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body;
  }

  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (raw.length > 32_768) throw new RequestError(413, 'Requête trop volumineuse.');
  }
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw new RequestError(400, 'Corps de requête invalide.');
  }
}

export function siteUrl() {
  const value = process.env.SITE_URL;
  if (!value) throw new Error('SITE_URL is not configured.');
  const url = new URL(value);
  if (url.protocol !== 'https:' && url.hostname !== 'localhost') {
    throw new Error('SITE_URL must use HTTPS.');
  }
  return url.origin;
}

export function clientIp(req) {
  return (req.headers['x-forwarded-for'] || '').split(',')[0].trim()
    || req.socket?.remoteAddress
    || 'unknown';
}

export function handleError(res, error, message = 'Une erreur est survenue. Réessayez plus tard.') {
  if (error instanceof RequestError) {
    return json(res, error.status, { error: error.message });
  }
  console.error(error);
  if (res.headersSent) return;
  json(res, 500, { error: message });
}

export function parseCookies(req) {
  return Object.fromEntries((req.headers.cookie || '').split(';').map((part) => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    try {
      return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
    } catch {
      return ['', ''];
    }
  }).filter(([name]) => name));
}
