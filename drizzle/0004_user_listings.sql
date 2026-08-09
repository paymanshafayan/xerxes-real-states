-- Migration: User Listings + Visit Requests + Block System (Phase 8)
-- Run with: psql "$DATABASE_URL" -f drizzle/0004_user_listings.sql
-- or: npx drizzle-kit push

-- =============================================================================
-- Section 1: Block system columns on users
-- =============================================================================
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_users_is_blocked ON users(is_blocked);

-- =============================================================================
-- Section 2: Properties: listing linkage + visibility control
-- =============================================================================
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_properties_listing ON properties(listing_id);
CREATE INDEX IF NOT EXISTS idx_properties_source ON properties(source);
CREATE INDEX IF NOT EXISTS idx_properties_is_listed ON properties(is_listed);

-- =============================================================================
-- Section 3: user_profiles — extended user info for property submission
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  last_name TEXT,
  national_id VARCHAR(20),
  address_line TEXT,
  city VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Turkey',
  postal_code VARCHAR(20),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON user_profiles(user_id);

-- =============================================================================
-- Section 4: staff_specialties — staff assignment matching
-- =============================================================================
CREATE TABLE IF NOT EXISTS staff_specialties (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  city VARCHAR(100),
  category VARCHAR(50),
  listing_type VARCHAR(20),                -- sale | rent
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_specialties_staff ON staff_specialties(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_specialties_match
  ON staff_specialties(city, category, listing_type) WHERE is_active = TRUE;

-- =============================================================================
-- Section 5: listings — user-submitted property listings
-- =============================================================================
CREATE TABLE IF NOT EXISTS listings (
  id SERIAL PRIMARY KEY,
  slug VARCHAR(255) NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  listing_kinds JSONB NOT NULL,            -- ["sale", "rent"]
  category VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  district VARCHAR(100),
  country VARCHAR(100) DEFAULT 'Turkey',
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  price DOUBLE PRECISION,                  -- قیمت فروش
  rent_deposit DOUBLE PRECISION,           -- ودیعه
  monthly_rent DOUBLE PRECISION,           -- اجاره ماهانه
  currency VARCHAR(10) NOT NULL DEFAULT 'GBP',
  bedrooms INTEGER NOT NULL DEFAULT 0,
  bathrooms INTEGER NOT NULL DEFAULT 0,
  area DOUBLE PRECISION NOT NULL,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  images JSONB NOT NULL DEFAULT '[]'::jsonb,
  videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  panoramas JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  assigned_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  removed_by_user BOOLEAN NOT NULL DEFAULT FALSE,
  removed_at TIMESTAMP,
  unavailability_reported_at TIMESTAMP,
  unavailability_report_notes TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_listings_user ON listings(user_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(approval_status);
CREATE INDEX IF NOT EXISTS idx_listings_city ON listings(city);
CREATE INDEX IF NOT EXISTS idx_listings_assigned_staff ON listings(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_listings_created ON listings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_listings_property ON listings(property_id);

-- =============================================================================
-- Section 6: listings_status_history — audit trail
-- =============================================================================
CREATE TABLE IF NOT EXISTS listings_status_history (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  changed_by_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_status_history_listing
  ON listings_status_history(listing_id);
CREATE INDEX IF NOT EXISTS idx_listings_status_history_created
  ON listings_status_history(created_at DESC);

-- =============================================================================
-- Section 7: notifications — in-app user notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON notifications(user_id, read_at, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread
  ON notifications(user_id, created_at DESC) WHERE read_at IS NULL;

-- =============================================================================
-- Section 8: visit_requests — visit booking workflow
-- =============================================================================
CREATE TABLE IF NOT EXISTS visit_requests (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  requester_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_email TEXT,
  preferred_date TIMESTAMP,
  note TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  -- pending | staff_reviewing | owner_contacted | approved | rejected | completed | cancelled
  staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  owner_response VARCHAR(20),              -- available | unavailable | no_response
  owner_response_note TEXT,
  contacted_at TIMESTAMP,
  appointment_date TIMESTAMP,
  appointment_notes TEXT,
  requester_notified_at TIMESTAMP,
  unavailability_reported BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_visit_requests_listing ON visit_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_requester ON visit_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_staff ON visit_requests(staff_id);
CREATE INDEX IF NOT EXISTS idx_visit_requests_status ON visit_requests(status);
CREATE INDEX IF NOT EXISTS idx_visit_requests_property ON visit_requests(property_id);

-- =============================================================================
-- Section 9: reassignment_requests — staff-initiated reassign workflow
-- =============================================================================
CREATE TABLE IF NOT EXISTS reassignment_requests (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  requested_by_staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  preferred_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | approved | rejected
  resolved_by_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  resolution_note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reassignment_requests_listing
  ON reassignment_requests(listing_id);
CREATE INDEX IF NOT EXISTS idx_reassignment_requests_status
  ON reassignment_requests(status);

-- =============================================================================
-- Done
-- =============================================================================
