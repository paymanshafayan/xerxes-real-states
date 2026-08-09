# پلن پیاده‌سازی: ثبت ملک توسط کاربر (User Listings)

> **هدف:** افزودن قابلیتی به سایت و اپلیکیشن مشتری (Xerxes Realty) که به کاربران ثبت‌نام‌شده اجازه می‌دهد ملک خود را برای فروش/اجاره ثبت کنند، و کارشناسان پس از بررسی آن را در لیست عمومی منتشر کنند.  
> **دامنه:** وب (Next.js) + اپلیکیشن مشتری (mobile-client/).

---

## ۰. خلاصه تصمیمات نهایی (طبق گفتگو با کارفرما)

| موضوع | تصمیم |
|---|---|
| **ثبت ملک** | **کاملاً آزاد** — کاربر محدودیتی در تعداد ملک‌های ثبت‌شده ندارد |
| **هشدار تعهد** | در مرحله بررسی فرم (مرحله ۷)، چک‌باکس تعهد به حذف پس از فروش/اجاره/انصراف |
| **پروفایل کاربر** | مشخصات تکمیلی (نام خانوادگی، آدرس، شهر، کشور) فقط در فرم ثبت ملک گرفته می‌شود |
| **نوع آگهی** | همزمان فروش و اجاره ممکن است (یک ملک می‌تواند هم برای فروش هم برای اجاره باشد) |
| **مدل قیمت** | ستون `price` برای فروش + `rent_deposit` و `monthly_rent` برای اجاره |
| **وضعیت آگهی** | جدول `listings_status_history` برای audit + ستون `approval_status` |
| **حذف توسط کاربر** | حذف خودکار از لیست عمومی + نوتیفیکیشن به کارشناس مربوطه |
| **درخواست بازدید** | جدول اختصاصی `visit_requests` + سیستم booking پس از تایید کارشناس |
| **Workflow بازدید** | متقاضی ثبت می‌کند → کارشناس بررسی می‌کند → تماس با صاحب ملک → اگر تأیید: appointment ثبت + اطلاع متقاضی. اگر اعلام عدم موجودیت: گزارش + بلک کاربر |
| **اثبات عدم موجودیت** | **فقط توسط کارشناس** (پس از تماس با صاحب ملک) — آدرس دقیق محرمانه است |
| **بلک حساب** | **فوری** — در صورت ثبت گزارش کارشناس مبنی بر عدم موجودیت، حساب بلافاصله بلاک می‌شود |
| **پیامد بلاک** | `users.is_blocked = true` + همه listings از لیست عمومی حذف + رکوردها در DB نگهداری می‌شوند (soft delete برای audit) + امکان login ندارد |
| **رفع بلاک** | فقط توسط مدیر (از پنل مدیریت، با دلیل) |
| **تخصیص به کارشناس** | **تخصیص هوشمند خودکار** — بر اساس تخصص (شهر، نوع ملک، نوع آگهی) از `staff_specialties`. اگر تخصص منطبق نبود: به اولین کارشناس فعال |
| **مالکیت ملک** | **هر ملک پس از ثبت تنها توسط کارشناس assigned مدیریت می‌شود** — سایر کارشناسان فقط read-only |
| **دسترسی مدیر** | **مدیران به همه ملک‌ها دسترسی کامل دارند** (ویرایش، حذف، reassign) |
| **دسترسی سایر کارشناسان** | فقط read-only (مشاهده لیست + جزئیات) — بدون ویرایش/حذف/تایید |
| **Reassign (واگذاری)** | **درخواست + تأیید مدیر**: کارشناس فعلی یا مدیر درخواست reassign ثبت می‌کنند → مدیر نهایی تأیید می‌کند → تغییر + نوتیفیکیشن |
| **تصاویر 360 درجه** | **فقط پس از تایید** — کاربر از پنل «جزئیات آگهی من» می‌تواند تصاویر Equirectangular آپلود کند |
| **نمایش 360** | استفاده از `VirtualTour.tsx` موجود (Pannellum) |
| **نوتیفیکیشن به کاربر** | ایمیل + جدول `notifications` (in-app) |
| **نقشه** | OpenStreetMap + Leaflet (رایگان، بدون API key) |
| **آپلود** | استفاده از `/api/upload` موجود (پشتیبانی تصویر، ویدیو، panorama) |
| **UI ثبت** | دکمه «آگهی‌های من» در Header (با badge تعداد pending) + ویجت در داشبورد account |
| **UI درخواست بازدید** | دکمه «درخواست بازدید» در صفحه جزئیات ملک |
| **تعریف «آگهی فعال»** | فقط listings با `approval_status='approved'` |

---

## ۱. تغییرات دیتابیس (Migration `0004_user_listings.sql`)

### ۱.۱ جداول جدید

#### `user_profiles` — اطلاعات تکمیلی کاربر (اختیاری، در فرم ثبت ملک)
```sql
CREATE TABLE user_profiles (
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
CREATE INDEX idx_user_profiles_user ON user_profiles(user_id);
```

#### `listings` — آگهی‌های ثبت‌شده توسط کاربر
```sql
CREATE TABLE listings (
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
  features JSONB NOT NULL DEFAULT '[]',
  images JSONB NOT NULL DEFAULT '[]',
  videos JSONB NOT NULL DEFAULT '[]',
  contact_name TEXT NOT NULL,
  contact_phone TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  approval_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  assigned_staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  removed_by_user BOOLEAN NOT NULL DEFAULT FALSE,
  removed_at TIMESTAMP,
  unavailability_reported_at TIMESTAMP,    -- زمان ثبت گزارش عدم موجودیت توسط کارشناس
  unavailability_report_notes TEXT,        -- یادداشت کارشناس
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMP
);
CREATE INDEX idx_listings_user ON listings(user_id);
CREATE INDEX idx_listings_status ON listings(approval_status);
CREATE INDEX idx_listings_city ON listings(city);
CREATE INDEX idx_listings_assigned_staff ON listings(assigned_staff_id);
CREATE INDEX idx_listings_created ON listings(created_at DESC);
```

#### `listings_status_history` — تاریخچه تغییر وضعیت
```sql
CREATE TABLE listings_status_history (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  from_status VARCHAR(20),
  to_status VARCHAR(20) NOT NULL,
  changed_by_user_id INTEGER REFERENCES users(id),
  changed_by_staff_id INTEGER REFERENCES staff(id),
  note TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_listings_status_history_listing ON listings_status_history(listing_id);
```

#### `staff_specialties` — تخصص کارشناس
```sql
CREATE TABLE staff_specialties (
  id SERIAL PRIMARY KEY,
  staff_id INTEGER NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  city VARCHAR(100),
  category VARCHAR(50),
  listing_type VARCHAR(20),                -- sale | rent
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_staff_specialties_staff ON staff_specialties(staff_id);
CREATE INDEX idx_staff_specialties_match ON staff_specialties(city, category, listing_type) WHERE is_active = TRUE;
```

#### `notifications` — نوتیفیکیشن‌های in-app کاربر
```sql
CREATE TABLE notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB,
  read_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user ON notifications(user_id, read_at, created_at DESC);
```

#### `visit_requests` — درخواست‌های بازدید
```sql
CREATE TABLE visit_requests (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  property_id INTEGER REFERENCES properties(id) ON DELETE SET NULL,
  requester_user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_email TEXT,
  preferred_date TIMESTAMP,                -- تاریخ پیشنهادی توسط متقاضی
  note TEXT,
  -- Workflow
  status VARCHAR(20) NOT NULL DEFAULT 'pending',  -- pending | staff_reviewing | owner_contacted | approved | rejected | completed | cancelled
  staff_id INTEGER REFERENCES staff(id) ON DELETE SET NULL,
  -- نتیجه تماس با صاحب ملک
  owner_response VARCHAR(20),              -- available | unavailable | no_response
  owner_response_note TEXT,
  contacted_at TIMESTAMP,
  -- Appointment (اگر owner_response = available)
  appointment_date TIMESTAMP,
  appointment_notes TEXT,
  -- اطلاع‌رسانی
  requester_notified_at TIMESTAMP,
  -- Unavailability report trigger
  unavailability_reported BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_visit_requests_listing ON visit_requests(listing_id);
CREATE INDEX idx_visit_requests_requester ON visit_requests(requester_user_id);
CREATE INDEX idx_visit_requests_staff ON visit_requests(staff_id);
CREATE INDEX idx_visit_requests_status ON visit_requests(status);
```

### ۱.۲ تغییرات روی جداول موجود

**`users` — افزودن ستون‌های بلاک:**
```sql
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by_staff_id INTEGER REFERENCES staff(id);
```

**`properties` — افزودن ستون‌های کنترل:**
```sql
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS is_listed BOOLEAN NOT NULL DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS source VARCHAR(20) NOT NULL DEFAULT 'staff',
  ADD COLUMN IF NOT EXISTS listing_id INTEGER REFERENCES listings(id) ON DELETE SET NULL;
```

### ۱.۳ به‌روزرسانی Drizzle schema (`src/db/schema.ts`)

افزودن ۶ export جدید: `userProfiles`, `listings`, `listingsStatusHistory`, `staffSpecialties`, `notifications`, `visitRequests` + به‌روزرسانی `users` و `properties`.

---

## ۲. API Endpoints جدید

### ۲.۱ سمت کاربر (User)

| Method | Path | توضیح |
|---|---|---|
| GET | `/api/user/profile` | دریافت/ساخت پروفایل تکمیلی |
| PUT | `/api/user/profile` | به‌روزرسانی پروفایل |
| GET | `/api/listings/mine` | لیست آگهی‌های من (با فیلتر status اختیاری) |
| GET | `/api/listings/mine/[id]` | جزئیات آگهی من |
| POST | `/api/listings` | ثبت آگهی جدید (multipart: data + files) |
| DELETE | `/api/listings/mine/[id]` | حذف آگهی توسط کاربر (soft + remove from public) |
| POST | `/api/listings/mine/[id]/panoramas` | **افزودن تصاویر 360 پس از تایید** (multipart) |
| DELETE | `/api/listings/mine/[id]/panoramas/[panoramaId]` | حذف تصویر 360 |
| GET | `/api/user/notifications` | لیست نوتیفیکیشن‌های کاربر |
| POST | `/api/user/notifications/[id]/read` | علامت‌گذاری خوانده‌شده |
| POST | `/api/visit-requests` | ثبت درخواست بازدید توسط متقاضی |
| GET | `/api/visit-requests/mine` | لیست درخواست‌های بازدید من |

### ۲.۲ سمت مدیر/کارشناس (Staff)

| Method | Path | Auth | توضیح |
|---|---|---|---|
| GET | `/api/staff/listings` | manager, consultant | لیست انتظار (consultant فقط assigned) |
| GET | `/api/staff/listings/[id]` | staff | جزئیات (همه staff می‌توانند read-only ببینند، فقط assigned یا manager می‌تواند edit) |
| POST | `/api/staff/listings/[id]/approve` | **فقط assigned staff یا manager** | تایید |
| POST | `/api/staff/listings/[id]/reject` | **فقط assigned staff یا manager** | رد با دلیل |
| POST | `/api/staff/listings/[id]/reassign` | manager | واگذاری ملک به کارشناس دیگر (با دلیل) |
| POST | `/api/staff/listings/[id]/reassign-request` | staff (assigned) | درخواست reassign (نیاز به تأیید مدیر) |
| GET | `/api/staff/specialties` | staff | دریافت تخصص‌ها |
| PUT | `/api/staff/specialties` | staff | به‌روزرسانی تخصص‌های خود |
| GET | `/api/staff/visit-requests` | staff | لیست درخواست‌های بازدید (consultant فقط assigned) |
| GET | `/api/staff/visit-requests/[id]` | staff | جزئیات |
| POST | `/api/staff/visit-requests/[id]/review` | staff | شروع بررسی (status = staff_reviewing) |
| POST | `/api/staff/visit-requests/[id]/contact-owner` | staff | ثبت نتیجه تماس با صاحب ملک (`owner_response`: available|unavailable|no_response) |
| POST | `/api/staff/visit-requests/[id]/schedule` | staff | تنظیم appointment پس از تأیید صاحب ملک |
| POST | `/api/staff/visit-requests/[id]/report-unavailable` | staff | **گزارش عدم موجودیت + بلک فوری کاربر** |
| GET | `/api/admin/users` | manager | لیست کاربران + فیلتر `is_blocked` |
| POST | `/api/admin/users/[id]/unblock` | manager | رفع بلاک کاربر (با دلیل) |

### ۲.۳ رفتارهای کلیدی API

#### **`POST /api/listings`** (ثبت آگهی توسط کاربر)
1. احراز هویت user JWT + بررسی `is_blocked=false`
2. دریافت فرم + فایل‌ها (multipart)
3. آپلود تصاویر/ویدیوها (helper از `/api/upload`)
4. Snapshot اطلاعات تماس از `user_profiles` (یا fallback به `users`)
5. ایجاد `listings` با `approval_status='pending'`
6. **الگوریتم تخصیص کارشناس** (`src/lib/listings/assignment.ts`):
   - فیلتر staff فعال با `staff_specialties` شامل `city=listing.city` (یا null=همه)، `category` مطابقت دارد، `listing_type` در `listing_kinds` باشد
   - کم‌بار‌ترین (تعداد pending اخیر کمتر) → انتخاب
   - Fallback به manager pool اگر هیچ تخصص منطبقی نیست
7. Push به کارشناس + ایجاد `notifications` (in-app)
8. ثبت اولین entry در `listings_status_history` (null → pending)
9. بازگشت `{success, listing, message: "در انتظار بررسی کارشناسان"}`

#### **`POST /api/staff/listings/[id]/approve`** (تایید توسط کارشناس)
1. احراز هویت staff + بررسی ownership (consultant فقط assigned to me)
2. تراکنش: ایجاد/به‌روزرسانی رکورد `properties` با داده‌های listing + media
3. `properties.is_listed=true`, `source='user_listing'`, `listing_id=this.id`
4. `listings.property_id=newPropertyId`, `approval_status='approved'`, `reviewed_at=now()`
5. ثبت در `listings_status_history`
6. نوتیفیکیشن به کاربر (ایمیل + in-app + push)

#### **`DELETE /api/listings/mine/[id]`** (حذف توسط کاربر)
1. احراز هویت + بررسی مالکیت + `is_blocked=false`
2. `listings.approval_status='removed'`, `removed_by_user=true`, `removed_at=now()`
3. اگر `property_id` دارد: `properties.is_listed=false`
4. ثبت در `listings_status_history`
5. اطلاع به کارشناس (push + in-app)
6. بازگشت موفقیت

#### **`POST /api/visit-requests`** (درخواست بازدید توسط متقاضی)
1. احراز هویت متقاضی
2. دریافت `listing_id` (property listing تایید‌شده)
3. ایجاد رکورد `visit_requests` با `status='pending'`
4. **تخصیص به کارشناس** همان listing (`assigned_staff_id` از listing)
5. نوتیفیکیشن به کارشناس
6. بازگشت `{success, visit_request, message: "درخواست شما ثبت شد. کارشناس مربوطه به زودی با شما تماس خواهد گرفت."}`

#### **`POST /api/staff/visit-requests/[id]/contact-owner`** (تماس با صاحب ملک)
1. احراز هویت staff + ownership
2. دریافت `owner_response` (available | unavailable | no_response) + note
3. به‌روزرسانی `visit_requests`:
   - `owner_response` و `owner_response_note`
   - `contacted_at=now()`
   - `status = 'owner_contacted'`
4. **اگر `owner_response='unavailable'`**:
   - فراخوانی `reportListingUnavailable(listing_id, visit_request_id, staff_id, note)` (تابع مشترک)
5. **اگر `owner_response='available'`**:
   - `status = 'approved'` (آماده schedule)
   - نوتیفیکیشن به متقاضی: «کارشناس با صاحب ملک تماس گرفت. لطفاً برای هماهنگی زمان بازدید منتظر بمانید.»

#### **`POST /api/staff/visit-requests/[id]/schedule`** (تنظیم وقت بازدید)
1. احراز هویت staff
2. دریافت `appointment_date`, `appointment_notes`
3. `status = 'completed'`
4. نوتیفیکیشن به متقاضی + ایمیل با جزئیات

#### **`POST /api/staff/visit-requests/[id]/report-unavailable`** (گزارش عدم موجودیت - مسیر مستقیم)
> **نکته مهم:** در عمل، گزارش عدم موجودیت معمولاً از طریق `contact-owner` با `owner_response='unavailable'` رخ می‌دهد. این endpoint برای موارد خاص (مثلاً متقاضی پس از بازدید گزارش دهد) است.

#### **`reportListingUnavailable(listingId, visitRequestId, staffId, note)`** (تابع مشترک — هسته سیستم بلاک)
1. **دریافت listing و user_id**
2. **بلاک فوری کاربر**:
   - `users.is_blocked = true`
   - `users.blocked_at = now()`
   - `users.blocked_reason = 'ثبت ملک غیرموجود توسط کارشناس'`
   - `users.blocked_by_staff_id = staffId`
3. **حذف همه listings کاربر از لیست عمومی**:
   - `UPDATE properties SET is_listed=false WHERE listing_id IN (SELECT id FROM listings WHERE user_id=...) AND is_listed=true`
   - `UPDATE listings SET approval_status='unavailable_reported', updated_at=now() WHERE user_id=...`
4. **ثبت در `listings_status_history` برای همه listings**
5. **نوتیفیکیشن به همه کارشناسان و مدیران** (در پنل ادمین)
6. **نوتیفیکیشن به متقاضی بازدید**: «متأسفانه ملک مورد نظر در دسترس نیست.»
7. **بازگشت نتیجه**

#### **`POST /api/admin/users/[id]/unblock`** (رفع بلاک توسط مدیر)
1. احراز هویت manager
2. دریافت `reason` (دلیل رفع بلاک)
3. `users.is_blocked=false`, `blocked_reason=NULL`
4. ثبت در activity log
5. نوتیفیکیشن به کاربر: «حساب شما رفع بلاک شد.»
6. **مهم:** listings کاربر **به طور خودکار به حالت قبل بازنمی‌گردند** — کاربر باید دوباره آن‌ها را ثبت کند (یا مدیر به صورت دستی تأیید کند).

#### **`POST /api/staff/listings/[id]/reassign-request`** (درخواست reassign توسط کارشناس فعلی)
1. احراز هویت staff + بررسی `assigned_staff_id == me`
2. دریافت `reason` (دلیل درخواست)
3. ایجاد رکورد `reassignment_requests` (یا استفاده از `listings_status_history` با `to_status='reassign_requested'`)
4. نوتیفیکیشن به همه مدیران
5. بازگشت: «درخواست شما برای مدیر ارسال شد.»

#### **`POST /api/staff/listings/[id]/reassign`** (تأیید reassign توسط مدیر)
1. احراز هویت manager
2. دریافت `new_staff_id` و `reason`
3. تراکنش:
   - `listings.assigned_staff_id = new_staff_id`
   - اگر `property_id` دارد: `properties.agent_id = new_staff.agent_id` (اگر agent لینک دارد)
   - ثبت در `listings_status_history`: `assigned_staff_id: old → new` با note
4. نوتیفیکیشن:
   - به کارشناس جدید: «یک ملک به شما واگذار شد.»
   - به کارشناس قبلی: «ملک X از شما واگذار شد به Y.»
   - به کاربر مالک: «کارشناس ملک شما تغییر کرد.»

#### **`POST /api/listings/mine/[id]/panoramas`** (افزودن تصویر 360 توسط کاربر)
1. احراز هویت user + بررسی مالکیت + `approval_status='approved'`
2. دریافت فایل equirectangular (jpeg/png، نسبت ۲:۱)
3. آپلود با `type='panorama'` به `/api/upload`
4. افزودن URL به `listings.panoramas` (jsonb array)
5. اگر `property_id` دارد: همچنین به `properties.panoramas` اضافه شود
6. نوتیفیکیشن به کارشناس assigned
7. بازگشت `{success, panoramas: [...]}`

#### **`DELETE /api/listings/mine/[id]/panoramas/[panoramaId]`** (حذف تصویر 360)
1. احراز هویت + بررسی مالکیت
2. حذف از `listings.panoramas` (با URL یا index)
3. همگام‌سازی با `properties.panoramas` (اگر وجود دارد)
4. بازگشت موفقیت

### ۲.۴ به‌روزرسانی `dataProvider.ts`

```ts
// جدید
getListingById(id)
getListingsByUser(userId, status?)
createListing(data, userId)
softDeleteListing(id, userId)
approveListing(id, staffId)   // → create/update properties + change status
rejectListing(id, staffId, reason)
getPendingListingsForStaff(staffId)
getUserNotifications(userId, limit?)
markNotificationRead(notificationId, userId)
createVisitRequest(data, requesterId)
getVisitRequestsByUser(userId)
getVisitRequestsForStaff(staffId, status?)
updateVisitRequestStatus(id, staffId, data)
reportListingUnavailable(listingId, visitRequestId, staffId, note)
blockUser(userId, staffId, reason)
unblockUser(userId, managerId, reason)

// به‌روزرسانی
getProperties(filters)  // فیلتر is_listed=true
getPropertyBySlug(slug) // بررسی is_listed
```

---

## ۳. لایه‌های کمکی (`src/lib/listings/`)

```
src/lib/listings/
  ├── assignment.ts         # الگوریتم تخصیص کارشناس
  ├── pricing.ts            # اعتبارسنجی قیمت بر اساس listing_kinds
  ├── notify.ts             # نوتیفیکیشن (ایمیل + in-app + push)
  ├── upload.ts             # wrapper آپلود فایل
  ├── validation.ts         # zod schemas
  └── blocking.ts           # منطق مشترک بلاک کاربر + گزارش عدم موجودیت
```

---

## ۴. UI — وب (Next.js)

### ۴.۱ صفحات جدید

| Route | کامپوننت | توضیح |
|---|---|---|
| `/list-property` | `ListPropertyContent.tsx` | فرم ثبت ملک (۷ مرحله) |
| `/account/listings` | `MyListingsContent.tsx` | لیست آگهی‌های من |
| `/account/listings/[id]` | `MyListingDetailContent.tsx` | جزئیات + حذف |
| `/account/notifications` | `UserNotificationsContent.tsx` | لیست نوتیفیکیشن‌ها |
| `/account/visit-requests` | `MyVisitRequestsContent.tsx` | درخواست‌های بازدید من |
| `/admin/user-listings` | `UserListingsManager.tsx` | پنل مدیر: آگهی‌های کاربران |
| `/admin/visit-requests` | `StaffVisitRequestsManager.tsx` | پنل مدیر: درخواست‌های بازدید |
| `/admin/blocked-users` | `BlockedUsersManager.tsx` | پنل مدیر: کاربران بلاک‌شده + رفع بلاک |

### ۴.۲ به‌روزرسانی‌های UI

- `AccountContent.tsx`: 
  - ویجت «آگهی‌های من: X» (لینک به `/account/listings`)
  - تب‌های جدید: آگهی‌های من، نوتیفیکیشن‌ها، درخواست‌های بازدید
- `Header.tsx` / `UserMenu.tsx`: 
  - دکمه «آگهی‌های من» با badge تعداد pending
  - NotificationBell با badge تعداد خوانده‌نشده
- `PropertyDetail.tsx` (یا wrapper جدید): 
  - دکمه «درخواست بازدید» (فقط برای listings تایید‌شده)
  - مودال فرم درخواست بازدید
- `AuthModal.tsx`: پیام «برای ثبت ملک ابتدا وارد شوید» در دکمه «ثبت ملک»

### ۴.۳ فرم ثبت ملک (`ListPropertyContent.tsx`) — ۷ مرحله

**مرحله ۱ — اطلاعات مالک (پروفایل)**
- اگر `user_profiles.profile_completed=true`: خلاصه + دکمه ویرایش (skippable)
- در غیر این صورت: نام، نام خانوادگی، آدرس، شهر، کشور + نقشه OSM
- دکمه «ادامه»

**مرحله ۲ — نوع آگهی**
- Checkbox: «برای فروش» و «برای اجاره» (هر دو ممکن است)
- دسته‌بندی: villa | apartment | land | commercial

**مرحله ۳ — مشخصات ملک**
- عنوان، توضیحات، متراژ، تعداد خواب/حمام
- ویژگی‌ها (multi-select chips)

**مرحله ۴ — آدرس و لوکیشن**
- آدرس متنی، شهر (dropdown)، منطقه
- نقشه OSM با کلیک برای marker + reverse geocoding (Nominatim)

**مرحله ۵ — قیمت‌ها**
- اگر "sale": قیمت فروش + currency
- اگر "rent": ودیعه + اجاره ماهانه + currency

**مرحله ۶ — تصاویر و ویدیو**
- آپلود چندتایی تصویر (حداقل ۳، حداکثر ۲۰)
- آپلود ویدیو (اختیاری، حداکثر ۲)
- پیش‌نمایش + تعیین کاور

**مرحله ۷ — بررسی و ارسال**
- نمایش خلاصه همه فیلدها
- **هشدار تعهد (الزامی)**:
  > ⚠️ **توجه:** شما متعهد می‌شوید که در صورت فروش، اجاره یا انصراف از ملک، **بلافاصله** آن را از لیست شخصی خود حذف کنید. در غیر این صورت، در صورت درخواست بازدید توسط سایر کاربران و عدم موجودیت ملک، حساب شما **بلاک شده** و تمام آگهی‌های ثبت‌شده شما حذف خواهند شد.
- چک‌باکس: «متعهد می‌شوم پس از فروش/اجاره/انصراف، ملک را از سیستم حذف کنم.» (الزامی)
- دکمه «ارسال برای بررسی»

> **توجه:** در این پلن، هیچ محدودیتی برای تعداد آگهی‌های فعال کاربر وجود ندارد.

### ۴.۴ صفحه «آگهی‌های من» (`MyListingsContent.tsx`)

- تب‌ها: همه | pending | approved | rejected | unavailable_reported | removed
- هر کارت: تصویر کاور، عنوان، شهر، status (badge رنگی)، تاریخ، دکمه «مشاهده» و «حذف» (اگر active باشد)
- نمایش badge تعداد pending

### ۴.۴.۱ صفحه «جزئیات آگهی من» (`MyListingDetailContent.tsx`)

**سکشن‌ها:**
1. **اطلاعات اصلی**: عنوان، توضیحات، مشخصات، قیمت
2. **تصاویر عادی**: گالری با کاور
3. **تصاویر 360 درجه** (فقط اگر `approval_status='approved'`):
   - دکمه «+ افزودن تصویر 360 درجه»
   - مودال آپلود با:
     - راهنما: «تصویر باید equirectangular با نسبت ۲:۱ باشد. مثال: 4096×2048 یا 8192×4096»
     - انتخاب فایل + پیش‌نمایش 360 فوری (با `VirtualTour` موجود)
     - دکمه «افزودن»
   - لیست تصاویر 360 موجود با:
     - پیش‌نمایش کوچک
     - دکمه مشاهده تمام‌صفحه (با `VirtualTour`)
     - دکمه حذف
4. **نقشه OSM** (موقعیت مکانی)
5. **وضعیت و تاریخچه**: timeline از `listings_status_history` (نمایش داده شده برای کاربر)
6. **اطلاعات کارشناس assigned**: نام، تماس (در صورت تایید)
7. **دکمه «حذف آگهی»** (با تأیید + هشدار)

### ۴.۵ صفحه «درخواست‌های بازدید من» (`MyVisitRequestsContent.tsx`)

- لیست درخواست‌ها با timeline:
  1. ثبت درخواست (pending)
  2. در حال بررسی توسط کارشناس (staff_reviewing)
  3. تماس با صاحب ملک (owner_contacted)
  4. تأیید + زمان بازدید (approved/completed) / رد (rejected)
- نمایش تاریخ بازدید هماهنگ‌شده (اگر approved)

### ۴.۶ پنل مدیریت — بخش‌های جدید

**`UserListingsManager.tsx` (آگهی‌های کاربران):**
- فیلتر status (پیش‌فرض: pending) + فیلتر assigned_staff
- جدول: تصویر، عنوان، شهر، کاربر، تاریخ، **کارشناس assigned** (badge)، دکمه «بررسی»
- **دسترسی**: consultant فقط assigned listings را می‌بیند؛ manager همه را
- صفحه بررسی: کامل + نقشه OSM + دکمه‌های:
  - «تایید» (فقط assigned یا manager)
  - «رد (با دلیل)» (فقط assigned یا manager)
  - «ویرایش» (فقط assigned یا manager)
  - «درخواست واگذاری» (فقط assigned)
  - «واگذاری» (فقط manager)
  - **اگر consultant غیر-assigned این صفحه را باز کند: همه دکمه‌ها disabled + پیام «این ملک توسط کارشناس X مدیریت می‌شود»**

**`StaffVisitRequestsManager.tsx` (درخواست‌های بازدید):**
- کانبان یا لیست با status
- کارت هر درخواست:
  - اطلاعات متقاضی (نام، تماس)
  - ملک مرتبط
  - تاریخ پیشنهادی
  - دکمه‌ها: «شروع بررسی» / «تماس با صاحب ملک» (مودال با گزینه‌ها: available/unavailable/no_response) / «تنظیم وقت بازدید»
  - در صورت unavailable: نمایش هشدار قرمز + دکمه «تأیید بلاک کاربر»

**`BlockedUsersManager.tsx` (کاربران بلاک‌شده):**
- لیست کاربران بلاک‌شده با دلیل + تاریخ
- دکمه «رفع بلاک» (با دلیل + تأیید)

**`StaffSpecialtiesEditor.tsx` (تخصص کارشناس):**
- در `StaffManagementScreen` و پنل وب
- CRUD تخصص‌ها (شهر + نوع ملک + نوع آگهی)

### ۴.۷ نقشه OSM با Leaflet

- `OSMMapPicker.tsx` (برای فرم ثبت)
- `OSMMapView.tsx` (نمایش در صفحه بررسی)
- Reverse geocoding در `src/lib/geocode.ts` با rate limiting (Nominatim)

### ۴.۸ نوتیفیکیشن

- `NotificationBell.tsx` در Header با badge
- Polling هر ۳۰ ثانیه یا Ably realtime
- Dropdown با ۱۰ نوتیفیکیشن اخیر

---

## ۵. اپلیکیشن مشتری (mobile-client/) — همان قابلیت‌ها

### ۵.۱ صفحات جدید (Expo Router)

```
app/(tabs)/
  ├── list-property.tsx              # فرم ثبت (Stepper)
  └── account/
      ├── listings.tsx               # لیست آگهی‌های من
      ├── listing-detail.tsx         # جزئیات + حذف
      ├── notifications.tsx          # نوتیفیکیشن‌ها
      └── visit-requests.tsx         # درخواست‌های بازدید
```

### ۵.۲ کتابخانه‌ها

- `react-native-maps` — نقشه با Marker draggable
- `expo-image-picker` — آپلود از گالری/دوربین
- `expo-location` — GPS برای موقعیت فعلی

### ۵.۳ UI موبایل

- فرم در یک صفحه با Stepper + `<>` swipe
- Push notification به طور خودکار فعال می‌شود
- لیست آگهی‌های من با badge تعداد pending
- **جزئیات آگهی من (`listing-detail.tsx`)** شامل:
  - سکشن «تصاویر 360 درجه» با دکمه افزودن + پیش‌نمایش با react-native-pannellum یا WebView
  - یا استفاده از react-native-360-image-viewer (در صورت موجود بودن)

---

## ۶. تغییرات `dataProvider.ts`

```ts
// جدید
getListingById(id)
getListingsByUser(userId, status?)
createListing(data, userId)
softDeleteListing(id, userId)
approveListing(id, staffId)
rejectListing(id, staffId, reason)
getPendingListingsForStaff(staffId)
getUserNotifications(userId, limit?)
markNotificationRead(notificationId, userId)
createVisitRequest(data, requesterId)
getVisitRequestsByUser(userId)
getVisitRequestsForStaff(staffId, status?)
updateVisitRequestStatus(id, staffId, data)
reportListingUnavailable(listingId, visitRequestId, staffId, note)
blockUser(userId, staffId, reason)
unblockUser(userId, managerId, reason)

// به‌روزرسانی
getProperties(filters)  // فیلتر is_listed=true
getPropertyBySlug(slug) // بررسی is_listed
getUsers(filters)       // افزودن فیلتر is_blocked
```

---

## ۷. امنیت و اعتبارسنجی

### ۷.۱ Rate limiting
- `POST /api/listings` (مثلاً ۱۰ در ساعت)
- `POST /api/visit-requests` (۵ در روز)
- `POST /api/listings/mine/[id]/panoramas` (۱۰ در ساعت)

### ۷.۲ Zod validation
در همه endpoint ها

### ۷.۳ Auth check
- با `verifyUserToken` (user) و `requireStaff` (staff)

### ۷.۴ Ownership check
در تمام DELETE/GET mine

### ۷.۵ is_blocked check
- در login (جلوگیری از ورود)
- در همه endpoint های user-scoped

### ۷.۶ RBAC برای Listings (قانون جدید — مالکیت کارشناس)

**تابع کمکی در `src/lib/listings/permissions.ts`:**

```ts
type ListingAccess = 'owner' | 'assigned' | 'manager' | 'readonly' | 'none';

function getListingAccess(listing, currentUser, currentStaff): ListingAccess {
  // 1. Manager: همیشه دسترسی کامل
  if (currentStaff?.role === 'manager') return 'manager';
  
  // 2. Staff assigned: دسترسی کامل به این listing
  if (currentStaff && listing.assigned_staff_id === currentStaff.id) return 'assigned';
  
  // 3. Staff دیگر: فقط read-only (مشاهده)
  if (currentStaff) return 'readonly';
  
  // 4. User مالک: فقط به آگهی‌های خودش
  if (currentUser && listing.user_id === currentUser.id) return 'owner';
  
  // 5. بقیه: هیچ دسترسی
  return 'none';
}
```

**اعمال در endpoint ها:**

| Endpoint | نیاز به دسترسی |
|---|---|
| `GET /api/staff/listings` | manager: همه، consultant: فقط assigned |
| `GET /api/staff/listings/[id]` | `readonly` یا بالاتر (همه staff می‌توانند ببینند) |
| `POST /api/staff/listings/[id]/approve` | `assigned` یا `manager` |
| `POST /api/staff/listings/[id]/reject` | `assigned` یا `manager` |
| `PUT /api/staff/listings/[id]` (ویرایش) | `assigned` یا `manager` |
| `DELETE /api/staff/listings/[id]` | فقط `manager` |
| `POST /api/staff/listings/[id]/reassign` | فقط `manager` |
| `POST /api/staff/listings/[id]/reassign-request` | `assigned` یا `manager` |
| `GET /api/staff/visit-requests` | manager: همه، consultant: فقط assigned listings |

**در dataProvider:** تمام query های staff باید owner-scope باشند:
```ts
// مثال
async function getListingsForStaff(staffId, role) {
  if (role === 'manager') {
    return db.select().from(listings).where(...);
  } else {
    // consultant: فقط assigned
    return db.select().from(listings).where(eq(listings.assigned_staff_id, staffId));
  }
}
```

### ۷.۷ CSRF
JWT در header (موجود)

### ۷.۸ Audit log
- تمام تغییرات status در `listings_status_history`
- بلاک/رفع بلاک در `activity_logs`
- **reassign** در `listings_status_history` + `activity_logs` با `note=reassigned_to_staff_id:N`

---

## ۸. تست‌ها

- `tests/listings/assignment.test.ts` — الگوریتم تخصیص کارشناس
- `tests/listings/blocking.test.ts` — منطق بلاک + بازگردانی
- `tests/listings/validation.test.ts` — zod schemas
- `tests/api/listings.test.ts` — happy path + edge cases
- `tests/api/visit-requests.test.ts` — workflow بازدید
- manual test در پنل ادمین و فرم وب

---

## ۹. مستندسازی

- به‌روزرسانی `HANDOFF.md` با Phase جدید (مثلاً Phase 8 — User Listings + Visit Requests)
- ایجاد `docs/USER_LISTINGS.md` با راهنمای کاربر نهایی (اختیاری)

---

## ۱۰. فازبندی اجرا

| فاز | محتوا | تخمین |
|---|---|---|
| **فاز ۱** | Migration + Drizzle schema + جداول جدید + ستون‌های جدید | کوچک |
| **فاز ۲** | API های سمت کاربر (profile + listings + delete) + الگوریتم تخصیص | متوسط |
| **فاز ۳** | API های سمت staff (approve/reject + specialties + visit-requests) + منطق بلاک | متوسط |
| **فاز ۴** | UI وب (فرم ثبت + آگهی‌های من + پنل ادمین + نقشه OSM + نوتیف) | بزرگ |
| **فاز ۵** | اپلیکیشن مشتری (mobile-client) + تست‌ها + مستندسازی HANDOFF | متوسط |

---

## ۱۱. فایل‌هایی که تغییر می‌کنند (خلاصه)

**Backend (Next.js):**
- `drizzle/0004_user_listings.sql` (جدید)
- `src/db/schema.ts` (به‌روزرسانی)
- `src/lib/listings/*.ts` (جدید — ۶ فایل)
- `src/lib/data/dataProvider.ts` (به‌روزرسانی)
- `src/lib/email.ts` (template جدید)
- `src/lib/geocode.ts` (جدید)
- `src/app/api/user/profile/route.ts` (جدید)
- `src/app/api/user/notifications/route.ts` (جدید)
- `src/app/api/user/notifications/[id]/read/route.ts` (جدید)
- `src/app/api/listings/route.ts` (جدید)
- `src/app/api/listings/mine/route.ts` (جدید)
- `src/app/api/listings/mine/[id]/route.ts` (جدید)
- `src/app/api/visit-requests/route.ts` (جدید)
- `src/app/api/visit-requests/mine/route.ts` (جدید)
- `src/app/api/staff/listings/route.ts` (جدید)
- `src/app/api/staff/listings/[id]/route.ts` (جدید)
- `src/app/api/staff/listings/[id]/approve/route.ts` (جدید)
- `src/app/api/staff/listings/[id]/reject/route.ts` (جدید)
- `src/app/api/staff/listings/[id]/reassign/route.ts` (جدید — manager only)
- `src/app/api/staff/listings/[id]/reassign-request/route.ts` (جدید — assigned staff)
- `src/app/api/listings/mine/[id]/panoramas/route.ts` (جدید)
- `src/app/api/listings/mine/[id]/panoramas/[panoramaId]/route.ts` (جدید)
- `src/app/api/staff/specialties/route.ts` (جدید)
- `src/app/api/staff/visit-requests/route.ts` (جدید)
- `src/app/api/staff/visit-requests/[id]/route.ts` (جدید)
- `src/app/api/staff/visit-requests/[id]/review/route.ts` (جدید)
- `src/app/api/staff/visit-requests/[id]/contact-owner/route.ts` (جدید)
- `src/app/api/staff/visit-requests/[id]/schedule/route.ts` (جدید)
- `src/app/api/staff/visit-requests/[id]/report-unavailable/route.ts` (جدید)
- `src/app/api/admin/users/[id]/unblock/route.ts` (جدید)
- `src/app/api/admin/users/route.ts` (به‌روزرسانی — افزودن فیلتر is_blocked)

**Frontend (Next.js):**
- `src/app/list-property/page.tsx` (جدید)
- `src/app/account/listings/page.tsx` (جدید)
- `src/app/account/listings/[id]/page.tsx` (جدید)
- `src/app/account/notifications/page.tsx` (جدید)
- `src/app/account/visit-requests/page.tsx` (جدید)
- `src/app/admin/user-listings/page.tsx` (جدید)
- `src/app/admin/visit-requests/page.tsx` (جدید)
- `src/app/admin/blocked-users/page.tsx` (جدید)
- `src/components/ListPropertyContent.tsx` (جدید)
- `src/components/MyListingsContent.tsx` (جدید)
- `src/components/MyListingDetailContent.tsx` (جدید)
- `src/components/UserNotificationsContent.tsx` (جدید)
- `src/components/MyVisitRequestsContent.tsx` (جدید)
- `src/components/NotificationBell.tsx` (جدید)
- `src/components/VisitRequestModal.tsx` (جدید)
- `src/components/OSMMapPicker.tsx` (جدید)
- `src/components/OSMMapView.tsx` (جدید)
- `src/components/AccountContent.tsx` (به‌روزرسانی)
- `src/components/Header.tsx` (به‌روزرسانی)
- `src/components/PropertyDetail.tsx` (به‌روزرسانی — دکمه درخواست بازدید)
- `src/components/admin/AdminShell.tsx` (به‌روزرسانی)
- `src/components/admin/UserListingsManager.tsx` (جدید)
- `src/components/admin/StaffVisitRequestsManager.tsx` (جدید)
- `src/components/admin/BlockedUsersManager.tsx` (جدید)
- `src/components/admin/StaffSpecialtiesEditor.tsx` (جدید)
- `src/components/admin/ListingReviewModal.tsx` (جدید)

**Mobile Client (mobile-client/):**
- فرم ثبت ملک + صفحات آگهی‌های من + نوتیفیکیشن‌ها + درخواست‌های بازدید

**Tests:**
- `tests/listings/*.test.ts` (۵ فایل)

**Docs:**
- `docs/PLAN-user-listings.md` (این فایل)
- `HANDOFF.md` (به‌روزرسانی)

---

## ✅ تغییرات کلیدی نسبت به نسخه قبلی پلن

1. ✅ **حذف محدودیت تعداد آگهی** — کاربر آزاد است دها ملک ثبت کند
2. ✅ **حذف منطق "check-active" و بلاک submit در فرم** — هیچ مانعی برای ثبت جدید وجود ندارد
3. ✅ **اضافه شدن جدول `visit_requests`** با workflow کامل
4. ✅ **اضافه شدن منطق `reportListingUnavailable` + `blockUser`** — هسته سیستم بلاک
5. ✅ **ستون‌های بلاک در `users`** (`is_blocked`, `blocked_at`, `blocked_reason`, `blocked_by_staff_id`)
6. ✅ **صفحه پنل مدیر: `BlockedUsersManager`** با قابلیت رفع بلاک
7. ✅ **جدا کردن منطق بلاک در `src/lib/listings/blocking.ts`** به عنوان تابع مشترک
8. ✅ **هشدار تعهد به صورت چک‌باکس الزامی در مرحله ۷ فرم ثبت** (طبق انتخاب شما)
9. ✅ **مالکیت کارشناس (RBAC)**: هر ملک فقط توسط assigned staff + manager مدیریت می‌شود
10. ✅ **سیستم reassign**: درخواست توسط staff → تأیید توسط manager
11. ✅ **تصاویر 360 درجه (panoramas)**: فقط پس از تایید، در پنل جزئیات آگهی من

---

## ✅ آماده برای شروع؟

اگر این پلن مورد تأیید است، اعلام کنید تا فاز ۱ (Migration + Schema) را شروع کنم.
اگر سؤال، ابهام یا درخواست تغییری دارید، بفرمایید.
