CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY,
  order_number TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  amount_total INTEGER NOT NULL CHECK (amount_total > 0),
  currency TEXT NOT NULL DEFAULT 'eur',
  status TEXT NOT NULL,
  items_json JSONB NOT NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  customer_name TEXT,
  shipping_json JSONB,
  confirmation_email_claimed_at TIMESTAMPTZ,
  confirmation_email_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS orders_email_status_idx ON orders (lower(email), status, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_stripe_payment_intent_idx ON orders (stripe_payment_intent_id);

CREATE TABLE IF NOT EXISTS account_magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_magic_links_expiry_idx ON account_magic_links (expires_at);

CREATE TABLE IF NOT EXISTS account_sessions (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS account_sessions_expiry_idx ON account_sessions (expires_at);

CREATE TABLE IF NOT EXISTS api_rate_limits (
  key TEXT PRIMARY KEY,
  window_started_at TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0
);
