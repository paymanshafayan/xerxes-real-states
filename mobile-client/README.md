# Xerxes Realty — Client Mobile App (Expo / React Native)

Guest-facing mobile app for customers browsing Xerxes Real Estate listings. Fully independent from the `mobile/` (staff) app — separate project, separate bundle identifier, no login required.

## Features
- **Guest-first, no account needed** — browse, search, favorite (saved on-device), inquire, and chat without signing up.
- **Home** — 2-column property grid (featured + latest), prices in the listing's real currency.
- **Search** — real filters: type (sale/rent), category, city-free text search, price range, min bedrooms.
- **Price Drop Alerts** — a dedicated tab showing properties with a *genuine* recent price reduction (tracked server-side in `properties.previous_price`, never a fabricated discount).
- **Property detail** — photo gallery, real native 360° panorama viewer (drag to look around) when the property has panoramas, or an embedded virtual tour (Matterport/other) when only `virtualTourUrl` is set, description, features, map link, mortgage/ROI calculators pre-filled with the property price, agent contact (call/WhatsApp), and a real inquiry form (`POST /api/inquiries`, same as the website's contact form).
- **Live chat** — same polling-based chat backend the website's guest widget uses (`/api/chat`); a session ID is generated on-device and persisted so a conversation survives app restarts.
- **Calculators** — mortgage and ROI, identical formulas to the website's calculators.
- **4 languages** — English, Türkçe, فارسی (default, RTL), Русский — with a working, re-rendering language switcher.

## Requirements
- Node 18+ and `npm`
- Expo CLI (`npx expo`)
- A running instance of the Next.js backend (this repo) exposing the public `/api/*` endpoints this app calls: `/api/properties`, `/api/properties/[id]`, `/api/properties/price-drops`, `/api/agents`, `/api/inquiries`, `/api/chat`.

## Setup
```bash
cd mobile-client
npm install
# point the app at your backend (LAN IP when testing on a physical device):
export EXPO_PUBLIC_API_URL=http://192.168.1.50:3000
npx expo start
```
Open with Expo Go, or `npx expo run:ios` / `npx expo run:android`.

## Backend requirement
Run the new migration before using Price Drop Alerts:
```bash
psql "$DATABASE_URL" -f ../drizzle/0003_price_drop_tracking.sql
# or: npx drizzle-kit push
```
This adds `properties.previous_price`, set automatically whenever a staff member lowers a property's price.

## Production builds
Set a real `EXPO_PUBLIC_API_URL` in `eas.json` before running `eas build` — the default in `app.json` is `https://xerxes.biz` (production). For local development, override with your LAN IP, e.g. `export EXPO_PUBLIC_API_URL=http://192.168.1.50:3000`.

## Scope notes (deliberately not included, to avoid over-claiming)
- No push notifications (no login/account to tie a push token to — chat replies rely on polling, same as the website's guest chat).
- No embedded map view — "View on Map" opens the device's native Maps app via a link, instead of bundling `react-native-maps`.
- No dark mode (the site's dark mode has known limitations itself; this app matches the site's default light theme).
