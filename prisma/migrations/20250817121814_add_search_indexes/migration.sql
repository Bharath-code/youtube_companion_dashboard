-- CreateIndex
CREATE INDEX "notes_content_idx" ON "notes"("content");

-- CreateIndex
CREATE INDEX "notes_tags_idx" ON "notes"("tags");

-- CreateIndex
CREATE INDEX "notes_userId_videoId_idx" ON "notes"("userId", "videoId");

-- CreateIndex
CREATE INDEX "notes_userId_createdAt_idx" ON "notes"("userId", "createdAt");
