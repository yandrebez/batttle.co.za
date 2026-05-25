-- CreateTable
CREATE TABLE "Product" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "image" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- Seed initial products
INSERT INTO "Product" ("id", "name", "description", "price", "image", "isActive", "createdAt", "updatedAt")
VALUES
    (1, 'Battle Headset X1', 'Lightweight headset with clear sound and deep bass.', 79.99, '/next.svg', true, NOW(), NOW()),
    (2, 'Pro Mouse M5', 'Fast response mouse with adjustable DPI presets.', 49.99, '/window.svg', true, NOW(), NOW()),
    (3, 'Mechanical Keyboard K2', 'Tactile switches and compact layout for daily use.', 99.99, '/globe.svg', true, NOW(), NOW()),
    (4, 'Battle Desk Mat', 'Wide smooth-surface desk mat with anti-slip base.', 24.99, '/file.svg', true, NOW(), NOW())
ON CONFLICT DO NOTHING;

SELECT setval(pg_get_serial_sequence('"Product"', 'id'), COALESCE((SELECT MAX("id") FROM "Product"), 1), true);
