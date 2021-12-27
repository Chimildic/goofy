# Search

Методы поиска. Используются другими функциями. Понадобится только для индивидуальных решений.

### find*

Возвращает массив с результатами поиска по ключевому слову для типов: плейлист, трек, альбом, исполнитель.

Аргументы
- (массив) `keywords` - перечень ключевых слов, только строки. На каждое в результатах будет свой массив.
- (число) `requestCount` - количество запросов на **одно** ключевое слово. На один запрос 50 объектов, если они есть. Максимум 40 запросов. По умолчанию 1.

Пример 1 - Найти 100 плейлистов по слову `rain`

?> Лучшим способом будет функция [mineTracks](/func?id=minetracks). Прямое использование модуля Search нужно для решений, которые не реализованы по умолчанию. Например, при [импорте треков с FM-радио](https://github.com/Chimildic/goofy/discussions/35).

```js
let keywords = ['rain'];
let playlists = Search.findPlaylists(keywords, 2);
```

### getNoFound

Возвращает массив с ключевыми словами и типом поиска, для которых не нашлось результатов за текущее выполнение скрипта. 

Аргументов нет.

```js
let noFound = Search.getNoFound();
// структура: { type: '', keyword: '', item: {} }
```

### multisearch*

Возвращается лучшее совпадение по ключевому словаму трека/исполнителя/альбома

Аргументы
- (массив) `items` - перебираемые элементы
- (функция) `parseNameMethod` - коллбэк, вызываемый для каждого элемента. Должен вернуть строку, являющуюся ключевым словом для поиска.

Пример 1 - Когда массив элементов с простым текстом
```js
let keywords = ['skillet', 'skydive'];
let artists = Search.multisearchArtists(keywords, (i) => i);
```

Пример 2 - Когда массив элементов со сложной структурой
```js
let tracks = Search.multisearchTracks(items, (item) => {
    return `${item.artist} ${item.title}`.formatName();
});
```

### sendMusicRequest

Заполняет форму [music request](https://docs.google.com/forms/d/e/1FAIpQLScMGwTBnCz8nOPkM5g9IwwbpKolEWOXkhpAUSl8JjlkKcBGKw/viewform) данными из [getNoFound](/func?id=getnofound). То есть отправляет запрос на добавление исполнителей или треков, которых не удалось найти в Spotify.

?> Эксперимент. Используйте после запросов к lastfm, например `getCustomTop`, в конце функции.

Аргумент
- (объект) `context` - контекст текущего массива ненайденных элементов для сохранения в кэш файл `NoFoundItems`. Позволит выполнить повторный поиск позже, а также узнать куда планировалось добавлять элемент.

Пример 1 - Выполнить некоторый поиск треков в lastfm и отправить запрос на добавления для ненайденных
```js
let tracks = Lastfm.getCustomTop({
  user: KeyValue.LASTFM_LOGIN,
  from: '2013-01-01',
  to: '2013-12-12',
});
Search.sendMusicRequest({ name: 'Топ 2013', id: 'abc' });
```

Пример 2 - Повторный поиск треков, который планировали добавить в плейлист с `id = abc` 
```js
let file = Cache.read('NoFoundItems');
let itemTracks = file.filter(i => i.context.id == 'abc').map(i => i.items).flat(1);
let tracks = Search.multisearchTracks(itemTracks, (item) => item.keyword);
```
