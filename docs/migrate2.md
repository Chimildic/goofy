# Миграция

## Версия 2.0

Новая политика Spotify API ограничела доступ к важным функциям. Подробнее [здесь](https://developer.spotify.com/blog/2024-11-27-changes-to-the-web-api).
Чтобы вернуть доступ в goofy 2.0 запросы делятся между двумя приложениями: вашим и приватным. На данный момент приватное приложение продолжает отвечать на запросы к закрытой части API.

1. Зайдите в [Spotify Dashboard](https://developer.spotify.com/dashboard)
2. Выберите приложение для goofy
3. Нажмите кнопку `Settings`
4. Посмотрите статус в поле `App Status` (понадобится дальше)
5. Спуститесь ниже и добавьте в `Redirect URLs` новую ссылку: `https://chimildic.github.io/spotify/auth`
6. Откройте проект в Apps Script
7. Зайдите в файл `config` и добавьте две новые строчки в функцию `setProperties`. Пример как должно выглядеть [здесь](https://github.com/Chimildic/goofy/blob/main/config.js).
```js
  UserProperties.setProperty('PRIVATE_CLIENT_ID', 'вашеЗначение');
  UserProperties.setProperty('PRIVATE_CLIENT_SECRET', 'вашеЗначение');
```

- Если ваш статус `Development mode`, перейдите по [ссылке](https://script.google.com/macros/s/AKfycbwwDT25i71nYAk1aICxnrXfFVDzctcmhRMqzugjEkpqmUWjGATAbMOCL5aqvlPXOIq4/exec), чтобы получить значения для приватного приложения.

- Если ваш статус `Granted quota extension`, продублируйте свои же значения из строк `CLIENT_ID` и `CLIENT_SECRET`.

8. Скопируйте в файл `config` следующую функцию и запустите её.

```js
function reset() {
    Admin.reset()
    setProperties()
}
```

9. [Обновите](https://chimildic.github.io/goofy/#/tuning?id=Обновить-библиотеку) код основной библиотеки как раньше (по умолчанию файл `library`)
10.  Обновите права доступа: `начать развертывание` > `пробные развертывания` > перейти по ссылке `веб-приложение` и следовать появившейся инструкции
