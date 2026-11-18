# GameZone: промежуточный результат

Задача выполнена частично. 54 товара, 18 категорий и характеристики используют общий JSON для seed и демо. Миграций нет: используется существующая модель атрибутов. Seed не очищает существующие данные; старые записи уже заполненной базы сохраняются. Повторный запуск обновляет цены, остатки и пароли тестовых пользователей.

Администраторы: sanzhar@example.com, batyrkhan@example.com, eldar@example.com — admin123, роль SUPERADMIN. Покупатель customer@example.com — user123. Аккаунты описаны в seed, в реальной БД пока не созданы. Верификации email в модели User нет. bcrypt: 12 раундов. Защита production проверена: код 1 до записи данных.

Переменные: SEED_ADMIN_1_EMAIL/PASSWORD, SEED_ADMIN_2_EMAIL/PASSWORD, SEED_ADMIN_3_EMAIL/PASSWORD (см. серверный .env.example). NEXT_PUBLIC_STORE_NAME (GameZone), NEXT_PUBLIC_STORE_CURRENCY (KZT) добавлены в конфигурацию клиента. Форматтер валюты ещё не подключён ко всем компонентам. Stripe остаётся USD; конвертации нет.

Проверки: сервер npx tsc --noEmit и npm run build прошли. Клиент npx tsc --noEmit и lint выявили ошибки в существующих формах, чате, таблицах и уведомлениях. Клиент npm run build завершился успешно, но отдельные TypeScript и lint не проходят. Реальные migrate/seed и браузерная проверка не выполнены.

Запуск после настройки локальных PostgreSQL, Redis и переменных окружения:

```sh
cd src/server
npx prisma migrate dev
npm run seed
npm run dev
# В другом терминале из корня:
cd src/client
npm run dev
```

Не завершено: полная русификация UI/API/писем, единая валюта оплаты и отображения, тёмная тема, игровые фильтры и сортировка, предзаказы и платформенные блоки, замена остальных старых брендов и демо-заказов, проверка всех прав и сценариев в браузере, устранение ошибок клиента. Секретные .env не изменялись. Пользовательские изменения .vscode/settings.json и exceptions.log не затронуты.

Изменённые и добавленные файлы:

- src/server/seeds/seed.ts
- src/server/.env.example
- src/client/app/data/demo/gaming.json
- src/client/app/data/demo/catalog.ts
- src/client/app/lib/demo/seed.ts
- src/client/app/(auth)/sign-in/page.tsx
- src/client/app/(public)/(home)/HeroSection.tsx
- src/client/app/layout.tsx
- src/client/app/page.tsx
- src/client/app/lib/constants/config.ts
- src/client/app/utils/formatDate.ts
- GAMEZONE_PROGRESS.md
