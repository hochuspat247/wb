# MarketCard AI

MarketCard AI - MVP AI-сервиса для продавцов маркетплейсов. Пользователь загружает фото товара, вводит описание, выбирает маркетплейс, стиль и режим изображения, а сервис генерирует текст карточки, SEO, инфографику, HTML-preview и AI-изображение через NanoBanana Expert или Google Gemini Nano Banana.

## Запуск

```bash
npm install
npm run dev
```

Сборка:

```bash
npm run build
```

## Переменные окружения

Скопируйте `.env.example` в `.env.local`:

```env
AI_PROVIDER=gemini
GEMINI_API_KEY=
GEMINI_TEXT_MODEL=gemini-2.5-flash
IMAGE_PROVIDER=nanobanana_expert
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_IMAGE_FALLBACK_MODEL=gemini-2.5-flash-image
GEMINI_IMAGE_PRO_MODEL=gemini-3-pro-image
GEMINI_IMAGE_SIZE=1K

NANOBANANA_EXPERT_API_KEY=
NANOBANANA_EXPERT_BASE_URL=https://nanobanana.expert/api/v1
NANOBANANA_EXPERT_MODEL=nb2
NANOBANANA_EXPERT_PROVIDER=auto
NANOBANANA_EXPERT_RESOLUTION=1k
NANOBANANA_EXPERT_ASPECT_RATIO=4:5
```

Секретные ключи храните только в `.env.local`. Не добавляйте реальные ключи в `.env.example`.

## Как подключить NanoBanana Expert

1. Зарегистрируйтесь в NanoBanana Expert.
2. Откройте Dashboard → API.
3. Создайте API key.
4. В `.env.local` добавьте:

```env
NANOBANANA_EXPERT_API_KEY=
NANOBANANA_EXPERT_BASE_URL=https://nanobanana.expert/api/v1
NANOBANANA_EXPERT_MODEL=nb2
NANOBANANA_EXPERT_PROVIDER=auto
NANOBANANA_EXPERT_RESOLUTION=1k
NANOBANANA_EXPERT_ASPECT_RATIO=4:5
IMAGE_PROVIDER=nanobanana_expert
```

5. Запустите проект:

```bash
npm run dev
```

6. На странице генератора выберите:
   Режим изображения → NanoBanana Expert

## Ошибки NanoBanana Expert

**401:**
Неверный API-ключ.

**402:**
Недостаточно banana-баланса.

**400:**
Ошибка параметров запроса.

**403:**
Нет доступа или аккаунт заблокирован.

**429:**
Слишком много запросов.

**500/503:**
Сервис временно недоступен.

## Когда выбирать nb2, а когда gpt2

**nb2:**
Использовать по умолчанию для красивых товарных карточек, фонов, визуальной композиции и image-to-image.

**gpt2:**
Использовать, если важно лучше отрисовать текст на изображении.

## Как включить Nano Banana (Gemini)

1. Создайте API key в Google AI Studio.
2. Создайте файл `.env.local`.
3. Добавьте:

```env
GEMINI_API_KEY=
AI_PROVIDER=gemini
IMAGE_PROVIDER=gemini
GEMINI_TEXT_MODEL=gemini-2.5-flash
GEMINI_IMAGE_MODEL=gemini-3.1-flash-image
GEMINI_IMAGE_FALLBACK_MODEL=gemini-2.5-flash-image
GEMINI_IMAGE_PRO_MODEL=gemini-3-pro-image
```

4. Запустите проект:

```bash
npm run dev
```

5. На странице генератора включите “Сгенерировать AI-изображение карточки” и выберите режим:

- `HTML-preview` - не вызывает внешние image API.
- `NanoBanana Expert` - генерация через REST API NanoBanana Expert.
- `Gemini Nano Banana` - `gemini-3.1-flash-image` / `gemini-2.5-flash-image` / `gemini-3-pro-image`.
- `Auto` - сначала NanoBanana Expert (если задан ключ), затем Gemini, затем HTML-preview.

## Почему картинка может не генерироваться

- не задан `NANOBANANA_EXPERT_API_KEY` или `GEMINI_API_KEY`;
- недостаточно banana-баланса в NanoBanana Expert;
- выбран текстовый Gemini model вместо image model;
- не используется Interactions API;
- превышены лимиты API;
- не подключен billing для платного уровня;
- модель временно недоступна;
- запрос заблокирован safety-фильтрами;
- изображение слишком большое или неподдерживаемого формата.

Если AI-изображение не сгенерировалось, интерфейс не падает: показывается HTML/CSS fallback-preview, который можно скачать как PNG.

## Ограничения изображения

- Максимальный размер входного файла: 5 МБ.
- Поддерживаются `image/jpeg`, `image/png`, `image/webp`.
- Если файл больше 5 МБ, приложение покажет ошибку: “Изображение слишком большое. Загрузите файл до 5 МБ.”

## Что работает в MVP

- Генерация текстовой карточки через Gemini, Ollama, OpenRouter, Hugging Face или smart fallback.
- Генерация AI-изображения карточки через NanoBanana Expert REST API.
- Генерация AI-изображения карточки через Gemini Nano Banana Interactions API.
- Автоматический fallback на HTML/CSS preview.
- Проверка баланса NanoBanana Expert через `/api/image-balance`.
- Скачивание PNG/AI-изображения и JSON.
- Копирование описания и prompt изображения.
- История последних 10 генераций в localStorage, включая AI-изображение и metadata.
- Защита от слишком больших и неподдерживаемых изображений.

## Честные ограничения

- В MVP нет прямой публикации на WB/Ozon/Avito.
- AI-модель может ошибаться в мелкой типографике; HTML-preview остается надежным fallback.
- Для Gemini image API может требоваться paid billing.
