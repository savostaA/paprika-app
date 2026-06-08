#!/bin/bash
# ============================================
# 🌶️ Паприка — Сборка для macOS (Client)
# ============================================
set -e

echo "🌶️  Паприка — Сборка macOS (Client)"
echo "=================================="

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
cd "$(dirname "$0")/client"
npm install

# 2. Сборка desktop приложения
echo "🔨 Сборка desktop приложения для macOS..."
npm run desktop:build

# 3. Копирование результатов в корень
echo "📦 Копирование готовых файлов..."
cd ..

# Названия файлов по умолчанию от electron-builder
DMG_PATH="client/dist-desktop/PaprikaCatering-1.0.0.dmg"
ZIP_PATH="client/dist-desktop/PaprikaCatering-1.0.0-mac.zip"

if [ -f "$DMG_PATH" ]; then
    cp "$DMG_PATH" "./paprika-catering.dmg"
    echo "✅ DMG скопирован в: paprika-catering.dmg"
else
    # На случай если имя файла отличается (например, содержит архитектуру arm64 или x64)
    FOUND_DMG=$(find client/dist-desktop/ -name "*.dmg" | head -n 1)
    if [ -n "$FOUND_DMG" ]; then
        cp "$FOUND_DMG" "./paprika-catering.dmg"
        echo "✅ DMG скопирован в: paprika-catering.dmg"
    else
        echo "⚠️ DMG файл не найден в client/dist-desktop"
    fi
fi

if [ -f "$ZIP_PATH" ]; then
    cp "$ZIP_PATH" "./paprika-catering-mac.zip"
    echo "✅ ZIP скопирован в: paprika-catering-mac.zip"
else
    FOUND_ZIP=$(find client/dist-desktop/ -name "*-mac.zip" | head -n 1)
    if [ -n "$FOUND_ZIP" ]; then
        cp "$FOUND_ZIP" "./paprika-catering-mac.zip"
        echo "✅ ZIP скопирован в: paprika-catering-mac.zip"
    else
        echo "⚠️ ZIP файл не найден в client/dist-desktop"
    fi
fi

echo "🎉 Готово!"
