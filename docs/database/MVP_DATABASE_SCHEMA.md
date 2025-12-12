# MVP Database Schema
## Real Estate CRM & Matching Platform

**Version:** 1.0
**Date:** 2025-12-12
**Database:** PostgreSQL 15+
**ORM:** Prisma

---

## 1. MVP ERD Özeti

### 1.1 Entity'ler

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            MVP ENTITIES (9 Tablo)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  CORE                           CRM                        MATCHING         │
│  ────                           ───                        ────────         │
│  • users                        • contacts                 • search_requests│
│  • listings                     • activities               • matches        │
│  • listing_media                                                            │
│                                                                             │
│  MESSAGING                                                                  │
│  ─────────                                                                  │
│  • whatsapp_messages                                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 İlişkiler (Relationships)

```
users (1) ─────────────┬──────── (N) listings
                       ├──────── (N) contacts
                       ├──────── (N) search_requests
                       └──────── (N) activities

listings (1) ──────────┬──────── (N) listing_media
                       └──────── (N) matches

contacts (1) ──────────┬──────── (N) search_requests
                       ├──────── (N) activities
                       └──────── (N) whatsapp_messages

search_requests (1) ───────────── (N) matches
```

### 1.3 ER Diagram (Text)

```
                                    ┌──────────────┐
                                    │    users     │
                                    │──────────────│
                                    │ id (PK)      │
                                    │ email        │
                                    │ password_hash│
                                    │ name         │
                                    │ phone        │
                                    └──────┬───────┘
                                           │
              ┌────────────────┬───────────┼───────────┬────────────────┐
              │                │           │           │                │
              ▼                ▼           ▼           ▼                ▼
       ┌────────────┐   ┌────────────┐ ┌────────┐ ┌──────────────┐ ┌──────────┐
       │  listings  │   │  contacts  │ │search_ │ │  activities  │ │ whatsapp │
       │────────────│   │────────────│ │requests│ │──────────────│ │_messages │
       │ id (PK)    │   │ id (PK)    │ │────────│ │ id (PK)      │ │──────────│
       │ user_id(FK)│   │ user_id(FK)│ │ id(PK) │ │ user_id (FK) │ │ id (PK)  │
       │ title      │   │ name       │ │user(FK)│ │ contact_id   │ │contact_id│
       │ price      │   │ phone      │ │contact │ │ listing_id   │ │ direction│
       │ city       │   │ source     │ │raw_text│ │ type         │ │ content  │
       │ district   │   │ status     │ │criteria│ │ notes        │ │ status   │
       └─────┬──────┘   └─────┬──────┘ └───┬────┘ └──────────────┘ └──────────┘
             │                │            │
             │                │            │
             ▼                │            ▼
       ┌────────────┐         │      ┌──────────┐
       │listing_    │         │      │ matches  │
       │media       │         │      │──────────│
       │────────────│         │      │ id (PK)  │
       │ id (PK)    │         └─────►│search_id │
       │ listing_id │                │listing_id│
       │ url        │                │ score    │
       │ type       │                │ status   │
       └────────────┘                └──────────┘
```

---

## 2. Tablo Şemaları

### 2.1 `users` - Kullanıcılar (Emlakçılar)

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `email` | VARCHAR(255) | NO | - | Login email (**UNIQUE**) |
| `password_hash` | VARCHAR(255) | NO | - | Bcrypt hash |
| `name` | VARCHAR(255) | NO | - | Ad Soyad |
| `phone` | VARCHAR(20) | YES | NULL | Telefon |
| `avatar_url` | VARCHAR(500) | YES | NULL | Profil fotoğrafı (S3) |
| `is_active` | BOOLEAN | NO | `true` | Hesap aktif mi |
| `last_login_at` | TIMESTAMPTZ | YES | NULL | Son giriş |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |

---

### 2.2 `listings` - İlanlar (Portföy)

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `user_id` | UUID | NO | - | **FK → users** (ilan sahibi) |
| `listing_type` | VARCHAR(20) | NO | - | `sale` / `rent` |
| `property_type` | VARCHAR(50) | NO | - | `apartment`, `villa`, `office`, `land`, `shop` |
| `status` | VARCHAR(20) | NO | `'active'` | `draft`, `active`, `sold`, `rented`, `inactive` |
| `title` | VARCHAR(255) | NO | - | İlan başlığı |
| `description` | TEXT | YES | NULL | Açıklama |
| `price` | DECIMAL(15,2) | NO | - | Fiyat |
| `currency` | VARCHAR(3) | NO | `'TRY'` | `TRY`, `USD`, `EUR` |
| `gross_sqm` | INTEGER | YES | NULL | Brüt m² |
| `net_sqm` | INTEGER | YES | NULL | Net m² |
| `room_count` | VARCHAR(10) | YES | NULL | Oda sayısı: `1+0`, `1+1`, `2+1`, `3+1`, `4+1`, `5+` |
| `building_age` | SMALLINT | YES | NULL | Bina yaşı (yıl) |
| `floor_number` | SMALLINT | YES | NULL | Bulunduğu kat |
| `total_floors` | SMALLINT | YES | NULL | Toplam kat |
| `is_furnished` | BOOLEAN | YES | NULL | Eşyalı mı |
| `heating_type` | VARCHAR(30) | YES | NULL | `central`, `individual`, `floor`, `ac`, `stove`, `none` |
| `view_type` | VARCHAR(30) | YES | NULL | `sea`, `city`, `nature`, `pool`, `garden`, `street`, `none` |
| `entrance_type` | VARCHAR(30) | YES | NULL | `apartment`, `villa`, `duplex`, `triplex` |
| `is_in_complex` | BOOLEAN | YES | `false` | Site içinde mi |
| `dues` | DECIMAL(10,2) | YES | NULL | Aidat |
| `city` | VARCHAR(100) | NO | - | İl |
| `district` | VARCHAR(100) | NO | - | İlçe |
| `neighborhood` | VARCHAR(100) | YES | NULL | Mahalle |
| `address_detail` | TEXT | YES | NULL | Açık adres |
| `latitude` | DECIMAL(10,8) | YES | NULL | Enlem |
| `longitude` | DECIMAL(11,8) | YES | NULL | Boylam |
| `features` | JSONB | YES | `'[]'` | Özellikler array: `["parking", "elevator", "security"]` |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |

**Features JSONB Örnek:**
```json
["parking", "elevator", "security", "pool", "gym", "generator", "balcony", "storage"]
```

---

### 2.3 `listing_media` - İlan Medyaları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `listing_id` | UUID | NO | - | **FK → listings** |
| `media_type` | VARCHAR(20) | NO | - | `image`, `video`, `document` |
| `url` | VARCHAR(500) | NO | - | S3 URL / key |
| `thumbnail_url` | VARCHAR(500) | YES | NULL | Thumbnail URL |
| `file_name` | VARCHAR(255) | YES | NULL | Orijinal dosya adı |
| `file_size` | INTEGER | YES | NULL | Byte cinsinden |
| `sort_order` | SMALLINT | NO | `0` | Sıralama |
| `is_cover` | BOOLEAN | NO | `false` | Kapak fotoğrafı mı |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 2.4 `contacts` - Müşteriler (CRM)

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `user_id` | UUID | NO | - | **FK → users** (sorumlu emlakçı) |
| `name` | VARCHAR(255) | NO | - | Ad Soyad |
| `phone` | VARCHAR(20) | YES | NULL | Telefon |
| `email` | VARCHAR(255) | YES | NULL | E-posta |
| `source` | VARCHAR(30) | NO | `'manual'` | `manual`, `whatsapp`, `website`, `referral` |
| `contact_type` | VARCHAR(20) | NO | `'buyer'` | `buyer`, `seller`, `tenant`, `landlord` |
| `status` | VARCHAR(20) | NO | `'new'` | `new`, `active`, `inactive`, `converted`, `lost` |
| `notes` | TEXT | YES | NULL | Genel notlar |
| `last_contact_at` | TIMESTAMPTZ | YES | NULL | Son iletişim |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |

---

### 2.5 `search_requests` - Arayış Talepleri

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `user_id` | UUID | NO | - | **FK → users** (kaydeden emlakçı) |
| `contact_id` | UUID | YES | NULL | **FK → contacts** (müşteri) |
| `source` | VARCHAR(30) | NO | `'manual'` | `manual`, `whatsapp`, `form` |
| `status` | VARCHAR(20) | NO | `'active'` | `active`, `paused`, `fulfilled`, `expired` |
| `raw_text` | TEXT | YES | NULL | Orijinal metin (AI parse için) |
| `listing_type` | VARCHAR(20) | YES | NULL | `sale`, `rent` |
| `property_types` | JSONB | YES | `'[]'` | İstenen tipler: `["apartment", "villa"]` |
| `budget_min` | DECIMAL(15,2) | YES | NULL | Min bütçe |
| `budget_max` | DECIMAL(15,2) | YES | NULL | Max bütçe |
| `currency` | VARCHAR(3) | YES | `'TRY'` | Para birimi |
| `sqm_min` | INTEGER | YES | NULL | Min m² |
| `sqm_max` | INTEGER | YES | NULL | Max m² |
| `room_count_min` | VARCHAR(10) | YES | NULL | Min oda |
| `room_count_max` | VARCHAR(10) | YES | NULL | Max oda |
| `cities` | JSONB | YES | `'[]'` | İstenen iller |
| `districts` | JSONB | YES | `'[]'` | İstenen ilçeler |
| `neighborhoods` | JSONB | YES | `'[]'` | İstenen mahalleler |
| `must_have_features` | JSONB | YES | `'[]'` | Olmazsa olmaz |
| `nice_to_have_features` | JSONB | YES | `'[]'` | Tercih edilen |
| `criteria` | JSONB | YES | `'{}'` | AI parse edilmiş tüm kriterler |
| `notes` | TEXT | YES | NULL | Ek notlar |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |

**Criteria JSONB Örnek (AI Parse Sonucu):**
```json
{
  "listing_type": "sale",
  "property_types": ["apartment"],
  "budget": { "min": 2000000, "max": 5000000, "currency": "TRY" },
  "location": { "cities": ["İstanbul"], "districts": ["Kadıköy", "Üsküdar"] },
  "size": { "sqm_min": 100, "sqm_max": 150 },
  "rooms": { "min": "2+1", "max": "3+1" },
  "must_have": ["elevator", "parking"],
  "preferences": { "view": "sea", "furnished": false },
  "confidence": 0.89
}
```

---

### 2.6 `matches` - Eşleştirmeler

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `search_request_id` | UUID | NO | - | **FK → search_requests** |
| `listing_id` | UUID | NO | - | **FK → listings** |
| `match_type` | VARCHAR(20) | NO | `'auto'` | `auto`, `manual` |
| `score` | DECIMAL(5,2) | YES | NULL | Eşleşme skoru (0-100) |
| `score_breakdown` | JSONB | YES | `'{}'` | Skor detayları |
| `status` | VARCHAR(20) | NO | `'new'` | `new`, `sent`, `viewed`, `interested`, `rejected` |
| `notes` | TEXT | YES | NULL | Notlar |
| `sent_at` | TIMESTAMPTZ | YES | NULL | Gönderilme zamanı |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

**Score Breakdown JSONB Örnek:**
```json
{
  "location_match": 100,
  "price_match": 85,
  "size_match": 90,
  "features_match": 70,
  "room_match": 100,
  "total": 89
}
```

---

### 2.7 `activities` - CRM Aktiviteleri

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `user_id` | UUID | NO | - | **FK → users** (yapan) |
| `contact_id` | UUID | YES | NULL | **FK → contacts** |
| `listing_id` | UUID | YES | NULL | **FK → listings** |
| `activity_type` | VARCHAR(30) | NO | - | `note`, `call`, `meeting`, `showing`, `whatsapp`, `email`, `offer` |
| `title` | VARCHAR(255) | YES | NULL | Başlık |
| `description` | TEXT | YES | NULL | Açıklama/Notlar |
| `outcome` | VARCHAR(30) | YES | NULL | `completed`, `no_answer`, `rescheduled`, `cancelled` |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `scheduled_at` | TIMESTAMPTZ | YES | NULL | Planlanan zaman |
| `completed_at` | TIMESTAMPTZ | YES | NULL | Tamamlanma zamanı |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 2.8 `whatsapp_messages` - WhatsApp Mesajları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|:--------:|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | **PK** |
| `contact_id` | UUID | YES | NULL | **FK → contacts** |
| `user_id` | UUID | YES | NULL | **FK → users** (gönderen emlakçı) |
| `phone_number` | VARCHAR(20) | NO | - | Telefon numarası |
| `direction` | VARCHAR(10) | NO | - | `inbound`, `outbound` |
| `message_type` | VARCHAR(20) | NO | `'text'` | `text`, `image`, `document`, `location` |
| `content` | TEXT | YES | NULL | Mesaj içeriği |
| `media_url` | VARCHAR(500) | YES | NULL | Medya URL (S3) |
| `status` | VARCHAR(20) | NO | `'pending'` | `pending`, `sent`, `delivered`, `read`, `failed` |
| `error_message` | TEXT | YES | NULL | Hata mesajı |
| `external_id` | VARCHAR(100) | YES | NULL | WhatsApp message ID |
| `related_listing_ids` | JSONB | YES | `'[]'` | İlişkili ilan ID'leri |
| `sent_at` | TIMESTAMPTZ | YES | NULL | Gönderilme zamanı |
| `delivered_at` | TIMESTAMPTZ | YES | NULL | Teslim zamanı |
| `read_at` | TIMESTAMPTZ | YES | NULL | Okunma zamanı |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

## 3. Index ve Unique Önerileri

### 3.1 Unique Constraints

```sql
-- Users: email unique
CREATE UNIQUE INDEX idx_users_email ON users(email) WHERE deleted_at IS NULL;

-- Listings: duplicate kontrol için (aynı emlakçı, aynı lokasyon, benzer fiyat)
CREATE UNIQUE INDEX idx_listings_duplicate_check
  ON listings(user_id, city, district, neighborhood, listing_type, price)
  WHERE deleted_at IS NULL AND status = 'active';

-- Matches: bir arayış-ilan çifti tekrar edemez
CREATE UNIQUE INDEX idx_matches_unique ON matches(search_request_id, listing_id);

-- Contacts: aynı emlakçıda aynı telefon tekrar edemez
CREATE UNIQUE INDEX idx_contacts_phone ON contacts(user_id, phone)
  WHERE deleted_at IS NULL AND phone IS NOT NULL;
```

### 3.2 Foreign Key Indexes

```sql
-- Tüm FK'ler için index (PostgreSQL otomatik yapmaz)
CREATE INDEX idx_listings_user_id ON listings(user_id);
CREATE INDEX idx_listing_media_listing_id ON listing_media(listing_id);
CREATE INDEX idx_contacts_user_id ON contacts(user_id);
CREATE INDEX idx_search_requests_user_id ON search_requests(user_id);
CREATE INDEX idx_search_requests_contact_id ON search_requests(contact_id);
CREATE INDEX idx_matches_search_request_id ON matches(search_request_id);
CREATE INDEX idx_matches_listing_id ON matches(listing_id);
CREATE INDEX idx_activities_user_id ON activities(user_id);
CREATE INDEX idx_activities_contact_id ON activities(contact_id);
CREATE INDEX idx_activities_listing_id ON activities(listing_id);
CREATE INDEX idx_whatsapp_messages_contact_id ON whatsapp_messages(contact_id);
```

### 3.3 Filtreleme / Query Optimization Indexes

```sql
-- Listings: en sık kullanılan filtreler
CREATE INDEX idx_listings_status ON listings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_type ON listings(listing_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_location ON listings(city, district) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_price ON listings(price) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_listings_created ON listings(created_at DESC) WHERE deleted_at IS NULL;

-- Composite index: listing arama
CREATE INDEX idx_listings_search ON listings(status, listing_type, city, district, price)
  WHERE deleted_at IS NULL;

-- Contacts: status bazlı
CREATE INDEX idx_contacts_status ON contacts(status) WHERE deleted_at IS NULL;

-- Search Requests: aktif arayışlar
CREATE INDEX idx_search_requests_status ON search_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_search_requests_active ON search_requests(user_id, status, created_at DESC)
  WHERE deleted_at IS NULL AND status = 'active';

-- Matches: skor bazlı sıralama
CREATE INDEX idx_matches_score ON matches(search_request_id, score DESC);
CREATE INDEX idx_matches_status ON matches(status);

-- Activities: timeline
CREATE INDEX idx_activities_timeline ON activities(contact_id, created_at DESC);
CREATE INDEX idx_activities_type ON activities(activity_type);

-- WhatsApp: conversation view
CREATE INDEX idx_whatsapp_phone ON whatsapp_messages(phone_number, created_at DESC);
CREATE INDEX idx_whatsapp_contact ON whatsapp_messages(contact_id, created_at DESC);
```

### 3.4 JSONB Indexes (GIN)

```sql
-- Listings features arama
CREATE INDEX idx_listings_features ON listings USING GIN(features);

-- Search requests criteria arama
CREATE INDEX idx_search_requests_criteria ON search_requests USING GIN(criteria);

-- Search requests location arrays
CREATE INDEX idx_search_requests_districts ON search_requests USING GIN(districts);
CREATE INDEX idx_search_requests_neighborhoods ON search_requests USING GIN(neighborhoods);
```

---

## 4. Enum / Lookup Alanları

### 4.1 Listing Enums

| Alan | Değerler | Açıklama |
|------|----------|----------|
| `listing_type` | `sale`, `rent` | Satılık / Kiralık |
| `property_type` | `apartment`, `villa`, `office`, `land`, `shop`, `warehouse`, `building` | Emlak tipi |
| `status` | `draft`, `active`, `sold`, `rented`, `inactive` | İlan durumu |
| `room_count` | `1+0`, `1+1`, `2+1`, `3+1`, `4+1`, `4+2`, `5+1`, `5+2`, `6+` | Oda sayısı |
| `heating_type` | `central`, `individual`, `floor`, `ac`, `stove`, `none` | Isıtma tipi |
| `view_type` | `sea`, `city`, `nature`, `pool`, `garden`, `street`, `none` | Manzara |
| `entrance_type` | `apartment`, `villa`, `duplex`, `triplex` | Giriş tipi |

### 4.2 Contact Enums

| Alan | Değerler | Açıklama |
|------|----------|----------|
| `source` | `manual`, `whatsapp`, `website`, `referral` | Kaynak |
| `contact_type` | `buyer`, `seller`, `tenant`, `landlord` | Müşteri tipi |
| `status` | `new`, `active`, `inactive`, `converted`, `lost` | Durum |

### 4.3 Search Request Enums

| Alan | Değerler | Açıklama |
|------|----------|----------|
| `source` | `manual`, `whatsapp`, `form` | Kaynak |
| `status` | `active`, `paused`, `fulfilled`, `expired` | Durum |

### 4.4 Match Enums

| Alan | Değerler | Açıklama |
|------|----------|----------|
| `match_type` | `auto`, `manual` | Eşleşme tipi |
| `status` | `new`, `sent`, `viewed`, `interested`, `rejected` | Durum |

### 4.5 Activity Enums

| Alan | Değerler | Açıklama |
|------|----------|----------|
| `activity_type` | `note`, `call`, `meeting`, `showing`, `whatsapp`, `email`, `offer` | Aktivite tipi |
| `outcome` | `completed`, `no_answer`, `rescheduled`, `cancelled` | Sonuç |

### 4.6 WhatsApp Message Enums

| Alan | Değerler | Açıklama |
|------|----------|----------|
| `direction` | `inbound`, `outbound` | Yön |
| `message_type` | `text`, `image`, `document`, `location` | Mesaj tipi |
| `status` | `pending`, `sent`, `delivered`, `read`, `failed` | Durum |

### 4.7 Listing Features (Özellikler Array)

```javascript
const LISTING_FEATURES = [
  // Bina Özellikleri
  'elevator',        // Asansör
  'parking',         // Otopark
  'closed_parking',  // Kapalı Otopark
  'security',        // Güvenlik
  'generator',       // Jeneratör
  'fire_escape',     // Yangın merdiveni

  // Daire Özellikleri
  'balcony',         // Balkon
  'terrace',         // Teras
  'storage',         // Kiler
  'dressing_room',   // Giyinme odası
  'laundry_room',    // Çamaşır odası
  'built_in_kitchen',// Ankastre mutfak
  'steel_door',      // Çelik kapı

  // Site Özellikleri
  'pool',            // Havuz
  'gym',             // Spor salonu
  'sauna',           // Sauna
  'playground',      // Çocuk parkı
  'garden',          // Bahçe
  'bbq_area',        // Mangal alanı
  'doorman',         // Kapıcı
  'caretaker',       // Site görevlisi

  // Diğer
  'fiber_internet',  // Fiber internet
  'satellite',       // Uydu
  'air_conditioning',// Klima
  'furnished',       // Eşyalı
  'white_goods',     // Beyaz eşya
  'pets_allowed'     // Evcil hayvan
];
```

---

## 5. Audit Standardı

### 5.1 Temel Audit Alanları

Her tabloda aşağıdaki alanlar bulunur:

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- Oluşturulma zamanı
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()  -- Son güncelleme zamanı
```

### 5.2 Soft Delete

Silinebilir tablolarda ek olarak:

```sql
deleted_at  TIMESTAMPTZ DEFAULT NULL  -- NULL = aktif, değer = silinme zamanı
```

### 5.3 Audit Özeti

| Tablo | created_at | updated_at | deleted_at |
|-------|:----------:|:----------:|:----------:|
| users | ✓ | ✓ | ✓ |
| listings | ✓ | ✓ | ✓ |
| listing_media | ✓ | - | - |
| contacts | ✓ | ✓ | ✓ |
| search_requests | ✓ | ✓ | ✓ |
| matches | ✓ | ✓ | - |
| activities | ✓ | - | - |
| whatsapp_messages | ✓ | - | - |

**Not:** `listing_media`, `activities`, `whatsapp_messages` immutable log tabloları olduğu için `updated_at` ve `deleted_at` yok.

### 5.4 Updated_at Trigger

```sql
-- Prisma otomatik yönetir (@updatedAt)
-- Manuel SQL için:
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
-- ... diğer tablolar için aynısı
```

---

## 6. MVP vs Sonraki Faz Tabloları

### 6.1 MVP Tabloları (9 Tablo)

| # | Tablo | Açıklama | Öncelik |
|---|-------|----------|---------|
| 1 | `users` | Auth + profil | **P0** |
| 2 | `listings` | İlan kayıtları | **P0** |
| 3 | `listing_media` | Fotoğraf/video | **P0** |
| 4 | `contacts` | Müşteri kartları | **P0** |
| 5 | `search_requests` | Arayış talepleri | **P0** |
| 6 | `matches` | Eşleştirmeler | **P0** |
| 7 | `activities` | CRM timeline | **P1** |
| 8 | `whatsapp_messages` | Mesaj logu | **P1** |

### 6.2 Sonraki Faz Tabloları (Önerilen)

| # | Tablo | Açıklama | Faz |
|---|-------|----------|-----|
| 1 | `organizations` | Multi-tenant | Phase 2 |
| 2 | `deals` | Satış pipeline | Phase 2 |
| 3 | `pipeline_stages` | Pipeline aşamaları | Phase 2 |
| 4 | `reminders` | Hatırlatmalar | Phase 2 |
| 5 | `whatsapp_conversations` | Konuşma thread'leri | Phase 2 |
| 6 | `presentation_logs` | Sunum gönderim | Phase 2 |
| 7 | `listing_views` | Görüntülenme analytics | Phase 3 |
| 8 | `ai_logs` | AI işlem logları | Phase 3 |
| 9 | `feature_definitions` | Master data | Phase 3 |
| 10 | `duplicate_checks` | Duplicate kontrol | Phase 3 |

---

## 7. Prisma Schema

```prisma
// schema.prisma
// MVP Database Schema for Real Estate CRM

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================
// ENUMS
// ============================================

enum ListingType {
  sale
  rent
}

enum PropertyType {
  apartment
  villa
  office
  land
  shop
  warehouse
  building
}

enum ListingStatus {
  draft
  active
  sold
  rented
  inactive
}

enum HeatingType {
  central
  individual
  floor
  ac
  stove
  none
}

enum ViewType {
  sea
  city
  nature
  pool
  garden
  street
  none
}

enum EntranceType {
  apartment
  villa
  duplex
  triplex
}

enum MediaType {
  image
  video
  document
}

enum ContactSource {
  manual
  whatsapp
  website
  referral
}

enum ContactType {
  buyer
  seller
  tenant
  landlord
}

enum ContactStatus {
  new
  active
  inactive
  converted
  lost
}

enum SearchRequestSource {
  manual
  whatsapp
  form
}

enum SearchRequestStatus {
  active
  paused
  fulfilled
  expired
}

enum MatchType {
  auto
  manual
}

enum MatchStatus {
  new
  sent
  viewed
  interested
  rejected
}

enum ActivityType {
  note
  call
  meeting
  showing
  whatsapp
  email
  offer
}

enum ActivityOutcome {
  completed
  no_answer
  rescheduled
  cancelled
}

enum MessageDirection {
  inbound
  outbound
}

enum MessageType {
  text
  image
  document
  location
}

enum MessageStatus {
  pending
  sent
  delivered
  read
  failed
}

// ============================================
// MODELS
// ============================================

model User {
  id            String    @id @default(uuid()) @db.Uuid
  email         String    @unique @db.VarChar(255)
  passwordHash  String    @map("password_hash") @db.VarChar(255)
  name          String    @db.VarChar(255)
  phone         String?   @db.VarChar(20)
  avatarUrl     String?   @map("avatar_url") @db.VarChar(500)
  isActive      Boolean   @default(true) @map("is_active")
  lastLoginAt   DateTime? @map("last_login_at") @db.Timestamptz
  createdAt     DateTime  @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime  @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime? @map("deleted_at") @db.Timestamptz

  // Relations
  listings        Listing[]
  contacts        Contact[]
  searchRequests  SearchRequest[]
  activities      Activity[]
  whatsappMessages WhatsappMessage[]

  @@map("users")
}

model Listing {
  id            String        @id @default(uuid()) @db.Uuid
  userId        String        @map("user_id") @db.Uuid
  listingType   ListingType   @map("listing_type")
  propertyType  PropertyType  @map("property_type")
  status        ListingStatus @default(active)
  title         String        @db.VarChar(255)
  description   String?       @db.Text
  price         Decimal       @db.Decimal(15, 2)
  currency      String        @default("TRY") @db.VarChar(3)
  grossSqm      Int?          @map("gross_sqm")
  netSqm        Int?          @map("net_sqm")
  roomCount     String?       @map("room_count") @db.VarChar(10)
  buildingAge   Int?          @map("building_age") @db.SmallInt
  floorNumber   Int?          @map("floor_number") @db.SmallInt
  totalFloors   Int?          @map("total_floors") @db.SmallInt
  isFurnished   Boolean?      @map("is_furnished")
  heatingType   HeatingType?  @map("heating_type")
  viewType      ViewType?     @map("view_type")
  entranceType  EntranceType? @map("entrance_type")
  isInComplex   Boolean?      @default(false) @map("is_in_complex")
  dues          Decimal?      @db.Decimal(10, 2)
  city          String        @db.VarChar(100)
  district      String        @db.VarChar(100)
  neighborhood  String?       @db.VarChar(100)
  addressDetail String?       @map("address_detail") @db.Text
  latitude      Decimal?      @db.Decimal(10, 8)
  longitude     Decimal?      @db.Decimal(11, 8)
  features      Json          @default("[]")
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime?     @map("deleted_at") @db.Timestamptz

  // Relations
  user       User           @relation(fields: [userId], references: [id])
  media      ListingMedia[]
  matches    Match[]
  activities Activity[]

  @@index([userId])
  @@index([status])
  @@index([listingType])
  @@index([city, district])
  @@index([price])
  @@index([createdAt(sort: Desc)])
  @@map("listings")
}

model ListingMedia {
  id           String    @id @default(uuid()) @db.Uuid
  listingId    String    @map("listing_id") @db.Uuid
  mediaType    MediaType @map("media_type")
  url          String    @db.VarChar(500)
  thumbnailUrl String?   @map("thumbnail_url") @db.VarChar(500)
  fileName     String?   @map("file_name") @db.VarChar(255)
  fileSize     Int?      @map("file_size")
  sortOrder    Int       @default(0) @map("sort_order") @db.SmallInt
  isCover      Boolean   @default(false) @map("is_cover")
  createdAt    DateTime  @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  listing Listing @relation(fields: [listingId], references: [id], onDelete: Cascade)

  @@index([listingId])
  @@map("listing_media")
}

model Contact {
  id            String        @id @default(uuid()) @db.Uuid
  userId        String        @map("user_id") @db.Uuid
  name          String        @db.VarChar(255)
  phone         String?       @db.VarChar(20)
  email         String?       @db.VarChar(255)
  source        ContactSource @default(manual)
  contactType   ContactType   @default(buyer) @map("contact_type")
  status        ContactStatus @default(new)
  notes         String?       @db.Text
  lastContactAt DateTime?     @map("last_contact_at") @db.Timestamptz
  createdAt     DateTime      @default(now()) @map("created_at") @db.Timestamptz
  updatedAt     DateTime      @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt     DateTime?     @map("deleted_at") @db.Timestamptz

  // Relations
  user             User              @relation(fields: [userId], references: [id])
  searchRequests   SearchRequest[]
  activities       Activity[]
  whatsappMessages WhatsappMessage[]

  @@unique([userId, phone])
  @@index([userId])
  @@index([status])
  @@map("contacts")
}

model SearchRequest {
  id                 String              @id @default(uuid()) @db.Uuid
  userId             String              @map("user_id") @db.Uuid
  contactId          String?             @map("contact_id") @db.Uuid
  source             SearchRequestSource @default(manual)
  status             SearchRequestStatus @default(active)
  rawText            String?             @map("raw_text") @db.Text
  listingType        ListingType?        @map("listing_type")
  propertyTypes      Json                @default("[]") @map("property_types")
  budgetMin          Decimal?            @map("budget_min") @db.Decimal(15, 2)
  budgetMax          Decimal?            @map("budget_max") @db.Decimal(15, 2)
  currency           String?             @default("TRY") @db.VarChar(3)
  sqmMin             Int?                @map("sqm_min")
  sqmMax             Int?                @map("sqm_max")
  roomCountMin       String?             @map("room_count_min") @db.VarChar(10)
  roomCountMax       String?             @map("room_count_max") @db.VarChar(10)
  cities             Json                @default("[]")
  districts          Json                @default("[]")
  neighborhoods      Json                @default("[]")
  mustHaveFeatures   Json                @default("[]") @map("must_have_features")
  niceToHaveFeatures Json                @default("[]") @map("nice_to_have_features")
  criteria           Json                @default("{}")
  notes              String?             @db.Text
  createdAt          DateTime            @default(now()) @map("created_at") @db.Timestamptz
  updatedAt          DateTime            @updatedAt @map("updated_at") @db.Timestamptz
  deletedAt          DateTime?           @map("deleted_at") @db.Timestamptz

  // Relations
  user    User     @relation(fields: [userId], references: [id])
  contact Contact? @relation(fields: [contactId], references: [id])
  matches Match[]

  @@index([userId])
  @@index([contactId])
  @@index([status])
  @@map("search_requests")
}

model Match {
  id              String      @id @default(uuid()) @db.Uuid
  searchRequestId String      @map("search_request_id") @db.Uuid
  listingId       String      @map("listing_id") @db.Uuid
  matchType       MatchType   @default(auto) @map("match_type")
  score           Decimal?    @db.Decimal(5, 2)
  scoreBreakdown  Json        @default("{}") @map("score_breakdown")
  status          MatchStatus @default(new)
  notes           String?     @db.Text
  sentAt          DateTime?   @map("sent_at") @db.Timestamptz
  createdAt       DateTime    @default(now()) @map("created_at") @db.Timestamptz
  updatedAt       DateTime    @updatedAt @map("updated_at") @db.Timestamptz

  // Relations
  searchRequest SearchRequest @relation(fields: [searchRequestId], references: [id], onDelete: Cascade)
  listing       Listing       @relation(fields: [listingId], references: [id])

  @@unique([searchRequestId, listingId])
  @@index([searchRequestId])
  @@index([listingId])
  @@index([status])
  @@map("matches")
}

model Activity {
  id           String           @id @default(uuid()) @db.Uuid
  userId       String           @map("user_id") @db.Uuid
  contactId    String?          @map("contact_id") @db.Uuid
  listingId    String?          @map("listing_id") @db.Uuid
  activityType ActivityType     @map("activity_type")
  title        String?          @db.VarChar(255)
  description  String?          @db.Text
  outcome      ActivityOutcome?
  metadata     Json             @default("{}")
  scheduledAt  DateTime?        @map("scheduled_at") @db.Timestamptz
  completedAt  DateTime?        @map("completed_at") @db.Timestamptz
  createdAt    DateTime         @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  user    User     @relation(fields: [userId], references: [id])
  contact Contact? @relation(fields: [contactId], references: [id])
  listing Listing? @relation(fields: [listingId], references: [id])

  @@index([userId])
  @@index([contactId])
  @@index([listingId])
  @@index([activityType])
  @@index([contactId, createdAt(sort: Desc)])
  @@map("activities")
}

model WhatsappMessage {
  id                String           @id @default(uuid()) @db.Uuid
  contactId         String?          @map("contact_id") @db.Uuid
  userId            String?          @map("user_id") @db.Uuid
  phoneNumber       String           @map("phone_number") @db.VarChar(20)
  direction         MessageDirection
  messageType       MessageType      @default(text) @map("message_type")
  content           String?          @db.Text
  mediaUrl          String?          @map("media_url") @db.VarChar(500)
  status            MessageStatus    @default(pending)
  errorMessage      String?          @map("error_message") @db.Text
  externalId        String?          @map("external_id") @db.VarChar(100)
  relatedListingIds Json             @default("[]") @map("related_listing_ids")
  sentAt            DateTime?        @map("sent_at") @db.Timestamptz
  deliveredAt       DateTime?        @map("delivered_at") @db.Timestamptz
  readAt            DateTime?        @map("read_at") @db.Timestamptz
  createdAt         DateTime         @default(now()) @map("created_at") @db.Timestamptz

  // Relations
  contact Contact? @relation(fields: [contactId], references: [id])
  user    User?    @relation(fields: [userId], references: [id])

  @@index([contactId])
  @@index([phoneNumber, createdAt(sort: Desc)])
  @@map("whatsapp_messages")
}
```

---

## 8. Hızlı Başvuru

### 8.1 Tablo Sayıları

| Kategori | MVP | Sonraki Faz |
|----------|:---:|:-----------:|
| Core | 3 | +2 |
| CRM | 2 | +3 |
| Matching | 2 | +2 |
| Messaging | 1 | +1 |
| Analytics | 0 | +2 |
| **Toplam** | **8** | **+10** |

### 8.2 Enum Sayıları

| Tablo | Enum Alanı |
|-------|:----------:|
| listings | 6 |
| contacts | 3 |
| search_requests | 2 |
| matches | 2 |
| activities | 2 |
| whatsapp_messages | 3 |
| **Toplam** | **18** |

### 8.3 Komutlar

```bash
# Prisma migration oluştur
npx prisma migrate dev --name init

# Prisma client generate
npx prisma generate

# Database seed
npx prisma db seed

# Prisma studio (GUI)
npx prisma studio
```

---

*Bu doküman MVP seviyesinde Real Estate CRM & Matching Platform için PostgreSQL + Prisma veritabanı şemasını tanımlar.*
