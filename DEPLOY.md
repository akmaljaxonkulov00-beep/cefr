# Mock CEFR/IELTS — Deployment Guide

## Architecture
- Frontend → Vercel
- Backend → Railway
- Database → Supabase PostgreSQL  
- File Storage → Supabase Storage

## Step 1: GitHub
1. Create new repo at github.com
2. Run in terminal:
   ```bash
   git init
   git add .
   git commit -m "initial commit"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```

## Step 2: Supabase Setup
1. Go to supabase.com → New Project
2. Settings → Database → copy Connection String
3. Storage → New Bucket → name: "mock-files" → Public: ON
4. Settings → API → copy URL and anon key and service key

## Step 3: Deploy Backend to Railway
1. Go to railway.app → New Project → Deploy from GitHub
2. Select your repo → select /backend folder
3. Add Environment Variables:
   - DATABASE_URL = (from Supabase)
   - JWT_SECRET = (any random 32+ char string)
   - GROQ_API_KEY = (your Groq key)
   - SUPABASE_URL = (from Supabase)
   - SUPABASE_ANON_KEY = (from Supabase)
   - SUPABASE_SERVICE_KEY = (from Supabase)
   - FRONTEND_URL = (set after Vercel deploy)
   - PORT = 3000
4. Railway builds → copy your backend URL (e.g. https://mock-backend.railway.app)
5. Run migrations: railway run npx prisma db push

## Step 4: Deploy Frontend to Vercel
1. Go to vercel.com → New Project → Import from GitHub
2. Select your repo → Root Directory: frontend
3. Add Environment Variable:
   - NEXT_PUBLIC_API_URL = https://your-backend.railway.app
4. Deploy → copy your Vercel URL

## Step 5: Connect Everything
1. Go to Railway → your backend → Environment Variables
2. Update FRONTEND_URL = https://your-app.vercel.app
3. Redeploy backend

## Local Development
1. Copy backend/.env.example → backend/.env → fill in values
2. Copy frontend/.env.example → frontend/.env.local → fill in values
3. cd backend && npm install && npm run start:dev
4. cd frontend && npm install && npm run dev
