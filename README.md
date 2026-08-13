# Beauty Expert Summit 2026 — форма регистрации

Статический сайт с формой регистрации (повторяет PDF-форму), который отправляет ответы в Google Таблицу. Никакого сервера не нужно — только статический хостинг (Vercel) и бесплатный Google Apps Script в роли бэкенда.

## Структура проекта

```
index.html      — сама форма (все 13 разделов из PDF)
styles.css       — оформление
script.js        — логика формы и отправка данных
config.js        — сюда вставляется URL вашего Google Apps Script
google-apps-script/Code.gs — код бэкенда для Google Таблиц
```

---

## Шаг 1. Google Таблица для ответов (для администратора)

1. Откройте [sheets.google.com](https://sheets.google.com) и создайте новую таблицу, например «Beauty Expert Summit 2026 — Регистрации».
2. В меню выберите **Extensions → Apps Script** (Расширения → Apps Script).
3. Удалите весь код-заглушку в редакторе и вставьте туда содержимое файла [`google-apps-script/Code.gs`](google-apps-script/Code.gs) из этого проекта.
4. Сохраните проект (значок дискеты, можно назвать «Beauty Expert Summit Backend»).
5. Сверху в редакторе выберите функцию `setup` в выпадающем списке и нажмите **Run** (▶). Google попросит подтвердить разрешения — разрешите доступ к своему аккаунту (это создаст лист «Responses» и папку на Google Диске для файлов).
6. Нажмите **Deploy → New deployment** (Развернуть → Новое развертывание).
   - Тип: **Web app**.
   - Execute as: **Me**.
   - Who has access: **Anyone** (это нужно, чтобы сайт мог отправлять данные; сама таблица при этом остаётся закрытой — доступ есть только у вас).
7. Нажмите **Deploy**, разрешите доступ ещё раз, если попросит.
8. Скопируйте появившийся **Web app URL** (выглядит как `https://script.google.com/macros/s/XXXXXXX/exec`).

Ответы будут появляться на листе «Responses» в вашей таблице, а прикреплённые файлы (фото, диплом, тезисы и т.д.) — в папке «Beauty Expert Summit 2026 — Uploads» на Google Диске; ссылки на файлы подставляются в соответствующие столбцы таблицы.

> Если позже понадобится изменить код `Code.gs`, отредактируйте его в Apps Script и сделайте **Deploy → Manage deployments → Edit → New version**.

---

## Шаг 2. Подключить сайт к таблице

Откройте файл `config.js` в этом проекте и вставьте скопированный URL:

```js
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/XXXXXXX/exec";
```

---

## Шаг 3. Залить проект на GitHub

В терминале, находясь в папке проекта:

```bash
git add -A
git commit -m "Beauty Expert Summit 2026 registration form"
```

Создайте пустой репозиторий на [github.com/new](https://github.com/new) (без README/gitignore), затем:

```bash
git remote add origin https://github.com/ВАШ_ЛОГИН/НАЗВАНИЕ_РЕПО.git
git branch -M main
git push -u origin main
```

---

## Шаг 4. Развернуть на Vercel

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub.
2. **Add New → Project**, выберите только что созданный репозиторий.
3. Framework Preset — оставьте **Other** (сайт статический, сборка не нужна).
4. Нажмите **Deploy**.

Через минуту сайт будет доступен по адресу вида `https://ваш-проект.vercel.app`. При каждом `git push` в `main` Vercel будет обновлять сайт автоматически.

---

## Проверка перед запуском

- Откройте задеплоенный сайт, заполните форму тестовыми данными и отправьте.
- Проверьте, что в Google Таблице на листе «Responses» появилась новая строка.
- Если ничего не пришло — проверьте, что в `config.js` указан правильный URL и что деплой в Apps Script имеет доступ **Anyone**.

## Что можно донастроить

- Обязательные/необязательные поля — атрибут `required` в `index.html`.
- Цвета и шрифты — переменные в начале `styles.css` (`:root`).
- Состав столбцов Google Таблицы — массив `COLUMNS` в `Code.gs`.
