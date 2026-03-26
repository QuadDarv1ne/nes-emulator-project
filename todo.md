# 📋 Tasks — NES Emulator Project

**Последнее обновление:** 26 марта 2026 г.
**Ветка:** `main` ✅ (все изменения закоммичены и отправлены)

---

## 🔥 Активные изменения (dev → main)

### ✅ Выполненные изменения (закоммичены в main)
- ✅ `src/core/cartridge.ts` — поддержка mapper 4 (MMC3), mapper 1 (MMC1), mapper 2 (UxROM), mapper 3 (CNROM)
- ✅ `src/core/cartridge.ts` — методы `write()`, `readPRGInternal()`, `initializeMapperState()`, PRG RAM, MMC3 IRQ
- ✅ `src/core/ppu.ts` — CHR ROM поддержка, рендеринг background и sprites, sprite priority
- ✅ `src/core/nes.ts` — mapper 0 (NROM), установка CHR ROM в PPU, debug логирование
- ✅ `src/core/cpu.ts` — исправления memory interface, getMemory() для DMA
- ✅ `src/core/memory.ts` — handlers для PPU, APU, Cartridge, DMA
- ✅ `src/components/screen.tsx` — оптимизация canvas rendering
- ✅ `src/components/rom-loader.tsx` — улучшено логирование
- ✅ `src/components/debug-overlay.tsx` — добавлен debug overlay
- ✅ `src/app/api/log/route.ts` — API для логирования
- ✅ `src/app/page.tsx` — исправление lint (setState в useEffect)
- ✅ `eslint.config.mjs` — игнорирование test-roms/
- ✅ `todo.md` — обновлены задачи и статусы

### ✅ Отправлено в origin
- ✅ `main` → origin/main (10efd92)
- ✅ `dev` → origin/dev (10efd92)

### ⏳ Требуется проверка
- [x] Протестировать загрузку ROM (Super Mario Bros) — ROM скопирован в test-roms/
- [ ] Проверить работу save/load состояний
- [ ] Исправить ошибку сборки (_global-error) — не критично
- [ ] **Запустить dev-сервер** и проверить рендеринг Super Mario Bros

---

## 🎯 Критические задачи

### [1.1.1] — Хотфикс ✅ ЗАВЕРШЁН
- [x] Исправить обработку ошибок в `cartridge.ts` (парсинг iNES ROM)
- [ ] Добавить валидацию размера ROM перед загрузкой
- [ ] Обработать случай несовместимых mapper'ов
- [x] Исправлена ошибка гидратации Next.js
- [x] Добавлена поддержка CHR ROM в PPU
- [x] **Реализована поддержка mapper'ов:** MMC3 (4), MMC1 (1), UxROM (2), CNROM (3)
- [x] **Закоммичено в main:** 10efd92

### [1.2.0] — PPU Rendering ✅ ГОТОВО
- [x] Проверить рендеринг background (tile patterns) — реализовано
- [x] Проверить рендеринг спрайтов (8x8 и 8x16) — реализовано
- [x] Реализовать priority бит (спрайты за/перед фоном) — реализовано
- [ ] Тестировать на Super Mario Bros (mapper 0)
- [ ] Тестировать на Contra (mapper 4 MMC3)

### Тесты (приоритет: высокий)
- [ ] Добавить тесты для `ppu.ts` (renderBackground, renderSprites)
- [ ] Добавить тесты для `apu.ts`
- [ ] Добавить тесты для `memory.ts`
- [ ] Интеграционные тесты для `nes.ts`
- [ ] Тесты для mapper'ов (MMC3 IRQ, MMC1 bank switching)

---

## 🚀 Функциональные задачи

### Эмуляция (ядро)
- [ ] Реализовать полный цикл CPU (opcode-by-opcode)
- [x] Завершить реализацию PPU (рендеринг спрайтов, background) ✅ CHR ROM поддержка, sprite priority
- [x] Поддержка mapper'ов: MMC3 (4), MMC1 (1), UxROM (2), CNROM (3) ✅ IRQ поддержка
- [ ] Реализовать APU (звуковые каналы: pulse, triangle, noise, DMC)
- [ ] **Тестирование** — проверка с реальными ROM
- [ ] **Отладка** — MMC3 IRQ корректность

### UI/UX
- [ ] Экран загрузки с прогресс-баром
- [ ] Список последних игр (localStorage)
- [ ] Настройки управления в UI (key bindings)
- [ ] Поддержка геймпадов (Gamepad API)
- [ ] Мобильные контролы (touch buttons)

### Библиотека игр
- [ ] Страница `/library` со списком ROM
- [ ] Отображение обложек игр (если есть)
- [ ] Поиск и фильтрация
- [ ] Категории/теги

### Сохранения
- [ ] Автосохранение каждые 5 минут
- [ ] Несколько слотов сохранений
- [ ] Синхронизация с localStorage

---

## 🔧 Технические задачи

### Производительность
- [ ] WebAssembly версия CPU для скорости
- [ ] Оптимизация рендеринга PPU (offscreen canvas)
- [ ] Web Worker для эмуляции (чтобы не блокировать UI)
- [ ] Lazy loading ROM файлов

### Инфраструктура
- [ ] CI/CD пайплайн (GitHub Actions)
- [ ] E2E тесты (Playwright)
- [ ] Docker compose для production
- [ ] Мониторинг ошибок (Sentry)

### Код
- [ ] Покрыть 80%+ кода тестами
- [ ] Настроить pre-commit хуки (lint-staged)
- [ ] Добавить Storybook для компонентов
- [ ] Настроить абсолютные импорты через `@/`

---

## 📝 Документация

- [ ] API документация (TSDoc)
- [ ] Инструкция по добавлению новых mapper'ов
- [ ] Руководство для контрибьюторов (расширенное)
- [ ] FAQ для пользователей

---

## 🗓️ План по версиям

### [1.2.0] — Следующий релиз
- Поддержка геймпадов
- Настройка key bindings
- Страница библиотеки игр
- Автосохранение

### [1.3.0]
- Поддержка популярных mapper'ов (MMC1, MMC3)
- Улучшенная эмуляция APU
- Мобильные контролы

### [2.0.0] — Мажорный релиз
- WebAssembly оптимизации
- Онлайн-мультиплеер (netplay)
- Синхронизация сохранений в облаке
- PWA поддержка

---

## 📊 Статус компонентов

| Компонент | Статус | Тесты | Документация |
|-----------|--------|-------|--------------|
| CPU (6502) | 🟡 Частично | ✅ 30 тестов | ❌ |
| PPU | 🟢 Рендеринг готов | ❌ | ❌ |
| APU | 🔴 Не готово | ❌ | ❌ |
| Memory | 🟢 Готово | ❌ | ❌ |
| Controller | ✅ Готово | ✅ 8 тестов | ❌ |
| Cartridge | 🟢 Mapper 0,1,2,3,4 | ✅ 20 тестов | ❌ |
| NES Core | 🟢 Готово | ❌ | ❌ |

**Легенда:** 🟢 Готово | 🟡 В работе | 🔴 Не начато

---

## 📝 Примечания к коммиту

**Последний коммит:** `10efd92` — chore: обновлены задачи в todo.md для dev ветки

**Ветки:**
- `main` → origin/main (10efd92) ✅
- `dev` → origin/dev (10efd92) ✅

**Изменения в main:**
- ✅ Поддержка mapper'ов MMC3, MMC1, UxROM, CNROM
- ✅ CHR ROM поддержка в PPU
- ✅ Sprite priority implementation
- ✅ MMC3 IRQ поддержка
- ✅ Debug overlay и API логирования
- ✅ Исправление lint ошибок
- ✅ 43 теста пройдены
- ✅ Lint пройден

**Текущие задачи:**
1. Тестирование с реальными ROM (Super Mario Bros, Contra)
2. Проверка save/load состояний
3. Исправление ошибки сборки (_global-error) — не критично

**Следующие шаги:**
1. Протестировать загрузку ROM в dev-режиме
2. Проверить рендеринг графики
3. Добавить тесты для PPU

---

## 🔗 Ссылки

- [Репозиторий](https://github.com/yourusername/nes-emulator-project)
- [CHANGELOG](./CHANGELOG.md)
- [CONTRIBUTING](./CONTRIBUTING.md)
- [README](./README.md)

---

© 2026 Дуплей Максим Игоревич | Школа программирования Maestro7IT
