# Xerxes Realty — Mobile App (Expo / React Native)

Admin & consultant mobile app for the Xerxes Real Estate platform.

## Features
- **Role-based access (RBAC)**
  - **Manager** → full access (dashboard, all properties, leads, appointments, chat, profile).
  - **Consultant** → limited access (only own properties, assigned chats, own leads).
- **Property entry in the field** — capture from phone camera / gallery:
  - Photos, **360° panoramas**, **video**, and **voice notes** (audio).
  - Multi-language text (FA/EN/TR/RU) with **auto-translate** (default Farsi → other 4 languages).
  - **Offline drafts** — save a half-filled property and finish later (no signal needed).
- **Live chat with customers** — same chat backend as the website, with text + voice messages and unread badges.
- Elegant, masculine, uncluttered UI (dark by default), Farsi/RTL first.

## Requirements
- Node 18+ and `npm`
- Expo CLI: `npm install -g expo-cli` (or use `npx expo`)
- iOS: Apple Developer account + EAS account for TestFlight builds
- A running instance of the **Next.js backend** (this repo) exposing the `/api/staff/*` endpoints

## Setup
```bash
cd mobile
npm install
# point the app at your backend (LAN IP when testing on a device):
export EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
npx expo start
```
Open with Expo Go, or run `npx expo run:ios` / `npx expo run:android`.

## Backend env (root .env)
See `/.env.example`. Important new variables:
- `AUTH_SECRET` — long random string for JWT signing
- `DEFAULT_MANAGER_USER` / `DEFAULT_MANAGER_PASS` — first manager bootstrap
- `R2_*` — Cloudflare R2 (optional; enables direct mobile upload)
- `OPENAI_API_KEY` — enables auto-translate + speech-to-text (optional)
- `ABLY_API_KEY` — realtime chat (optional; app falls back to polling)
- Run `npx drizzle-kit push` (or `psql ... -f drizzle/0002_mobile_app.sql`) to add the new tables/columns.

First login: use the manager credentials above. Create consultants from the
admin staff list ( manager-only endpoint `/api/staff` ).

## Build for TestFlight (production)
1. Create an EAS project: `npx eas login` then `npx eas build:configure`.
2. Set your backend URL in `eas.json` (`EXPO_PUBLIC_API_URL` under `production`).
3. Build + submit:
   ```bash
   npx eas build --platform ios --profile production
   npx eas submit --platform ios --profile production
   ```
   The produced IPA is uploaded to App Store Connect → TestFlight.

For internal testing use `--profile preview` (internal distribution).

## Architecture
```
mobile/src
  api/        → REST client + typed endpoints (auth, properties, chat, media, translate)
  store/      → zustand stores (auth, theme, offline drafts)
  components/ → shared UI + MediaCapture (camera/360/video/audio)
  screens/    → Login, Dashboard, PropertyList, PropertyForm, Chat*, Leads, Appointments, Profile
  navigation/ → role-based bottom-tab navigator
  i18n/       → FA/EN/TR/RU strings (Farsi default, RTL)
  theme.ts    → masculine/elegant palette (dark default)
```

> Note: With `ABLY_API_KEY` unset, chat uses HTTP polling. With `R2_*` unset,
> media is stored on the Next.js server under `/public/uploads`. Both are fine
> for development; configure them for production scale.
