# Render.com ga Deploy Qilish Bo'yicha To'liq Yo'riqnoma

## 1. Render.com da Akkaunt Yaratish

1. [Render.com](https://render.com) saytiga kiring
2. **Sign Up** tugmasini bosing
3. GitHub akkauntingiz bilan ro'yxatdan o'ting

## 2. GitHub Repository ga Push Qilish

```bash
# Barcha o'zgarishlarni commit qiling
git add .
git commit -m "Configure for Render deployment"

# GitHub ga push qiling
git push origin main
```

## 3. Render Dashboard da Sozlash

### A. Backend (NestJS API) ni Deploy Qilish

1. Render Dashboard ga kiring: https://dashboard.render.com
2. **New +** tugmasini bosing va **Blueprint** ni tanlang
3. GitHub repository ni ulang
4. `render.yaml` fayl avtomatik topiladi va tasdiqlang
5. **Environment Variables** bo'limida quyidagilarni qo'shing:

#### Majburiy Environment Variables:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-key-minimum-32-characters-long
GROQ_API_KEY=gsk_your-groq-api-key-here
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
```

#### Environment Variables olish yo'llari:

**DATABASE_URL (Supabase):**
- Supabase Dashboard → Settings → Database → Connection string
- **Connection pooling** ni tanlang (Render uchun zarur)
- Format: `postgresql://postgres.[ref]:[password]@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`

**JWT_SECRET:**
- O'zingiz yarating (minimum 32 belgi)
- Node.js orqali: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

**GROQ_API_KEY:**
- https://console.groq.com → API Keys → Create API Key

**SUPABASE Keys:**
- Supabase Dashboard → Settings → API
- `SUPABASE_URL`: Project URL
- `SUPABASE_ANON_KEY`: anon/public key
- `SUPABASE_SERVICE_KEY`: service_role key (secret)

6. **Apply** tugmasini bosing

### B. Frontend (Next.js) ni Deploy Qilish

Frontend allaqachon `render.yaml` da sozlangan va avtomatik deploy bo'ladi.

**MUHIM:** Backend deploy bo'lgandan keyin, backend URL ni frontend environment variable ga qo'shish kerak:

1. Backend service deployed bo'lgandan keyin URL ni ko'chirib oling (masalan: `https://mock-cefr-backend.onrender.com`)
2. Frontend service → Environment → Edit
3. `NEXT_PUBLIC_API_URL` ni backend URL ga o'zgartiring

## 4. Deployment Monitoring

1. **Logs** tab orqali deploy jarayonini kuzating
2. Build muvaffaqiyatli yakunlanganidan keyin:
   - Backend: `https://mock-cefr-backend.onrender.com/health`
   - Frontend: `https://mock-cefr-frontend.onrender.com`

## 5. Supabase Storage Sozlash

Agar audio fayllar upload qilinsa, Supabase Storage bucket yarating:

1. Supabase Dashboard → Storage → Create Bucket
2. Bucket nomi: `audio`
3. Public access: **disabled** (secure)
4. RLS Policies qo'shing:
   ```sql
   -- Authenticated users upload qilishi mumkin
   CREATE POLICY "Authenticated users can upload audio"
   ON storage.objects FOR INSERT
   TO authenticated
   WITH CHECK (bucket_id = 'audio');

   -- Authenticated users o'z fayllarini ko'rishi mumkin
   CREATE POLICY "Users can view own audio"
   ON storage.objects FOR SELECT
   TO authenticated
   USING (bucket_id = 'audio');
   ```

## 6. CORS Sozlash

Frontend URL ni backendda CORS uchun sozlang. Backend environment variables da:

```env
FRONTEND_URL=https://mock-cefr-frontend.onrender.com
```

## 7. Database Migration

Render avtomatik migration ishga tushiradi `start.sh` orqali:
- Failed migration resolve qilinadi
- `prisma migrate deploy` ishga tushadi
- Agar xato bo'lsa `prisma db push` ishlaydi

## 8. Troubleshooting

### Backend ishga tushmayapti:

```bash
# Render logs ni tekshiring
# Dashboard → Service → Logs tab
```

**Keng tarqalgan muammolar:**

1. **Module not found error:**
   - `package.json` da `"main": "dist/src/main.js"` to'g'ri ekanligini tekshiring
   - Build script to'g'ri ishlayotganini tekshiring

2. **Database connection failed:**
   - `DATABASE_URL` to'g'ri va **connection pooling** URL ekanligini tekshiring
   - Supabase da IP allowlist bo'lmasligi kerak (Render IP dynamic)

3. **Failed migration:**
   - Manual ravishda Supabase SQL Editor da migration ni resolve qiling:
   ```sql
   DELETE FROM "_prisma_migrations" 
   WHERE migration_name = '20260513180000_speaking_analysis_fields' 
   AND finished_at IS NULL;
   ```

### Frontend API ga ulana olmayapti:

1. `NEXT_PUBLIC_API_URL` environment variable to'g'ri o'rnatilganligini tekshiring
2. Backend health check ishlayotganini tekshiring
3. CORS sozlamalarini tekshiring

## 9. Custom Domain (Ixtiyoriy)

1. Render Dashboard → Service → Settings → Custom Domain
2. Domain nomini qo'shing
3. DNS providerda CNAME record yarating:
   - Host: `@` yoki `www`
   - Value: `[your-service].onrender.com`

## 10. Auto-Deploy Sozlash

`render.yaml` da `autoDeploy: true` sozlangan, shuning uchun:
- Har safar `main` branchga push qilsangiz
- Render avtomatik yangi versiyani deploy qiladi

## 11. Free Tier Limitlari

Render Free plan:
- **750 soat/oy** runtime (bir service uchun)
- 15 daqiqa inactivity dan keyin spin down bo'ladi
- Cold start: 30-60 soniya

**Yaxshilash:** Starter plan ($7/oy) - 24/7 running, no cold starts

## 12. Monitoring va Alertlar

1. Render Dashboard → Service → Metrics
2. CPU, Memory, Request latency larni kuzating
3. Alertlar sozlash: Settings → Notifications

## Deployment Muvaffaqiyatli Bo'ldi! 🎉

Backend API: `https://mock-cefr-backend.onrender.com`
Frontend: `https://mock-cefr-frontend.onrender.com`

---

## Qo'shimcha Yordam

Render dokumentatsiya: https://docs.render.com
Support: support@render.com
Status: https://status.render.com
