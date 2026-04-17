-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN');

-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'DELETED');

-- CreateEnum
CREATE TYPE "AuthProviderType" AS ENUM ('EMAIL', 'PHONE', 'GOOGLE');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('ACTIVE', 'CANCELED', 'EXPIRED', 'TRIAL');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "full_name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "google_id" TEXT,
    "password_hash" TEXT,
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
    "avatar" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_auth_providers" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "provider_type" "AuthProviderType" NOT NULL,
    "provider_uid" TEXT NOT NULL,
    "meta_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_auth_providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clients" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "comment" TEXT,
    "company_name" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "client_id" UUID,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProjectStatus" NOT NULL DEFAULT 'DRAFT',
    "preview_image" TEXT,
    "project_format_version" INTEGER NOT NULL DEFAULT 1,
    "saved_view_mode" TEXT,
    "saved_camera_state_json" JSONB,
    "saved_ui_state_json" JSONB,
    "total_cost_cached" DECIMAL(14,2),
    "total_material_cost_cached" DECIMAL(14,2),
    "total_hardware_cost_cached" DECIMAL(14,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_opened_at" TIMESTAMP(3),

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_versions" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "version_number" INTEGER NOT NULL,
    "snapshot_json" JSONB NOT NULL,
    "internal_binary_path" TEXT,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thickness_mm" INTEGER NOT NULL,
    "sheet_width_mm" INTEGER NOT NULL,
    "sheet_height_mm" INTEGER NOT NULL,
    "price_per_sheet" DECIMAL(12,2) NOT NULL,
    "price_per_m2" DECIMAL(12,2),
    "density" DECIMAL(10,3),
    "default_texture_id" UUID,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "textures" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "preview_image" TEXT NOT NULL,
    "texture_path" TEXT NOT NULL,
    "normal_map_path" TEXT,
    "roughness_map_path" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "textures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_types" (
    "id" UUID NOT NULL,
    "category" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subtype" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "meta_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hardware_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hardware_presets" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "config_json" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "hardware_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "item_type" TEXT NOT NULL,
    "parent_id" UUID,
    "material_id" UUID,
    "texture_id" UUID,
    "hardware_preset_id" UUID,
    "geometry_json" JSONB NOT NULL,
    "transform_json" JSONB NOT NULL,
    "dimension_json" JSONB NOT NULL,
    "style_json" JSONB,
    "rules_json" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_calculations" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "materials_json" JSONB NOT NULL,
    "hardware_json" JSONB NOT NULL,
    "edging_json" JSONB NOT NULL,
    "cutting_json" JSONB NOT NULL,
    "warnings_json" JSONB NOT NULL,
    "extra_costs_json" JSONB NOT NULL,
    "totals_json" JSONB NOT NULL,
    "calculated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_calculations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extra_cost_items" (
    "id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "amount" DECIMAL(14,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "comment" TEXT,

    CONSTRAINT "extra_cost_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tariffs" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "monthly_price" DECIMAL(12,2) NOT NULL,
    "yearly_price" DECIMAL(12,2),
    "max_projects" INTEGER,
    "max_render_per_month" INTEGER,
    "max_export_per_month" INTEGER,
    "features_json" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "tariffs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "tariff_id" UUID NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ended_at" TIMESTAMP(3),
    "meta_json" JSONB,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_settings" (
    "id" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value_json" JSONB NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "system_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE INDEX "users_role_idx" ON "users"("role");

-- CreateIndex
CREATE INDEX "users_status_idx" ON "users"("status");

-- CreateIndex
CREATE INDEX "user_auth_providers_user_id_idx" ON "user_auth_providers"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_auth_providers_provider_type_provider_uid_key" ON "user_auth_providers"("provider_type", "provider_uid");

-- CreateIndex
CREATE INDEX "clients_user_id_idx" ON "clients"("user_id");

-- CreateIndex
CREATE INDEX "clients_company_name_idx" ON "clients"("company_name");

-- CreateIndex
CREATE INDEX "projects_user_id_idx" ON "projects"("user_id");

-- CreateIndex
CREATE INDEX "projects_client_id_idx" ON "projects"("client_id");

-- CreateIndex
CREATE INDEX "projects_status_idx" ON "projects"("status");

-- CreateIndex
CREATE INDEX "projects_updated_at_idx" ON "projects"("updated_at");

-- CreateIndex
CREATE INDEX "project_versions_project_id_idx" ON "project_versions"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "project_versions_project_id_version_number_key" ON "project_versions"("project_id", "version_number");

-- CreateIndex
CREATE INDEX "materials_category_idx" ON "materials"("category");

-- CreateIndex
CREATE INDEX "materials_is_active_idx" ON "materials"("is_active");

-- CreateIndex
CREATE INDEX "textures_is_active_idx" ON "textures"("is_active");

-- CreateIndex
CREATE INDEX "hardware_types_category_idx" ON "hardware_types"("category");

-- CreateIndex
CREATE INDEX "hardware_types_is_active_idx" ON "hardware_types"("is_active");

-- CreateIndex
CREATE INDEX "hardware_presets_category_idx" ON "hardware_presets"("category");

-- CreateIndex
CREATE INDEX "hardware_presets_is_active_idx" ON "hardware_presets"("is_active");

-- CreateIndex
CREATE INDEX "project_items_project_id_idx" ON "project_items"("project_id");

-- CreateIndex
CREATE INDEX "project_items_parent_id_idx" ON "project_items"("parent_id");

-- CreateIndex
CREATE INDEX "project_items_item_type_idx" ON "project_items"("item_type");

-- CreateIndex
CREATE INDEX "project_calculations_project_id_idx" ON "project_calculations"("project_id");

-- CreateIndex
CREATE INDEX "project_calculations_calculated_at_idx" ON "project_calculations"("calculated_at");

-- CreateIndex
CREATE INDEX "extra_cost_items_project_id_idx" ON "extra_cost_items"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "tariffs_code_key" ON "tariffs"("code");

-- CreateIndex
CREATE INDEX "tariffs_is_active_idx" ON "tariffs"("is_active");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "subscriptions_tariff_id_idx" ON "subscriptions"("tariff_id");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE UNIQUE INDEX "system_settings_key_key" ON "system_settings"("key");

-- AddForeignKey
ALTER TABLE "user_auth_providers" ADD CONSTRAINT "user_auth_providers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_versions" ADD CONSTRAINT "project_versions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_default_texture_id_fkey" FOREIGN KEY ("default_texture_id") REFERENCES "textures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "project_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_texture_id_fkey" FOREIGN KEY ("texture_id") REFERENCES "textures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_items" ADD CONSTRAINT "project_items_hardware_preset_id_fkey" FOREIGN KEY ("hardware_preset_id") REFERENCES "hardware_presets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_calculations" ADD CONSTRAINT "project_calculations_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extra_cost_items" ADD CONSTRAINT "extra_cost_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_tariff_id_fkey" FOREIGN KEY ("tariff_id") REFERENCES "tariffs"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
┌─────────────────────────────────────────────────────────┐
│  Update available 6.19.3 -> 7.7.0                       │
│                                                         │
│  This is a major update - please follow the guide at    │
│  https://pris.ly/d/major-version-upgrade                │
│                                                         │
│  Run the following to update                            │
│    npm i --save-dev prisma@latest                       │
│    npm i @prisma/client@latest                          │
└─────────────────────────────────────────────────────────┘

