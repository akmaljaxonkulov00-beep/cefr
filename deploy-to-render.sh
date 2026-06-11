#!/bin/bash

echo "========================================"
echo "   Render.com ga Deploy Qilish"
echo "========================================"
echo ""

echo "[1/5] Git status tekshirilmoqda..."
git status

echo ""
echo "[2/5] Barcha o'zgarishlar qo'shilmoqda..."
git add .

echo ""
echo "[3/5] Commit qilinmoqda..."
read -p "Commit message kiriting (default: Configure for Render deployment): " commit_msg
commit_msg=${commit_msg:-"Configure for Render deployment"}
git commit -m "$commit_msg"

echo ""
echo "[4/5] GitHub ga push qilinmoqda..."
git push origin main

echo ""
echo "[5/5] Deploy tayyor!"
echo ""
echo "========================================"
echo "   Keyingi Qadamlar:"
echo "========================================"
echo ""
echo "1. Render.com ga kiring: https://dashboard.render.com"
echo "2. 'New +' - 'Blueprint' ni tanlang"
echo "3. GitHub repository ni ulang"
echo "4. render.yaml avtomatik topiladi"
echo "5. Environment variables ni qo'shing (RENDER_DEPLOY.md ga qarang)"
echo "6. 'Apply' tugmasini bosing"
echo ""
echo "To'liq yo'riqnoma: RENDER_DEPLOY.md faylini oching"
echo ""
