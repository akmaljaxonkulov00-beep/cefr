# Windsurf Deploy Prompt — Mock CEFR/IELTS (Render + Vercel + Supabase)

---

## PROMPT (Windsurfga copy-paste qiling):

---

Sen tajribali DevOps muhandisisisan. Mening loyihamni production'ga to'liq deploy qilishimga yordam ber. Har bir qadamni aniq ko'rsat va terminalda ishlatish kerak bo'lgan komandalarni ham yoz.

## Loyiha tuzilishi

```
mock/
├── backend/        ← NestJS 10, Prisma, PostgreSQL
├── frontend/       ← Next.js 14, TypeScript, Tailwind
├── render.yaml     ← Render config (tayyor)
└── DEPLOY.md
```

## Deploy arxitekturasi

| Qism     | Platform          |
|----------|-------------------|
| Frontend | Vercel (bepul)    |
| Backend  | Render (bepul)    |
| Database | Supabase (bepul)  |
| Storage  | Supabase Storage  |

---

## QADAM 1 — GitHub'ga yuklash

Avval loyihani GitHub'ga yuklashim kerak. Quyidagi komandalarni terminalda ishlatishimga yordam ber:

```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/USERNAME/REPONAME.git
git push -u origin main
```

GitHub'da yangi repo ochish uchun: https://github.com/new

---

## QADAM 2 — Supabase sozlash

1. https://supabase.com → New Project och
2. Settings → Database → Connection String → copy qil (bu DATABASE_URL bo'ladi)
3. Storage → New Bucket → nom: `mock-files` → Public: ON
4. Settings → API → copy qil:
   - Project URL → bu SUPABASE_URL
   - anon public key → bu SUPABASE_ANON_KEY
   - service_role key → bu SUPABASE_SERVICE_KEY

---

## QADAM 3 — Backend → Render deploy

1. https://render.com → New → Web Service
2. GitHub repo'ni ulash
3. Quyidagi sozlamalarni kiritish:

   - **Name**: mock-cefr-backend
   - **Root Directory**: backend
   - **Runtime**: Docker
   - **Dockerfile Path**: ./Dockerfile
   - **Plan**: Free

4. Environment Variables qo'shish (Add Environment Variable):

```
DATABASE_URL        = [Supabase connection string]
JWT_SECRET          = [kamida 32 ta belgili random string, masalan: openssl rand -hex 32]
GROQ_API_KEY        = [https://console.groq.com dan olish]
SUPABASE_URL        = [Supabase project URL]
SUPABASE_ANON_KEY   = [Supabase anon key]
SUPABASE_SERVICE_KEY= [Supabase service key]
FRONTEND_URL        = [keyinroq Vercel URL bilan to'ldiriladi]
PORT                = 4000
```

5. "Create Web Service" bosish → deploy boshlanadi (~3-5 daqiqa)
6. Deploy tugagach backend URL olish: `https://mock-cefr-backend.onrender.com`

7. Database migration ishlatish — Render dashboard → Shell tab:
```bash
npx prisma db push
```

---

## QADAM 4 — Frontend → Vercel deploy

1. https://vercel.com → New Project → Import GitHub repo
2. Sozlamalar:
   - **Root Directory**: frontend
   - **Framework**: Next.js (avtomatik aniqlanadi)
   - **Build Command**: npm run build
   - **Output Directory**: .next

3. Environment Variable qo'shish:
```
NEXT_PUBLIC_API_URL = https://mock-cefr-backend.onrender.com
```

4. "Deploy" bosish → (~2-3 daqiqa)
5. Vercel URL olish: `https://mock-cefr-frontend.vercel.app`

---

## QADAM 5 — CORS ulash (oxirgi qadam)

Render dashboard → mock-cefr-backend → Environment:
```
FRONTEND_URL = https://mock-cefr-frontend.vercel.app
```
"Save Changes" → avtomatik redeploy bo'ladi.

---

## QADAM 6 — Tekshirish

Quyidagilarni tekshir:

1. Backend ishlayaptimi:
```
https://mock-cefr-backend.onrender.com/api/auth/login
```
→ `{"message":"...","statusCode":...}` javob kelishi kerak (404 yoki 400 bo'lsa ham ishlayapti)

2. Frontend ochilayaptimi:
```
https://mock-cefr-frontend.vercel.app
```
→ Bosh sahifa ko'rinishi kerak

3. Login qilish → dashboard ochilishi kerak
4. Browser Console'da CORS xatosi yo'qligi

---

## Muhim texnik ma'lumotlar (o'zgartirma)

- Backend port: `4000` (main.ts va Dockerfile mos)
- Global prefix: `/api` — barcha endpointlar `/api/...`
- CORS: `main.ts` da `FRONTEND_URL` env'dan o'qiladi
- Auth: JWT, localStorage'da saqlanadi
- File storage: Supabase Storage (local uploads emas)
- `render.yaml` root papkada tayyor — Render avtomatik o'qiydi

---

Har bir qadamda menga natijani ko'rsat va xato bo'lsa tuzat. Boshlaylik!
