-- CreateTable
CREATE TABLE "WordLookup" (
    "id" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WordLookup_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WordLookup_term_key" ON "WordLookup"("term");
