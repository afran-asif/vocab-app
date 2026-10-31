-- AlterTable
ALTER TABLE "DeckWord" ADD COLUMN     "category" TEXT;

-- CreateIndex
CREATE INDEX "DeckWord_deckId_category_idx" ON "DeckWord"("deckId", "category");
