# Инструкция по размещению NES Emulator на Tilda

## ⚠️ Важно: Tilda не поддерживает Next.js напрямую

Tilda — это статический конструктор сайтов, а Next.js требует Node.js сервера.

---

## Вариант 1: Iframe с Vercel (Рекомендуется)

### Шаг 1: Разместите приложение на Vercel

1. Создайте аккаунт на [vercel.com](https://vercel.com)
2. Нажмите "Import Project"
3. Загрузите ZIP-архив или подключите GitHub
4. Vercel автоматически определит Next.js и настроит сборку
5. Получите URL: `https://ваш-проект.vercel.app`

### Шаг 2: Встройте в Tilda

1. В Tilda добавьте блок **"HTML-код"** (категория "Другое")
2. Вставьте код:

```html
<div style="width: 100%; height: 100vh; min-height: 600px;">
  <iframe 
    src="https://ваш-проект.vercel.app" 
    width="100%" 
    height="100%" 
    frameborder="0" 
    allowfullscreen
    style="border: none; border-radius: 8px;"
  ></iframe>
</div>
```

---

## Вариант 2: Netlify (Бесплатно)

1. Загрузите проект на [netlify.com](https://netlify.com)
2. Команда сборки: `bun run build`
3. Папка публикации: `.next`
4. Встройте через iframe аналогично

---

## Вариант 3: Статический экспорт (Ограниченный)

Если нужна чисто статическая версия:

1. Измените `next.config.ts`:

```typescript
const nextConfig = {
  output: 'export',
  images: { unoptimized: true },
};
```

2. Соберите: `bun run build`
3. Загрузите папку `out/` на любой хостинг статики

**Ограничения статического экспорта:**
- Нет API routes
- Нет динамических маршрутов
- IndexedDB работает только на HTTPS

---

## Требования для ROM

ROM-файлы должны быть на HTTPS сервере с CORS:

```
Access-Control-Allow-Origin: *
```

Или используйте GitHub Pages / RAW GitHub URL.

---

## Быстрая проверка

После размещения откройте URL и проверьте:
- ✅ Библиотека игр загружается
- ✅ Настройки открываются
- ✅ Можно загрузить ROM файл

---

## Файлы проекта

- `nes-emulator-project.zip` — полный архив проекта
- Распакуйте и загрузите на Vercel/Netlify/GitHub

## Минимальные требования

- Node.js 18+
- bun или npm
- 512MB RAM для сборки
