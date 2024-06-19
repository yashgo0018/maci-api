-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "secretKey" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_secretKey_key" ON "User"("secretKey");
