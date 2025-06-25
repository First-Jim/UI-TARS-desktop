/*
  Warnings:

  - A unique constraint covering the columns `[wechatOpenId]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[wechatUnionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "wechatCity" TEXT,
ADD COLUMN     "wechatCountry" TEXT,
ADD COLUMN     "wechatGroupId" INTEGER,
ADD COLUMN     "wechatHeadImgUrl" TEXT,
ADD COLUMN     "wechatLanguage" TEXT,
ADD COLUMN     "wechatNickname" TEXT,
ADD COLUMN     "wechatOpenId" TEXT,
ADD COLUMN     "wechatProvince" TEXT,
ADD COLUMN     "wechatQrScene" TEXT,
ADD COLUMN     "wechatQrSceneStr" TEXT,
ADD COLUMN     "wechatRemark" TEXT,
ADD COLUMN     "wechatSubscribeScene" TEXT,
ADD COLUMN     "wechatSubscribeTime" TIMESTAMP(3),
ADD COLUMN     "wechatSubscribed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "wechatTagIds" TEXT,
ADD COLUMN     "wechatUnionId" TEXT,
ALTER COLUMN "email" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatOpenId_key" ON "User"("wechatOpenId");

-- CreateIndex
CREATE UNIQUE INDEX "User_wechatUnionId_key" ON "User"("wechatUnionId");

-- CreateIndex
CREATE INDEX "User_wechatOpenId_idx" ON "User"("wechatOpenId");

-- CreateIndex
CREATE INDEX "User_wechatUnionId_idx" ON "User"("wechatUnionId");
