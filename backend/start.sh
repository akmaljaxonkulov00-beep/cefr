#!/bin/sh
echo "Resolving failed migrations..."
npx prisma migrate resolve --applied 20260513180000_speaking_analysis_fields || true
echo "Running Prisma migrations..."
npx prisma migrate deploy || npx prisma db push
echo "Starting application..."
exec node dist/src/main.js
