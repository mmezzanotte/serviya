-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- AppServicios â€” MigraciÃ³n inicial de base de datos (Supabase)
-- Ejecutar en el SQL Editor de tu proyecto Supabase
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- â”€â”€â”€ 1. TABLA: profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  phone       TEXT,
  avatar_url  TEXT,
  address     TEXT,
  current_role TEXT NOT NULL DEFAULT 'client'
    CHECK (current_role IN ('client', 'professional')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- â”€â”€â”€ 2. TABLA: professional_profiles â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.professional_profiles (
  id                UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  category          TEXT NOT NULL
    CHECK (category IN ('gasista', 'plomero', 'electricista', 'cerrajero', 'albanil', 'pintor')),
  license_number    TEXT,
  license_doc_url   TEXT,
  dni_front_url     TEXT,
  dni_back_url      TEXT,
  approval_status   TEXT NOT NULL DEFAULT 'pending_approval'
    CHECK (approval_status IN ('pending_approval', 'approved', 'rejected')),
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  is_online         BOOLEAN NOT NULL DEFAULT FALSE,
  last_location     GEOGRAPHY(Point, 4326),
  base_visit_price  NUMERIC(10, 2) NOT NULL DEFAULT 0,
  wallet_balance    NUMERIC(10, 2) NOT NULL DEFAULT 0,
  average_rating    NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
  total_reviews     INT NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FunciÃ³n: bloquear online si supera lÃ­mite de deuda en wallet
-- (El lÃ­mite se configura via variable de entorno en la app)
CREATE OR REPLACE FUNCTION public.check_wallet_limit()
RETURNS TRIGGER AS $$
DECLARE
  wallet_limit NUMERIC := -5000; -- Pendiente configuraciÃ³n del usuario
BEGIN
  IF NEW.is_online = TRUE AND NEW.wallet_balance < wallet_limit THEN
    NEW.is_online := FALSE;
    RAISE EXCEPTION 'Deuda en billetera supera el lÃ­mite. SaldÃ¡ tu deuda para conectarte.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS enforce_wallet_limit ON public.professional_profiles;
CREATE TRIGGER enforce_wallet_limit
  BEFORE UPDATE OF is_online ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.check_wallet_limit();

-- â”€â”€â”€ 3. TABLA: services_catalog â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.services_catalog (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  professional_id UUID NOT NULL REFERENCES public.professional_profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  price_type      TEXT NOT NULL CHECK (price_type IN ('fixed', 'diagnostic_deductible')),
  price           NUMERIC(10, 2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- â”€â”€â”€ 4. TABLA: bookings â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.bookings (
  id                   UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id            UUID NOT NULL REFERENCES public.profiles(id),
  professional_id      UUID NOT NULL REFERENCES public.professional_profiles(id),
  service_id           UUID REFERENCES public.services_catalog(id),
  booking_type         TEXT NOT NULL CHECK (booking_type IN ('urgent', 'scheduled')),
  status               TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'in_route', 'in_progress',
                      'quote_pending', 'completed', 'cancelled')),
  destination_lat      NUMERIC(10, 7) NOT NULL,
  destination_lng      NUMERIC(10, 7) NOT NULL,
  destination_address  TEXT NOT NULL,
  visit_fee            NUMERIC(10, 2) NOT NULL DEFAULT 0,
  final_quote_amount   NUMERIC(10, 2),
  total_paid           NUMERIC(10, 2),
  payment_method       TEXT NOT NULL DEFAULT 'mercadopago'
    CHECK (payment_method IN ('mercadopago', 'cash')),
  payment_status       TEXT NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending', 'authorized', 'paid', 'failed')),
  scheduled_for        TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger: updated_at automÃ¡tico
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bookings_updated_at ON public.bookings;
CREATE TRIGGER bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- â”€â”€â”€ 5. TABLA: reviews â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE TABLE IF NOT EXISTS public.reviews (
  id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id              UUID NOT NULL UNIQUE REFERENCES public.bookings(id),
  client_id               UUID NOT NULL REFERENCES public.profiles(id),
  professional_id         UUID NOT NULL REFERENCES public.professional_profiles(id),
  rating                  INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  is_punctual             BOOLEAN NOT NULL,
  agreed_price_respected  BOOLEAN NOT NULL,
  highlight_tags          TEXT[] NOT NULL DEFAULT '{}',
  comment                 TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- FunciÃ³n: actualizar promedio de rating del profesional
CREATE OR REPLACE FUNCTION public.update_professional_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.professional_profiles
  SET
    average_rating = (
      SELECT ROUND(AVG(rating)::NUMERIC, 2)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
    ),
    total_reviews = (
      SELECT COUNT(*)
      FROM public.reviews
      WHERE professional_id = NEW.professional_id
    )
  WHERE id = NEW.professional_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_review_created ON public.reviews;
CREATE TRIGGER on_review_created
  AFTER INSERT OR UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_professional_rating();

-- â”€â”€â”€ 6. ROW LEVEL SECURITY (RLS) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Profiles: solo el dueÃ±o puede editar su perfil, todos pueden leer
CREATE POLICY "Profiles: lectura pÃºblica" ON public.profiles FOR SELECT USING (TRUE);
CREATE POLICY "Profiles: solo dueÃ±o edita" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Professional profiles: todos leen, solo el dueÃ±o edita
CREATE POLICY "ProfProfiles: lectura pÃºblica" ON public.professional_profiles FOR SELECT USING (TRUE);
CREATE POLICY "ProfProfiles: solo dueÃ±o edita" ON public.professional_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "ProfProfiles: solo dueÃ±o inserta" ON public.professional_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Services catalog: todos leen, solo el profesional dueÃ±o edita
CREATE POLICY "Services: lectura pÃºblica" ON public.services_catalog FOR SELECT USING (TRUE);
CREATE POLICY "Services: solo dueÃ±o gestiona" ON public.services_catalog
  FOR ALL USING (auth.uid() = professional_id);

-- Bookings: solo cliente o profesional involucrado pueden ver/editar
CREATE POLICY "Bookings: solo involucrados" ON public.bookings
  FOR ALL USING (
    auth.uid() = client_id OR auth.uid() = professional_id
  );

-- Reviews: todos pueden leer, solo el cliente del booking puede crear
CREATE POLICY "Reviews: lectura pÃºblica" ON public.reviews FOR SELECT USING (TRUE);
CREATE POLICY "Reviews: solo cliente crea" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = client_id);

-- â”€â”€â”€ 7. ÃNDICES DE PERFORMANCE â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
CREATE INDEX IF NOT EXISTS idx_professional_category ON public.professional_profiles(category);
CREATE INDEX IF NOT EXISTS idx_professional_online ON public.professional_profiles(is_online);
CREATE INDEX IF NOT EXISTS idx_professional_location ON public.professional_profiles USING GIST(last_location);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON public.bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_professional ON public.bookings(professional_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_reviews_professional ON public.reviews(professional_id);

-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
-- FIN DE MIGRACIÃ“N
-- RecordÃ¡ habilitar PostGIS desde el Dashboard de Supabase si no estÃ¡ activo.
-- â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

