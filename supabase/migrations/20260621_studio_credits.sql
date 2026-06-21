-- Cordeband — Studio credits system + onboarding flag

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits_remaining INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS credits_reset_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS studio_onboarding_seen_at TIMESTAMPTZ;

UPDATE profiles SET credits_remaining = 1  WHERE plan = 'free'  AND credits_remaining = 0;
UPDATE profiles SET credits_remaining = 15 WHERE plan = 'pro'   AND credits_remaining = 0;
UPDATE profiles SET credits_remaining = 15 WHERE plan = 'banda' AND credits_remaining = 0;

CREATE TABLE IF NOT EXISTS credit_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action        TEXT NOT NULL,
  credits_used  INTEGER NOT NULL DEFAULT 1,
  metadata      JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id
  ON credit_transactions(user_id, created_at DESC);

ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own transactions" ON credit_transactions;
CREATE POLICY "Users can view own transactions"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION deduct_credit(p_user_id UUID, p_action TEXT, p_metadata JSONB DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_credits INTEGER;
BEGIN
  SELECT credits_remaining INTO v_credits
  FROM profiles
  WHERE id = p_user_id
  FOR UPDATE;

  IF v_credits IS NULL OR v_credits < 1 THEN
    RETURN FALSE;
  END IF;

  UPDATE profiles
  SET credits_remaining = credits_remaining - 1
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, action, credits_used, metadata)
  VALUES (p_user_id, p_action, 1, p_metadata);

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION refund_credit(p_user_id UUID, p_action TEXT, p_metadata JSONB DEFAULT NULL)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles
  SET credits_remaining = credits_remaining + 1
  WHERE id = p_user_id;

  INSERT INTO credit_transactions (user_id, action, credits_used, metadata)
  VALUES (p_user_id, p_action, -1, p_metadata);

  RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION reset_monthly_credits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE profiles SET
    credits_remaining = CASE
      WHEN plan = 'free'  THEN 1
      WHEN plan = 'pro'   THEN 15
      WHEN plan = 'banda' THEN 15
      ELSE 0
    END,
    credits_reset_at = NOW()
  WHERE credits_reset_at IS NULL
     OR credits_reset_at < date_trunc('month', NOW());
END;
$$;
