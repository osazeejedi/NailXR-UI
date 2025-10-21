-- Onboarding System Database Migration
-- This creates all necessary tables for the white-label onboarding system

-- ============================================================================
-- 1. TENANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenants (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  domain VARCHAR(255) NOT NULL,
  config JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'trial', -- trial, active, suspended, canceled
  trial_end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);
CREATE INDEX IF NOT EXISTS idx_tenants_is_active ON tenants(is_active);

-- ============================================================================
-- 2. ONBOARDING APPLICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS onboarding_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL,
  business_name VARCHAR(255) NOT NULL,
  subdomain VARCHAR(100),
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, approved, rejected, completed
  step_completed INTEGER DEFAULT 0,
  form_data JSONB DEFAULT '{}',
  trial_start_date TIMESTAMP WITH TIME ZONE,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for onboarding applications
CREATE INDEX IF NOT EXISTS idx_onboarding_email ON onboarding_applications(email);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON onboarding_applications(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_subdomain ON onboarding_applications(subdomain);
CREATE INDEX IF NOT EXISTS idx_onboarding_created ON onboarding_applications(created_at DESC);

-- ============================================================================
-- 3. SUBDOMAIN RESERVATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subdomain_reservations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subdomain VARCHAR(100) UNIQUE NOT NULL,
  tenant_id VARCHAR(255),
  status VARCHAR(50) DEFAULT 'reserved', -- reserved, active, released
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for subdomain reservations
CREATE INDEX IF NOT EXISTS idx_subdomain_res_subdomain ON subdomain_reservations(subdomain);
CREATE INDEX IF NOT EXISTS idx_subdomain_res_status ON subdomain_reservations(status);
CREATE INDEX IF NOT EXISTS idx_subdomain_res_expires ON subdomain_reservations(expires_at);

-- ============================================================================
-- 4. TENANT PAYMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  setup_fee_paid BOOLEAN DEFAULT false,
  monthly_fee_active BOOLEAN DEFAULT false,
  payment_method_id VARCHAR(255),
  billing_cycle VARCHAR(20) DEFAULT 'monthly', -- monthly, annual
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for tenant payments
CREATE INDEX IF NOT EXISTS idx_tenant_payments_tenant ON tenant_payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_customer ON tenant_payments(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_tenant_payments_subscription ON tenant_payments(stripe_subscription_id);

-- ============================================================================
-- 5. PAYMENT TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS payment_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  stripe_payment_intent_id VARCHAR(255),
  amount INTEGER NOT NULL, -- Amount in cents
  currency VARCHAR(3) DEFAULT 'USD',
  type VARCHAR(50) NOT NULL, -- setup_fee, monthly_fee, annual_fee, commission
  status VARCHAR(50) NOT NULL, -- pending, succeeded, failed, refunded
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment transactions
CREATE INDEX IF NOT EXISTS idx_payment_trans_tenant ON payment_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_trans_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_payment_trans_type ON payment_transactions(type);
CREATE INDEX IF NOT EXISTS idx_payment_trans_created ON payment_transactions(created_at DESC);

-- ============================================================================
-- 6. TRIAL NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS trial_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  notification_type VARCHAR(50) NOT NULL, -- welcome, trial_start, trial_reminder, trial_ending, trial_ended
  sent_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, sent, failed
  email_to VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for trial notifications
CREATE INDEX IF NOT EXISTS idx_trial_notif_tenant ON trial_notifications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trial_notif_type ON trial_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_trial_notif_status ON trial_notifications(status);
CREATE INDEX IF NOT EXISTS idx_trial_notif_sent ON trial_notifications(sent_at);

-- ============================================================================
-- 7. TENANT USERS TABLE (for multi-user access per tenant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin', -- admin, manager, staff
  is_primary BOOLEAN DEFAULT false,
  invitation_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, expired
  invitation_token VARCHAR(255),
  invitation_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, email)
);

-- Indexes for tenant users
CREATE INDEX IF NOT EXISTS idx_tenant_users_tenant ON tenant_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_user ON tenant_users(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_users_email ON tenant_users(email);
CREATE INDEX IF NOT EXISTS idx_tenant_users_role ON tenant_users(role);

-- ============================================================================
-- 8. TENANT ANALYTICS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS tenant_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id VARCHAR(255) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  total_visitors INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  try_on_sessions INTEGER DEFAULT 0,
  saved_looks INTEGER DEFAULT 0,
  bookings_created INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10, 2) DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(tenant_id, date)
);

-- Indexes for tenant analytics
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_tenant ON tenant_analytics(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_analytics_date ON tenant_analytics(date DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
  BEFORE UPDATE ON tenants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_onboarding_applications_updated_at ON onboarding_applications;
CREATE TRIGGER update_onboarding_applications_updated_at
  BEFORE UPDATE ON onboarding_applications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_payments_updated_at ON tenant_payments;
CREATE TRIGGER update_tenant_payments_updated_at
  BEFORE UPDATE ON tenant_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_payment_transactions_updated_at ON payment_transactions;
CREATE TRIGGER update_payment_transactions_updated_at
  BEFORE UPDATE ON payment_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_tenant_users_updated_at ON tenant_users;
CREATE TRIGGER update_tenant_users_updated_at
  BEFORE UPDATE ON tenant_users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE onboarding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE subdomain_reservations ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE trial_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_analytics ENABLE ROW LEVEL SECURITY;

-- Policies for tenants table
CREATE POLICY "Tenants are viewable by authenticated users" ON tenants
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can manage tenants" ON tenants
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for onboarding_applications
CREATE POLICY "Users can view their own applications" ON onboarding_applications
  FOR SELECT USING (auth.email() = email);

CREATE POLICY "Users can create applications" ON onboarding_applications
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update their own applications" ON onboarding_applications
  FOR UPDATE USING (auth.email() = email);

CREATE POLICY "Service role can manage applications" ON onboarding_applications
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for subdomain_reservations
CREATE POLICY "Service role can manage reservations" ON subdomain_reservations
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for tenant_payments
CREATE POLICY "Tenant users can view their tenant payments" ON tenant_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_payments.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage payments" ON tenant_payments
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for payment_transactions
CREATE POLICY "Tenant users can view their transactions" ON payment_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = payment_transactions.tenant_id
      AND tenant_users.user_id = auth.uid()
    )
  );

CREATE POLICY "Service role can manage transactions" ON payment_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for tenant_users
CREATE POLICY "Users can view their own tenant memberships" ON tenant_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage tenant users" ON tenant_users
  FOR ALL USING (auth.role() = 'service_role');

-- Policies for tenant_analytics
CREATE POLICY "Tenant admins can view their analytics" ON tenant_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM tenant_users
      WHERE tenant_users.tenant_id = tenant_analytics.tenant_id
      AND tenant_users.user_id = auth.uid()
      AND tenant_users.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "Service role can manage analytics" ON tenant_analytics
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get active tenants count
CREATE OR REPLACE FUNCTION get_active_tenants_count()
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM tenants WHERE is_active = true AND status IN ('trial', 'active'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trials expiring soon (within 3 days)
CREATE OR REPLACE FUNCTION get_trials_expiring_soon()
RETURNS TABLE (
  tenant_id VARCHAR,
  tenant_name VARCHAR,
  subdomain VARCHAR,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  days_remaining DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    t.subdomain,
    t.trial_end_date,
    EXTRACT(EPOCH FROM (t.trial_end_date - NOW())) / 86400 AS days_remaining
  FROM tenants t
  WHERE t.status = 'trial'
    AND t.trial_end_date IS NOT NULL
    AND t.trial_end_date > NOW()
    AND t.trial_end_date < NOW() + INTERVAL '3 days'
  ORDER BY t.trial_end_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clean up expired subdomain reservations
CREATE OR REPLACE FUNCTION cleanup_expired_reservations()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  UPDATE subdomain_reservations
  SET status = 'expired'
  WHERE status = 'reserved'
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- INITIAL DATA / SEED DATA
-- ============================================================================

-- Insert default tenant (NailXR platform)
INSERT INTO tenants (id, name, subdomain, domain, config, status, is_active)
VALUES (
  'nailxr-default',
  'NailXR',
  'app',
  'nailxr.com',
  '{
    "id": "nailxr-default",
    "name": "NailXR",
    "domain": "nailxr.com",
    "subdomain": "app",
    "branding": {
      "logo": "/NailXR-symbol.png",
      "logoWhite": "/NailXR-white.png",
      "primaryColor": "#ec4899",
      "secondaryColor": "#8b5cf6",
      "accentColor": "#f472b6"
    },
    "pricing": {
      "commissionRate": 0,
      "setupFee": 0,
      "monthlyFee": 0,
      "tier": "enterprise"
    }
  }'::jsonb,
  'active',
  true
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE tenants IS 'White-label tenant configurations';
COMMENT ON TABLE onboarding_applications IS 'User applications for white-label signup';
COMMENT ON TABLE subdomain_reservations IS 'Temporary subdomain reservations during signup';
COMMENT ON TABLE tenant_payments IS 'Stripe payment information for tenants';
COMMENT ON TABLE payment_transactions IS 'Individual payment transaction records';
COMMENT ON TABLE trial_notifications IS 'Email notifications for trial management';
COMMENT ON TABLE tenant_users IS 'Users associated with each tenant';
COMMENT ON TABLE tenant_analytics IS 'Daily analytics data per tenant';

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE 'Onboarding system migration completed successfully!';
  RAISE NOTICE 'Tables created: tenants, onboarding_applications, subdomain_reservations, tenant_payments, payment_transactions, trial_notifications, tenant_users, tenant_analytics';
  RAISE NOTICE 'Remember to configure RLS policies and set up Stripe webhooks!';
END $$;
