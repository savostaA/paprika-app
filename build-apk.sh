#!/bin/bash
# ============================================
# 🌶️ Паприка — Сборка APK
# ============================================
# Требования:
#   - Java JDK 17+
#   - Android SDK (или Android Studio)
#   - Node.js 18+
# ============================================

set -e

echo "🌶️  Паприка — Сборка APK"
echo "========================"

# 1. Установка зависимостей
echo "📦 Установка зависимостей..."
cd "$(dirname "$0")/client"
npm install

# 2. Билд веб-приложения
echo "🔨 Сборка веб-приложения..."
npm run build

# 3. Синхронизация с Android
echo "📱 Синхронизация с Android..."
npx cap sync android

# 4. Сборка APK
echo "📦 Сборка APK..."
cd android
chmod +x gradlew
./gradlew assembleDebug

# 5. Вывод пути к APK
APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
if [ -f "$APK_PATH" ]; then
    echo ""
    echo "✅ APK успешно собран!"
    echo "📍 Путь: $(pwd)/$APK_PATH"
    echo "📏 Размер: $(du -h "$APK_PATH" | cut -f1)"
    
    # Копируем в корень проекта
    cp "$APK_PATH" "../../paprika-catering.apk"
    echo "📋 Скопирован в: paprika-catering.apk"
else
    echo "❌ Ошибка сборки APK"
    exit 1
fi
