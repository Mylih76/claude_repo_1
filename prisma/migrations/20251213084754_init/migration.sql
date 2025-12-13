-- CreateEnum
CREATE TYPE "ListingType" AS ENUM ('sale', 'rent');

-- CreateEnum
CREATE TYPE "PropertyType" AS ENUM ('apartment', 'villa', 'office', 'land', 'shop', 'warehouse', 'building');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('draft', 'active', 'sold', 'rented', 'inactive');

-- CreateEnum
CREATE TYPE "HeatingType" AS ENUM ('central', 'individual', 'floor', 'ac', 'stove', 'none');

-- CreateEnum
CREATE TYPE "ViewType" AS ENUM ('sea', 'city', 'nature', 'pool', 'garden', 'street', 'none');

-- CreateEnum
CREATE TYPE "EntranceType" AS ENUM ('apartment', 'villa', 'duplex', 'triplex');

-- CreateEnum
CREATE TYPE "MediaType" AS ENUM ('image', 'video', 'document');

-- CreateEnum
CREATE TYPE "ContactSource" AS ENUM ('manual', 'whatsapp', 'website', 'referral');

-- CreateEnum
CREATE TYPE "ContactType" AS ENUM ('buyer', 'seller', 'tenant', 'landlord');

-- CreateEnum
CREATE TYPE "ContactStatus" AS ENUM ('new', 'active', 'inactive', 'converted', 'lost');

-- CreateEnum
CREATE TYPE "SearchRequestSource" AS ENUM ('manual', 'whatsapp', 'form');

-- CreateEnum
CREATE TYPE "SearchRequestStatus" AS ENUM ('active', 'paused', 'fulfilled', 'expired');

-- CreateEnum
CREATE TYPE "MatchType" AS ENUM ('auto', 'manual');

-- CreateEnum
CREATE TYPE "MatchStatus" AS ENUM ('new', 'sent', 'viewed', 'interested', 'rejected');

-- CreateEnum
CREATE TYPE "ActivityType" AS ENUM ('note', 'call', 'meeting', 'showing', 'whatsapp', 'email', 'offer');

-- CreateEnum
CREATE TYPE "ActivityOutcome" AS ENUM ('completed', 'no_answer', 'rescheduled', 'cancelled');

-- CreateEnum
CREATE TYPE "MessageDirection" AS ENUM ('inbound', 'outbound');

-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('text', 'image', 'document', 'location');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('pending', 'sent', 'delivered', 'read', 'failed');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "avatar_url" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listings" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "listing_type" "ListingType" NOT NULL,
    "property_type" "PropertyType" NOT NULL,
    "status" "ListingStatus" NOT NULL DEFAULT 'active',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DECIMAL(15,2) NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'TRY',
    "gross_sqm" INTEGER,
    "net_sqm" INTEGER,
    "room_count" VARCHAR(10),
    "building_age" SMALLINT,
    "floor_number" SMALLINT,
    "total_floors" SMALLINT,
    "is_furnished" BOOLEAN,
    "heating_type" "HeatingType",
    "view_type" "ViewType",
    "entrance_type" "EntranceType",
    "is_in_complex" BOOLEAN DEFAULT false,
    "dues" DECIMAL(10,2),
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "neighborhood" VARCHAR(100),
    "address_detail" TEXT,
    "latitude" DECIMAL(10,8),
    "longitude" DECIMAL(11,8),
    "features" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "listings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listing_media" (
    "id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "media_type" "MediaType" NOT NULL,
    "url" VARCHAR(500) NOT NULL,
    "thumbnail_url" VARCHAR(500),
    "file_name" VARCHAR(255),
    "file_size" INTEGER,
    "sort_order" SMALLINT NOT NULL DEFAULT 0,
    "is_cover" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "listing_media_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contacts" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(20),
    "email" VARCHAR(255),
    "source" "ContactSource" NOT NULL DEFAULT 'manual',
    "contact_type" "ContactType" NOT NULL DEFAULT 'buyer',
    "status" "ContactStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "last_contact_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "search_requests" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "contact_id" UUID,
    "source" "SearchRequestSource" NOT NULL DEFAULT 'manual',
    "status" "SearchRequestStatus" NOT NULL DEFAULT 'active',
    "raw_text" TEXT,
    "listing_type" "ListingType",
    "property_types" JSONB NOT NULL DEFAULT '[]',
    "budget_min" DECIMAL(15,2),
    "budget_max" DECIMAL(15,2),
    "currency" VARCHAR(3) DEFAULT 'TRY',
    "sqm_min" INTEGER,
    "sqm_max" INTEGER,
    "room_count_min" VARCHAR(10),
    "room_count_max" VARCHAR(10),
    "cities" JSONB NOT NULL DEFAULT '[]',
    "districts" JSONB NOT NULL DEFAULT '[]',
    "neighborhoods" JSONB NOT NULL DEFAULT '[]',
    "must_have_features" JSONB NOT NULL DEFAULT '[]',
    "nice_to_have_features" JSONB NOT NULL DEFAULT '[]',
    "criteria" JSONB NOT NULL DEFAULT '{}',
    "notes" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "search_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" UUID NOT NULL,
    "search_request_id" UUID NOT NULL,
    "listing_id" UUID NOT NULL,
    "match_type" "MatchType" NOT NULL DEFAULT 'auto',
    "score" DECIMAL(5,2),
    "score_breakdown" JSONB NOT NULL DEFAULT '{}',
    "status" "MatchStatus" NOT NULL DEFAULT 'new',
    "notes" TEXT,
    "sent_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "activities" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "contact_id" UUID,
    "listing_id" UUID,
    "activity_type" "ActivityType" NOT NULL,
    "title" VARCHAR(255),
    "description" TEXT,
    "outcome" "ActivityOutcome",
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "scheduled_at" TIMESTAMPTZ,
    "completed_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" UUID NOT NULL,
    "contact_id" UUID,
    "user_id" UUID,
    "phone_number" VARCHAR(20) NOT NULL,
    "direction" "MessageDirection" NOT NULL,
    "message_type" "MessageType" NOT NULL DEFAULT 'text',
    "content" TEXT,
    "media_url" VARCHAR(500),
    "status" "MessageStatus" NOT NULL DEFAULT 'pending',
    "error_message" TEXT,
    "external_id" VARCHAR(100),
    "related_listing_ids" JSONB NOT NULL DEFAULT '[]',
    "sent_at" TIMESTAMPTZ,
    "delivered_at" TIMESTAMPTZ,
    "read_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "listings_user_id_idx" ON "listings"("user_id");

-- CreateIndex
CREATE INDEX "listings_status_idx" ON "listings"("status");

-- CreateIndex
CREATE INDEX "listings_listing_type_idx" ON "listings"("listing_type");

-- CreateIndex
CREATE INDEX "listings_city_district_idx" ON "listings"("city", "district");

-- CreateIndex
CREATE INDEX "listings_price_idx" ON "listings"("price");

-- CreateIndex
CREATE INDEX "listings_created_at_idx" ON "listings"("created_at" DESC);

-- CreateIndex
CREATE INDEX "listing_media_listing_id_idx" ON "listing_media"("listing_id");

-- CreateIndex
CREATE INDEX "contacts_user_id_idx" ON "contacts"("user_id");

-- CreateIndex
CREATE INDEX "contacts_status_idx" ON "contacts"("status");

-- CreateIndex
CREATE UNIQUE INDEX "contacts_user_id_phone_key" ON "contacts"("user_id", "phone");

-- CreateIndex
CREATE INDEX "search_requests_user_id_idx" ON "search_requests"("user_id");

-- CreateIndex
CREATE INDEX "search_requests_contact_id_idx" ON "search_requests"("contact_id");

-- CreateIndex
CREATE INDEX "search_requests_status_idx" ON "search_requests"("status");

-- CreateIndex
CREATE INDEX "matches_search_request_id_idx" ON "matches"("search_request_id");

-- CreateIndex
CREATE INDEX "matches_listing_id_idx" ON "matches"("listing_id");

-- CreateIndex
CREATE INDEX "matches_status_idx" ON "matches"("status");

-- CreateIndex
CREATE UNIQUE INDEX "matches_search_request_id_listing_id_key" ON "matches"("search_request_id", "listing_id");

-- CreateIndex
CREATE INDEX "activities_user_id_idx" ON "activities"("user_id");

-- CreateIndex
CREATE INDEX "activities_contact_id_idx" ON "activities"("contact_id");

-- CreateIndex
CREATE INDEX "activities_listing_id_idx" ON "activities"("listing_id");

-- CreateIndex
CREATE INDEX "activities_activity_type_idx" ON "activities"("activity_type");

-- CreateIndex
CREATE INDEX "activities_contact_id_created_at_idx" ON "activities"("contact_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "whatsapp_messages_contact_id_idx" ON "whatsapp_messages"("contact_id");

-- CreateIndex
CREATE INDEX "whatsapp_messages_phone_number_created_at_idx" ON "whatsapp_messages"("phone_number", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "listings" ADD CONSTRAINT "listings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "listing_media" ADD CONSTRAINT "listing_media_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contacts" ADD CONSTRAINT "contacts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_requests" ADD CONSTRAINT "search_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "search_requests" ADD CONSTRAINT "search_requests_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_search_request_id_fkey" FOREIGN KEY ("search_request_id") REFERENCES "search_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "matches" ADD CONSTRAINT "matches_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "activities" ADD CONSTRAINT "activities_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "listings"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_contact_id_fkey" FOREIGN KEY ("contact_id") REFERENCES "contacts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
