# 🎮 NES Emulator

Веб-эмулятор Nintendo Entertainment System (NES) с современным UI.

**Автор:** Дуплей Максим Игоревич  
**Школа программирования:** [Maestro7IT](https://maestro7it.ru)

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-blue?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-38bdf8?logo=tailwind-css)
![Bun](https://img.shields.io/badge/Bun-latest-fbf0df?logo=bun)

---

> ⚠️ **Лицензия:** Данный проект является личным обучающим проектом школы программирования Maestro7IT.  
> Все права защищены. См. [LICENSE](./LICENSE) для деталей.

## ✨ Особенности

- 🎯 **Современный стек** — Next.js 16 с App Router
- 🎨 **Красивый UI** — shadcn/ui компоненты с Tailwind CSS 4
- 📱 **Адаптивный дизайн** — работает на всех устройствах
- 🌙 **Тёмная тема** — встроенная поддержка тёмной/светлой темы
- 🔐 **Аутентификация** — NextAuth.js для управления сессиями
- 🗄️ **База данных** — Prisma ORM для типобезопасных запросов
- 🌍 **i18n** — интернационализация через next-intl
- 📊 **Состояние** — Zustand + TanStack Query

## 🚀 Быстрый старт

### Требования

- Node.js 18+
- Bun (рекомендуется) или npm/yarn

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/yourusername/nes-emulator-project.git
cd nes-emulator-project

# Установить зависимости
bun install

# Сгенерировать Prisma клиент
bun run db:generate

# Запустить миграции (опционально)
bun run db:migrate

# Запустить dev-сервер
bun run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📦 Команды

```bash
# Разработка
bun run dev          # Запустить dev-сервер

# Сборка
bun run build        # Production сборка
bun run start        # Запустить production сервер

# База данных
bun run db:generate  # Сгенерировать Prisma клиент
bun run db:push      # Применить схему к БД
bun run db:migrate   # Запустить миграции
bun run db:reset     # Сбросить БД

# Линтинг
bun run lint         # ESLint проверка
```

## 📁 Структура проекта

```
nes-emulator-project/
├── src/
│   ├── app/              # Next.js App Router страницы
│   │   ├── api/          # API routes
│   │   ├── globals.css   # Глобальные стили
│   │   ├── layout.tsx    # Корневой layout
│   │   └── page.tsx      # Главная страница
│   ├── components/       # React компоненты
│   │   └── ui/           # shadcn/ui компоненты
│   ├── hooks/            # Кастомные хуки
│   └── lib/              # Утилиты и конфиги
├── public/               # Статические файлы
├── prisma/               # Prisma схема и миграции
├── upload/               # Загруженные ROM файлы*
└── mini-services/        # Дополнительные сервисы
```

*Примечание: ROM файлы не коммитятся в репозиторий.

## 🎮 Использование

### Загрузка ROM

1. Откройте приложение
2. Перейдите в раздел загрузки
3. Выберите `.nes` файл с вашего устройства
4. Игра запустится автоматически

### Управление

| Клавиша | Действие |
|---------|----------|
| Стрелки | D-pad (вверх/вниз/влево/вправо) |
| Z / Enter | Кнопка A |
| X / Space | Кнопка B |
| A | Кнопка Select |
| S | Кнопка Start |

## 🔧 Конфигурация

### Переменные окружения

Создайте файл `.env.local` на основе `.env.example`:

```bash
cp .env.example .env.local
```

Основные переменные:

```env
# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# Database (SQLite для разработки)
DATABASE_URL="file:./dev.db"

# GitHub OAuth (опционально)
GITHUB_CLIENT_ID=your-client-id
GITHUB_CLIENT_SECRET=your-client-secret
```

## 🌐 Деплой

### Vercel (рекомендуется)

```bash
# Установите Vercel CLI
bun add -g vercel

# Задеплоить
vercel
```

### Docker

```bash
# Сборка образа
docker build -t nes-emulator .

# Запуск
docker run -p 3000:3000 nes-emulator
```

### Ручной деплой

```bash
# Production сборка
bun run build

# Запуск
bun run start
```

## 📋 Технологии

| Категория | Технология |
|-----------|------------|
| **Фреймворк** | Next.js 16, React 19 |
| **Язык** | TypeScript 5 |
| **Стили** | Tailwind CSS 4, shadcn/ui |
| **UI Компоненты** | Radix UI, Lucide Icons |
| **Состояние** | Zustand, TanStack Query |
| **Формы** | React Hook Form, Zod |
| **База данных** | Prisma ORM |
| **Аутентификация** | NextAuth.js |
| **Анимации** | Framer Motion |
| **Пакетный менеджер** | Bun |

## 🤝 Вклад

См. [CONTRIBUTING.md](./CONTRIBUTING.md) для информации о том, как внести свой вклад.

## 📄 Лицензия

© Дуплей Максим Игоревич | Школа программирования Maestro7IT

Данный проект является личным обучающим проектом. Все права защищены.  
Использование за пределами учебного процесса Maestro7IT запрещено без письменного разрешения.  
См. файл [LICENSE](./LICENSE) для подробной информации.

## 🙏 Благодарности

- [shadcn/ui](https://ui.shadcn.com/) — за потрясающие компоненты
- [Next.js](https://nextjs.org/) — за превосходный фреймворк
- [Prisma](https://prisma.io/) — за лучшую ORM для TypeScript

---

**Школа программирования Maestro7IT**  
*Обучение программированию будущего*
