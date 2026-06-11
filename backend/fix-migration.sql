-- Failed migration ni Supabase da resolve qilish uchun SQL
-- Supabase Dashboard → SQL Editor ga kiring va bu script ni ishga tushiring

-- 1. Failed migration recordni o'chirish
DELETE FROM "_prisma_migrations" 
WHERE migration_name = '20260513180000_speaking_analysis_fields' 
AND finished_at IS NULL;

-- 2. Migration muvaffaqiyatli bajarilgan deb belgilash
-- (Agar jadvallar allaqachon mavjud bo'lsa)
INSERT INTO "_prisma_migrations" (
    id,
    checksum,
    finished_at,
    migration_name,
    logs,
    rolled_back_at,
    started_at,
    applied_steps_count
) VALUES (
    gen_random_uuid(),
    'migration_checksum_here',
    NOW(),
    '20260513180000_speaking_analysis_fields',
    NULL,
    NULL,
    NOW(),
    1
) ON CONFLICT DO NOTHING;

-- 3. Migration tableni tekshirish
SELECT * FROM "_prisma_migrations" ORDER BY started_at DESC;
