# Handoff Document — Xerxes Realty Mobile App (Backend)

> This document records **every backend change** made to support the Expo/React Native
> admin & consultant mobile app. It is updated on each backend change and committed
> together with the code. If you are taking over, read top-to-bottom.

---

## 0. How to run / configure

```bash
# Backend (this repo root)
npm install
cp .env.example .env          # fill values (see section 3)
npx drizzle-kit push         # OR: psql "$DATABASE_URL" -f drizzle/0002_mobile_app.sql
npm run dev                  # Next.js on :3000

# Mobile (separate folder)
cd mobile && npm install
EXPO_PUBLIC_API_URL=http://<LAN_IP>:3000 npx expo start
```

First login uses the bootstrap manager from `.env`:
`DEFAULT_MANAGER_USER` / `DEFAULT_MANAGER_PASS` (defaults `manager` / `manager123`).

---

## 1. Data model changes (`src/db/schema.ts`)

| Table | Change | File |
|-------|--------|------|
| `staff` (NEW) | Login identities for manager/consultant; links to `agents.id` via `agentId`, has `role`, `permissions`, `status`, `avatar`, `phone`, `pushToken`, `lastLoginAt` | `src/db/schema.ts` |
| `properties` | **Added** `panoramas jsonb`, `videos jsonb`, `audioNotes jsonb`, `documents jsonb`, `virtualTourUrl text` | `src/db/schema.ts` |
| `media` | **Added** `type` (image/panorama/video/audio/document), `propertyId`, `uploadedById`, `durationSec`, `thumbnailUrl` | `src/db/schema.ts` |
| `chat_sessions` | **Added** `assignedStaffId`, `unreadCount`, `lastMessageAt` | `src/db/schema.ts` |
| `chat_messages` | **Added** `senderId`, `type` (text/audio/image), `mediaUrl`, `durationSec` | `src/db/schema.ts` |

Migration SQL (idempotent): **`drizzle/0002_mobile_app.sql`**
Apply with: `psql "$DATABASE_URL" -f drizzle/0002_mobile_app.sql` or `npx drizzle-kit push`.

---

## 2. New / changed API endpoints

All new endpoints require `Authorization: Bearer <jwt>` (except `/api/staff/login`).

| Method | Path | Auth | Purpose | File |
|--------|------|------|---------|------|
| POST | `/api/staff/login` | public | Staff login → JWT (auto-creates default manager on first run) | `src/app/api/staff/login/route.ts` |
| GET | `/api/staff/me` | staff | Current staff profile | `src/app/api/staff/me/route.ts` |
| GET/POST/PUT/DELETE | `/api/staff` | manager | List / create / update / delete consultants | `src/app/api/staff/route.ts` |
| GET/POST | `/api/staff/properties` | staff | List (consultant scoped to own) / create property with media | `src/app/api/staff/properties/route.ts` |
| GET/PUT/DELETE | `/api/staff/properties/[id]` | staff | Get/update/delete (consultant limited to own) | `src/app/api/staff/properties/[id]/route.ts` |
| POST | `/api/upload` | staff* | Upload image/panorama/video/audio (multipart `files` + `kind`) | `src/app/api/upload/route.ts` (extended) |
| POST | `/api/media/presign` | staff | Presigned direct-to-R2 URL (when configured) | `src/app/api/media/presign/route.ts` |
| GET | `/api/staff/chat/sessions` | staff | List chat sessions (consultant scoped) + assign/close | `src/app/api/staff/chat/sessions/route.ts` |
| GET/POST | `/api/staff/chat/sessions/[id]/messages` | staff | Get/poll messages + send as staff (text/audio/image) | `src/app/api/staff/chat/sessions/[id]/messages/route.ts` |
| POST | `/api/translate` | public | Translate text (Farsi default → 4 langs) | `src/app/api/translate/route.ts` |
| POST | `/api/transcribe` | staff | Speech-to-text for voice notes | `src/app/api/transcribe/route.ts` |
| POST | `/api/staff/push/register` | staff | Store this device's Expo push token | `src/app/api/staff/push/register/route.ts` |
| POST | `/api/realtime/token` | staff | Issue a scoped Ably client token request (API key stays server-side) | `src/app/api/realtime/token/route.ts` |
| POST | `/api/chat` | public | **Extended**: tracks `lastMessageAt` + increments `unreadCount` | `src/app/api/chat/route.ts` (edited) |

\* `/api/upload` accepts an optional authenticated staff; falls back to anonymous for back-compat.

---

## 3. New backend libraries (`src/lib/`)

| File | Responsibility |
|------|----------------|
| `src/lib/auth/jwt.ts` | HS256 JWT sign/verify for staff (`AUTH_SECRET`). |
| `src/lib/auth/session.ts` | `getStaff(req)` + `requireStaff(req, roles)` RBAC helpers. |
| `src/lib/storage.ts` | Storage abstraction: local `public/uploads` default + R2 presigned upload (`R2_*`). |
| `src/lib/translate.ts` | Translation provider (OpenAI when key set, else echo). |
| `src/lib/transcribe.ts` | Whisper transcription (OpenAI when key set). |
| `src/lib/realtime.ts` | Ably publisher for chat (optional; polling fallback). |
| `src/lib/push.ts` | Expo push notifications to assigned staff (optional, `EXPO_PUSH_ACCESS_TOKEN`). |

### Environment variables (`.env.example`)
`AUTH_SECRET`, `DEFAULT_MANAGER_USER/PASS/EMAIL`, `NEXT_PUBLIC_APP_URL`,
`R2_ACCOUNT_ID/ACCESS_KEY_ID/SECRET_ACCESS_KEY/BUCKET/PUBLIC_URL`,
`OPENAI_API_KEY/BASE_URL/TRANSLATE_MODEL/STT_MODEL`, `ABLY_API_KEY`,
`EXPO_PUSH_ACCESS_TOKEN`.

---

## 4. Change log

### Phase 7.1 — Initial mobile backend (commit `b0ac721f`)
- `staff` table + JWT auth + RBAC (`src/db/schema.ts`, `src/lib/auth/*`).
- Extended `properties`/`media`/`chat_*` schema + migration `drizzle/0002_mobile_app.sql`.
- Upload endpoint extended for video/audio/360 (`src/app/api/upload/route.ts`).
- R2 presign endpoint (`src/app/api/media/presign/route.ts`).
- Staff-scoped property CRUD (`src/app/api/staff/properties/*`).
- Staff chat sessions + messages (`src/app/api/staff/chat/*`).
- Translate + transcribe endpoints (`src/app/api/translate`, `/transcribe`).
- `dataProvider.getProperties` gains `agentId` filter for consultant scoping.
- `SampleProperty` + `dbRowToProperty` include new media fields.

### Phase 7.2 — Mobile app scaffold (commit `fa3b85e8`)
- Expo/React Native app under `mobile/` (see `mobile/README.md`).
- Role-based tabs, property capture, chat, CRM, appointments, EAS/TestFlight config.

### Phase 7.3 — Push notifications, documents, location (THIS UPDATE)
- `staff.pushToken` column added (migration updated).
- `properties.documents jsonb` added (property document scan).
- `src/lib/push.ts` — Expo push notify helper (optional, `EXPO_PUSH_ACCESS_TOKEN`).
- `POST /api/staff/push/register` — store staff Expo push token.
- Visitor chat messages now trigger a push to the assigned staff (`src/app/api/chat/route.ts`).

### Phase 7.4 — Realtime (Ably) + interactive map
- `POST /api/realtime/token` — issues a scoped Ably client token (API key stays server-side); uses `ably` package.
- `src/lib/realtime.ts` now uses `ably` for publishing chat events.
- Mobile: `src/lib/ably.ts` connects via token + subscribes to `staff:<id>` and `chat:<sessionId>`; instant delivery, polling kept as fallback.
- `MapScreen` (react-native-maps) shows properties with coordinates; opened from the Properties list header.
- Mobile theme updated to product spec (#fafafa / #ffffff / #17569b / #094c95).

### Phase 7.5 — Complete the staff app
- **Backend**: `GET /api/appointments` (list booking requests), `PATCH/DELETE /api/appointments/[id]`; `PUT /api/staff/me` (self profile), `POST /api/staff/change-password`; chat `GET messages` now resets `unreadCount` for any staff; push `data.sessionId` included.
- **Mobile screens added/extended**:
  - `InquiriesScreen` + tab (status workflow).
  - `StaffManagementScreen` (manager: create/disable/delete consultants) + tab.
  - `PropertyDetailScreen` (gallery, video, audio playback, edit/delete) + route.
  - `LeadsScreen` create + status; `AppointmentsScreen` create + status + delete.
  - `ChatListScreen` open/close/assign actions; `ChatThreadScreen` image sending.
  - `ProfileScreen` edit profile + change password.
  - `PropertyListScreen` search + pagination (load more) + detail navigation.
  - App.tsx: Expo push handler + deep-link to chat thread on notification tap.
- Both backend and mobile typecheck clean (0 errors).

### Phase 7.6 - Polish and robustness
- Offline auto-sync: src/lib/propertySubmit.ts extracts submit logic; on network failure the draft is saved with pendingSync true; syncPendingDrafts runs on app resume and submits queued drafts.
- 360 panorama viewer in PropertyDetailScreen (horizontal pan + 360 badge).
- Activity log screen for managers (GET /api/admin/activity) plus a new tab.
- **Settings screen** (theme + language + about) reachable from Profile; **Agents directory** screen (GET /api/agents) for managers.
- **Global Search** tab: searches properties (API) + leads + inquiries (client filter), grouped results with navigation.
- **Chat read receipts + typing indicator**: `chat_messages.read_at` column (migration updated); staff opening a thread marks visitor messages read; visitor polling marks staff messages read (so staff see "Read ✓✓"); Ably `typing` events published/subscribed in the thread.

---

## 5. Pending / not yet implemented
- **Production media**: requires `R2_*` or another object store; local `public/uploads` is dev-only.
- **TestFlight IPA**: requires the user's Apple Developer account + `eas build` (configured in `mobile/eas.json`).

### Implemented in Phase 7.3 / 7.4
- **Realtime chat (Ably)**: backend publishes events (`src/lib/realtime.ts`); mobile subscribes via a
  scoped token from `/api/realtime/token` (`src/lib/ably.ts`) — instant message delivery, polling retained as fallback.
- **Interactive map**: `MapScreen` renders properties with coordinates via `react-native-maps`; opened from the
  Properties list header. Backend stores `lat`/`lng` per property.
- **Push notifications, document scan, geolocation, biometric unlock**: see Phase 7.3.
