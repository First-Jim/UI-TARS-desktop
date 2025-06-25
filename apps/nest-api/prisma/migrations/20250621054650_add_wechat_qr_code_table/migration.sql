-- CreateTable
CREATE TABLE "WechatQrCode" (
    "id" TEXT NOT NULL,
    "sceneValue" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "userInfo" JSONB,
    "tokens" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scannedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WechatQrCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WechatQrCode_sceneValue_key" ON "WechatQrCode"("sceneValue");

-- CreateIndex
CREATE INDEX "WechatQrCode_sceneValue_idx" ON "WechatQrCode"("sceneValue");

-- CreateIndex
CREATE INDEX "WechatQrCode_expiresAt_idx" ON "WechatQrCode"("expiresAt");
