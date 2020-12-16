## Основные страницы
- [Мои проекты](https://script.google.com/home/my) - чтобы открыть редактор кода.
- [Мои выполнения](https://script.google.com/home/executions) - чтобы смотреть результаты выполнения кода.
- [Мои триггеры](https://script.google.com/home/triggers) - перечень установленных триггеров.

## Редактор кода
1. Перейдите в [мои проекты](https://script.google.com/home/my)
2. Выберите проект `Копия Goofy (Ver. 1)` (вы могли изменить название)
3. Справа нажмите кнопку `Открыть проект` или в списке проектов на значок карандаша.
4. Перейдите в файл `main`. Сейчас он пуст.

   Большая стрелка слева сверху вернет обратно в список проектов.

   ![Редактор кода](/img/fp-editor.png)

## Запуск

Откройте файл `main` в редакторе кода и вставьте в него следующий код функции `createHelloPlaylist`:
```js
function createHelloPlaylist() {
    // Получить все любимые треки
    let tracks = Source.getSavedTracks();

    // Выбрать 5 случайных любимых треков
    Selector.keepRandom(tracks, 5);

    // Создать плейлист с ними
    Playlist.saveWithReplace({
        name: 'Hello, playlist!',
        tracks: tracks,
    });
}
```
Сохраните файл `Ctrl + S` или в меню `Файл` - `Сохранить`.

Нажмите `Изменить` - `Триггеры текущего проекта`

![Триггеры текущего проекта](/img/fp-triggers-open.png)

Справа внизу кнопка `Добавление триггера`

- Выберите функцию `createHelloPlaylist`
- Триггер по времени
- По минутам
- Раз в минуту
- Сохраните

![Создание триггера](/img/fp-trigger-set.png)

Зайдите в Spotify. Через минуту появится плейлист с названием `Hello, playlist!` и каждую следующую минут его содержание будет обновляться 5 случайными любимыми треками.

После проверки этого, перейдите в [список триггеров](https://script.google.com/home/triggers). Вы увидите два триггера: для функции `createHelloPlaylist`, созданный вручную ранее и для функции `updateRecentTracks`, созданный автоматически. Подробнее о нем читать в [истории прослушиваний](/desc?id=История-прослушиваний).

Удалите триггер для функции `createHelloPlaylist`: справа три точки, удалить триггер. В этом же меню можно открыть список выполнений *конкретного* триггера.

Перейдите в раздел [мои выполнения](https://script.google.com/home/executions). Вы увидите общий список завершенных или выполняемых операций, их времени работы, статуса завершения, логов.

## Отладка

Для запуска функции без создания триггера, в редакторе кода выберите функцию и нажмите запуск

![Отладка](/img/fp-debug.png)

Перейдите в [мои выполнения](https://script.google.com/home/executions). Дождитесь статуса успешного завершения или сбоя. Результат появляется с некоторой задержкой относительно фактического завершения. Возможно потребуется обновить страницу, чтобы увидить статус.

Для вывода сообщений в результат выполнения используйте функцию `console.log`
```js
let tracks = Source.getSavedTracks();
console.log('Количество любимых треков', tracks.length);
```
> Не передавайте в `console.log` просто `tracks`. Получится большая неинформативная стена текста.

![Пример логов](/img/example-log.png)

Можно вывести названия всех треков
```js
let tracks = Source.getSavedTracks();
tracks.forEach(track => console.log(track.name));
```


Чтобы узнать сколько запросов потребовалось на выполнение, добавьте в конец функции следующую строку. Подробнее о запросах в [описании ограничений](/desc?id=Ограничения).
```
console.log('Число запросов', Request.getCountRequest());
```

## Экспресс-курс

-  `Функция`
   ```js
   function myName(){
        // Тело функции
   }
   ```

   - Ключевое слово `function` обязательно. 
   - Дальше произвольное имя, здесь это `myName`.
   - Круглые скобки `()` для перечисления аргументов (входные данные). Здесь нет аргументов.
   - Фигурные скобки `{}` определяют границу функции.
   - Символы `//` для написания комментария. 

- `Переменная`
    ```js
    let tracks = 5;
    tracks = 10;
    ```

    - Ключевое слово `let` обязательно при первом объявлении переменной.
    - Дальше произвольное имя. Здесь это `tracks`.
    - `= 5` присвоение переменной `tracks` значения `5`. Присвоение справа налево.
    - Точка с запятой `;` в данном языке необязательна. Но желательно для избежания сложных ошибок.
    - На второй строке присвоение 10. Значение 5 теряется.

-   Использование `функции` и `переменной`
    ```js
    myName(tracks);
    ```

    - Вызов функции `myName` и передача переменной `tracks`.