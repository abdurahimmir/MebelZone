-- CreateEnum
CREATE TYPE "BackgroundJobKind" AS ENUM ('EXPORT_JSON', 'EXPORT_PDF', 'EXPORT_DXF', 'EXPORT_INTERNAL', 'RENDER_PREVIEW');

-- CreateEnum
CREATE TYPE "BackgroundJobStatus" AS ENUM ('PENDING', 'ACTIVE', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "background_jobs" (
    "id" UUID NOT NULL,
    "kind" "BackgroundJobKind" NOT NULL,
    "status" "BackgroundJobStatus" NOT NULL DEFAULT 'PENDING',
    "user_id" UUID NOT NULL,
    "project_id" UUID NOT NULL,
    "payload_json" JSONB,
    "result_key" TEXT,
    "mime_type" TEXT,
    "byte_size" INTEGER,
    "error" TEXT,
    "bull_job_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "background_jobs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "background_jobs_user_id_idx" ON "background_jobs"("user_id");

-- CreateIndex
CREATE INDEX "background_jobs_project_id_idx" ON "background_jobs"("project_id");

-- CreateIndex
CREATE INDEX "background_jobs_status_idx" ON "background_jobs"("status");

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "background_jobs" ADD CONSTRAINT "background_jobs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
