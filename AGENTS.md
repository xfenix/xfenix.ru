# Инструменты и рабочий процесс

- **Serena** — использовать всегда для работы с кодом. Навигация и понимание через `get_symbols_overview` / `find_symbol` (не Read для discovery), правки через `replace_symbol_body` / `replace_content` (не Edit). Активировать проект в начале сессии.
- **Фронтенд** — для любой UI/вёрстки/дизайна/редизайна использовать скилл `design-taste-frontend`.
- **Планирование** — для проработки задач, фич и сложных изменений использовать скиллы `superpowers`: `superpowers:brainstorming` (до начала работы), `superpowers:writing-plans`, `superpowers:executing-plans`.
- **Тексты** — для любого написания/редактуры текстов (особенно русскоязычных, сайт на русском) всегда прогонять через `humanizer` и `humanizer-ru`, чтобы убрать признаки AI-генерации.

# Стиль кода

В проекте используется БЭМ конвенция https://raw.githubusercontent.com/bem-site/bem-method/refs/heads/bem-info-data/method/naming-convention/naming-convention.ru.md

Переменные называются семантично, длину менее 8 символов для именования не используем.
Следуем js стандартам именования переменных, констант, функций, методов.
Не используй # айди для css никогда. Обращение только по БЭМ классам.
Все функции в js/ts мы пишем только анонимными: const somethingDo = () => {...}
