# Windsurf AI Agent uchun Loyiha Yo'riqnomasi

## Loyiha Haqida

Bu **AI Mock Exam Platform** - CEFR va IELTS imtihonlari uchun sun'iy intellekt asosidagi mock test tizimi.

### Tech Stack:
- **Backend:** NestJS 10 + Prisma 5 + PostgreSQL (Supabase)
- **Frontend:** Next.js 14 + Tailwind CSS + Zustand
- **AI:** Groq API (Llama 3.3-70b, Whisper v3)
- **Storage:** Supabase Storage
- **Auth:** JWT

---

## 📋 Windsurf uchun Asosiy Promptlar

### 1. Loyihani O'rganish

```
Bu loyihani to'liq tahlil qilib ber:
1. Backend arxitekturasini tushuntir (NestJS modullari, servislari)
2. Frontend strukturasini ko'rsating (App Router, pages, components)
3. Database schema ni Prisma dan o'qib tushuntir
4. API endpointlari ro'yxatini chiqar
5. Asosiy features va funksiyalarni sanab ber
```

### 2. Bug Fix

```
[Xato tavsifini yozing] muammosini hal qil:
1. Xatolik joyini aniqlash uchun tegishli fayllarni o'qi
2. Root cause ni topib tushuntir
3. Fix ni amalga oshir
4. Testing strategiyasini taklif qil
```

### 3. Yangi Feature Qo'shish

```
[Feature nomi] ni quyidagi talablarga ko'ra implement qil:
- [Talab 1]
- [Talab 2]

Backend:
1. Prisma schema yangilash (agar kerak bo'lsa)
2. DTO yaratish
3. Service logic yozish
4. Controller endpoint yaratish

Frontend:
1. API client yozish
2. Component yaratish
3. State management (Zustand)
4. UI/UX styling (Tailwind)
```

### 4. Database Migration

```
Prisma schema ga [o'zgarish tavsifi] qo'sh:
1. schema.prisma ni yangilab ber
2. Migration yaratish command ini ko'rsat
3. Seed datani update qil (agar kerak bo'lsa)
```

### 5. API Endpoint Yaratish

```
[HTTP Method] [Endpoint path] yaratish:
- Request body: [...]
- Response: [...]
- Auth: [required/optional]
- Validation: [rules]

NestJS best practices ga rioya qilib implement qil
```

### 6. Performance Optimization

```
Loyihaning performance muammolarini topib optimize qil:
1. Database query optimization (Prisma)
2. Frontend bundle size kamayishi
3. API response time yaxshilash
4. Caching strategiyasi taklif qil
```

### 7. Security Audit

```
Security zaifliklarini aniqlash:
1. Auth & Authorization tekshir
2. Input validation va sanitization
3. SQL injection, XSS himoyasi
4. Environment variables xavfsizligi
5. Rate limiting va brute force himoyasi
```

### 8. Code Refactoring

```
[Fayl/modul nomi] ni refactor qil:
1. Code smell va anti-pattern larni topish
2. Clean code principles qo'llash
3. DRY, SOLID printsiplar
4. TypeScript type safety yaxshilash
```

### 9. Testing

```
[Component/Service] uchun testlar yoz:
- Unit tests
- Integration tests
- E2E tests (agar kerak bo'lsa)

Jest/Vitest ishlatib best practices ga rioya qil
```

### 10. Deployment Issue

```
Render.com deployment muammosini hal qil:
1. Loglarni tahlil qil
2. Muammoni diagnose qil
3. Fix implement qil
4. Deployment checklist yaratib ber
```

---

## 🎯 Loyiha Specific Promptlari

### CEFR/IELTS Features

```
CEFR/IELTS mock exam uchun [feature] ni implement qil:
- Reading section
- Listening section
- Writing section
- Speaking section (AI analysis)

AI integration (Groq API) bilan bog'lab ber
```

### AI Speaking Analysis

```
Speaking analysis funksiyasini yaxshila:
1. Groq Whisper STT integratsiyasi
2. Pronunciation scoring
3. Fluency analysis
4. Grammar accuracy
5. Real-time feedback generation
```

### Analytics Dashboard

```
Analytics dashboard yaratish:
1. Student performance metrics
2. Exam statistics
3. Progress tracking
4. Recharts bilan data visualization
```

### Payment Integration

```
Manual payment system ni implement qil:
1. Payment request submission
2. Admin verification
3. Payment status tracking
4. Mock access control
```

---

## 📁 Muhim Fayllar va Ularning Maqsadi

### Backend
- `src/app.module.ts` - Root module
- `src/auth/` - Authentication system
- `src/ielts/` - IELTS exam logic
- `src/cefr/` - CEFR exam logic
- `src/ai/` - AI service (Groq integration)
- `src/analytics/` - Analytics service
- `prisma/schema.prisma` - Database schema
- `Dockerfile` - Production build config
- `start.sh` - Deployment startup script

### Frontend
- `src/app/` - Next.js App Router pages
- `src/components/` - Reusable components
- `src/lib/api.ts` - API client
- `src/store/` - Zustand state management

### Deployment
- `render.yaml` - Render.com configuration
- `RENDER_DEPLOY.md` - Deployment guide
- `deploy-to-render.bat/.sh` - Automated deploy scripts

---

## 🔧 Development Commands

### Backend
```bash
cd backend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run prisma:migrate # Run migrations
npm run seed         # Seed database
```

### Frontend
```bash
cd frontend
npm install
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Linting
```

---

## 🚨 Keng Tarqalgan Muammolar va Yechimlar

### 1. Module Dependency Error
```
NestJS da module import qilishni unutmaslik:
- Service ni provider ga qo'shing
- Module ni imports array ga qo'shing
```

### 2. Prisma Client Error
```
npx prisma generate
npm run build
```

### 3. CORS Error
```
Backend .env da FRONTEND_URL ni to'g'ri sozlang
```

### 4. Failed Migration
```
fix-migration.sql scriptini Supabase da ishga tushiring
```

---

## 💡 Best Practices

1. **Har doim type-safe kod yozing** (TypeScript)
2. **DTO validation** (class-validator)
3. **Error handling** (try-catch, proper error messages)
4. **Logging** (console.log emas, proper logger)
5. **Environment variables** (.env fayldan o'qish)
6. **Git commits** (meaningful commit messages)
7. **Code review** (PR yaratishdan oldin self-review)

---

## 🤖 Windsurf Agent Setup

Windsurf da loyihani ochganingizda:

1. **Project context o'rganish:**
   ```
   Ushbu loyihani to'liq o'rganing va arxitekturasini tushuntirib bering
   ```

2. **Specific task:** 
   Yuqoridagi promptlardan birini tanlang va task tavsifini kiriting

3. **Continuous work:**
   Windsurf agent avtomatik ravishda:
   - Kerakli fayllarni o'qiydi
   - Code yozadi
   - Test qiladi
   - Git commit qiladi (sizning roziligingiz bilan)

---

## 📞 Yordam Kerak Bo'lsa

Agar Windsurf agent task ni to'liq bajara olmasa:

1. Task ni kichikroq qismlarga bo'ling
2. Contextni aniqroq bering (qaysi fayllar, qaysi funksiyalar)
3. Expected output ni ko'rsating
4. Error loglarini to'liq sharing qiling

---

**Good luck with Windsurf AI! 🚀**
