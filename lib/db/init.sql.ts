/**
 * SQL executed once on PGlite initialization to create all tables.
 * Uses IF NOT EXISTS so it is safe to run on every app startup.
 */
export const INIT_SQL = /* sql */ `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  currency TEXT NOT NULL DEFAULT 'USD',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  level_up_pending BOOLEAN NOT NULL DEFAULT false,
  streak INTEGER NOT NULL DEFAULT 0,
  last_transaction_date TIMESTAMPTZ,
  streak_freeze_available INTEGER NOT NULL DEFAULT 0,
  last_freeze_granted_at TIMESTAMPTZ,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  seen_tips TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  color TEXT NOT NULL DEFAULT '#6C47FF',
  icon TEXT NOT NULL DEFAULT 'wallet',
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON wallets(user_id);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '💰',
  color TEXT NOT NULL DEFAULT '#6C47FF',
  is_default BOOLEAN NOT NULL DEFAULT false,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wallet_id TEXT NOT NULL REFERENCES wallets(id),
  destination_wallet_id TEXT REFERENCES wallets(id),
  category_id TEXT REFERENCES categories(id),
  amount NUMERIC(18, 2) NOT NULL,
  type TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  note TEXT,
  is_recurring_generated BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions(user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_user_wallet ON transactions(user_id, wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_category ON transactions(user_id, category_id);

CREATE TABLE IF NOT EXISTS budgets (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_id TEXT NOT NULL REFERENCES categories(id),
  monthly_limit NUMERIC(18, 2) NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  rollover_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, category_id, month, year)
);
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_user_month_year ON budgets(user_id, month, year);

CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, type)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

CREATE TABLE IF NOT EXISTS monthly_challenges (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_type TEXT NOT NULL,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  target_value NUMERIC(18, 2) NOT NULL,
  current_value NUMERIC(18, 2) NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, challenge_type, month, year)
);
CREATE INDEX IF NOT EXISTS idx_monthly_challenges_user_id ON monthly_challenges(user_id);

CREATE TABLE IF NOT EXISTS xp_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  xp_earned INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_xp_logs_user_id ON xp_logs(user_id);

CREATE TABLE IF NOT EXISTS net_worth_snapshots (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_value NUMERIC(18, 2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_net_worth_user_id ON net_worth_snapshots(user_id);
`;
