-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT,
    "name" TEXT,
    "isAnonymous" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite_locations" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "locationKey" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" CHAR(2) NOT NULL,
    "state" TEXT,
    "lat" DECIMAL(8,5) NOT NULL,
    "lon" DECIMAL(9,5) NOT NULL,
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_locations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "favorite_locations_userId_sortOrder_idx" ON "favorite_locations"("userId", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "favorite_locations_userId_locationKey_key" ON "favorite_locations"("userId", "locationKey");

-- AddForeignKey
ALTER TABLE "favorite_locations" ADD CONSTRAINT "favorite_locations_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
