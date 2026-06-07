-- AlterTable
ALTER TABLE "documents" ADD COLUMN     "document_id" UUID,
ADD COLUMN     "user_id" UUID;

-- CreateTable
CREATE TABLE "user_documents" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "user_id" UUID NOT NULL,
    "filename" TEXT NOT NULL,
    "file_size" BIGINT,
    "mime_type" TEXT,
    "storage_path" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "error_message" TEXT,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_documents_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_documents_user_id_idx" ON "user_documents"("user_id");

-- CreateIndex
CREATE INDEX "user_documents_user_id_status_idx" ON "user_documents"("user_id", "status");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "documents_document_id_idx" ON "documents"("document_id");

-- CreateIndex
CREATE INDEX "documents_user_id_document_id_idx" ON "documents"("user_id", "document_id");

-- AddForeignKey
ALTER TABLE "documents" ADD CONSTRAINT "documents_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "user_documents"("id") ON DELETE CASCADE ON UPDATE CASCADE;
