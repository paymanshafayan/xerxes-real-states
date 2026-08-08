-- Migration: Mobile app support (Phase 7)
-- Run with: psql "$DATABASE_URL" -f drizzle/0002_mobile_app.sql
-- or: npx drizzle-kit push

-- Properties: 360 panoramas, videos, audio notes, virtual tour url
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS panoramas JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS audio_notes JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;

-- Staff / consultant accounts with RBAC
CREATE TABLE IF NOT EXISTS staff (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'consultant',
  agent_id INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
  avatar TEXT,
  phone VARCHAR(50),
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Chat sessions: assignment to staff, unread counter, last message time
ALTER TABLE chat_sessions
  ADD COLUMN IF NOT EXISTS assigned_staff_id INTEGER,
  ADD COLUMN IF NOT EXISTS unread_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP;

-- Chat messages: rich types (audio/image), sender staff id, media url, duration
ALTER TABLE chat_messages
  ADD COLUMN IF NOT EXISTS sender_id INTEGER,
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS media_url TEXT,
  ADD COLUMN IF NOT EXISTS duration_sec INTEGER;

-- Media: classify uploads (image/panorama/video/audio/document) + ownership
ALTER TABLE media
  ADD COLUMN IF NOT EXISTS type VARCHAR(20) NOT NULL DEFAULT 'image',
  ADD COLUMN IF NOT EXISTS property_id INTEGER,
  ADD COLUMN IF NOT EXISTS uploaded_by_id INTEGER,
  ADD COLUMN IF NOT EXISTS duration_sec INTEGER,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;

-- Staff: Expo push token for mobile notifications
ALTER TABLE staff
  ADD COLUMN IF NOT EXISTS push_token TEXT;

-- Properties: scanned documents / contracts
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS documents JSONB NOT NULL DEFAULT '[]'::jsonb;

-- Indexes for common lookups
CREATE INDEX IF NOT EXISTS idx_staff_agent_id ON staff(agent_id);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_assigned_staff ON chat_sessions(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_media_property ON media(property_id);
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by_id);

-- Chat messages: read receipts
ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS read_at TIMESTAMP;
