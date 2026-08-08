# Xerxes Real Estate - Architecture Document
## Real Estate Platform for Northern Cyprus

---

## 1. Overview

Xerxes Real Estate is a multilingual (EN/TR/FA/RU) real estate platform for buying and renting properties in Northern Cyprus. Built with Next.js App Router, PostgreSQL via Drizzle ORM, and Tailwind CSS.

---

## 2. Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Styling | Tailwind CSS 4 |
| Icons | Lucide React |
| State | React Context (locale), Zustand-ready |
| Auth | bcryptjs (admin panel) |

---

## 3. Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Home page (server component)
│   ├── globals.css             # Global styles + theme
│   ├── properties/
│   │   └── page.tsx            # Properties listing (server component)
│   ├── property/
│   │   └── [slug]/
│   │       └── page.tsx        # Property detail (server component)
│   ├── contact/
│   │   └── page.tsx            # Contact page
│   ├── admin/
│   │   └── page.tsx            # Admin panel
│   └── api/
│       ├── health/route.ts     # Health check
│       ├── properties/route.ts # Properties CRUD API
│       ├── inquiries/
│       │   ├── route.ts        # Inquiries API
│       │   └── [id]/route.ts   # Inquiry status update
│       └── admin/
│           ├── login/route.ts  # Admin login
│           ├── stats/route.ts  # Dashboard stats
│           └── settings/route.ts # Settings API
├── components/
│   ├── AppShell.tsx            # Locale context provider + layout wrapper
│   ├── Header.tsx              # Navigation with language switcher
│   ├── Footer.tsx              # Site footer
│   ├── HeroSection.tsx         # Hero with search
│   ├── HomeContent.tsx         # Home page sections
│   ├── PropertyCard.tsx        # Property listing card
│   ├── PropertyDetail.tsx      # Property detail view
│   ├── PropertiesContent.tsx   # Properties list with filters
│   ├── ContactContent.tsx      # Contact form
│   └── AdminPanel.tsx          # Admin dashboard
├── lib/
│   ├── i18n/
│   │   ├── types.ts            # Locale types and config
│   │   └── dictionaries.ts     # Translation strings (EN/TR/FA/RU)
│   ├── data/
│   │   ├── sampleData.ts       # Sample properties, agents, cities
│   │   └── dataProvider.ts     # Data abstraction (sample vs DB)
│   └── utils.ts                # Utility functions
└── db/
    ├── index.ts                # Database connection
    └── schema.ts               # Drizzle schema definitions
```

---

## 4. Database Schema

### Tables

1. **properties** - Real estate listings with 4-language support
2. **agents** - Real estate agents with multilingual bios
3. **inquiries** - Contact form submissions
4. **site_settings** - Key-value configuration store
5. **admin_users** - Admin authentication

---

## 5. Data Flow Architecture

### Data Source Toggle
The admin can switch between two data sources:
- **Sample Data**: Reads from `src/lib/data/sampleData.ts`
- **Database**: Reads from PostgreSQL via Drizzle ORM

The `dataProvider.ts` abstraction layer checks the `site_settings` table for the `data_source` key and routes all queries accordingly.

### Seed Mechanism
Admin can import sample data into the database via the "Seed Database" button, which copies all sample properties and agents into PostgreSQL tables.

---

## 6. Internationalization (i18n)

### Approach: Client-side locale switching
- Locale stored in `localStorage`
- Context provider (`AppShell`) distributes locale + dictionary
- HTML `dir` attribute updated for RTL (Persian)
- All UI strings from `dictionaries.ts`
- Property content stored in 4 columns per field (title_en, title_tr, etc.)

### Supported Languages
| Code | Language | Direction |
|------|----------|-----------|
| en | English | LTR |
| tr | Türkçe | LTR |
| fa | فارسی | RTL |
| ru | Русский | LTR |

---

## 7. API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/health | Health check |
| GET | /api/properties | List properties with filters |
| POST | /api/properties | Create property |
| DELETE | /api/properties?id=N | Delete property |
| POST | /api/inquiries | Create inquiry |
| GET | /api/inquiries | List inquiries |
| PATCH | /api/inquiries/:id | Update inquiry status |
| POST | /api/admin/login | Admin authentication |
| GET | /api/admin/stats | Dashboard statistics |
| GET/POST | /api/admin/settings | Manage settings |

---

## 8. Admin Panel

### Authentication
- Default credentials: `admin` / `admin123`
- First login auto-creates admin user with bcrypt hashed password
- Session stored in `sessionStorage`

### Features
- Dashboard with property/inquiry/agent counts
- Inquiry management with status tracking (new → read → resolved)
- Data source toggle (Sample Data ↔ Database)
- Database seeding from sample data

---

## 9. Design Principles

1. Clean white background with professional blue (#1a56db) primary color
2. Responsive design (mobile-first approach)
3. RTL support for Persian language
4. Smooth transitions and hover effects
5. Inspired by realtor.com and kilid.com design patterns:
   - Prominent search bar in hero section
   - Grid-based property cards with image overlays
   - Filter sidebar on listing page
   - Agent contact cards on property detail

---

## 10. Phase 1 Completed Features

- [x] Database schema (PostgreSQL with Drizzle ORM)
- [x] 4-language support (EN/TR/FA/RU) with RTL
- [x] Sample data file with 8 properties, 3 agents, 6 cities
- [x] Data provider with sample/database toggle
- [x] Home page with hero, featured/latest properties, cities, agents
- [x] Property listing page with advanced filters
- [x] Property detail page with image gallery
- [x] Contact page with inquiry form
- [x] Admin panel with login, dashboard, inquiry management, settings
- [x] RESTful API endpoints
- [x] Professional UI with clean white design

---

## 11. Phase 2 Completed Features

### UI/UX Improvements
- [x] Interactive map with Leaflet (single property + multiple properties view)
- [x] Grid/Map view toggle on properties listing page
- [x] WhatsApp floating button with pulse animation
- [x] Share buttons (Facebook, Twitter, LinkedIn, WhatsApp, Telegram, Copy Link)
- [x] Favorites system with localStorage persistence

### User Features
- [x] Save property to favorites (heart button)
- [x] Favorites page (`/favorites`)
- [x] Favorites counter in header
- [x] Clear all favorites functionality

### SEO Improvements
- [x] Advanced meta tags (OpenGraph, Twitter Cards)
- [x] Schema.org structured data generators
- [x] Proper viewport configuration
- [x] Keywords and robots meta
- [x] Canonical URLs and language alternates

### Technical
- [x] Dynamic map imports (SSR disabled for Leaflet)
- [x] Responsive design for all new components

---

## 12. Phase 3 Completed Features

### Calculators
- [x] Mortgage Calculator (down payment, interest rate, loan term)
- [x] ROI Calculator (rental yield, appreciation, total profit)

### User Features
- [x] Appointment/Viewing Booking System
- [x] Newsletter Popup (5-second delay, localStorage dismiss)

### Content
- [x] Blog System (6 sample articles)
- [x] Blog Category Filtering
- [x] Blog Search
- [x] Blog Post Detail Page with Related Posts
- [x] City Pages (6 cities with descriptions in 4 languages)

### Social Proof
- [x] Testimonials Section (6 client reviews with ratings)
- [x] Client avatars and country flags

### Navigation
- [x] Blog link in header & footer
- [x] Favorites link in header with count badge

### API
- [x] Appointments API endpoint

---

## 13. Phase 4 Completed Features

### Admin Panel Enhancements
- [x] Properties CRUD (Create, Read, Update, Delete)
- [x] Full property form with 4-language support
- [x] Image URL management (add/remove multiple)
- [x] Feature selection (checkbox grid)
- [x] Agents CRUD management
- [x] Agent form with photo and multilingual bio
- [x] Analytics Dashboard with charts
  - Properties by category
  - Properties by city
  - Price analysis (min/avg/max)

### User Features
- [x] Property Comparison Tool
  - Add up to 4 properties to compare
  - Side-by-side comparison table
  - Feature-by-feature comparison
  - Floating compare bar
- [x] Live Chat Widget
  - Bot responses for common queries
  - Quick reply buttons
  - Online status indicator

### UI Enhancements
- [x] Dark Mode Support
  - Theme toggle in header
  - Full dark theme CSS
  - LocalStorage persistence
- [x] Compare button on property cards

### API Endpoints Added
- [x] GET/POST/DELETE /api/agents
- [x] GET/PUT /api/agents/[id]
- [x] GET/PUT /api/properties/[id]

---

## 14. Phase 5 Completed Features

### PWA (Progressive Web App)
- [x] Web App Manifest
- [x] Service Worker with caching
- [x] Offline support
- [x] Install prompt (Android & iOS)
- [x] Push notification support

### User Authentication
- [x] User registration
- [x] User login
- [x] Token-based auth
- [x] User menu with profile
- [x] Protected routes

### Advanced Features
- [x] Currency Converter (GBP, EUR, USD, TRY, RUB, IRR)
- [x] Saved Searches with notifications
- [x] Virtual Tour 360° support (Matterport integration)
- [x] Optimized Image component
- [x] Advanced CSS animations

### Database Schema Updates
- [x] users table
- [x] saved_searches table

### API Endpoints Added
- [x] POST /api/auth/register
- [x] POST /api/auth/login
- [x] GET /api/auth/me
- [x] GET/POST/DELETE /api/saved-searches

---

## 15. Phase 6 - Fixes & Completions

### Previously Missing - Now Completed
- [x] **Image Upload Drag & Drop** - Real file upload with `/api/upload`, saves to `public/uploads/`, stores in `media` table
- [x] **User Management in Admin** - Users tab showing registered users with details
- [x] **Activity Log** - Full activity tracking system (create, update, delete, login actions)
- [x] **Google Analytics** - `GoogleAnalytics` component with `gtag.js`, custom events, page view tracking
- [x] **Newsletter with real storage** - `/api/newsletter` saves to `newsletters` table in DB

### Database Schema Additions
- [x] `activity_logs` table - Action tracking
- [x] `newsletters` table - Email subscribers  
- [x] `media` table - Uploaded files tracking

### Admin Panel Updates
- [x] 8 tabs: Dashboard, Properties, Agents, Inquiries, Analytics, Users, Activity Log, Settings
- [x] ImageUploader component replaces URL-only input in PropertyForm

### API Endpoints Added
- [x] POST /api/upload - File upload with validation
- [x] GET /api/admin/activity - Activity logs
- [x] GET /api/admin/users - User management
- [x] GET/POST /api/newsletter - Newsletter subscriptions
