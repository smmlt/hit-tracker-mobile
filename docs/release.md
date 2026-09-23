# Выпуск веб-версии и Android

Один и тот же NestJS API обслуживает веб-приложение и Android APK. В текущей схеме сервер, PostgreSQL и MinIO работают в Docker на вашем ПК, а Cloudflare Tunnel публикует их по HTTPS. ПК, Docker и туннель должны оставаться включёнными, пока приложением пользуются другие люди. APK не содержит сервер и не работает автономно.

## Адреса

Для текущего домена настройте в Cloudflare Tunnel следующие маршруты:

| Публичный адрес | Сервис в Docker |
| --- | --- |
| `https://app.hit-tracker.com` | `http://frontend:80` |
| `https://api.hit-tracker.com` | `http://api:3000` |
| `https://files.hit-tracker.com/hit-tracker/uploads/*` | `http://minio:9000` |

У файлового маршрута текущий фильтр пути `^/hit-tracker/uploads/.*`; корень домена и `/minio/health/live` намеренно отвечают `404`. MinIO Console на порту 9001 оставьте локальной. Не публикуйте PostgreSQL. Туннель и сервисы должны быть в сетях, уже описанных в `hit-tracker-backend/docker-compose.yml`.

В `hit-tracker-backend/.env` задайте значения из `.env.example` и проверьте согласованность публичных адресов:

```env
EXPO_PUBLIC_API_URL=https://api.hit-tracker.com
EXPO_PUBLIC_WEB_URL=https://app.hit-tracker.com
CORS_ORIGINS=https://app.hit-tracker.com
FRONTEND_URL=https://app.hit-tracker.com
GOOGLE_CALLBACK_URL=https://api.hit-tracker.com/auth/google/callback
OAUTH_SUCCESS_REDIRECT_URL=https://app.hit-tracker.com/auth/google/callback
OAUTH_MOBILE_REDIRECT_URL=hit-tracker-mobile://auth/google/callback
S3_PUBLIC_ENDPOINT=https://files.hit-tracker.com
```

Если нужен локальный веб-сервер разработки, добавьте `http://localhost:5173` в `CORS_ORIGINS` через запятую. Остальные секреты и SMTP-параметры остаются только в backend `.env`. `EXPO_PUBLIC_*` — публичные адреса, их нельзя использовать для секретов. Настройка Google Cloud должна содержать точный `GOOGLE_CALLBACK_URL` в Authorized redirect URIs. Для пользователей вне списка тестирования Google OAuth-приложение нужно опубликовать.

## Веб на текущем ПК

Из `hit-tracker-backend/`:

```powershell
docker compose --profile edge config --quiet
docker compose --profile edge up --build -d
docker compose --profile edge ps
```

Профиль `edge` включает веб-сервер и Cloudflare Tunnel. При запуске Compose выполняет миграции и идемпотентное заполнение общего каталога; данные пользователей находятся в постоянном томе PostgreSQL. Перед обновлением работающего проекта сделайте резервную копию базы и проверьте миграции. Для диагностики используйте `docker compose --profile edge logs api frontend cloudflared`.

Откройте `https://app.hit-tracker.com` и проверьте регистрацию с письмом, вход, обновление страницы после входа, Google OAuth, тренировку, загрузку фото и ссылку на общий контент. Публичные ссылки на фото должны вести на `files.hit-tracker.com` и открываться с телефона. Компиляция и unit-тесты сами по себе не доказывают эти сценарии.

## Устанавливаемый Android APK

Создайте бесплатную учётную запись Expo, затем из `hit-tracker-mobile/` один раз привяжите проект к ней:

```powershell
npx eas-cli@latest login
npx eas-cli@latest init
```

В настройках окружения `production` этого EAS-проекта установите две переменные типа plain text:

```powershell
npx eas-cli@latest env:set --name EXPO_PUBLIC_API_URL --value https://api.hit-tracker.com --environment production --visibility plaintext
npx eas-cli@latest env:set --name EXPO_PUBLIC_WEB_URL --value https://app.hit-tracker.com --environment production --visibility plaintext
```

Профиль `preview` в `eas.json` создаёт самостоятельный APK с адресами production API. Для первой сборки EAS предложит создать Android keystore. Сохраните доступ к Expo-аккаунту и keystore: они нужны для последующих обновлений того же приложения.

```powershell
npx eas-cli@latest build --platform android --profile preview
```

После завершения скачайте APK по ссылке EAS и установите на Android. Expo Go и работающий Metro-сервер для такого APK не нужны. Если позже понадобится Google Play, профиль `production` создаёт AAB:

```powershell
npx eas-cli@latest build --platform android --profile production
```

Перед первой публикацией в Google Play утвердите окончательный `android.package` в `app.json`: сейчас там `com.anonymous.hittrackermobile`. Изменение идентификатора после публикации создаст отдельное приложение. Для загрузки в Google Play нужен аккаунт Google Play Console.

## Проверка на телефоне

1. Отключите телефон от домашнего Wi-Fi: приложение должно работать через мобильный интернет и обращаться к HTTPS API, а не к `localhost`.
2. Проверьте регистрацию, получение кода по почте, вход, закрытие и повторный запуск приложения, Google-вход, профиль и фото.
3. Создайте и завершите тренировку; после перезапуска проверьте историю и библиотеку. Откройте ссылку общего контента на другом устройстве.
4. Выключите API или сеть на время запроса и проверьте, что приложение показывает ошибку и позволяет повторить действие.

## Основа для iPhone

Общий Expo-код, `ios.bundleIdentifier` и custom URL scheme уже есть. В будущем профиль `production` можно использовать для iOS-сборки, но TestFlight/App Store потребуют Apple Developer, настройки подписи и проверки на устройстве. Кнопка Apple-входа сейчас показывает `Coming soon`; перед публикацией iOS с Google-входом нужно отдельно решить требование Apple к эквивалентному приватному способу входа.
