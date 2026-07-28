/**
 * Ručně udržované typy odpovídající supabase/migrations.
 * Po změně schématu lze přegenerovat:
 *   npx supabase gen types typescript --project-id <ref> > lib/database.types.ts
 */

export type BookingStatus = "pending" | "confirmed" | "completed" | "cancelled";

export type Profile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  car_make: string | null;
  car_model: string | null;
  car_plate: string | null;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};

export type Service = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description: string | null;
  category: string;
  price_from: number;
  price_note: string | null;
  duration_min: number;
  features: string[];
  image_url: string | null;
  highlight: boolean;
  /** Zakázka blokuje celou otevírací dobu dne. */
  whole_day: boolean;
  active: boolean;
  sort_order: number;
  created_at: string;
};

export type BusinessHour = {
  weekday: number;
  open_time: string;
  close_time: string;
  closed: boolean;
};

export type BlockedSlot = {
  id: string;
  starts_at: string;
  ends_at: string;
  reason: string | null;
  created_at: string;
};

export type Booking = {
  id: string;
  reference: string;
  user_id: string | null;
  service_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  car_make: string | null;
  car_model: string | null;
  car_plate: string | null;
  note: string | null;
  starts_at: string;
  ends_at: string;
  /** Čas předání vozu u celodenních zakázek; jinak null. */
  dropoff_at: string | null;
  status: BookingStatus;
  price_estimate: number | null;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
};

export type Review = {
  id: string;
  user_id: string | null;
  booking_id: string | null;
  author_name: string;
  car: string | null;
  rating: number;
  body: string;
  approved: boolean;
  featured: boolean;
  created_at: string;
};

export type GalleryItem = {
  id: string;
  title: string;
  description: string | null;
  car: string | null;
  image_url: string;
  before_url: string | null;
  service_id: string | null;
  featured: boolean;
  sort_order: number;
  created_at: string;
};

export type SiteSettingsRow = {
  id: boolean;
  data: Record<string, unknown>;
  updated_at: string;
  updated_by: string | null;
};

type Table<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export type Database = {
  public: {
    Tables: {
      profiles: Table<Profile>;
      services: Table<Service>;
      business_hours: Table<BusinessHour>;
      blocked_slots: Table<BlockedSlot>;
      bookings: Table<Booking>;
      reviews: Table<Review>;
      gallery_items: Table<GalleryItem>;
      site_settings: Table<SiteSettingsRow>;
    };
    Views: Record<never, never>;
    Functions: {
      get_busy_ranges: {
        Args: { day: string };
        Returns: { starts_at: string; ends_at: string }[];
      };
      is_admin: { Args: Record<never, never>; Returns: boolean };
      cancel_my_booking: { Args: { booking_id: string }; Returns: boolean };
    };
    Enums: { booking_status: BookingStatus };
    CompositeTypes: Record<never, never>;
  };
};
