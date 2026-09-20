// ─── Tipos base de la base de datos PostgreSQL/Supabase ─────────────────────

export type UserRole = 'client' | 'professional';

export type ProfessionalCategory =
  | 'gasista'
  | 'plomero'
  | 'electricista'
  | 'cerrajero'
  | 'albanil'
  | 'pintor';

export type PriceType = 'fixed' | 'diagnostic_deductible';

export type BookingType = 'urgent' | 'scheduled';

export type BookingStatus =
  | 'pending'
  | 'accepted'
  | 'in_route'
  | 'in_progress'
  | 'quote_pending'
  | 'completed'
  | 'cancelled';

export type PaymentMethod = 'mercadopago' | 'cash';

export type PaymentStatus = 'pending' | 'authorized' | 'paid' | 'failed';

export type ProfileApprovalStatus = 'pending_approval' | 'approved' | 'rejected';

// ─── Tabla: profiles ─────────────────────────────────────────────────────────
export interface Profile {
  id: string; // UUID — referencia a auth.users
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  address: string | null;
  current_role: UserRole;
  created_at: string;
}

// ─── Tabla: professional_profiles ────────────────────────────────────────────
export interface ProfessionalProfile {
  id: string; // UUID — referencia a profiles.id
  category: ProfessionalCategory;
  license_number: string | null;
  license_doc_url: string | null;
  is_verified: boolean;
  is_online: boolean;
  last_location: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  } | null;
  base_visit_price: number;
  wallet_balance: number;
  average_rating: number;
  total_reviews: number;
  approval_status: ProfileApprovalStatus;
  created_at: string;
}

// ─── Tabla: services_catalog ─────────────────────────────────────────────────
export interface ServiceCatalogItem {
  id: string; // UUID
  professional_id: string; // FK → professional_profiles
  title: string;
  description: string;
  price_type: PriceType;
  price: number;
  created_at: string;
}

// ─── Tabla: bookings ─────────────────────────────────────────────────────────
export interface Booking {
  id: string; // UUID
  client_id: string; // FK → profiles
  professional_id: string; // FK → professional_profiles
  service_id: string | null; // FK → services_catalog (nullable para urgencias)
  booking_type: BookingType;
  status: BookingStatus;
  destination_lat: number;
  destination_lng: number;
  destination_address: string;
  visit_fee: number;
  final_quote_amount: number | null;
  total_paid: number | null;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  created_at: string;
  updated_at: string;
  // Joins opcionales
  client?: Profile;
  professional?: ProfessionalProfile;
  service?: ServiceCatalogItem;
}

// ─── Tabla: reviews ──────────────────────────────────────────────────────────
export interface Review {
  id: string; // UUID
  booking_id: string; // FK → bookings
  client_id: string; // FK → profiles
  professional_id: string; // FK → professional_profiles
  rating: 1 | 2 | 3 | 4 | 5;
  is_punctual: boolean;
  agreed_price_respected: boolean;
  highlight_tags: HighlightTag[];
  comment: string | null;
  created_at: string;
}

export type HighlightTag = 'limpio' | 'buena_onda' | 'muy_claro' | 'rapido';

// ─── Tipos compuestos para la UI ──────────────────────────────────────────────
export interface ProfessionalCardData {
  profile: Profile;
  professional: ProfessionalProfile;
  distanceMinutes: number | null;
  neighborQuote?: string; // Reseña corta de un vecino
}

// ─── Cálculo de cotización (Modalidad B) ─────────────────────────────────────
export interface QuoteCalculation {
  visit_fee: number;
  quote_amount: number;
  total_if_accepted: number; // quote_amount - visit_fee
  total_if_rejected: number; // visit_fee
}

export function calculateQuote(
  visit_fee: number,
  quote_amount: number
): QuoteCalculation {
  return {
    visit_fee,
    quote_amount,
    total_if_accepted: Math.max(0, quote_amount - visit_fee),
    total_if_rejected: visit_fee,
  };
}
