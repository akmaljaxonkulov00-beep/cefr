#!/bin/sh
set -e

echo "🔧 Resolving failed migrations..."
npx prisma migrate resolve --applied 20260513180000_speaking_analysis_fields || true

echo "🗄️ Running Prisma migrations..."
npx prisma migrate deploy || {
    echo "⚠️  Migrate deploy failed, trying db push..."
    npx prisma db push --accept-data-loss || {
        echo "❌ Both migrate and push failed"
        exit 1
    }
}

echo "📦 Generating Prisma Client..."
npx prisma generate

echo "🚀 Starting application..."
exec node dist/src/main.js
