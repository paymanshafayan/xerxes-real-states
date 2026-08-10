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
# Production: defaults to https://xerxes.biz. Override for local dev:
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

### Phase 7.7 — CI/CD Workflows for Backend and Frontend
- **GitHub Actions Workflows added & extended**:
  - `.github/workflows/build-web.yml`: Dedicated CI/CD workflow for the fullstack Next.js web application.
    - **Backend job**: Node.js 20, TypeScript typecheck (`tsc --noEmit`), ESLint, Jest unit & integration tests (`npm test`), Drizzle schema verification.
    - **Frontend job**: Next.js production build (`next build`), SSR & 51+ static pages generation, PWA assets validation, and `.next` artifact packaging/upload (`upload-artifact@v4`).
  - `.github/workflows/build-mobile-apps.yml`: Extended to build Backend, Frontend, and Mobile apps (Staff & Client for Android APK/AAB and iOS IPA) with flexible `workflow_dispatch` targets (`all`, `web`, `backend`, `frontend`, `mobile`).
  - Mobile build fixes (both apps): Added missing direct dependency `expo-font` (~13.0.0) to both `mobile/package.json` and `mobile-client/package.json` so `@expo/vector-icons` resolves `Font` cleanly in Metro bundler during `createBundleReleaseJsAndAssets` and Xcode bundling; updated `react-native-maps` to `~1.18.0` in `mobile/package.json` to resolve React Native 0.76 `ViewManagerWithGeneratedInterface` incompatibility on Android.
  - `package.json`: Added `npm test` script (`jest --forceExit`).
  - ESLint configuration: Configured `eslint.config.mjs` and fixed JSX unescaped entities for zero-error linting.
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

### Phase 8 — User Listings + Visit Requests + Block System
- **Migration**: `drizzle/0004_user_listings.sql` adds 7 tables: `user_profiles`, `staff_specialties`, `listings`, `listings_status_history`, `notifications`, `visit_requests`, `reassignment_requests`. Adds block columns to `users` (`is_blocked`, `blocked_at`, `blocked_reason`, `blocked_by_staff_id`) and listing-link columns to `properties` (`is_listed`, `source`, `listing_id`).

- **User API** (auth via `verifyUserToken`): 
  - `GET/PUT /api/user/profile` (extended profile)
  - `POST /api/listings` (multipart upload + smart staff assignment)
  - `GET /api/listings/mine` (with status filter + summary)
  - `GET /api/listings/mine/[id]` (with history)
  - `DELETE /api/listings/mine/[id]` (soft delete + hide from public)
  - `POST /api/listings/mine/[id]/panoramas` (360° upload, post-approval only)
  - `DELETE /api/listings/mine/[id]/panoramas/[panoramaId]`
  - `GET /api/user/notifications` + `POST /api/user/notifications/[id]/read`
  - `POST /api/visit-requests` + `GET /api/visit-requests/mine`
  - `/api/auth/login` now checks `is_blocked` and returns 403 `ACCOUNT_BLOCKED`.

- **Staff API** (auth via `requireStaff`, strict RBAC):
  - `GET /api/staff/listings` — manager: all, consultant: assigned only
  - `GET /api/staff/listings/[id]` (with permissions)
  - `POST /api/staff/listings/[id]/approve` (assigned or manager)
  - `POST /api/staff/listings/[id]/reject` (with reason)
  - `POST /api/staff/listings/[id]/reassign` (manager only) + `reassign-request` (assigned)
  - `GET /api/staff/reassign-requests` (manager)
  - `GET/PUT /api/staff/specialties` (CRUD for staff specialties)
  - `GET /api/staff/visit-requests` (manager all, consultant assigned) + workflow endpoints:
    - `POST .../review` (status=staff_reviewing)
    - `POST .../contact-owner` (available | unavailable | no_response) — **unavailable triggers block**
    - `POST .../schedule` (set appointment)
    - `POST .../report-unavailable` (direct block)
  - `GET /api/admin/users` (filter `isBlocked`, search) + `POST /api/admin/users/[id]/unblock`

- **Core helpers** (`src/lib/listings/`):
  - `validation.ts` — zod schemas (profile, listing, panorama, visit-request, reassign, unblock)
  - `assignment.ts` — smart staff assignment (specialty match + load balancing + fallback)
  - `upload.ts` — multipart file upload to `public/uploads/{image,video,panorama}/`
  - `notify.ts` — 10 notification helpers (in-app + push + activity log)
  - `permissions.ts` — `getListingAccess` + `getListingPermissions` (manager > assigned > readonly > owner > none)
  - `blocking.ts` — `reportListingUnavailable` (block user + hide listings + notify affected visitors)
  - `data/listings.ts` — data layer: create, read, soft delete, panoramas, notifications, visit-requests, block/unblock, reassign, approve, reject

- **Web UI**:
  - `/list-property` — 7-step listing wizard with mandatory commitment checkbox
  - `/account/listings` + `/account/listings/[id]` (with panorama upload + status history)
  - `/account/notifications` + `/account/visit-requests`
  - `NotificationBell` in Header with badge + 30s polling
  - `PropertyDetail` — "Visit Request" button + modal
  - `AccountContent` — quick-link cards + CTA banner
  - Admin: `/admin/user-listings` + `/admin/user-listings/[id]` (review with approve/reject)
  - Admin: `/admin/visit-requests` (kanban with contact-owner + schedule + block trigger)
  - Admin: `/admin/blocked-users` (list + unblock modal)
  - AdminShell sidebar: 3 new items (User Listings, Visit Requests, Blocked Users)

- **Mobile client app** (`mobile-client/`):
  - `src/api/user.ts` — user JWT auth (login/register/logout) with token in AsyncStorage
  - `src/api/listings.ts` — typed wrappers for all user-side listing/visit-request endpoints
  - `src/screens/ListPropertyScreen.tsx` — 7-step wizard
  - `src/screens/MyListingsScreen.tsx` — list with status badges + delete
  - `src/screens/MyListingDetailScreen.tsx` — detail + panorama management
  - `src/screens/MyVisitRequestsScreen.tsx` — timeline view
  - `AppNavigator.tsx` — new stack screens
  - `MoreScreen.tsx` — 3 new menu items

- **Tests** (`tests/listings/`):
  - `validation.test.ts` — zod schema tests (valid + edge cases)
  - `permissions.test.ts` — RBAC tests (all access levels)

- **Features**:
  - Free user submissions (no quantity limit, can register unlimited properties)
  - Smart staff assignment via `staff_specialties` (city + category + listing type)
  - Each listing is owned by exactly one assigned staff (RBAC enforced everywhere)
  - Other staff can VIEW listings but cannot edit/approve/reject
  - Reassign workflow: staff requests → manager approves
  - 360° panorama upload ONLY after approval (uses existing `VirtualTour` component)
  - Visit request workflow: pending → staff_reviewing → owner_contacted → approved → completed
  - Block system: instant block on unavailability report; cascades to all listings + visit requests
  - Unblock: manager-only, with reason; listings NOT auto-restored
  - Notification pipeline: in-app + push (Expo) + email + activity log
  - Rate limiting: 10/hr listings, 5/day visit requests, 10/hr panoramas
  - 8 new indexes for performance (city, status, user, assigned_staff, etc.)
