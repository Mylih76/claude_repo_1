# PostgreSQL Database Architecture
## Real Estate CRM & Matching Platform

**Version:** 1.0
**Date:** 2025-12-12
**Status:** Draft

---

## Table of Contents

1. [Genel Bakış](#1-genel-bakış)
2. [Entity Listesi ve Açıklamalar](#2-entity-listesi-ve-açıklamalar)
3. [İlişkiler (ER Diagram)](#3-ilişkiler-er-diagram)
4. [Tablo Detayları](#4-tablo-detayları)
5. [Index ve Unique Constraint Önerileri](#5-index-ve-unique-constraint-önerileri)
6. [Soft Delete ve Status Alanları](#6-soft-delete-ve-status-alanları)
7. [Audit Alanları Standardı](#7-audit-alanları-standardı)
8. [Multi-Tenant Mimarisi](#8-multi-tenant-mimarisi)
9. [MVP Minimum Tablolar](#9-mvp-minimum-tablolar)
10. [Ek Öneriler](#10-ek-öneriler)

---

## 1. Genel Bakış

Bu doküman, emlak sektörüne yönelik CRM ve eşleştirme platformu için PostgreSQL veritabanı mimarisini tanımlar.

### Temel Özellikler
- **Kullanıcı Yönetimi:** Emlakçı (Agent) bazlı erişim
- **Portföy Yönetimi:** İlan ekleme, medya yönetimi, AI normalizasyonu
- **Müşteri Talepleri:** Arayış kayıtları ve AI-destekli kriter çıkarımı
- **Eşleştirme Motoru:** Hard filter + Soft score + Semantic matching
- **WhatsApp Entegrasyonu:** Inbound/Outbound mesaj yönetimi
- **CRM:** Müşteri kartları, aktiviteler, pipeline yönetimi

### Tasarım Prensipleri
- UUID primary key kullanımı (distributed systems uyumu)
- Soft delete desteği (veri kaybı önleme)
- Audit trail (created_at, updated_at, created_by, updated_by)
- JSONB kullanımı (esnek metadata, AI çıktıları)
- Multi-tenant ready (organization_id ile izolasyon)

---

## 2. Entity Listesi ve Açıklamalar

| # | Entity | Tablo Adı | Açıklama |
|---|--------|-----------|----------|
| 1 | **Organization** | `organizations` | Multi-tenant için ajans/şirket. Tüm verilerin sahibi. |
| 2 | **User** | `users` | Sistem kullanıcıları (auth bilgileri) |
| 3 | **Agent Profile** | `agent_profiles` | Emlakçı profil detayları |
| 4 | **Listing** | `listings` | Portföy/ilan kayıtları |
| 5 | **Listing Media** | `listing_media` | İlan fotoğraf, video, PDF dosyaları |
| 6 | **Listing Feature** | `listing_features` | İlan özellikleri (normalize edilmiş) |
| 7 | **Feature Definition** | `feature_definitions` | Standart özellik tanımları (master data) |
| 8 | **Contact** | `contacts` | Müşteri/lead kartları |
| 9 | **Search Request** | `search_requests` | Müşteri arayış talepleri |
| 10 | **Search Criteria** | `search_criteria` | AI ile çıkarılan yapısal kriterler |
| 11 | **Match** | `matches` | İlan-talep eşleştirme sonuçları |
| 12 | **WhatsApp Conversation** | `whatsapp_conversations` | WhatsApp konuşma thread'leri |
| 13 | **WhatsApp Message** | `whatsapp_messages` | Gelen/giden WhatsApp mesajları |
| 14 | **CRM Activity** | `crm_activities` | Tüm aktivite logları (call, note, email, vb.) |
| 15 | **Pipeline Stage** | `pipeline_stages` | Satış aşamaları tanımı |
| 16 | **Deal** | `deals` | Satış/kiralama fırsatları |
| 17 | **Reminder** | `reminders` | Hatırlatma/ajanda kayıtları |
| 18 | **Presentation Log** | `presentation_logs` | Sunum gönderim logları |
| 19 | **AI Processing Log** | `ai_processing_logs` | AI işlem geçmişi |
| 20 | **Duplicate Check** | `duplicate_checks` | Duplicate ilan kontrol sonuçları |

---

## 3. İlişkiler (ER Diagram)

### 3.1 İlişki Matrisi

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           RELATIONSHIP MATRIX                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  organizations (1) ──────┬──── (N) users                                    │
│                          ├──── (N) listings                                 │
│                          ├──── (N) contacts                                 │
│                          └──── (N) pipeline_stages                          │
│                                                                              │
│  users (1) ──────────────┬──── (1) agent_profiles                           │
│                          ├──── (N) listings (owner)                         │
│                          ├──── (N) contacts (assigned_to)                   │
│                          ├──── (N) search_requests                          │
│                          ├──── (N) deals (assigned_to)                      │
│                          └──── (N) reminders                                │
│                                                                              │
│  listings (1) ───────────┬──── (N) listing_media                            │
│                          ├──── (N) listing_features                         │
│                          ├──── (N) matches                                  │
│                          ├──── (N) presentation_logs                        │
│                          └──── (N) duplicate_checks                         │
│                                                                              │
│  contacts (1) ───────────┬──── (N) search_requests                          │
│                          ├──── (N) whatsapp_conversations                   │
│                          ├──── (N) crm_activities                           │
│                          ├──── (N) deals                                    │
│                          └──── (N) reminders                                │
│                                                                              │
│  search_requests (1) ────┬──── (1) search_criteria                          │
│                          └──── (N) matches                                  │
│                                                                              │
│  whatsapp_conversations (1) ── (N) whatsapp_messages                        │
│                                                                              │
│  pipeline_stages (1) ────────── (N) deals                                   │
│                                                                              │
│  feature_definitions (1) ────── (N) listing_features                        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3.2 N-N İlişkiler (Junction Tables)

| İlişki | Junction Table | Açıklama |
|--------|---------------|----------|
| listings ↔ contacts | `matches` | Eşleştirme sonuçları üzerinden |
| users ↔ contacts | `contact_assignments` | Birden fazla agent bir müşteriye atanabilir (opsiyonel) |

---

## 4. Tablo Detayları

### 4.1 `organizations` - Organizasyonlar (Multi-tenant Root)

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `name` | VARCHAR(255) | NO | - | Şirket/ajans adı |
| `slug` | VARCHAR(100) | NO | - | URL-friendly identifier |
| `subscription_plan` | VARCHAR(50) | YES | `'free'` | Abonelik planı |
| `settings` | JSONB | YES | `'{}'` | Organizasyon ayarları |
| `is_active` | BOOLEAN | NO | `true` | Aktiflik durumu |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.2 `users` - Kullanıcılar

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `email` | VARCHAR(255) | NO | - | E-posta (login) |
| `username` | VARCHAR(100) | YES | NULL | Kullanıcı adı (opsiyonel) |
| `password_hash` | VARCHAR(255) | NO | - | Bcrypt hash |
| `role` | VARCHAR(50) | NO | `'agent'` | Rol: admin, agent |
| `is_active` | BOOLEAN | NO | `true` | Hesap aktif mi |
| `is_verified` | BOOLEAN | NO | `false` | E-posta doğrulandı mı |
| `last_login_at` | TIMESTAMPTZ | YES | NULL | Son giriş |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.3 `agent_profiles` - Emlakçı Profilleri

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `user_id` | UUID | NO | - | FK → users (UNIQUE) |
| `first_name` | VARCHAR(100) | NO | - | Ad |
| `last_name` | VARCHAR(100) | NO | - | Soyad |
| `phone` | VARCHAR(20) | YES | NULL | Telefon |
| `whatsapp_number` | VARCHAR(20) | YES | NULL | WhatsApp numarası |
| `avatar_url` | VARCHAR(500) | YES | NULL | Profil fotoğrafı |
| `bio` | TEXT | YES | NULL | Hakkında |
| `specializations` | JSONB | YES | `'[]'` | Uzmanlık alanları |
| `service_areas` | JSONB | YES | `'[]'` | Hizmet bölgeleri |
| `license_number` | VARCHAR(50) | YES | NULL | Lisans no |
| `settings` | JSONB | YES | `'{}'` | Kişisel ayarlar |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.4 `listings` - Portföy/İlanlar

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `agent_id` | UUID | NO | - | FK → users (owner) |
| `external_id` | VARCHAR(100) | YES | NULL | Harici sistem ID |
| `reference_code` | VARCHAR(50) | NO | - | İlan referans kodu |
| `status` | VARCHAR(30) | NO | `'draft'` | draft, active, sold, rented, inactive |
| `listing_type` | VARCHAR(20) | NO | - | sale, rent |
| `property_type` | VARCHAR(50) | NO | - | apartment, villa, office, land, vb. |
| `title` | VARCHAR(255) | NO | - | İlan başlığı |
| `description` | TEXT | YES | NULL | Açıklama (orijinal) |
| `description_normalized` | TEXT | YES | NULL | AI normalize edilmiş açıklama |
| `price` | DECIMAL(15,2) | NO | - | Fiyat |
| `currency` | VARCHAR(3) | NO | `'TRY'` | Para birimi |
| `price_per_sqm` | DECIMAL(10,2) | YES | NULL | m² fiyatı (hesaplanmış) |
| `gross_sqm` | DECIMAL(10,2) | YES | NULL | Brüt m² |
| `net_sqm` | DECIMAL(10,2) | YES | NULL | Net m² |
| `room_count` | VARCHAR(10) | YES | NULL | Oda sayısı (3+1, 2+1) |
| `bedroom_count` | SMALLINT | YES | NULL | Yatak odası |
| `bathroom_count` | SMALLINT | YES | NULL | Banyo sayısı |
| `floor_number` | SMALLINT | YES | NULL | Bulunduğu kat |
| `total_floors` | SMALLINT | YES | NULL | Toplam kat |
| `building_age` | SMALLINT | YES | NULL | Bina yaşı |
| `is_furnished` | BOOLEAN | YES | NULL | Eşyalı mı |
| `heating_type` | VARCHAR(50) | YES | NULL | Isıtma tipi |
| `parking_type` | VARCHAR(50) | YES | NULL | Otopark tipi |
| `dues` | DECIMAL(10,2) | YES | NULL | Aidat |
| `address_country` | VARCHAR(100) | YES | `'Türkiye'` | Ülke |
| `address_city` | VARCHAR(100) | YES | NULL | İl |
| `address_district` | VARCHAR(100) | YES | NULL | İlçe |
| `address_neighborhood` | VARCHAR(100) | YES | NULL | Mahalle |
| `address_street` | VARCHAR(255) | YES | NULL | Sokak/Cadde |
| `address_full` | TEXT | YES | NULL | Tam adres |
| `latitude` | DECIMAL(10,8) | YES | NULL | Enlem |
| `longitude` | DECIMAL(11,8) | YES | NULL | Boylam |
| `location` | GEOGRAPHY(Point,4326) | YES | NULL | PostGIS point |
| `view_type` | VARCHAR(50) | YES | NULL | Manzara tipi |
| `entry_type` | VARCHAR(50) | YES | NULL | Giriş tipi |
| `ownership_status` | VARCHAR(50) | YES | NULL | Tapu durumu |
| `is_in_complex` | BOOLEAN | YES | NULL | Site içinde mi |
| `complex_name` | VARCHAR(255) | YES | NULL | Site adı |
| `metadata` | JSONB | YES | `'{}'` | Ek metadata |
| `ai_extracted_features` | JSONB | YES | `'{}'` | AI çıkarılan özellikler |
| `completeness_score` | SMALLINT | YES | NULL | Veri tamamlanma skoru (0-100) |
| `completeness_warnings` | JSONB | YES | `'[]'` | Eksik alan uyarıları |
| `embedding_vector` | VECTOR(1536) | YES | NULL | Semantic search embedding |
| `is_verified` | BOOLEAN | NO | `false` | Doğrulanmış mı |
| `verified_at` | TIMESTAMPTZ | YES | NULL | Doğrulama tarihi |
| `published_at` | TIMESTAMPTZ | YES | NULL | Yayın tarihi |
| `expires_at` | TIMESTAMPTZ | YES | NULL | Bitiş tarihi |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `created_by` | UUID | YES | NULL | Oluşturan user |
| `updated_by` | UUID | YES | NULL | Güncelleyen user |

---

### 4.5 `listing_media` - İlan Medyaları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `listing_id` | UUID | NO | - | FK → listings |
| `media_type` | VARCHAR(20) | NO | - | image, video, document, presentation, expertiz |
| `file_url` | VARCHAR(500) | NO | - | Dosya URL |
| `thumbnail_url` | VARCHAR(500) | YES | NULL | Thumbnail URL |
| `file_name` | VARCHAR(255) | YES | NULL | Orijinal dosya adı |
| `file_size` | INTEGER | YES | NULL | Dosya boyutu (bytes) |
| `mime_type` | VARCHAR(100) | YES | NULL | MIME tipi |
| `sort_order` | SMALLINT | NO | `0` | Sıralama |
| `is_primary` | BOOLEAN | NO | `false` | Ana görsel mi |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler (dimensions, vb.) |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 4.6 `feature_definitions` - Özellik Tanımları (Master Data)

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `category` | VARCHAR(50) | NO | - | Kategori: amenity, view, security, vb. |
| `code` | VARCHAR(50) | NO | - | Unique kod |
| `name_tr` | VARCHAR(100) | NO | - | Türkçe ad |
| `name_en` | VARCHAR(100) | YES | NULL | İngilizce ad |
| `icon` | VARCHAR(50) | YES | NULL | Icon kodu |
| `sort_order` | SMALLINT | NO | `0` | Sıralama |
| `is_active` | BOOLEAN | NO | `true` | Aktif mi |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 4.7 `listing_features` - İlan Özellikleri

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `listing_id` | UUID | NO | - | FK → listings |
| `feature_id` | UUID | NO | - | FK → feature_definitions |
| `value` | VARCHAR(255) | YES | NULL | Değer (varsa) |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 4.8 `contacts` - Müşteri/Lead Kartları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `assigned_to` | UUID | YES | NULL | FK → users (atanan agent) |
| `source` | VARCHAR(50) | NO | `'manual'` | Kaynak: manual, whatsapp, website, referral |
| `first_name` | VARCHAR(100) | YES | NULL | Ad |
| `last_name` | VARCHAR(100) | YES | NULL | Soyad |
| `full_name` | VARCHAR(255) | YES | NULL | Tam ad |
| `email` | VARCHAR(255) | YES | NULL | E-posta |
| `phone` | VARCHAR(20) | YES | NULL | Telefon |
| `whatsapp_number` | VARCHAR(20) | YES | NULL | WhatsApp numarası |
| `company` | VARCHAR(255) | YES | NULL | Şirket |
| `contact_type` | VARCHAR(30) | NO | `'buyer'` | buyer, seller, tenant, landlord, investor |
| `status` | VARCHAR(30) | NO | `'new'` | new, active, inactive, converted, lost |
| `priority` | VARCHAR(20) | YES | `'medium'` | low, medium, high, urgent |
| `tags` | JSONB | YES | `'[]'` | Etiketler |
| `notes` | TEXT | YES | NULL | Genel notlar |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `last_contact_at` | TIMESTAMPTZ | YES | NULL | Son iletişim |
| `next_followup_at` | TIMESTAMPTZ | YES | NULL | Sonraki takip |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `created_by` | UUID | YES | NULL | Oluşturan user |
| `updated_by` | UUID | YES | NULL | Güncelleyen user |

---

### 4.9 `search_requests` - Müşteri Arayışları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `contact_id` | UUID | YES | NULL | FK → contacts |
| `agent_id` | UUID | NO | - | FK → users (kaydeden agent) |
| `source` | VARCHAR(50) | NO | `'manual'` | manual, whatsapp, form |
| `original_text` | TEXT | YES | NULL | Orijinal metin (AI parse için) |
| `status` | VARCHAR(30) | NO | `'active'` | active, paused, fulfilled, expired |
| `listing_type` | VARCHAR(20) | YES | NULL | sale, rent |
| `property_types` | JSONB | YES | `'[]'` | İstenen emlak tipleri |
| `budget_min` | DECIMAL(15,2) | YES | NULL | Min bütçe |
| `budget_max` | DECIMAL(15,2) | YES | NULL | Max bütçe |
| `currency` | VARCHAR(3) | YES | `'TRY'` | Para birimi |
| `sqm_min` | DECIMAL(10,2) | YES | NULL | Min m² |
| `sqm_max` | DECIMAL(10,2) | YES | NULL | Max m² |
| `room_count_min` | VARCHAR(10) | YES | NULL | Min oda |
| `room_count_max` | VARCHAR(10) | YES | NULL | Max oda |
| `preferred_cities` | JSONB | YES | `'[]'` | İstenen iller |
| `preferred_districts` | JSONB | YES | `'[]'` | İstenen ilçeler |
| `preferred_neighborhoods` | JSONB | YES | `'[]'` | İstenen mahalleler |
| `must_have_features` | JSONB | YES | `'[]'` | Olmazsa olmaz özellikler |
| `nice_to_have_features` | JSONB | YES | `'[]'` | Tercih edilen özellikler |
| `notes` | TEXT | YES | NULL | Ek notlar |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `last_matched_at` | TIMESTAMPTZ | YES | NULL | Son eşleştirme |
| `expires_at` | TIMESTAMPTZ | YES | NULL | Bitiş tarihi |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.10 `search_criteria` - AI Yapısal Kriterler

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `search_request_id` | UUID | NO | - | FK → search_requests (UNIQUE) |
| `ai_model` | VARCHAR(50) | YES | NULL | Kullanılan AI model |
| `ai_version` | VARCHAR(20) | YES | NULL | Model versiyonu |
| `parsed_criteria` | JSONB | NO | - | Yapısal kriter objesi |
| `confidence_score` | DECIMAL(5,4) | YES | NULL | AI güven skoru |
| `processing_notes` | TEXT | YES | NULL | İşlem notları |
| `embedding_vector` | VECTOR(1536) | YES | NULL | Semantic search embedding |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.11 `matches` - Eşleştirme Sonuçları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `search_request_id` | UUID | NO | - | FK → search_requests |
| `listing_id` | UUID | NO | - | FK → listings |
| `match_type` | VARCHAR(30) | NO | - | auto, manual, ai_suggested |
| `hard_filter_passed` | BOOLEAN | NO | - | Kesin filtre geçti mi |
| `hard_filter_details` | JSONB | YES | `'{}'` | Filtre detayları |
| `soft_score` | DECIMAL(5,2) | YES | NULL | Soft skor (0-100) |
| `soft_score_details` | JSONB | YES | `'{}'` | Skor detayları |
| `semantic_score` | DECIMAL(5,4) | YES | NULL | Semantic benzerlik (0-1) |
| `total_score` | DECIMAL(5,2) | YES | NULL | Toplam skor |
| `rank` | INTEGER | YES | NULL | Sıralama |
| `match_explanation` | TEXT | YES | NULL | Neden eşleşti açıklaması |
| `status` | VARCHAR(30) | NO | `'pending'` | pending, sent, viewed, interested, rejected |
| `agent_feedback` | TEXT | YES | NULL | Agent geri bildirimi |
| `contact_feedback` | TEXT | YES | NULL | Müşteri geri bildirimi |
| `sent_at` | TIMESTAMPTZ | YES | NULL | Gönderilme tarihi |
| `viewed_at` | TIMESTAMPTZ | YES | NULL | Görüntülenme tarihi |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.12 `whatsapp_conversations` - WhatsApp Konuşmaları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `contact_id` | UUID | YES | NULL | FK → contacts |
| `whatsapp_chat_id` | VARCHAR(100) | NO | - | WA Business API chat ID |
| `phone_number` | VARCHAR(20) | NO | - | Telefon numarası |
| `contact_name` | VARCHAR(255) | YES | NULL | İsim (WA'dan) |
| `status` | VARCHAR(30) | NO | `'active'` | active, archived, blocked |
| `assigned_to` | UUID | YES | NULL | FK → users |
| `last_message_at` | TIMESTAMPTZ | YES | NULL | Son mesaj zamanı |
| `last_message_preview` | VARCHAR(255) | YES | NULL | Son mesaj önizleme |
| `unread_count` | INTEGER | NO | `0` | Okunmamış sayısı |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.13 `whatsapp_messages` - WhatsApp Mesajları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `conversation_id` | UUID | NO | - | FK → whatsapp_conversations |
| `whatsapp_message_id` | VARCHAR(100) | YES | NULL | WA message ID |
| `direction` | VARCHAR(10) | NO | - | inbound, outbound |
| `message_type` | VARCHAR(30) | NO | `'text'` | text, image, document, location, vb. |
| `content` | TEXT | YES | NULL | Mesaj içeriği |
| `media_url` | VARCHAR(500) | YES | NULL | Medya URL |
| `media_mime_type` | VARCHAR(100) | YES | NULL | Medya MIME |
| `status` | VARCHAR(30) | NO | `'sent'` | sent, delivered, read, failed |
| `error_message` | TEXT | YES | NULL | Hata mesajı |
| `ai_parsed` | BOOLEAN | NO | `false` | AI işlendi mi |
| `ai_parse_result` | JSONB | YES | `'{}'` | AI parse sonucu |
| `related_search_request_id` | UUID | YES | NULL | FK → search_requests |
| `related_listing_ids` | JSONB | YES | `'[]'` | İlgili ilan ID'leri |
| `sent_at` | TIMESTAMPTZ | YES | NULL | Gönderilme zamanı (WA) |
| `delivered_at` | TIMESTAMPTZ | YES | NULL | Teslim zamanı |
| `read_at` | TIMESTAMPTZ | YES | NULL | Okunma zamanı |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 4.14 `crm_activities` - CRM Aktiviteleri

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `contact_id` | UUID | YES | NULL | FK → contacts |
| `deal_id` | UUID | YES | NULL | FK → deals |
| `listing_id` | UUID | YES | NULL | FK → listings |
| `user_id` | UUID | NO | - | FK → users (yapan) |
| `activity_type` | VARCHAR(50) | NO | - | call, meeting, email, note, whatsapp, showing, offer, vb. |
| `subject` | VARCHAR(255) | YES | NULL | Konu |
| `description` | TEXT | YES | NULL | Açıklama |
| `outcome` | VARCHAR(50) | YES | NULL | Sonuç: completed, no_answer, rescheduled |
| `scheduled_at` | TIMESTAMPTZ | YES | NULL | Planlanan zaman |
| `completed_at` | TIMESTAMPTZ | YES | NULL | Tamamlanma zamanı |
| `duration_minutes` | INTEGER | YES | NULL | Süre (dakika) |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.15 `pipeline_stages` - Pipeline Aşamaları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `name` | VARCHAR(100) | NO | - | Aşama adı |
| `code` | VARCHAR(50) | NO | - | Kod: lead, contacted, showing, offer, negotiation, closing, won, lost |
| `color` | VARCHAR(7) | YES | NULL | Renk kodu (#HEX) |
| `sort_order` | SMALLINT | NO | `0` | Sıralama |
| `is_won` | BOOLEAN | NO | `false` | Kazanıldı aşaması mı |
| `is_lost` | BOOLEAN | NO | `false` | Kaybedildi aşaması mı |
| `is_active` | BOOLEAN | NO | `true` | Aktif mi |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.16 `deals` - Satış/Kiralama Fırsatları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `contact_id` | UUID | NO | - | FK → contacts |
| `listing_id` | UUID | YES | NULL | FK → listings |
| `assigned_to` | UUID | YES | NULL | FK → users |
| `stage_id` | UUID | NO | - | FK → pipeline_stages |
| `title` | VARCHAR(255) | NO | - | Deal başlığı |
| `deal_type` | VARCHAR(20) | NO | - | sale, rent |
| `expected_value` | DECIMAL(15,2) | YES | NULL | Beklenen değer |
| `actual_value` | DECIMAL(15,2) | YES | NULL | Gerçekleşen değer |
| `currency` | VARCHAR(3) | NO | `'TRY'` | Para birimi |
| `commission_rate` | DECIMAL(5,2) | YES | NULL | Komisyon oranı (%) |
| `commission_amount` | DECIMAL(15,2) | YES | NULL | Komisyon tutarı |
| `probability` | SMALLINT | YES | `50` | Olasılık (%) |
| `expected_close_date` | DATE | YES | NULL | Beklenen kapanış |
| `actual_close_date` | DATE | YES | NULL | Gerçek kapanış |
| `lost_reason` | VARCHAR(255) | YES | NULL | Kaybetme nedeni |
| `notes` | TEXT | YES | NULL | Notlar |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `deleted_at` | TIMESTAMPTZ | YES | NULL | Soft delete |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |
| `created_by` | UUID | YES | NULL | Oluşturan user |
| `updated_by` | UUID | YES | NULL | Güncelleyen user |

---

### 4.17 `reminders` - Hatırlatmalar

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `user_id` | UUID | NO | - | FK → users (hatırlatılacak) |
| `contact_id` | UUID | YES | NULL | FK → contacts |
| `deal_id` | UUID | YES | NULL | FK → deals |
| `listing_id` | UUID | YES | NULL | FK → listings |
| `title` | VARCHAR(255) | NO | - | Başlık |
| `description` | TEXT | YES | NULL | Açıklama |
| `remind_at` | TIMESTAMPTZ | NO | - | Hatırlatma zamanı |
| `reminder_type` | VARCHAR(30) | NO | `'one_time'` | one_time, recurring |
| `recurrence_rule` | VARCHAR(255) | YES | NULL | RRULE formatı |
| `status` | VARCHAR(20) | NO | `'pending'` | pending, completed, snoozed, cancelled |
| `completed_at` | TIMESTAMPTZ | YES | NULL | Tamamlanma |
| `snoozed_until` | TIMESTAMPTZ | YES | NULL | Erteleme |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |
| `updated_at` | TIMESTAMPTZ | NO | `NOW()` | Güncelleme |

---

### 4.18 `presentation_logs` - Sunum Gönderim Logları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `listing_id` | UUID | NO | - | FK → listings |
| `contact_id` | UUID | YES | NULL | FK → contacts |
| `user_id` | UUID | NO | - | FK → users (gönderen) |
| `channel` | VARCHAR(30) | NO | - | email, whatsapp, download, link |
| `recipient` | VARCHAR(255) | YES | NULL | Alıcı (email/phone) |
| `presentation_url` | VARCHAR(500) | YES | NULL | PDF/link URL |
| `message` | TEXT | YES | NULL | Gönderilen mesaj |
| `status` | VARCHAR(30) | NO | `'sent'` | sent, delivered, opened, failed |
| `opened_at` | TIMESTAMPTZ | YES | NULL | Açılma zamanı |
| `open_count` | INTEGER | NO | `0` | Açılma sayısı |
| `metadata` | JSONB | YES | `'{}'` | Ek bilgiler |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 4.19 `ai_processing_logs` - AI İşlem Logları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `organization_id` | UUID | NO | - | FK → organizations |
| `entity_type` | VARCHAR(50) | NO | - | listing, search_request, whatsapp_message |
| `entity_id` | UUID | NO | - | İlgili kayıt ID |
| `operation` | VARCHAR(50) | NO | - | normalize, parse, embed, match, duplicate_check |
| `ai_model` | VARCHAR(50) | YES | NULL | Kullanılan model |
| `input_data` | JSONB | YES | `'{}'` | Girdi |
| `output_data` | JSONB | YES | `'{}'` | Çıktı |
| `tokens_used` | INTEGER | YES | NULL | Kullanılan token |
| `processing_time_ms` | INTEGER | YES | NULL | İşlem süresi (ms) |
| `status` | VARCHAR(30) | NO | - | success, error, partial |
| `error_message` | TEXT | YES | NULL | Hata mesajı |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

### 4.20 `duplicate_checks` - Duplicate Kontrol Sonuçları

| Alan | Tip | Nullable | Default | Açıklama |
|------|-----|----------|---------|----------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary Key |
| `listing_id` | UUID | NO | - | FK → listings (kontrol edilen) |
| `potential_duplicate_id` | UUID | NO | - | FK → listings (olası duplicate) |
| `similarity_score` | DECIMAL(5,4) | NO | - | Benzerlik skoru (0-1) |
| `similarity_factors` | JSONB | YES | `'{}'` | Benzerlik faktörleri |
| `status` | VARCHAR(30) | NO | `'pending'` | pending, confirmed_duplicate, not_duplicate, merged |
| `reviewed_by` | UUID | YES | NULL | FK → users |
| `reviewed_at` | TIMESTAMPTZ | YES | NULL | İnceleme zamanı |
| `notes` | TEXT | YES | NULL | Notlar |
| `created_at` | TIMESTAMPTZ | NO | `NOW()` | Oluşturulma |

---

## 5. Index ve Unique Constraint Önerileri

### 5.1 Primary Keys (Otomatik Index)
Tüm tablolarda `id` alanı UUID primary key olarak tanımlanmıştır.

### 5.2 Unique Constraints

```sql
-- organizations
CREATE UNIQUE INDEX idx_organizations_slug ON organizations(slug) WHERE deleted_at IS NULL;

-- users
CREATE UNIQUE INDEX idx_users_email_org ON users(organization_id, email) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_users_username_org ON users(organization_id, username) WHERE deleted_at IS NULL AND username IS NOT NULL;

-- agent_profiles
CREATE UNIQUE INDEX idx_agent_profiles_user ON agent_profiles(user_id) WHERE deleted_at IS NULL;

-- listings
CREATE UNIQUE INDEX idx_listings_reference_org ON listings(organization_id, reference_code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_listings_external_org ON listings(organization_id, external_id) WHERE deleted_at IS NULL AND external_id IS NOT NULL;

-- feature_definitions
CREATE UNIQUE INDEX idx_feature_definitions_code ON feature_definitions(code);

-- listing_features
CREATE UNIQUE INDEX idx_listing_features_unique ON listing_features(listing_id, feature_id);

-- whatsapp_conversations
CREATE UNIQUE INDEX idx_wa_conv_chat_id ON whatsapp_conversations(organization_id, whatsapp_chat_id);

-- search_criteria
CREATE UNIQUE INDEX idx_search_criteria_request ON search_criteria(search_request_id);

-- pipeline_stages
CREATE UNIQUE INDEX idx_pipeline_stages_code ON pipeline_stages(organization_id, code);
```

### 5.3 Foreign Key Indexes

```sql
-- Multi-tenant isolation (tüm tablolarda)
CREATE INDEX idx_users_org ON users(organization_id);
CREATE INDEX idx_listings_org ON listings(organization_id);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_search_requests_org ON search_requests(organization_id);
CREATE INDEX idx_deals_org ON deals(organization_id);
CREATE INDEX idx_crm_activities_org ON crm_activities(organization_id);
CREATE INDEX idx_whatsapp_conv_org ON whatsapp_conversations(organization_id);
CREATE INDEX idx_reminders_org ON reminders(organization_id);

-- Agent/Owner relationships
CREATE INDEX idx_listings_agent ON listings(agent_id);
CREATE INDEX idx_contacts_assigned ON contacts(assigned_to);
CREATE INDEX idx_deals_assigned ON deals(assigned_to);
CREATE INDEX idx_search_requests_agent ON search_requests(agent_id);

-- Parent-child relationships
CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);
CREATE INDEX idx_listing_features_listing ON listing_features(listing_id);
CREATE INDEX idx_search_requests_contact ON search_requests(contact_id);
CREATE INDEX idx_matches_search_request ON matches(search_request_id);
CREATE INDEX idx_matches_listing ON matches(listing_id);
CREATE INDEX idx_wa_messages_conv ON whatsapp_messages(conversation_id);
CREATE INDEX idx_wa_conv_contact ON whatsapp_conversations(contact_id);
CREATE INDEX idx_crm_activities_contact ON crm_activities(contact_id);
CREATE INDEX idx_crm_activities_deal ON crm_activities(deal_id);
CREATE INDEX idx_deals_contact ON deals(contact_id);
CREATE INDEX idx_deals_listing ON deals(listing_id);
CREATE INDEX idx_deals_stage ON deals(stage_id);
CREATE INDEX idx_reminders_user ON reminders(user_id);
CREATE INDEX idx_reminders_contact ON reminders(contact_id);
```

### 5.4 Query Optimization Indexes

```sql
-- Listings search
CREATE INDEX idx_listings_status ON listings(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_type ON listings(listing_type, property_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_price ON listings(price) WHERE deleted_at IS NULL AND status = 'active';
CREATE INDEX idx_listings_location ON listings(address_city, address_district) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_sqm ON listings(net_sqm) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_created ON listings(created_at DESC) WHERE deleted_at IS NULL;

-- GiST index for PostGIS location queries
CREATE INDEX idx_listings_geo ON listings USING GIST(location) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_listings_fts ON listings USING GIN(
    to_tsvector('turkish', coalesce(title, '') || ' ' || coalesce(description, ''))
) WHERE deleted_at IS NULL;

-- Vector similarity search (pgvector)
CREATE INDEX idx_listings_embedding ON listings USING ivfflat(embedding_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_search_criteria_embedding ON search_criteria USING ivfflat(embedding_vector vector_cosine_ops) WITH (lists = 100);

-- Contacts search
CREATE INDEX idx_contacts_status ON contacts(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_contacts_phone ON contacts(phone) WHERE deleted_at IS NULL AND phone IS NOT NULL;
CREATE INDEX idx_contacts_whatsapp ON contacts(whatsapp_number) WHERE deleted_at IS NULL AND whatsapp_number IS NOT NULL;
CREATE INDEX idx_contacts_followup ON contacts(next_followup_at) WHERE deleted_at IS NULL AND next_followup_at IS NOT NULL;

-- Search requests
CREATE INDEX idx_search_requests_status ON search_requests(status) WHERE deleted_at IS NULL;
CREATE INDEX idx_search_requests_created ON search_requests(created_at DESC) WHERE deleted_at IS NULL;

-- Matches
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_score ON matches(total_score DESC);
CREATE INDEX idx_matches_composite ON matches(search_request_id, status, total_score DESC);

-- WhatsApp
CREATE INDEX idx_wa_messages_direction ON whatsapp_messages(direction, created_at DESC);
CREATE INDEX idx_wa_conv_last_message ON whatsapp_conversations(last_message_at DESC);

-- CRM Activities
CREATE INDEX idx_crm_activities_type ON crm_activities(activity_type);
CREATE INDEX idx_crm_activities_scheduled ON crm_activities(scheduled_at) WHERE completed_at IS NULL;
CREATE INDEX idx_crm_activities_created ON crm_activities(created_at DESC);

-- Deals
CREATE INDEX idx_deals_stage ON deals(stage_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_deals_expected_close ON deals(expected_close_date) WHERE deleted_at IS NULL;

-- Reminders
CREATE INDEX idx_reminders_remind_at ON reminders(remind_at) WHERE status = 'pending';
```

### 5.5 Partial Indexes (Performance)

```sql
-- Active listings only
CREATE INDEX idx_listings_active ON listings(organization_id, created_at DESC)
    WHERE deleted_at IS NULL AND status = 'active';

-- Unread WhatsApp conversations
CREATE INDEX idx_wa_conv_unread ON whatsapp_conversations(organization_id, last_message_at DESC)
    WHERE unread_count > 0;

-- Pending reminders
CREATE INDEX idx_reminders_pending ON reminders(user_id, remind_at)
    WHERE status = 'pending';

-- Open deals
CREATE INDEX idx_deals_open ON deals(organization_id, stage_id)
    WHERE deleted_at IS NULL AND actual_close_date IS NULL;
```

---

## 6. Soft Delete ve Status Alanları

### 6.1 Soft Delete Stratejisi

**Neden Soft Delete?**
- Veri kaybını önleme
- Audit trail koruma
- İlişkisel bütünlük
- Geri alma imkanı

**Uygulama:**
```sql
-- deleted_at NULL ise kayıt aktif, değilse silinmiş
deleted_at TIMESTAMPTZ DEFAULT NULL

-- Soft delete query pattern
SELECT * FROM listings WHERE deleted_at IS NULL;

-- Hard delete (gerçek silme) için scheduled job
DELETE FROM listings WHERE deleted_at < NOW() - INTERVAL '90 days';
```

**Soft Delete Uygulanan Tablolar:**
- `organizations`
- `users`
- `agent_profiles`
- `listings`
- `listing_media`
- `contacts`
- `search_requests`
- `deals`

**Soft Delete UYGULANMAYAN Tablolar (Log/History):**
- `whatsapp_messages` (immutable log)
- `crm_activities` (immutable log)
- `presentation_logs` (immutable log)
- `ai_processing_logs` (immutable log)
- `matches` (can be status updated)
- `duplicate_checks` (audit record)

### 6.2 Status Alanları

| Tablo | Status Alanı | Değerler |
|-------|-------------|----------|
| `users` | `is_active` | true, false |
| `listings` | `status` | draft, active, sold, rented, inactive |
| `contacts` | `status` | new, active, inactive, converted, lost |
| `search_requests` | `status` | active, paused, fulfilled, expired |
| `matches` | `status` | pending, sent, viewed, interested, rejected |
| `whatsapp_conversations` | `status` | active, archived, blocked |
| `whatsapp_messages` | `status` | sent, delivered, read, failed |
| `deals` | - | stage_id (pipeline_stages) ile yönetilir |
| `reminders` | `status` | pending, completed, snoozed, cancelled |
| `duplicate_checks` | `status` | pending, confirmed_duplicate, not_duplicate, merged |

### 6.3 Status Enum Types (Opsiyonel)

```sql
-- PostgreSQL ENUM types (compile-time check)
CREATE TYPE listing_status AS ENUM ('draft', 'active', 'sold', 'rented', 'inactive');
CREATE TYPE contact_status AS ENUM ('new', 'active', 'inactive', 'converted', 'lost');
CREATE TYPE search_request_status AS ENUM ('active', 'paused', 'fulfilled', 'expired');
CREATE TYPE match_status AS ENUM ('pending', 'sent', 'viewed', 'interested', 'rejected');
CREATE TYPE message_direction AS ENUM ('inbound', 'outbound');
CREATE TYPE reminder_status AS ENUM ('pending', 'completed', 'snoozed', 'cancelled');

-- Not: VARCHAR tercih edilebilir (daha esnek, migration kolaylığı)
```

---

## 7. Audit Alanları Standardı

### 7.1 Temel Audit Alanları

Her tabloda bulunması gereken minimum audit alanları:

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### 7.2 Genişletilmiş Audit Alanları

Kritik business tablolarında (listings, contacts, deals):

```sql
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
created_by  UUID REFERENCES users(id)
updated_by  UUID REFERENCES users(id)
```

### 7.3 Otomatik Updated_at Trigger

```sql
-- Trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_listings_updated_at
    BEFORE UPDATE ON listings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ... (diğer tablolar için de aynı pattern)
```

### 7.4 Audit Alanları Tablosu

| Tablo | created_at | updated_at | created_by | updated_by | deleted_at |
|-------|:----------:|:----------:|:----------:|:----------:|:----------:|
| organizations | ✓ | ✓ | - | - | ✓ |
| users | ✓ | ✓ | - | - | ✓ |
| agent_profiles | ✓ | ✓ | - | - | ✓ |
| **listings** | ✓ | ✓ | ✓ | ✓ | ✓ |
| listing_media | ✓ | - | - | - | ✓ |
| listing_features | ✓ | - | - | - | - |
| feature_definitions | ✓ | - | - | - | - |
| **contacts** | ✓ | ✓ | ✓ | ✓ | ✓ |
| search_requests | ✓ | ✓ | - | - | ✓ |
| search_criteria | ✓ | ✓ | - | - | - |
| matches | ✓ | ✓ | - | - | - |
| whatsapp_conversations | ✓ | ✓ | - | - | - |
| whatsapp_messages | ✓ | - | - | - | - |
| crm_activities | ✓ | ✓ | - | - | - |
| pipeline_stages | ✓ | ✓ | - | - | - |
| **deals** | ✓ | ✓ | ✓ | ✓ | ✓ |
| reminders | ✓ | ✓ | - | - | - |
| presentation_logs | ✓ | - | - | - | - |
| ai_processing_logs | ✓ | - | - | - | - |
| duplicate_checks | ✓ | - | - | - | - |

---

## 8. Multi-Tenant Mimarisi

### 8.1 Gereksinim Analizi

**Varsayım:** Sistem birden fazla emlak ajansı/şirketi tarafından kullanılabilir olmalı.

**Senaryolar:**
1. **Single Agency (Başlangıç):** Tek ajans, tüm veriler tek organization altında
2. **Multi Agency (Ölçekleme):** Farklı ajanslar kendi verilerini izole görür
3. **Franchise Model:** Ana şirket + bağlı ofisler hiyerarşisi

### 8.2 Önerilen Strateji: Shared Database, Shared Schema

```
┌─────────────────────────────────────────────────────────────────┐
│                    PostgreSQL Database                          │
├─────────────────────────────────────────────────────────────────┤
│  organizations table                                            │
│  ┌─────────────┬─────────────┬─────────────┐                   │
│  │ Org A       │ Org B       │ Org C       │                   │
│  │ (Agency 1)  │ (Agency 2)  │ (Franchise) │                   │
│  └──────┬──────┴──────┬──────┴──────┬──────┘                   │
│         │             │             │                           │
│         ▼             ▼             ▼                           │
│  ┌─────────────────────────────────────────┐                   │
│  │  All data tables have organization_id   │                   │
│  │  - users                                │                   │
│  │  - listings                             │                   │
│  │  - contacts                             │                   │
│  │  - search_requests                      │                   │
│  │  - deals                                │                   │
│  │  - whatsapp_conversations               │                   │
│  │  - crm_activities                       │                   │
│  │  - reminders                            │                   │
│  │  - presentation_logs                    │                   │
│  └─────────────────────────────────────────┘                   │
└─────────────────────────────────────────────────────────────────┘
```

### 8.3 Row-Level Security (RLS)

```sql
-- Enable RLS on all tenant tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
-- ... (diğer tablolar)

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON users
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

CREATE POLICY tenant_isolation_policy ON listings
    USING (organization_id = current_setting('app.current_organization_id')::UUID);

-- Application must set context before queries
SET app.current_organization_id = 'org-uuid-here';
```

### 8.4 Application-Level Tenant Filtering

```typescript
// Middleware pattern (pseudocode)
async function tenantMiddleware(req, res, next) {
    const orgId = req.user.organization_id;
    req.tenantFilter = { organization_id: orgId };
    next();
}

// Repository pattern
class ListingRepository {
    async findAll(tenantFilter) {
        return db.listings.findMany({
            where: {
                ...tenantFilter,
                deleted_at: null
            }
        });
    }
}
```

### 8.5 Multi-Tenant için Ek Tablolar (Opsiyonel)

```sql
-- Organization hierarchy (franchise model)
CREATE TABLE organization_hierarchy (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_org_id UUID REFERENCES organizations(id),
    child_org_id UUID REFERENCES organizations(id),
    relationship_type VARCHAR(50), -- 'franchise', 'branch', 'partner'
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(parent_org_id, child_org_id)
);

-- Organization invitations
CREATE TABLE organization_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'agent',
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMPTZ NOT NULL,
    accepted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 8.6 Tenant İzolasyonu Kontrol Listesi

| Alan | Durum | Notlar |
|------|:-----:|--------|
| Her tabloda organization_id | ✓ | FK + Index |
| RLS politikaları | ✓ | PostgreSQL native |
| Application-level filtering | ✓ | Middleware/Repository |
| API endpoint isolation | ✓ | Auth token'dan org çıkarımı |
| File storage isolation | ✓ | S3 prefix: `org-{id}/` |
| Background job isolation | ✓ | Job payload'da org_id |
| Caching isolation | ✓ | Cache key: `org:{id}:*` |
| Logging isolation | ✓ | Log context'te org_id |

---

## 9. MVP Minimum Tablolar

### 9.1 MVP Scope

İlk sürüm için minimum gerekli tablolar ve özellikler:

```
MVP Hedefleri:
├── Auth & Users          → Giriş yapabilme
├── Listings              → İlan ekleyebilme
├── Contacts              → Müşteri kaydı
├── Search Requests       → Arayış girişi
├── Basic Matching        → Manuel/basit eşleştirme
└── WhatsApp Integration  → Mesaj alma/gönderme
```

### 9.2 MVP Tablo Listesi

| # | Tablo | MVP Öncelik | Notlar |
|---|-------|:-----------:|--------|
| 1 | `organizations` | ✅ MUST | Multi-tenant altyapı |
| 2 | `users` | ✅ MUST | Auth |
| 3 | `agent_profiles` | ✅ MUST | Profil bilgileri |
| 4 | `listings` | ✅ MUST | Core feature |
| 5 | `listing_media` | ✅ MUST | Fotoğraf zorunlu |
| 6 | `contacts` | ✅ MUST | Müşteri kartları |
| 7 | `search_requests` | ✅ MUST | Arayış kayıtları |
| 8 | `matches` | ✅ MUST | Eşleştirme sonuçları |
| 9 | `whatsapp_conversations` | ✅ MUST | WA entegrasyonu |
| 10 | `whatsapp_messages` | ✅ MUST | WA mesajları |
| 11 | `feature_definitions` | ⚠️ SHOULD | Master data (seed) |
| 12 | `listing_features` | ⚠️ SHOULD | İlan özellikleri |
| 13 | `search_criteria` | ⚠️ SHOULD | AI parse sonuçları |
| 14 | `crm_activities` | ⚠️ SHOULD | Basit aktivite logu |
| 15 | `pipeline_stages` | ❌ LATER | Phase 2 |
| 16 | `deals` | ❌ LATER | Phase 2 |
| 17 | `reminders` | ❌ LATER | Phase 2 |
| 18 | `presentation_logs` | ❌ LATER | Phase 2 |
| 19 | `ai_processing_logs` | ❌ LATER | Phase 2 |
| 20 | `duplicate_checks` | ❌ LATER | Phase 2 |

### 9.3 MVP ER Diagram (Simplified)

```
┌─────────────────────────────────────────────────────────────────┐
│                         MVP SCHEMA                               │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐         ┌──────────────┐
    │organizations │◄────────│    users     │
    └──────────────┘    1:N  └──────────────┘
           │                        │
           │ 1:N                    │ 1:1
           ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │   listings   │         │agent_profiles│
    └──────────────┘         └──────────────┘
           │
           │ 1:N
           ▼
    ┌──────────────┐
    │listing_media │
    └──────────────┘

    ┌──────────────┐         ┌──────────────┐
    │   contacts   │◄────────│search_request│
    └──────────────┘    1:N  └──────────────┘
           │                        │
           │ 1:N                    │
           ▼                        │
    ┌──────────────┐                │
    │  whatsapp_   │                │
    │conversations │                │
    └──────────────┘                │
           │                        │
           │ 1:N                    │
           ▼                        ▼
    ┌──────────────┐         ┌──────────────┐
    │  whatsapp_   │         │   matches    │◄──── listings
    │  messages    │         └──────────────┘
    └──────────────┘
```

### 9.4 MVP Migration Script

```sql
-- MVP Tables Creation Script

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Organizations
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'agent',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    last_login_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_users_email_org ON users(organization_id, email) WHERE deleted_at IS NULL;

-- 3. Agent Profiles
CREATE TABLE agent_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    avatar_url VARCHAR(500),
    bio TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_agent_profiles_user ON agent_profiles(user_id) WHERE deleted_at IS NULL;

-- 4. Listings
CREATE TABLE listings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    reference_code VARCHAR(50) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'draft',
    listing_type VARCHAR(20) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TRY',
    gross_sqm DECIMAL(10,2),
    net_sqm DECIMAL(10,2),
    room_count VARCHAR(10),
    floor_number SMALLINT,
    is_furnished BOOLEAN,
    address_city VARCHAR(100),
    address_district VARCHAR(100),
    address_neighborhood VARCHAR(100),
    metadata JSONB DEFAULT '{}',
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
CREATE UNIQUE INDEX idx_listings_reference_org ON listings(organization_id, reference_code) WHERE deleted_at IS NULL;
CREATE INDEX idx_listings_org ON listings(organization_id);
CREATE INDEX idx_listings_agent ON listings(agent_id);
CREATE INDEX idx_listings_status ON listings(status) WHERE deleted_at IS NULL;

-- 5. Listing Media
CREATE TABLE listing_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    listing_id UUID NOT NULL REFERENCES listings(id),
    media_type VARCHAR(20) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_name VARCHAR(255),
    sort_order SMALLINT NOT NULL DEFAULT 0,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_listing_media_listing ON listing_media(listing_id);

-- 6. Contacts
CREATE TABLE contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    assigned_to UUID REFERENCES users(id),
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    contact_type VARCHAR(30) NOT NULL DEFAULT 'buyer',
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    last_contact_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);
CREATE INDEX idx_contacts_org ON contacts(organization_id);
CREATE INDEX idx_contacts_assigned ON contacts(assigned_to);
CREATE INDEX idx_contacts_status ON contacts(status) WHERE deleted_at IS NULL;

-- 7. Search Requests
CREATE TABLE search_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    agent_id UUID NOT NULL REFERENCES users(id),
    source VARCHAR(50) NOT NULL DEFAULT 'manual',
    original_text TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    listing_type VARCHAR(20),
    budget_min DECIMAL(15,2),
    budget_max DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'TRY',
    sqm_min DECIMAL(10,2),
    sqm_max DECIMAL(10,2),
    preferred_districts JSONB DEFAULT '[]',
    notes TEXT,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_search_requests_org ON search_requests(organization_id);
CREATE INDEX idx_search_requests_contact ON search_requests(contact_id);
CREATE INDEX idx_search_requests_status ON search_requests(status) WHERE deleted_at IS NULL;

-- 8. Matches
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_request_id UUID NOT NULL REFERENCES search_requests(id),
    listing_id UUID NOT NULL REFERENCES listings(id),
    match_type VARCHAR(30) NOT NULL,
    total_score DECIMAL(5,2),
    match_explanation TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'pending',
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_matches_search_request ON matches(search_request_id);
CREATE INDEX idx_matches_listing ON matches(listing_id);
CREATE INDEX idx_matches_status ON matches(status);

-- 9. WhatsApp Conversations
CREATE TABLE whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id),
    contact_id UUID REFERENCES contacts(id),
    whatsapp_chat_id VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    contact_name VARCHAR(255),
    status VARCHAR(30) NOT NULL DEFAULT 'active',
    assigned_to UUID REFERENCES users(id),
    last_message_at TIMESTAMPTZ,
    unread_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_wa_conv_chat_id ON whatsapp_conversations(organization_id, whatsapp_chat_id);
CREATE INDEX idx_wa_conv_org ON whatsapp_conversations(organization_id);
CREATE INDEX idx_wa_conv_contact ON whatsapp_conversations(contact_id);

-- 10. WhatsApp Messages
CREATE TABLE whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES whatsapp_conversations(id),
    whatsapp_message_id VARCHAR(100),
    direction VARCHAR(10) NOT NULL,
    message_type VARCHAR(30) NOT NULL DEFAULT 'text',
    content TEXT,
    media_url VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'sent',
    ai_parsed BOOLEAN NOT NULL DEFAULT false,
    ai_parse_result JSONB DEFAULT '{}',
    related_search_request_id UUID REFERENCES search_requests(id),
    sent_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wa_messages_conv ON whatsapp_messages(conversation_id);
CREATE INDEX idx_wa_messages_direction ON whatsapp_messages(direction, created_at DESC);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_agent_profiles_updated_at BEFORE UPDATE ON agent_profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_listings_updated_at BEFORE UPDATE ON listings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_contacts_updated_at BEFORE UPDATE ON contacts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_search_requests_updated_at BEFORE UPDATE ON search_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON matches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_whatsapp_conversations_updated_at BEFORE UPDATE ON whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 10. Ek Öneriler

### 10.1 Extension'lar

```sql
-- Zorunlu
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";      -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";       -- Password hashing

-- Önerilen
CREATE EXTENSION IF NOT EXISTS "postgis";        -- Geo queries
CREATE EXTENSION IF NOT EXISTS "pg_trgm";        -- Fuzzy text search
CREATE EXTENSION IF NOT EXISTS "vector";         -- pgvector for embeddings
CREATE EXTENSION IF NOT EXISTS "btree_gin";      -- GIN index improvement
```

### 10.2 Naming Conventions

| Öğe | Kural | Örnek |
|-----|-------|-------|
| Tablo | snake_case, çoğul | `listings`, `search_requests` |
| Kolon | snake_case | `created_at`, `phone_number` |
| Primary Key | `id` | `id UUID PRIMARY KEY` |
| Foreign Key | `{table}_id` | `listing_id`, `contact_id` |
| Index | `idx_{table}_{columns}` | `idx_listings_status` |
| Unique | `idx_{table}_{columns}` | `idx_users_email_org` |
| Constraint | `{table}_{type}_{columns}` | `users_check_role` |
| Trigger | `{action}_{table}_{timing}` | `update_users_updated_at` |
| Function | `{verb}_{noun}` | `update_updated_at_column()` |

### 10.3 Performance Önerileri

1. **Connection Pooling:** PgBouncer veya built-in pooling
2. **Read Replicas:** Raporlama için ayrı replica
3. **Partitioning:** `whatsapp_messages`, `crm_activities` için tarih bazlı
4. **Vacuum:** Regular VACUUM ANALYZE scheduling
5. **Query Optimization:** EXPLAIN ANALYZE ile düzenli kontrol

### 10.4 Backup Stratejisi

```
Daily:     Full backup (pg_dump)
Hourly:    WAL archiving
Real-time: Streaming replication to standby
Retention: 30 days full, 7 days WAL
```

### 10.5 Güvenlik Önerileri

1. **RLS:** Row-Level Security for multi-tenant
2. **Encryption:** SSL/TLS for connections
3. **Secrets:** Credentials in environment variables
4. **Audit:** pg_audit extension for compliance
5. **Firewall:** IP whitelist for database access

---

## Appendix A: Complete Table Summary

| # | Tablo | Satır Tahmini (1 yıl) | Boyut Tahmini |
|---|-------|----------------------:|---------------|
| 1 | organizations | 10-100 | < 1 MB |
| 2 | users | 100-1,000 | < 1 MB |
| 3 | agent_profiles | 100-1,000 | < 1 MB |
| 4 | listings | 10,000-100,000 | 100-500 MB |
| 5 | listing_media | 50,000-500,000 | 10-50 MB (metadata only) |
| 6 | listing_features | 100,000-1,000,000 | 50-200 MB |
| 7 | feature_definitions | 100-500 | < 1 MB |
| 8 | contacts | 10,000-100,000 | 50-200 MB |
| 9 | search_requests | 5,000-50,000 | 20-100 MB |
| 10 | search_criteria | 5,000-50,000 | 50-200 MB |
| 11 | matches | 50,000-500,000 | 100-500 MB |
| 12 | whatsapp_conversations | 5,000-50,000 | 20-100 MB |
| 13 | whatsapp_messages | 100,000-1,000,000 | 200 MB - 1 GB |
| 14 | crm_activities | 50,000-500,000 | 100-500 MB |
| 15 | pipeline_stages | 50-200 | < 1 MB |
| 16 | deals | 1,000-10,000 | 5-50 MB |
| 17 | reminders | 5,000-50,000 | 10-50 MB |
| 18 | presentation_logs | 10,000-100,000 | 20-100 MB |
| 19 | ai_processing_logs | 50,000-500,000 | 500 MB - 2 GB |
| 20 | duplicate_checks | 1,000-10,000 | 5-50 MB |

**Toplam Tahmini:** 1-5 GB (1 yıl sonunda)

---

## Appendix B: Version History

| Versiyon | Tarih | Değişiklikler |
|----------|-------|---------------|
| 1.0 | 2025-12-12 | İlk taslak |

---

*Bu doküman Real Estate CRM & Matching Platform için PostgreSQL veritabanı mimarisini tanımlar. Sorular ve güncellemeler için geliştirme ekibiyle iletişime geçin.*
