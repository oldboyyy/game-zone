# GameZone — игровой интернет-магазин

Next.js + TypeScript + Tailwind + Redux Toolkit на клиенте; Express + Prisma + PostgreSQL + Redis на сервере. Есть каталог, корзина, заказы, Stripe, административная панель и чат Socket.IO.

Переход на игровой магазин **выполнен частично**: добавлены 54 игровых товара, три администратора, игровой баннер и часть русских текстов. Полная локализация, фильтры, оформление и согласование валют ещё требуют работы. Подробности устройства проекта и ограничений — в [ARCHITECTURE.md](ARCHITECTURE.md).

## Быстрый запуск без сервера

Для просмотра интерфейса и демо-админки нужны только Node.js и npm. Для локальной разработки используйте Node.js 22; версия закреплена в `.nvmrc` и `engines` пакетов. Node.js 26 несовместим с текущей JWT-зависимостью.

Из корня репозитория:

```sh
cd src/client
npm ci
NEXT_PUBLIC_DEMO_MODE=true npm run dev
```

Откройте http://localhost:3000. Вход: http://localhost:3000/sign-in, админка: http://localhost:3000/dashboard. В демо подходит любой пароль для аккаунтов из таблицы ниже. Оплата имитируется, настоящий чат требует сервера. Данные демо хранятся в браузере и не записываются в PostgreSQL.

Для постоянного включения демо добавьте `NEXT_PUBLIC_DEMO_MODE=true` в `src/client/.env.local`, затем перезапустите Next.js. Не заменяйте существующий файл целиком.

Если браузер показывает старые товары или аккаунты, откройте сайт в приватном окне. Для сброса сохранённого демо можно удалить только ключи `demo-store-v1` и `demo-session-user-id` в DevTools → Application → Local Storage и перезагрузить страницу. Это удалит локальные демо-заказы и изменения админки.

## Полный локальный запуск

Понадобятся Node.js/npm, Docker с Compose либо собственные PostgreSQL и Redis. Команды ниже рассчитаны на macOS/Linux и выполняются из указанных каталогов. Корневой `npm run dev` запускает клиент на 3000 и API на 5001 через `scripts/dev-local.cjs`; зависимости клиента и сервера устанавливаются отдельно. PostgreSQL и Redis должны быть запущены заранее.

### 1. Подготовить окружение

Шаблоны:

| Файл | Назначение |
| --- | --- |
| `src/.env.example` → `src/.env` | Параметры PostgreSQL в Compose |
| `src/server/.env.example` → `src/server/.env` | База, Redis, авторизация, внешние сервисы |
| `src/client/.env.example` → `src/client/.env.local` | Адреса API и флаги демо |

Если рабочие файлы уже существуют, сохраните их и дополните вручную. Создать только отсутствующие файлы можно из корня:

```sh
[ -f src/.env ] || cp src/.env.example src/.env
[ -f src/server/.env ] || cp src/server/.env.example src/server/.env
[ -f src/client/.env.local ] || cp src/client/.env.example src/client/.env.local
```

В `src/.env` задайте `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`. Вместо значений `<...>` в шаблоне укажите собственные локальные значения.

В `src/server/.env` настройте:

```dotenv
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@localhost:5432/YOUR_DATABASE
REDIS_URL=redis://localhost:6379
ALLOWED_ORIGINS=http://localhost:3000
CLIENT_URL_DEV=http://localhost:3000
```

Данные подключения должны совпадать с `src/.env`. Специальные символы пароля в URL требуют URL-кодирования. Для localhost оставьте `COOKIE_DOMAIN` пустым. Заполните `ACCESS_TOKEN_SECRET`, `REFRESH_TOKEN_SECRET`, `SESSION_SECRET`, `COOKIE_SECRET` независимыми случайными строками; например, генерируйте каждую командой `openssl rand -hex 32`.

Stripe и OAuth подключаются при наличии настроек. Без Stripe сервер может запуститься, но оформление оплаты вернёт 503. SMTP и Cloudinary также требуют собственных настроек для соответствующих функций.

SMTP (`EMAIL_USER`, `EMAIL_PASS`) нужен для писем, Cloudinary — для загрузки изображений. Секреты храните только локально, не в `NEXT_PUBLIC_*` и не в Git.

В `src/client/.env.local`:

```dotenv
NEXT_PUBLIC_API_URL_DEV=http://localhost:5000/api/v1
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_USE_DEMO_CATALOG=false
NEXT_PUBLIC_STORE_NAME=GameZone
NEXT_PUBLIC_STORE_CURRENCY=KZT
```

Checkout использует KZT и запрашивает адрес доставки в Казахстане. Общий форматтер интерфейса по умолчанию использует KZT. Оставляйте `NEXT_PUBLIC_STORE_CURRENCY=KZT`: эта настройка не конвертирует цены и не меняет валюту Stripe. Валюта старых заказов отдельно не хранится; реальные платежи ещё не проверены.

### 2. Поднять PostgreSQL и Redis

Из корня:

```sh
cd src
docker compose up -d db redis
docker compose ps
```

Порты: PostgreSQL `5432`, Redis `6379`. Если эти сервисы уже работают локально, настройте сервер на них вместо запуска контейнеров.

Здесь Docker используется только для базы и Redis. Полный `docker compose up --build` не является проверенным путём для текущего игрового seed: контейнер сервера не содержит соседний клиентский JSON-каталог.

### 3. Установить сервер, применить миграции и seed

В новом терминале из корня:

```sh
cd src/server
npm ci
npx prisma generate
npx prisma migrate dev
npm run seed
npm run dev
```

`migrate dev` используйте с локальной базой разработки. Не подтверждайте предложенный Prisma сброс базы, если в ней есть нужные данные. В окружении развёртывания существующие миграции применяют через `npx prisma migrate deploy`.

Seed берёт товары из `src/client/app/data/demo/gaming.json`, поэтому сохраняйте обе папки рядом. Он обновляет тестовые аккаунты, цены и остатки через upsert, не очищая существующие заказы и пользователей. Старые демо-записи уже заполненной базы автоматически не удаляются.

### 4. Запустить клиент

В отдельном терминале из корня:

```sh
cd src/client
npm ci
npm run dev
```

Проверить:

- http://localhost:3000 — магазин;
- http://localhost:3000/sign-in — вход;
- http://localhost:3000/dashboard — админка после входа;
- http://localhost:5000/health — состояние HTTP-сервера;
- http://localhost:5000/health/detailed — состояние зависимостей;
- http://localhost:5000/api-docs — Swagger;
- `http://localhost:5000/api/v1/graphql` — GraphQL endpoint.

## Тестовые аккаунты

В полноценном режиме появляются после успешного `npm run seed`:

| Имя | Email | Пароль | Роль |
| --- | --- | --- | --- |
| Санжар | sanzhar@example.com | admin123 | SUPERADMIN |
| Батырхан | batyrkhan@example.com | admin123 | SUPERADMIN |
| Елдар | eldar@example.com | admin123 | SUPERADMIN |
| Покупатель | customer@example.com | user123 | USER |

У трёх администраторов одна роль. Проверки иерархии запрещают изменение пользователей равного или более высокого уровня одинаково для всех.

Переопределение администраторов: `SEED_ADMIN_1_EMAIL`, `SEED_ADMIN_1_PASSWORD`, аналогично для `2` и `3`. Повтор seed обновляет роль и хэш пароля. При `NODE_ENV=production` любой стандартный пароль администратора `admin123` останавливает seed до записи данных. Покупатель остаётся тестовым аккаунтом с фиксированным паролем — этот seed не следует использовать для наполнения публичной рабочей базы.

## Проверки разработки

В `src/server`:

```sh
npx tsc --noEmit
npm run build
```

В `src/client`:

```sh
npx tsc --noEmit
npm run lint
npm run build
```

Серверного lint-скрипта нет. Регрессионные тесты запускаются через `npm test` отдельно в `src/server` и `src/client`. Используйте Node.js 22 (`nvm use` при установленном nvm).

Проверки и границы текущего аудита описаны в [AUDIT_FIXES.md](AUDIT_FIXES.md). Проверки типов и lint при клиентской сборке включены.

## Частые проблемы

| Симптом | Что проверить |
| --- | --- |
| Магазин показывает каталог при неработающем API | Есть автоматический fallback каталога; проверьте `/health/detailed` отдельно |
| Вход работает с любым паролем | Включён `NEXT_PUBLIC_DEMO_MODE`; выключите и перезапустите клиент |
| После seed в демо старые товары | PostgreSQL и localStorage независимы; сбросьте только демо-ключи |
| Prisma P1000 | Логин/пароль в URL и в существующей базе; изменение `src/.env` не меняет пароль в старом Docker volume |
| Prisma не подключается | PostgreSQL запущен, порт свободен, база создана, URL корректен |
| Оплата возвращает 503 | Проверьте STRIPE_SECRET_KEY; webhook также требует STRIPE_WEBHOOK_SECRET |
| Авторизация или гостевая корзина теряется | CORS, адреса localhost, cookies в DevTools; session-cookie использует `lax` в разработке и `none` с secure в production |
| Порт 3000 занят | Освободите порт либо согласуйте новый порт клиента с CORS и CLIENT_URL_DEV |

Остановить dev-серверы: `Ctrl+C` в каждом терминале. Остановить инфраструктуру: `cd src` и `docker compose stop db redis`. Не используйте `down -v` для обычной остановки — он удаляет данные volume.

## Документация

[ARCHITECTURE.md](ARCHITECTURE.md) — устройство приложения, модели, потоки данных и правила дальнейшей работы. [GAMEZONE_PROGRESS.md](GAMEZONE_PROGRESS.md) — промежуточный отчёт предыдущего этапа; для текущего запуска ориентируйтесь на этот README. Вложенные старые README могут содержать прежние аккаунты и инструкции.

Лицензия исходного проекта — [MIT](LICENSE).

## Бесплатное размещение серверной части

Пошаговая инструкция, конфигурация Render + Neon и текущие ограничения: [DEPLOYMENT.md](DEPLOYMENT.md).
