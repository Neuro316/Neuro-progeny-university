-- ═══════════════════════════════════════════════════════════
-- PAYWALL SYSTEM TABLES
-- Run this in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════

-- 1. Paywalls table (paywall configurations)
CREATE TABLE IF NOT EXISTS paywalls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  course_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  equipment_deposit NUMERIC(10,2) NOT NULL DEFAULT 0,
  equipment_auto_charge BOOLEAN NOT NULL DEFAULT true,
  equipment_charge_days_before INTEGER NOT NULL DEFAULT 14,
  confirmation_email_subject TEXT,
  confirmation_email_body TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Payments table (completed payment records)
CREATE TABLE IF NOT EXISTS payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id TEXT,
  stripe_customer_id TEXT,
  stripe_payment_intent TEXT,
  paywall_id UUID REFERENCES paywalls(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  customer_email TEXT,
  customer_name TEXT,
  amount_total NUMERIC(10,2) NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'usd',
  status TEXT DEFAULT 'completed',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Pending enrollments (for users who paid but haven't created accounts)
CREATE TABLE IF NOT EXISTS pending_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  paywall_id UUID REFERENCES paywalls(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  cohort_id UUID REFERENCES cohorts(id) ON DELETE SET NULL,
  stripe_session_id TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Scheduled charges (equipment deposits to charge later)
CREATE TABLE IF NOT EXISTS scheduled_charges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_customer_id TEXT,
  stripe_payment_intent TEXT,
  customer_email TEXT,
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  charge_date DATE NOT NULL,
  paywall_id UUID REFERENCES paywalls(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'scheduled',
  charged_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ═══════════════════════════════════════════════════════════
-- RLS POLICIES
-- ═══════════════════════════════════════════════════════════

-- Paywalls: public read for active, admin write
ALTER TABLE paywalls ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active paywalls"
  ON paywalls FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage paywalls"
  ON paywalls FOR ALL
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

-- Payments: admin read only
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read payments"
  ON payments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Service can insert payments"
  ON payments FOR INSERT
  WITH CHECK (true);

-- Pending enrollments: admin read, service insert
ALTER TABLE pending_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read pending enrollments"
  ON pending_enrollments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Service can insert pending enrollments"
  ON pending_enrollments FOR INSERT
  WITH CHECK (true);

-- Scheduled charges: admin read only
ALTER TABLE scheduled_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read scheduled charges"
  ON scheduled_charges FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'superadmin'))
  );

CREATE POLICY "Service can insert scheduled charges"
  ON scheduled_charges FOR INSERT
  WITH CHECK (true);

-- ═══════════════════════════════════════════════════════════
-- INDEXES
-- ═══════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_paywalls_slug ON paywalls(slug);
CREATE INDEX IF NOT EXISTS idx_paywalls_active ON paywalls(is_active);
CREATE INDEX IF NOT EXISTS idx_payments_email ON payments(customer_email);
CREATE INDEX IF NOT EXISTS idx_payments_session ON payments(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_pending_enrollments_email ON pending_enrollments(email);
CREATE INDEX IF NOT EXISTS idx_scheduled_charges_date ON scheduled_charges(charge_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_charges_status ON scheduled_charges(status);
