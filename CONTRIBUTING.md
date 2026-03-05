# Вклад в проект NES Emulator

**Автор проекта:** Дуплей Максим Игоревич  
**Школа программирования:** Maestro7IT

> ⚠️ **Важно:** Данный проект является личным обучающим проектом школы программирования Maestro7IT.  
> Вклад от внешних разработчиков возможен только по согласованию с автором.

---

## 📋 Как внести вклад

### 1. Форк и клонирование

```bash
# Форкните репозиторий на GitHub
# Затем клонируйте свою копию
git clone https://github.com/yourusername/nes-emulator-project.git
cd nes-emulator-project
```

### 2. Настройка окружения

```bash
# Установить зависимости
bun install

# Сгенерировать Prisma клиент
bun run db:generate

# Создать .env.local
cp .env.example .env.local
```

### 3. Создание ветки

```bash
# Создайте ветку для вашей функции/фикса
git checkout -b feature/your-feature-name
# или
git checkout -b fix/your-bug-fix
```

### 4. Внесение изменений

- Следуйте существующему стилю кода
- Добавляйте комментарии только там, где это необходимо
- Пишите типобезопасный код (TypeScript strict mode)
- Тестируйте изменения локально

### 5. Коммиты

Используйте понятные сообщения коммитов:

```bash
# Хорошо
git commit -m "feat: добавить сохранение состояния игры"
git commit -m "fix: исправить баг с загрузкой ROM"
git commit -m "docs: обновить README"

# Плохо
git commit -m "исправления"
git commit -m "обновление"
```

### 6. Пуш и Pull Request

```bash
# Отправьте ветку в ваш форк
git push origin feature/your-feature-name

# Создайте Pull Request на GitHub
```

## 📝 Стандарты кода

### TypeScript

- Используйте строгие типы (`strict: true`)
- Избегайте `any`, используйте правильные типы
- Экспортируйте только публичные API

### React компоненты

```tsx
// Используйте функциональные компоненты с хуками
'use client'

import { useState } from 'react'

interface Props {
  title: string
  count?: number
}

export function Component({ title, count = 0 }: Props) {
  const [state, setState] = useState(count)
  
  return <div>{title}: {state}</div>
}
```

### Стили

- Используйте Tailwind CSS utility классы
- Следуйте методологии shadcn/ui для компонентов
- Поддерживайте тёмную тему через CSS переменные

### Именование

| Тип | Стиль | Пример |
|-----|-------|--------|
| Компоненты | PascalCase | `GameCard`, `RomLoader` |
| Функции/переменные | camelCase | `loadRom`, `gameState` |
| Константы | UPPER_SNAKE_CASE | `MAX_PLAYERS`, `API_URL` |
| Файлы | kebab-case | `game-card.tsx`, `rom-loader.ts` |
| CSS классы | kebab-case | `game-card`, `rom-list` |

## 🧪 Тестирование

Перед отправкой PR убедитесь:

```bash
# Проверка типов
bun run tsc --noEmit

# Линтинг
bun run lint

# Сборка
bun run build
```

## 📂 Структура коммитов

### Фичи

```
feat: описание новой функции

- Деталь 1
- Деталь 2

Closes #123
```

### Фиксы

```
fix: описание исправления

Причина проблемы:
- Почему это сломалось

Решение:
- Что было исправлено

Fixes #456
```

## 🎯 Области для вклада

Ищем помощь в следующих областях:

- 🎮 Эмуляция ядра (CPU, PPU, APU)
- 🎨 Улучшение UI/UX
- 📱 Мобильная адаптивность
- 🌍 Переводы (i18n)
- 🧪 Тесты и документация
- ⚡ Оптимизация производительности

## ❓ Вопросы?

Для вопросов и предложений обращайтесь к автору проекта:

- **Автор:** Дуплей Максим Игоревич
- **Школа:** Maestro7IT
- **Email:** [укажите email]

---

© Школа программирования Maestro7IT
