# ❌ Vercel Frontend Xatolarini Tuzatish

## 🔴 Muammo: Railway Backend Ishlamaydi!

Sizning frontend hali ham eski Railway backend URL ga (`https://cefr-production-e7c9.up.railway.app`) ulanayapti.

**Barcha xatolar:**
- ❌ `GET /api/results/center` - 404 Not Found
- ❌ `GET /api/centers/undefined` - 404 Not Found  
- ❌ `GET /api/admin/settings` - 403 Forbidden
- ❌ `POST /api/uploads/payment-proof` - 502 Bad Gateway + CORS Error
- ❌ `POST /api/manual-payments` - 400 Bad Request
- ❌ `GET /api/question-bank` - 403 Forbidden (multiple)
- ❌ `POST /api/ai-questions/writing` - 500 Internal Server Error
- ❌ `POST /api/ai-questions/speaking` - 500 Internal Server Error
- ❌ Va boshqalar...

**Sabab:** Railway backend o'chirilgan yoki ishlamayapti!

---

## ✅ Yechim: 3 Ta Qadam

### Qadam 1: Render.com da Backend Deploy Qiling (FIRST!)

Backend hozir yo'q! Avval backend ni deploy qilish kerak:

```bash
# QUICK_START.md yoki RENDER_DEPLOY.md ga qarang
```

**MUHIM:** Backend deploy bo'lmaguncha, frontend ishlamaydi!

---

### Qadam 2: Vercel Environment Variable Yangilash

Backend deploy bo'lgach, Vercel da environment variable ni o'zgartiring:

#### 2.1. Vercel Dashboard ga kiring
https://vercel.com/dashboard

#### 2.2. Proyektni oching
- Proyekt: `cefr` yoki `mock-cefr-frontend`
- **Settings** tab

#### 2.3. Environment Variables
- **Environment Variables** bo'lim
- `NEXT_PUBLIC_API_URL` ni toping

#### 2.4. Eski Qiymatni O'chirish
```
❌ Eski: https://cefr-production-e7c9.up.railway.app
```

**Delete** yoki **Edit** qiling

#### 2.5. Yangi Qiymat Qo'shish
```
✅ Yangi: https://mock-cefr-backend.onrender.com
```

**Environment:** Production, Preview, Development (barcha 3 tasini belgilang)

**Save** tugmasini bosing

---

### Qadam 3: Vercel Redeploy

#### 3.1. Deployments Tab
- **Deployments** tabiga o'ting
- Eng oxirgi deployment ni toping

#### 3.2. Redeploy
- **...** (3 nuqta) menu → **Redeploy**
- ✅ **Use existing Build Cache** (tezroq)
- **Redeploy** tugmasini tasdiqlang

#### 3.3. Wait (1-2 daqiqa)
Deploy jarayoni tugashini kuting

---

## 🔍 Tekshirish

### Browser Developer Tools

1. **F12** yoki **Right Click → Inspect**
2. **Console** tab
3. **Network** tab

Xatolar yo'qolishi kerak:
- ✅ `https://mock-cefr-backend.onrender.com/api/...` (to'g'ri URL)
- ✅ 200 OK yoki 201 Created responses
- ❌ Railway URL ko'rinmasligi kerak

---

## 🚨 Agar Hali Ham Xato Bo'lsa

### 1. Environment Variable Tekshirish

Vercel Dashboard da:
```
Settings → Environment Variables → NEXT_PUBLIC_API_URL
```

**To'g'ri qiymat:**
```
https://mock-cefr-backend.onrender.com
```

**Environments:** Production ✅, Preview ✅, Development ✅

### 2. Cache Tozalash

Browser cache:
- **Chrome:** Ctrl+Shift+Delete
- **Hard Reload:** Ctrl+Shift+R yoki Cmd+Shift+R

### 3. Vercel Build Cache

Redeploy qilishda:
- **❌ Use existing Build Cache** ni o'chirish
- To'liq rebuild qilish (5-10 daqiqa)

### 4. Local Test

Local da test qiling:

```bash
cd frontend

# .env.local yaratish
echo "NEXT_PUBLIC_API_URL=https://mock-cefr-backend.onrender.com" > .env.local

# Local build
npm run build
npm start

# Browser: http://localhost:3000
# F12 → Network → API calls tekshiring
```

---

## 📋 Checklist

Backend:
- [ ] Backend Render.com da deploy qilindi
- [ ] Health check ishlayapti: `https://mock-cefr-backend.onrender.com/health`
- [ ] Response: `{"status":"ok","timestamp":"..."}`

Vercel Frontend:
- [ ] Environment variable yangilandi
- [ ] Barcha 3 environment (Production, Preview, Development) uchun
- [ ] Redeploy qilindi
- [ ] Deploy muvaffaqiyatli tugadi

Browser:
- [ ] Cache tozalandi (Ctrl+Shift+R)
- [ ] Network tab da Railway URL yo'q
- [ ] Barcha API requestlar Render URL ga boradi
- [ ] API xatolar yo'qoldi

---

## 💡 Pro Tips

1. **Backend Health Check:**
   ```bash
   curl https://mock-cefr-backend.onrender.com/health
   ```
   
   Expected:
   ```json
   {"status":"ok","timestamp":"2026-06-11T..."}
   ```

2. **Vercel Logs:**
   ```
   Vercel Dashboard → Deployments → Latest → Function Logs
   ```

3. **Render Logs:**
   ```
   Render Dashboard → Service → Logs
   ```

4. **CORS Issues:**
   Agar CORS error bo'lsa, backend `.env` da:
   ```env
   FRONTEND_URL=https://cefr-six.vercel.app
   ```

---

## 🎯 Expected Result

Vercel frontend deploy tugagach:

**Console:** ✅ No errors
**Network:** ✅ All API calls to Render backend
**Application:** ✅ Fully functional

---

## 📞 Hali Ham Yordam Kerak?

1. **Backend logs:** Render Dashboard → Logs
2. **Frontend logs:** Vercel Dashboard → Function Logs  
3. **Browser console:** F12 → Console tab
4. **Network tab:** F12 → Network → filter by XHR

Screenshot sharing bilan yordam bering!

---

**Xulosa:** Railway backend ishlamaydi. Render.com ga backend deploy qiling, keyin Vercel environment variable yangilang va redeploy qiling. Barcha xatolar tuziladi! 🚀
