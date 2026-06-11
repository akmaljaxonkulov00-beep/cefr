# Mock CEFR/IELTS Exam Platform

AI-powered mock exam platform for CEFR and IELTS tests with real-time speaking analysis.

## 🚀 Quick Start

### Local Development

#### Backend (NestJS)
```bash
cd backend
npm install
cp .env.example .env
# .env faylni to'ldiring
npx prisma generate
npx prisma migrate dev
npm run dev
```

#### Frontend (Next.js)
```bash
cd frontend
npm install
cp .env.example .env.local
# NEXT_PUBLIC_API_URL ni o'rnating
npm run dev
```

## 🌐 Production Deployment

### Render.com ga Deploy

1. **Avtomatik deploy:**
   ```bash
   # Windows
   deploy-to-render.bat
   
   # Linux/Mac
   chmod +x deploy-to-render.sh
   ./deploy-to-render.sh
   ```

2. **Manual deploy:**
   - To'liq yo'riqnoma: [RENDER_DEPLOY.md](./RENDER_DEPLOY.md)

### Vercel ga Deploy (Frontend faqat)

Frontend allaqachon Vercel ga deploy qilingan:
- URL: https://cefr-six.vercel.app
- Auto-deploy: `main` branchga har push qilinganda

Backend uchun Render.com yoki Railway.app ishlatiladi.

## 📁 Project Structure

```
mock/
├── backend/              # NestJS API
│   ├── src/
│   │   ├── auth/        # Authentication
│   │   ├── cefr/        # CEFR exams
│   │   ├── ielts/       # IELTS exams
│   │   ├── ai/          # AI services (Groq)
│   │   ├── analytics/   # Analytics
│   │   └── ...
│   ├── prisma/          # Database schema & migrations
│   ├── Dockerfile       # Production build
│   └── start.sh         # Startup script
│
├── frontend/            # Next.js App
│   ├── src/
│   │   ├── app/         # App Router pages
│   │   ├── components/  # React components
│   │   ├── lib/         # Utilities
│   │   └── store/       # Zustand state
│   └── public/          # Static files
│
└── render.yaml          # Render.com config

```

## 🛠️ Tech Stack

### Backend
- **Framework:** NestJS 10
- **Database:** PostgreSQL (Supabase)
- **ORM:** Prisma 5
- **AI:** Groq API (Llama 3.3, Whisper)
- **Storage:** Supabase Storage
- **Auth:** JWT

### Frontend
- **Framework:** Next.js 14 (App Router)
- **State:** Zustand
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Charts:** Recharts
- **HTTP:** Axios

## 🔐 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key-min-32-chars
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
FRONTEND_URL=https://cefr-six.vercel.app
PORT=4000
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

## 📦 Database

### Migrations
```bash
# Development
npm run prisma:migrate

# Production (automatic on deploy)
npm run prisma:deploy
```

### Seed Data
```bash
npm run seed
```

## 🐛 Troubleshooting

### Failed Migration Error

Agar deployment paytida migration error bo'lsa:

1. Supabase SQL Editor ga kiring
2. `fix-migration.sql` faylini ishga tushiring
3. Render da manual redeploy qiling

### Module Not Found Error

```bash
# Backend dist papka to'g'ri yaratilganligini tekshiring
npm run build
ls -la dist/src/main.js
```

### Database Connection Failed

- `DATABASE_URL` connection pooling URL ekanligini tekshiring
- Format: `postgresql://postgres.[ref]:[password]@...pooler.supabase.com:6543/...`

## 📊 API Documentation

### Base URL
- Local: `http://localhost:4000`
- Production: `https://mock-cefr-backend.onrender.com`

### Endpoints
- `GET /health` - Health check
- `POST /auth/login` - Login
- `POST /auth/register` - Register
- `GET /ielts/mocks` - Get IELTS mocks
- `GET /cefr/mocks` - Get CEFR mocks
- `POST /ai/analyze-speaking` - Analyze speaking

## 🤝 Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open Pull Request

## 📄 License

Private project - All rights reserved

## 👨‍💻 Developer

Created with ❤️ by ANUBIS

---

**Need Help?** Check [RENDER_DEPLOY.md](./RENDER_DEPLOY.md) for detailed deployment instructions.
