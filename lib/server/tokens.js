import { createHash, randomBytes } from 'node:crypto';

export function newToken() {
  return randomBytes(32).toString('base64url');
}

export function tokenHash(token) {
  return createHash('sha256').update(token).digest('hex');
}

export function validEmail(email) {
  return typeof email === 'string'
    && email.length <= 254
    && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim());
}

export function cookie(name, value, maxAge) {
  return `${name}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;
}

export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
}
