import { neon } from '@neondatabase/serverless';

export function db() {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is not configured.');
  return neon(process.env.DATABASE_URL);
}

export async function rateLimit(req, action, limit = 10) {
  const sql = db();
  const { createHash } = await import('node:crypto');
  const ipHash = createHash('sha256')
    .update(`${action}:${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown'}`)
    .digest('hex');
  const rows = await sql`
    INSERT INTO api_rate_limits (key, window_started_at, request_count)
    VALUES (${ipHash}, now(), 1)
    ON CONFLICT (key) DO UPDATE SET
      request_count = CASE
        WHEN api_rate_limits.window_started_at < now() - interval '10 minutes' THEN 1
        ELSE api_rate_limits.request_count + 1
      END,
      window_started_at = CASE
        WHEN api_rate_limits.window_started_at < now() - interval '10 minutes' THEN now()
        ELSE api_rate_limits.window_started_at
      END
    RETURNING request_count
  `;
  return Number(rows[0]?.request_count || 0) <= limit;
}
