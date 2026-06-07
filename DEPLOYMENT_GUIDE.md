# Mock CEFR - Deployment Guide

## Architecture

- **Frontend**: Vercel (Next.js)
- **Backend**: Railway (NestJS)
- **Database**: Supabase (PostgreSQL)
- **File Storage**: Supabase Storage

## Step 1: Supabase Setup (Database + Storage)

### 1.1 Create Supabase Project
1. Go to https://supabase.com
2. Sign up/login
3. Click "New Project"
4. Fill in:
   - Name: `mock-cefr-db`
   - Database Password: (save this!)
   - Region: Choose closest to your users
5. Wait for project to be created (~2 minutes)

### 1.2 Get Database URL
Database URL already configured:
```
DATABASE_URL=postgresql://postgres.diasmyffedauhqepoxbz:Akmal.1221%3F@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
```

### 1.3 Get API Keys
API Keys already configured:
```
SUPABASE_URL=https://diasmyffedauhqepoxbz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXNteWZmZWRhdWhxZXBveGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzczNjcsImV4cCI6MjA5NjQxMzM2N30.5x0dQBOjvUGkPOouDfdmlBTlXkeJRbNoQdjKOQ3o_vw
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXNteWZmZWRhdWhxZXBveGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDgzNzM2NywiZXhwIjoyMDk2NDEzMzY3fQ.InhZA1tN4MCNhBeHuf8zfFfjqT1r4eQ2oTgTV-0DTbA
```

### 1.4 Create Storage Buckets
1. Go to https://diasmyffedauhqepoxbz.supabase.co
2. Navigate to Storage
3. Create bucket: `pdf-uploads` (Public: No)
4. Create bucket: `audio-uploads` (Public: No)
5. Create bucket: `image-uploads` (Public: Yes)

### 1.5 Run Database Migrations
Database already synced with Prisma schema. No action needed.

## Step 2: Backend Deployment (Railway)

### 2.1 Create Railway Project
1. Go to https://railway.app
2. Sign up/login with GitHub
3. Click "New Project"
4. Select "Deploy from GitHub repo"
5. Select your `mock` repository
6. Select `backend` folder as root directory

### 2.2 Configure Environment Variables
In Railway project settings, add these variables:

```env
DATABASE_URL=postgresql://postgres.diasmyffedauhqepoxbz:Akmal.1221%3F@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
JWT_SECRET=zX3hMQttt2coeGP0minXpd9QJsYp80hsWFtDZPZSbTw4qocTQa7IemD3elXy5hXZldCUgYVoxs2AE8s4gn9cMw==
GROQ_API_KEY=gsk_test_placeholder
SUPABASE_URL=https://diasmyffedauhqepoxbz.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXNteWZmZWRhdWhxZXBveGJ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA4MzczNjcsImV4cCI6MjA5NjQxMzM2N30.5x0dQBOjvUGkPOouDfdmlBTlXkeJRbNoQdjKOQ3o_vw
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRpYXNteWZmZWRhdWhxZXBveGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDgzNzM2NywiZXhwIjoyMDk2NDEzMzY3fQ.InhZA1tN4MCNhBeHuf8zfFfjqT1r4eQ2oTgTV-0DTbA
FRONTEND_URL=https://your-frontend.vercel.app
PORT=4000
```

### 2.3 Deploy
1. Click "Deploy"
2. Railway will automatically:
   - Install dependencies
   - Build the project
   - Start the server
3. Wait for deployment to complete
4. Copy the Railway URL (e.g., `https://your-backend.railway.app`)

## Step 3: Frontend Deployment (Vercel)

### 3.1 Create Vercel Project
1. Go to https://vercel.com
2. Sign up/login with GitHub
3. Click "Add New Project"
4. Select your `mock` repository
5. Select `frontend` folder as root directory

### 3.2 Configure Environment Variables
In Vercel project settings → Environment Variables, add:

```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

**Note**: After deploying backend, replace `your-backend.railway.app` with actual Railway URL.

### 3.3 Deploy
1. Click "Deploy"
2. Vercel will automatically:
   - Install dependencies
   - Build the Next.js app
   - Deploy to edge network
3. Wait for deployment to complete
4. Copy the Vercel URL (e.g., `https://your-frontend.vercel.app`)

### 3.4 Update Backend CORS
Go back to Railway and update `FRONTEND_URL` with your Vercel URL, then redeploy.

## Step 4: Update Backend CORS

After deploying frontend, update the backend CORS configuration:

1. Go to Railway project
2. Update `FRONTEND_URL` environment variable with your Vercel URL
3. Redeploy the backend

## Step 5: Test the Deployment

### 5.1 Test Backend
```bash
curl https://your-backend.railway.app/api/health
```

### 5.2 Test Frontend
Open your Vercel URL in a browser and test:
- Login
- Dashboard
- Mock creation
- Mock taking

## Environment Variables Summary

### Backend (.env)
```env
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key-change-this
GROQ_API_KEY=your-groq-api-key
SUPABASE_URL=https://[ref].supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_KEY=your-supabase-service-key
FRONTEND_URL=https://your-frontend.vercel.app
PORT=3000
```

### Frontend (.env)
```env
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
```

## Troubleshooting

### Backend fails to start
- Check Railway logs for errors
- Verify DATABASE_URL is correct
- Check if all environment variables are set

### Frontend API errors
- Verify NEXT_PUBLIC_API_URL is correct
- Check backend is running
- Check CORS configuration

### File upload errors
- Verify Supabase storage buckets exist
- Check storage permissions
- Verify SUPABASE keys are correct

### Database connection errors
- Verify DATABASE_URL format
- Check if Supabase project is active
- Verify database password

## Cost Estimation

- **Supabase**: Free tier (500MB database, 1GB storage)
- **Railway**: $5/month (or free tier with limitations)
- **Vercel**: Free tier (100GB bandwidth)

Total: ~$5/month or free with limitations

## Alternative Deployment Options

### Render (instead of Railway)
- Similar to Railway
- Free tier available
- Good for Node.js apps

### DigitalOcean
- More control
- $4/month for basic droplet
- Manual setup required

### AWS
- Most scalable
- Complex setup
- Higher cost

## Post-Deployment Checklist

- [ ] Test user registration/login
- [ ] Test mock creation (IELTS & CEFR)
- [ ] Test mock taking
- [ ] Test PDF upload
- [ ] Test audio/image upload
- [ ] Test payment flow
- [ ] Test results generation
- [ ] Check admin dashboard
- [ ] Verify email notifications (if configured)
- [ ] Set up monitoring/alerts
- [ ] Configure custom domain (optional)
