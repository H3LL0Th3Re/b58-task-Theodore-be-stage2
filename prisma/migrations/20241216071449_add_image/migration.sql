-- AlterTable
ALTER TABLE "Thread" ADD COLUMN     "image" TEXT,
ADD COLUMN     "isDeleted" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Users" ADD COLUMN     "isDeleted" INTEGER NOT NULL DEFAULT 0;
