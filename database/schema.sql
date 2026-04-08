-- ============================================================
-- AgrIProperty Manager AI — Supabase Schema
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- USERS & SETTINGS
-- ============================================================

CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'manager')),
  whatsapp_number TEXT,
  business_name_ghana TEXT DEFAULT 'Ghana Real Estate',
  business_name_eswatini TEXT DEFAULT 'Eswatini Vegetable Farm',
  currency_preference TEXT DEFAULT 'GHS',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  whatsapp_enabled BOOLEAN DEFAULT false,
  daily_summary_enabled BOOLEAN DEFAULT false,
  daily_summary_time TIME DEFAULT '08:00',
  dark_mode BOOLEAN DEFAULT false,
  openweather_api_key TEXT,
  twilio_whatsapp_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- ============================================================
-- REAL ESTATE MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  city TEXT,
  region TEXT,
  type TEXT NOT NULL CHECK (type IN ('apartment', 'house', 'commercial', 'land', 'office', 'shop', 'warehouse')),
  value NUMERIC(15,2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'vacant' CHECK (status IN ('occupied', 'vacant', 'under_maintenance', 'for_sale')),
  description TEXT,
  bedrooms INT,
  bathrooms INT,
  size_sqm NUMERIC(10,2),
  amenities TEXT[],
  images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  id_number TEXT,
  nationality TEXT,
  occupation TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  lease_start DATE NOT NULL,
  lease_end DATE NOT NULL,
  monthly_rent NUMERIC(12,2) NOT NULL,
  deposit_amount NUMERIC(12,2) DEFAULT 0,
  deposit_paid BOOLEAN DEFAULT false,
  rent_due_day INT DEFAULT 1 CHECK (rent_due_day BETWEEN 1 AND 28),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'evicted')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.rent_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('paid', 'pending', 'overdue', 'partial')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'bank_transfer', 'mobile_money', 'cheque', 'other')),
  reference TEXT,
  notes TEXT,
  reminder_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.maintenance_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID REFERENCES public.tenants(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'emergency')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'cancelled')),
  category TEXT CHECK (category IN ('plumbing', 'electrical', 'structural', 'appliances', 'cleaning', 'security', 'other')),
  assigned_to TEXT,
  assigned_phone TEXT,
  estimated_cost NUMERIC(12,2),
  actual_cost NUMERIC(12,2),
  completed_at TIMESTAMPTZ,
  images TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.real_estate_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('maintenance', 'insurance', 'tax', 'management_fee', 'utilities', 'legal', 'renovation', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'GHS',
  date DATE NOT NULL,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- VEGETABLE FARM MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.crops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  crop_type TEXT NOT NULL,
  variety TEXT,
  field_plot TEXT NOT NULL,
  planting_date DATE NOT NULL,
  expected_harvest_date DATE NOT NULL,
  quantity_planted NUMERIC(10,2) NOT NULL,
  unit TEXT DEFAULT 'kg' CHECK (unit IN ('kg', 'g', 'ton', 'bags', 'crates', 'pieces')),
  area_hectares NUMERIC(8,4),
  status TEXT DEFAULT 'growing' CHECK (status IN ('growing', 'harvested', 'failed', 'sold')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.harvests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_id UUID NOT NULL REFERENCES public.crops(id) ON DELETE CASCADE,
  harvest_date DATE NOT NULL,
  yield_kg NUMERIC(10,2) NOT NULL,
  quality_grade TEXT CHECK (quality_grade IN ('A', 'B', 'C', 'reject')),
  storage_location TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.buyers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name TEXT,
  contact_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  whatsapp TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'South Africa',
  payment_terms TEXT DEFAULT 'net30',
  preferred_crops TEXT[],
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES public.buyers(id) ON DELETE CASCADE,
  invoice_number TEXT UNIQUE,
  order_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_date DATE,
  items JSONB NOT NULL DEFAULT '[]',
  subtotal NUMERIC(12,2) DEFAULT 0,
  tax_amount NUMERIC(12,2) DEFAULT 0,
  total_amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR' CHECK (currency IN ('ZAR', 'SZL', 'USD', 'GHS')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'cancelled')),
  payment_date DATE,
  delivery_status TEXT DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.farm_expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('seeds', 'fertilizer', 'pesticide', 'labor', 'irrigation', 'transport', 'equipment', 'packaging', 'certification', 'other')),
  description TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT DEFAULT 'SZL',
  date DATE NOT NULL,
  vendor TEXT,
  receipt_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.market_prices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crop_name TEXT NOT NULL,
  market TEXT NOT NULL,
  city TEXT,
  price_per_kg NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  source TEXT,
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.certifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT CHECK (type IN ('GlobalGAP', 'SIZA', 'organic', 'halal', 'other')),
  issuing_body TEXT,
  certificate_number TEXT,
  issue_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending', 'revoked')),
  checklist JSONB DEFAULT '[]',
  notes TEXT,
  document_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS & AI
-- ============================================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('rent_due', 'rent_overdue', 'harvest_approaching', 'order_confirmed', 'certification_deadline', 'maintenance', 'payment_received', 'system', 'weather_alert')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  sent_via_whatsapp BOOLEAN DEFAULT false,
  related_id UUID,
  related_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  messages JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rent_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.harvests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only see/edit their own
CREATE POLICY "profiles_own" ON public.profiles FOR ALL USING (auth.uid() = id);

-- Settings
CREATE POLICY "settings_own" ON public.settings FOR ALL USING (auth.uid() = user_id);

-- Properties
CREATE POLICY "properties_own" ON public.properties FOR ALL USING (auth.uid() = user_id);

-- Tenants
CREATE POLICY "tenants_own" ON public.tenants FOR ALL USING (auth.uid() = user_id);

-- Rent Payments
CREATE POLICY "rent_payments_own" ON public.rent_payments FOR ALL USING (auth.uid() = user_id);

-- Maintenance
CREATE POLICY "maintenance_own" ON public.maintenance_requests FOR ALL USING (auth.uid() = user_id);

-- Real estate expenses
CREATE POLICY "re_expenses_own" ON public.real_estate_expenses FOR ALL USING (auth.uid() = user_id);

-- Crops
CREATE POLICY "crops_own" ON public.crops FOR ALL USING (auth.uid() = user_id);

-- Harvests
CREATE POLICY "harvests_own" ON public.harvests FOR ALL USING (auth.uid() = user_id);

-- Buyers
CREATE POLICY "buyers_own" ON public.buyers FOR ALL USING (auth.uid() = user_id);

-- Orders
CREATE POLICY "orders_own" ON public.orders FOR ALL USING (auth.uid() = user_id);

-- Farm expenses
CREATE POLICY "farm_expenses_own" ON public.farm_expenses FOR ALL USING (auth.uid() = user_id);

-- Market prices (read-only for all auth users)
CREATE POLICY "market_prices_read" ON public.market_prices FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "market_prices_insert" ON public.market_prices FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Certifications
CREATE POLICY "certifications_own" ON public.certifications FOR ALL USING (auth.uid() = user_id);

-- Notifications
CREATE POLICY "notifications_own" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- AI Conversations
CREATE POLICY "ai_conversations_own" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  INSERT INTO public.settings (user_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON public.properties FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_tenants_updated_at BEFORE UPDATE ON public.tenants FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_rent_payments_updated_at BEFORE UPDATE ON public.rent_payments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON public.crops FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_buyers_updated_at BEFORE UPDATE ON public.buyers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_certifications_updated_at BEFORE UPDATE ON public.certifications FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Auto-generate invoice numbers
CREATE OR REPLACE FUNCTION public.generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := 'INV-' || TO_CHAR(NOW(), 'YYYYMM') || '-' || LPAD(CAST(FLOOR(RANDOM() * 9000 + 1000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_invoice_number BEFORE INSERT ON public.orders FOR EACH ROW EXECUTE FUNCTION public.generate_invoice_number();

-- ============================================================
-- SAMPLE MARKET PRICES SEED DATA
-- ============================================================

-- South Africa markets (ZAR)
INSERT INTO public.market_prices (crop_name, market, city, price_per_kg, currency, source) VALUES
('Tomatoes', 'Johannesburg Fresh Produce Market', 'Johannesburg', 8.50, 'ZAR', 'JFPM'),
('Tomatoes', 'Cape Town Market', 'Cape Town', 9.20, 'ZAR', 'CTM'),
('Spinach', 'Johannesburg Fresh Produce Market', 'Johannesburg', 5.30, 'ZAR', 'JFPM'),
('Cabbage', 'Johannesburg Fresh Produce Market', 'Johannesburg', 4.80, 'ZAR', 'JFPM'),
('Onions', 'Johannesburg Fresh Produce Market', 'Johannesburg', 6.20, 'ZAR', 'JFPM'),
('Green Peppers', 'Johannesburg Fresh Produce Market', 'Johannesburg', 12.50, 'ZAR', 'JFPM'),
('Butternut', 'Cape Town Market', 'Cape Town', 7.80, 'ZAR', 'CTM'),
('Sweet Potato', 'Johannesburg Fresh Produce Market', 'Johannesburg', 9.00, 'ZAR', 'JFPM'),
('Lettuce', 'Johannesburg Fresh Produce Market', 'Johannesburg', 11.20, 'ZAR', 'JFPM'),
('Carrots', 'Durban Market', 'Durban', 6.50, 'ZAR', 'DM'),
('Green Beans', 'Johannesburg Fresh Produce Market', 'Johannesburg', 14.00, 'ZAR', 'JFPM'),
('Baby Marrow', 'Cape Town Market', 'Cape Town', 15.50, 'ZAR', 'CTM')
ON CONFLICT DO NOTHING;

-- Eswatini markets (SZL — pegged 1:1 to ZAR)
INSERT INTO public.market_prices (crop_name, market, city, price_per_kg, currency, source) VALUES
('Tomatoes', 'Manzini Fresh Produce Market', 'Manzini', 7.50, 'SZL', 'MFPM'),
('Spinach', 'Manzini Fresh Produce Market', 'Manzini', 4.80, 'SZL', 'MFPM'),
('Cabbage', 'Mbabane Market', 'Mbabane', 4.20, 'SZL', 'MBM'),
('Onions', 'Manzini Fresh Produce Market', 'Manzini', 5.80, 'SZL', 'MFPM'),
('Green Peppers', 'Mbabane Market', 'Mbabane', 11.00, 'SZL', 'MBM'),
('Sweet Potato', 'Manzini Fresh Produce Market', 'Manzini', 8.00, 'SZL', 'MFPM'),
('Carrots', 'Manzini Fresh Produce Market', 'Manzini', 5.50, 'SZL', 'MFPM'),
('Butternut', 'Mbabane Market', 'Mbabane', 6.80, 'SZL', 'MBM')
ON CONFLICT DO NOTHING;
