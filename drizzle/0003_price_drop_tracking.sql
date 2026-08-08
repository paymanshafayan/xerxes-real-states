-- Migration: Price drop tracking (Phase 8 - mobile-client)
-- Run with: psql "$DATABASE_URL" -f drizzle/0003_price_drop_tracking.sql
-- or: npx drizzle-kit push

-- Properties: track the price before the last reduction, so the client
-- app's "Price Drop Alerts" screen can show real, honest discounts
-- instead of a fabricated/display-only number.
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS previous_price DOUBLE PRECISION;
