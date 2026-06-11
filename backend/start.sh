#!/bin/sh
echo "Running Prisma migrations..."
npx prisma migrate deploy || npx prisma db push
echo "Starting application..."
exec node dist/main.js
