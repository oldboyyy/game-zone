# Проверка и очистка проекта

## Исправленная ошибка

В браузере воспроизведён InvalidCharacterError в generatePlaceholderImage: btoa не принимает кириллицу. SVG теперь кодируется через encodeURIComponent, текст экранируется, инициалы обрабатываются по Unicode-символам. Цвет стабилен между рендерами. Добавлены четыре регрессионных теста: `cd src/client && npm test`.

Также исправлены типы дополнительных полей уведомлений и таймеров; живые страницы чата выделены в отдельные компоненты, чтобы хуки не вызывались после условного возврата демо-страницы.

## Выполненные проверки

- Клиент: 4 теста из 4 прошли.
- Сервер: `npx tsc --noEmit` и `npm run build` прошли.
- Клиент: `npm run build` прошёл, но конфигурация пропускает TypeScript и lint.
- Отдельные клиентские TypeScript и lint не проходят: остаются ошибки типов форм/таблиц/атрибутов и неиспользуемые переменные. Общая техническая очистка не завершена.
- Playwright: главная, /shop, /product/gamezone-ps5-1, /sign-in, /cart, /dashboard, /dashboard/products, /dashboard/users открылись без аварийной страницы. Для админки использован демо-вход Санжара. Это проверка открытия страниц, не полный тест бизнес-операций.
- Реальные Stripe, SMTP, загрузки, миграции и серверный чат в этом проходе не проверялись.
- `git diff --check` прошёл.

## Удалено по запросу

Неиспользуемый `src/client/app/(private)/(chat)/ChatContainer.tsx`: рабочие страницы импортируют реализацию из components через index.ts.

Английские Markdown: SECURITY.md, CONTRIBUTING.md, CODE_OF_CONDUCT.md, MAINTENANCE.md, src/ENV_STARTER.md, src/server/PRODUCTION_SETUP.md, README в src/server, src/client, src/server/seeds, src/client/app/(private)/(chat), assets/seed-images, src/client/public/assets/seed-images. Удалённые отслеживаемые файлы доступны в истории Git. Лицензия сохранена.

## Процессы

Остановлен подтверждённый dev-сервер проекта PID 73233 на порту 3001. Системный Control Center на 5000/7000, редактор, Codex, PostgreSQL и Redis не останавливались: принадлежность последних только этому проекту не установлена. Порты не являются файлами и не удаляются; их освобождает остановка соответствующего процесса.

## Повторный запуск

```sh
cd src/client
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

Полный запуск и архитектура описаны в README.md и ARCHITECTURE.md. Проблема кириллицы устранена, но проект в целом пока нельзя считать прошедшим все проверки.
