# Vercel Frontend - Render Backend ga Ulash

## Hozirgi Holat

Frontend: **Vercel** (https://cefr-six.vercel.app)
Backend: Railway emas, **Render.com** ga o'tkazmoqdamiz

## Vercel Environment Variable Yangilash

### Qadam 1: Render Backend Deploy
1. Avval Render.com da backend ni to'liq deploy qiling (RENDER_DEPLOY.md ga qarang)
2. Backend muvaffaqiyatli deploy bo'lgandan keyin URL ni oling:
   ```
   https://mock-cefr-backend.onrender.com
   ```

### Qadam 2: Vercel Dashboard
1. [Vercel Dashboard](https://vercel.com/dashboard) ga kiring
2. `cefr` proyektini oching
3. **Settings** tabiga o'ting
4. **Environment Variables** bo'limini oching

### Qadam 3: Environment Variable Update
1. `NEXT_PUBLIC_API_URL` ni toping
2. **Edit** tugmasini bosing
3. Qiymatni yangilang:
   ```
   https://mock-cefr-backend.onrender.com
   ```
4. **Save** tugmasini bosing

### Qadam 4: Redeploy
1. **Deployments** tabiga o'ting
2. Eng oxirgi deployment ni toping
3. **...** (three dots) menu ni oching
4. **Redeploy** ni bosing
5. ✅ **Use existing Build Cache** ni belgilang (tezroq)

### Qadam 5: Verify
Deploy tugagandan keyin tekshiring:
```
https://cefr-six.vercel.app
```

Browser Developer Tools → Network tabida API requestlar Render backend ga borayotganligini ko'ring.

---

## vercel.json ni Yangilash

`vercel.json` fayldan hardcoded Railway URL olib tashlandi:

**Oldingi:**
```json
{
  "env": {
    "NEXT_PUBLIC_API_URL": "https://cefr-production-e7c9.up.railway.app"
  }
}
```

**Yangi:**
```json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next"
}
```

Endi environment variable faqat Vercel Dashboard dan boshqariladi (best practice).

---

## Git Push va Auto-Deploy

```bash
git add .
git commit -m "Update Vercel config for Render backend"
git push origin main
```

Vercel avtomatik ravishda yangi versiyani deploy qiladi, lekin environment variable yangilanmaguncha eski Railway URL ishlatadi.

**MUHIM:** Yuqoridagi Qadam 3 da Vercel Dashboard da `NEXT_PUBLIC_API_URL` ni o'zgartirmasangiz, frontend hali ham Railway ga ulanadi!

---

## Alternatif: Render da Frontend Ham Deploy

Agar Vercel dan butunlay voz kechmoqchi bo'lsangiz:

1. `render.yaml` da allaqachon frontend service sozlangan
2. Render Blueprint deploy qilganingizda ham backend, ham frontend deploy bo'ladi
3. Vercel proyektini Delete qiling (ixtiyoriy)

**Afzalliklari:**
- Bir joyda boshqarish (Render)
- Backend va Frontend bir region da (Latency kamayadi)

**Kamchiliklari:**
- Vercel CDN global cache yo'q
- Vercel Edge Functions yo'q

---

## Tavsiya

**Development uchun:** Vercel (bepul, tez, CDN)
**Production uchun:** Render frontend ham (to'liq control, bir joyda)

---

## Troubleshooting

### Frontend backend ga ulana olmayapti

1. **CORS Error:**
   - Render backend `.env` da:
     ```
     FRONTEND_URL=https://cefr-six.vercel.app
     ```
   - Backend kodida CORS sozlamalari to'g'riligini tekshiring

2. **Network Error:**
   - Browser console da error ni ko'ring
   - Render backend `/health` endpoint ishlayotganini tekshiring:
     ```
     https://mock-cefr-backend.onrender.com/health
     ```

3. **Environment Variable Yangilanmadi:**
   - Vercel → Settings → Environment Variables tekshiring
   - Redeploy qilganingizdan ishonch hosil qiling

---

## Muvaffaqiyatli Setup! ✅

Agar hamma qadamlar to'g'ri bajarilsa:

- ✅ Frontend: Vercel (https://cefr-six.vercel.app)
- ✅ Backend: Render (https://mock-cefr-backend.onrender.com)
- ✅ Database: Supabase PostgreSQL
- ✅ Storage: Supabase Storage
- ✅ AI: Groq API

---

**Omad! 🚀**

<function_calls>
<invoke name="str_replace">
<parameter name="path">c:\Users\ANUBIS PC\Desktop\mock\frontend\vercel.json