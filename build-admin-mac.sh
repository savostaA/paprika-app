#!/bin/bash
# ============================================
# 🌶️ Паприка Админ — Сборка для macOS
# ============================================
set -e

echo "🌶️  Паприка Админ — Сборка macOS"
echo "=============================="

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
cd "$(dirname "$0")/admin"
npm install

# 2. Сборка desktop приложения
echo "🔨 Сборка desktop приложения для macOS..."
npm run desktop:build

# 3. Копирование результатов в корень
echo "📦 Копирование готовых файлов..."
cd ..

# Названия файлов по умолчанию от electron-builder
DMG_PATH="admin/dist-desktop/PaprikaAdmin-1.0.0.dmg"
ZIP_PATH="admin/dist-desktop/PaprikaAdmin-1.0.0-mac.zip"

if [ -f "$DMG_PATH" ]; then
    cp "$DMG_PATH" "./paprika-admin.dmg"
    echo "✅ DMG скопирован в: paprika-admin.dmg"
else
    FOUND_DMG=$(find admin/dist-desktop/ -name "*.dmg" | head -n 1)
    if [ -n "$FOUND_DMG" ]; then
        cp "$FOUND_DMG" "./paprika-admin.dmg"
        echo "✅ DMG скопирован в: paprika-admin.dmg"
    else
        echo "⚠️ DMG файл не найден в admin/dist-desktop"
    fi
fi

if [ -f "$ZIP_PATH" ]; then
    cp "$ZIP_PATH" "./paprika-admin-mac.zip"
    echo "✅ ZIP скопирован в: paprika-admin-mac.zip"
else
    FOUND_ZIP=$(find admin/dist-desktop/ -name "*-mac.zip" | head -n 1)
    if [ -n "$FOUND_ZIP" ]; then
        cp "$FOUND_ZIP" "./paprika-admin-mac.zip"
        echo "✅ ZIP скопирован в: paprika-admin-mac.zip"
    else
        echo "⚠️ ZIP файл не найден в admin/dist-desktop"
    fi
fi

echo "🎉 Готово!"
