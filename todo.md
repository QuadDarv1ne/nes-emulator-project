# 📋 Tasks — NES Emulator Project

**Последнее обновление:** 26 марта 2026 г.
**Ветка:** `main` ✅ (все изменения закоммичены)

---

## 🔥 Активные изменения (dev → main)

### ✅ Выполненные изменения (закоммичены в main)
- ✅ `src/core/cartridge.ts` — добавлена поддержка mapper 4 (MMC3), mapper 1 (MMC1), mapper 2 (UxROM), mapper 3 (CNROM)
- ✅ `src/core/cartridge.ts` — реализованы методы `write()`, `readPRGInternal()`, `initializeMapperState()`
- ✅ `src/core/cpu.ts` — изменения в CPU memory interface
- ✅ `src/core/memory.ts` — обновления memory handlers
- ✅ `src/core/ppu.ts` — добавлена поддержка CHR ROM для рендеринга background и sprites
- ✅ `src/core/nes.ts` — улучшена поддержка mapper 0 (NROM), установка CHR ROM в PPU
- ✅ `src/components/emulator/screen.tsx` — оптимизация рендеринга canvas, вынесение ctx в ref
- ✅ `src/components/emulator/rom-loader.tsx` — улучшено логирование загрузки ROM
- ✅ `src/__tests__/core/controller.test.ts` — обновления тестов контроллера
- ✅ `src/app/page.tsx` — исправлена ошибка lint (setState в useEffect)
- ✅ `eslint.config.mjs` — добавлено игнорирование test-roms/

### ⏳ Требуется проверка
- [ ] Протестировать загрузку ROM в dev-режиме (Super Mario Bros, Contra)
- [ ] Проверить работу save/load состояний
- [ ] **Проверить рендеринг графики** (фон, спрайты) — критично!
- [ ] Запустить `bun run build` — проверить сборку (есть ошибка с _global-error)

---

## 🎯 Критические задачи

### [1.1.1] — Хотфикс (приоритет: высокий) ✅ ЗАВЕРШЁН
- [x] Исправить обработку ошибок в `cartridge.ts` (парсинг iNES ROM)
- [ ] Добавить валидацию размера ROM перед загрузкой
- [ ] Обработать случай несовместимых mapper'ов
- [x] Исправлена ошибка гидратации Next.js
- [x] Добавлена поддержка CHR ROM в PPU
- [x] **Реализована поддержка mapper'ов:** MMC3 (4), MMC1 (1), UxROM (2), CNROM (3)
- [x] **Закоммичено в main:** 0d73069

### Тесты (приоритет: высокий)
- [ ] Добавить тесты для `ppu.ts`
- [ ] Добавить тесты для `apu.ts`
- [ ] Добавить тесты для `memory.ts`
- [ ] Интеграционные тесты для `nes.ts`
- [ ] Тесты для mapper'ов (MMC3, MMC1)

---

## 🚀 Функциональные задачи

### Эмуляция (ядро)
- [ ] Реализовать полный цикл CPU (opcode-by-opcode)
- [x] Завершить реализацию PPU (рендеринг спрайтов, background) ✅ CHR ROM поддержка
- [x] Поддержка mapper'ов: MMC3 (4), MMC1 (1), UxROM (2), CNROM (3) — **ожидают коммита**
- [ ] Реализовать APU (звуковые каналы: pulse, triangle, noise, DMC)
- [ ] Поддержка популярных mapper'ов (MMC1, MMC3) — **в реализации**

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
| CPU (6502) | 🟡 Частично | ✅ 15 тестов | ❌ |
| PPU | 🟢 CHR ROM готово | ❌ | ❌ |
| APU | 🔴 Не готово | ❌ | ❌ |
| Memory | 🟡 Частично | ❌ | ❌ |
| Controller | ✅ Готово | ✅ 8 тестов | ❌ |
| Cartridge | 🟢 Mapper 0,1,2,3,4 | ✅ 20 тестов | ❌ |
| NES Core | 🟢 Mapper 0 готов | ❌ | ❌ |

**Легенда:** 🟢 Готово | 🟡 В работе | 🔴 Не начато

---

## 📝 Примечания к коммиту

**Последний коммит:** `0d73069` — feat: поддержка mapper'ов MMC3, MMC1, UxROM, CNROM и улучшения ядра

**Изменения закоммичены:**
- ✅ `src/core/cartridge.ts` — поддержка MMC3, MMC1, UxROM, CNROM
- ✅ `src/core/cpu.ts` — исправления memory interface
- ✅ `src/core/memory.ts` — обновления handlers
- ✅ `src/core/ppu.ts` — CHR ROM поддержка
- ✅ `src/core/nes.ts` — mapper 0 поддержка
- ✅ `src/components/emulator/screen.tsx` — оптимизация canvas
- ✅ `src/components/emulator/rom-loader.tsx` — логирование
- ✅ `src/__tests__/core/controller.test.ts` — тесты
- ✅ `src/app/page.tsx` — исправление lint
- ✅ `eslint.config.mjs` — игнорирование test-roms/
- ✅ `todo.md` — обновлены задачи

**Следующие шаги:**
1. Протестировать загрузку ROM в dev-режиме
2. Проверить рендеринг графики (фон, спрайты)
3. Исправить ошибку сборки (_global-error)

---

## 🔗 Ссылки

- [Репозиторий](https://github.com/yourusername/nes-emulator-project)
- [CHANGELOG](./CHANGELOG.md)
- [CONTRIBUTING](./CONTRIBUTING.md)
- [README](./README.md)

---

© 2026 Дуплей Максим Игоревич | Школа программирования Maestro7IT
