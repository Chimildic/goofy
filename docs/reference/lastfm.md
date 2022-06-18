# Lastfm

Методы взаимодействия с Last.fm.

!> Эквивалент треков находится поиском Spotify по наилучшему совпадению. Если совпадения нет, трек игнорируется. Один трек Last.fm равен одному запросу поиска. Будьте внимательны с [ограничениями](/details?id=Ограничения) по количеству запросов в день и временем выполнения.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [convertToSpotify](/reference/lastfm?id=converttospotify) | Массив | Найти Spotify элементы по данным из Last.fm. |
| [getAlbumsByTag](/reference/lastfm?id=getalbumsbytag) | Массив | Получить альбомы по тегу. |
| [getArtistsByTag](/reference/lastfm?id=getartistsbytag) | Массив | Получить исполнителей по тегу. |
| [getCustomTop](/reference/lastfm?id=getcustomtop) | Массив | Получить произвольный топ пользователя. |
| [getLibraryStation](/reference/lastfm?id=getlibrarystation) | Массив | Получить треки с радиостанции _библиотека_. |
| [getLovedTracks](/reference/lastfm?id=getlovedtracks) | Массив | Получить _лайки_ Last.fm. |
| [getMixStation](/reference/lastfm?id=getmixstation) | Массив | Получить треки с радиостанции _микс_. |
| [getNeighboursStation](/reference/lastfm?id=getneighboursstation) | Массив | Получить треки с радиостанции _соседи_. |
| [getRecentTracks](/reference/lastfm?id=getrecenttracks) | Массив | Получить историю прослушиваний пользователя Last.fm.  |
| [getRecomStation](/reference/lastfm?id=getrecomstation) | Массив | Получить треки с радиостанции _рекомендации_. |
| [getSimilarArtists](/reference/lastfm?id=getsimilarartists) | Массив | Получить похожих исполнителей. |
| [getSimilarTracks](/reference/lastfm?id=getsimilartracks) | Массив | Получить похожие треки. |
| [getTopAlbums](/reference/lastfm?id=gettopalbums) | Массив | Получить топ альбомов пользователя. |
| [getTopAlbumsByTag](/reference/lastfm?id=gettopalbumsbytag) | Массив | Получить топ альбомов по тегу. |
| [getTopArtists](/reference/lastfm?id=gettopartists) | Массив | Получить топ исполнителей пользователя. |
| [getTopArtistsByTag](/reference/lastfm?id=getTopArtistsByTag) | Массив | Получить топ исполнителей по тегу. |
| [getTopTracks](/reference/lastfm?id=gettoptracks) | Массив | Получить топ треков пользователя. |
| [getTopTracksByTag](/reference/lastfm?id=gettoptracksbytag) | Массив | Получить топ треков по тегу. |
| [getTracksByTag](/reference/lastfm?id=gettracksbytag) | Массив | Получить треки по тегу. |
| [rangeTags](/reference/lastfm?id=rangetags) | - | Отобрать треки по тегам. |
| [removeRecentArtists](/reference/lastfm?id=removerecentartists) | - | Удалить исполнителей по данным истории прослушиваний Last.fm. |
| [removeRecentTracks](/reference/lastfm?id=removerecenttracks) | - | Удалить треки по данным истории прослушиваний Last.fm. |

## convertToSpotify

Найти Spotify элементы по данным из Last.fm.

### Аргументы :id=converttospotify-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Строка | Элементы в lastfm-формате. Например, полученные от [getCustomTop](/reference/lastfm?id=getcustomtop) при `isRawItems = true`. |
| `type` | Строка | Тип поиска: `track`, `artist` или `album`. По умолчанию `track`. |

### Возврат :id=converttospotify-return {docsify-ignore}

`items` (массив) - результат поиска.

## getAlbumsByTag

Получить альбомы по тегу. Парсит названия со страницы тега, [например](https://www.last.fm/tag/indie/albums).

### Аргументы :id=getalbumsbytag-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tag` | Строка | Название тега. |
| `limit` | Число | Предельное количество альбомов. |

### Возврат :id=getalbumsbytag-return {docsify-ignore}

`albums` (массив) - результат поиска альбомов в Spotify.

### Примеры :id=getalbumsbytag-examples {docsify-ignore}

1. Получить альбомы по тегу.

```js
let albums = Lastfm.getAlbumsByTag('indie', 40);
```

## getArtistsByTag

Получить исполнителей по тегу. Парсит имена со страницы тега, [например](https://www.last.fm/tag/pixie/artists).

### Аргументы :id=getartistsbytag-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tag` | Строка | Название тега. |
| `limit` | Число | Предельное количество исполнителей. |

### Возврат :id=getartistsbytag-return {docsify-ignore}

`artists` (массив) - результат поиска исполнителей в Spotify.

### Примеры :id=getartistsbytag-examples {docsify-ignore}

1. Получить исполнителей по тегу.

```js
let artists = Lastfm.getArtistsByTag('pixie', 40);
```

## getCustomTop

Получить произвольный топ пользователя.

?> На форуме есть [подробный пример](https://github.com/Chimildic/goofy/discussions/91) использования, позволяющий получить _рекомендации из прошлого_

### Аргументы :id=getcustomtop-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. |

#### Параметры отбора :id=getcustomtop-params {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Объект | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `from` | Дата/Строка/Число | Начало периода. |
| `to` | Дата/Строка/Число | Конец периода. |
| `type` | Строка | Тип: `track`, `artist` или `album`. По умолчанию `track`. |
| `count` | Число | Количество элементов. По умолчанию 40. |
| `offset` | Число | Пропуск первых N элементов. По умолчанию 0. |
| `minPlayed` | Число | Минимальное количество прослушиваний включительно. По умолчанию 0. |
| `maxPlayed` | Число | Максимальное количество прослушиваний включительно. По умолчанию 100 тысяч. |
| `isRawItems` | Булево | Когда не указано или `false`, поиск элементом по названию в Spotify. Если `true`, результат из lastfm-элементов. Игнорируются `count` и `offset`. Может понадобится для самостоятельной фильтрации. Затем используйте функцию [convertToSpotify](/reference/lastfm?id=converttospotify). |

### Возврат :id=getcustomtop-return {docsify-ignore}

`items` (массив) - результат отбора, отсортированный по количеству прослушиваний (в случае `isRawItems = false`).

К объектам результата добавится ключ `countPlayed` со значением числа прослушиваний.

### Примеры :id=getcustomtop-examples {docsify-ignore}

1. Отобрать топ 40 треков за 2015 год

```js
let topTracks = Lastfm.getCustomTop({
    from: '2015-01-01', // или new Date('2015-01-01'),
    to: '2015-12-31', // или new Date('2015-12-31').getTime(),
});
```

2. Отобрать топ 10 исполнителей за первое полугодие 2014 года

```js
let topArtists = Lastfm.getCustomTop({
    type: 'artist',
    from: '2014-01-01',
    to: '2014-06-30',
    count: 10,
});
```

## getLibraryStation

Получить треки с радиостанции _библиотека_ Last.fm. Содержит только заскроббленные треки. Внимание на предупреждение из [getRecentTracks](/reference/lastfm?id=getrecenttracks).

### Аргументы :id=getlibrarystation-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `countRequest` | Число | Количество запросов к Last.fm. Один запрос дает примерно от 20 до 30 треков. |

### Возврат :id=getlibrarystation-return {docsify-ignore}

`tracks` (массив) - результат поиска треков по названию в Spotify.

### Примеры :id=getlibrarystation-examples {docsify-ignore}

1. Получить треки радиостанции _библиотека_.

```js
let tracks = Lastfm.getLibraryStation('login', 2);
```

## getLovedTracks

Получить _лайки_ Last.fm. Внимание на предупреждение из [getRecentTracks](/reference/lastfm?id=getrecenttracks). Включает дату добавления, можно использовать фильтр по дате.

### Аргументы :id=getlovedtracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `limit` | Число | Ограничить количество треков. |

### Возврат :id=getlovedtracks-return {docsify-ignore}

`tracks` (массив) - результат поиска треков по названию в Spotify.

### Примеры :id=getlovedtracks-examples {docsify-ignore}

1. Получить _лайки_ Last.fm.

```js
let tracks = Lastfm.getLovedTracks('login', 200);
```

## getMixStation

Получить треки с радиостанции _микс_ Last.fm. Содержит заскроббленные треки и рекомендации Last.fm. Внимание на предупреждение из [getRecentTracks](/reference/lastfm?id=getrecenttracks).

### Аргументы :id=getmixstation-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `countRequest` | Число | Количество запросов к Last.fm. Один запрос дает примерно от 20 до 30 треков. |

### Возврат :id=getmixstation-return {docsify-ignore}

`tracks` (массив) - результат поиска треков по названию в Spotify.

### Примеры :id=getmixstation-examples {docsify-ignore}

1. Получить треки радиостанции _микс_.

```js
let tracks = Lastfm.getMixStation('login', 2);
```

## getNeighboursStation

Получить треки с радиостанции _соседи_ Last.fm. Содержит треки, которые слушают пользователи Last.fm со схожими музыкальными вкусами. Внимание на предупреждение из [getRecentTracks](/reference/lastfm?id=getrecenttracks).

### Аргументы :id=getneighboursstation-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `countRequest` | Число | Количество запросов к Last.fm. Один запрос дает примерно от 20 до 30 треков. |

### Возврат :id=getneighboursstation-return {docsify-ignore}

`tracks` (массив) - результат поиска треков по названию в Spotify.

### Примеры :id=getneighboursstation-examples {docsify-ignore}

1. Получить треки радиостанции _соседи_.

```js
let tracks = Lastfm.getNeighboursStation('login', 2);
```

## getRecentTracks

Получить историю прослушиваний пользователя Last.fm. В настройках аккаунта должна быть отключена приватность.

### Аргументы :id=getrecenttracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `count` | Число | Ограничить количество треков. |

### Возврат :id=getrecenttracks-return {docsify-ignore}

`tracks` (массив) - результат поиска треков по названию в Spotify.

### Примеры :id=getrecenttracks-examples {docsify-ignore}

1. Получить 200 недавно прослушанных треков.

```js
let tracks = Lastfm.getRecentTracks('login', 200);
```

## getRecomStation

Получить треки с радиостанции _рекомендации_ Last.fm. Внимание на предупреждение из [getRecentTracks](/reference/lastfm?id=getrecenttracks).

### Аргументы :id=getrecomstation-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `countRequest` | Число | Количество запросов к Last.fm. Один запрос дает примерно от 20 до 30 треков. |

### Возврат :id=getrecomstation-return {docsify-ignore}

`tracks` (массив) - результат поиска треков по названию в Spotify.

### Примеры :id=getrecomstation-examples {docsify-ignore}

1. Получить треки радиостанции _рекомендации_.

```js
let tracks = Lastfm.getRecomStation('login', 2);
```

## getSimilarArtists

Получить похожих исполнителей.

### Аргументы :id=getsimilarartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив | Треки или исполнители. Значимо только `name`. |
| `match` | Число | Минимальное значение схожести исполнителя в границе от _0.0_ до _1.0_.  |
| `limit` | Число | Количество похожих исполнителей на одного оригинального. |
| `isFlat` | Число | Если `false` результат группируется по исполнителям. Если `true` все исполнители в одном массиве. По умолчанию `true`. |

### Возврат :id=getsimilarartists-return {docsify-ignore}

`artists` (массив) - результат поиска исполнителей в Spotify.

### Примеры :id=getsimilarartists-examples {docsify-ignore}

1. Получить исполнителей похожих на отслеживаемых.

```js
let artists = Source.getArtists({ followed_include: true, });
let similarArtists = Lastfm.getSimilarArtists(artists, 0.65, 20);
```

## getSimilarTracks

Получить похожие треки.

### Аргументы :id=getsimilartracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки или исполнители. Значимо только `name`. |
| `match` | Число | Минимальное значение схожести трека в границе от _0.0_ до _1.0_.  |
| `limit` | Число | Количество похожих треков на один оригинальный. |
| `isFlat` | Число | Если `false` результат группируется по входным трекам. Если `true` все треки в одном массиве. По умолчанию `true`. |

### Возврат :id=getsimilartracks-return {docsify-ignore}

`tracks` (массив) - результат поиска треков в Spotify.

### Примеры :id=getsimilartracks-examples {docsify-ignore}

1. Получить треки похожие на треки плейлиста.

```js
let playlistTracks = Source.getPlaylistTracks('name', 'id');
let similarTracks = Lastfm.getSimilarTracks(playlistTracks, 0.65, 30);
```

## getTopAlbums

Получить топ альбомов пользователя.

### Аргументы :id=gettopalbums-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. Аналогично параметрам [getTopTracks](/reference/lastfm?id=gettoptracks). |

### Возврат :id=gettopalbums-return {docsify-ignore}

`albums` (массив) - результат поиска альбомов в Spotify.

### Примеры :id=gettopalbums-examples {docsify-ignore}

1. Получить топ-10 альбомов за полгода.

```js
let albums = Lastfm.getTopAlbums({
  user: 'login',
  period: '6month',
  limit: 10
});
```

## getTopAlbumsByTag

Получить топ альбомов по тегу.

### Аргументы :id=gettopalbumsbytag-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. |

#### Параметры отбора :id=gettopalbumsbytag-params {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tag` | Строка | Название тега. |
| `limit` | Число | Количество альбомов на странице. По умолчанию 50. Можно больше, но в этом случае Last.fm иногда дает другое количество. |
| `page` | Число | Номер страницы, используется для сдвига по результату. По умолчанию 1. |

### Возврат :id=gettopalbumsbytag-return {docsify-ignore}

`albums` (массив) - результат поиска альбомов в Spotify.

### Примеры :id=gettopalbumsbytag-examples {docsify-ignore}

1. Получить альбомы с 51-100 по тегу рок

```js
let albums = Lastfm.getTopAlbumsByTag({
    tag: 'rock',
    page: 2,
})
```

## getTopArtists

Получить топ исполнителей пользователя.

### Аргументы :id=gettopartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. Аналогично параметрам [getTopTracks](/reference/lastfm?id=gettoptracks). |

### Возврат :id=gettopartists-return {docsify-ignore}

`artists` (массив) - результат поиска исполнителей в Spotify.

### Примеры :id=gettopartists-examples {docsify-ignore}

1. Получить топ-10 исполнителей за полгода.

```js
let artists = Lastfm.getTopArtists({
  user: 'login',
  period: '6month',
  limit: 10
});
```

## getTopArtistsByTag

Получить топ исполнителей по тегу.

### Аргументы :id=gettopartistsbytag-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. Аналогично параметрам [getTopAlbumsByTag](/reference/lastfm?id=gettopalbumsbytag). |

### Возврат :id=gettopartistsbytag-return {docsify-ignore}

`artists` (массив) - результат поиска исполнителей в Spotify.

### Примеры :id=gettopartistsbytag-examples {docsify-ignore}

1. Получить вторую десятку исполнителей из топа инди.

```js
let artists = Lastfm.getTopArtistsByTag({
    tag: 'indie',
    limit: 10,
    page: 2,
})
```

## getTopTracks

Получить топ треков пользователя.

### Аргументы :id=gettoptracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. |

#### Параметры отбора :id=gettoptracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `period` | Строка | Одно из значений: _overall_, _7day_, _1month_, _3month_, _6month_, _12month_. |
| `limit` | Число | Ограничить количество треков. |

### Возврат :id=gettoptracks-return {docsify-ignore}

`artists` (массив) - результат поиска исполнителей в Spotify.

### Примеры :id=gettoptracks-examples {docsify-ignore}

1. Получить топ-40 треков за полгода.

```js
let tracks = Lastfm.getTopTracks({
  user: 'ваш логин',
  period: '6month',
  limit: 40
});
```

## getTopTracksByTag

Получить топ треков по тегу.

### Аргументы :id=gettoptracksbytag-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры отбора. Аналогично параметрам [getTopAlbumsByTag](/reference/lastfm?id=gettopalbumsbytag). |

### Возврат :id=gettoptracksbytag-return {docsify-ignore}

`tracks` (массив) - результат поиска треков в Spotify.

### Примеры :id=gettoptracksbytag-examples {docsify-ignore}

1. Получить топ 20 по тегу поп.

```js
let tracks = Lastfm.getTopTracksByTag({
    tag: 'pop',
    limit: 20,
})
```

## getTracksByTag

Получить треки по тегу. Парсит названия со страницы тега, [например](https://www.last.fm/ru/tag/vocal/tracks?page=1).

### Аргументы :id=gettracksbytag-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tag` | Строка | Название тега. |
| `limit` | Число | Предельное количество треков. |

### Возврат :id=gettracksbytag-return {docsify-ignore}

`tracks` (массив) - результат поиска треков в Spotify.

### Примеры :id=gettracksbytag-examples {docsify-ignore}

1. Получить треки по тегу.

```js
let tracks = Lastfm.getTracksByTag('vocal', 40);
```

2. Получить треки по нескольким тегам.

```js
let tracks = ['rock', 'indie', 'pixie'].reduce((tracks, tag) => 
    Combiner.push(tracks, Lastfm.getTracksByTag(tag, 100)), []);
```

## rangeTags

Отобрать треки по тегам.

### Аргументы :id=rangetags-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `spotifyTracks` | Массив | Проверяемые Spotify треки. |
| `params` | Объект | Параметры отбора. |

### Параметры отбора :id=rangetags-params {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `include` | Массив | Объекты тегов. Если есть у трека (хотя бы один), он сохраняется. |
| `exclude` | Массив | Объекты тегов. Если есть у трека (хотя бы один), он удаляется. |
| `isRemoveUnknown` | Булеов | При `true` треки без тегов удаляются. При `false` остаются. По умолчанию `false`. |

### Возврат :id=rangetags-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=rangetags-examples {docsify-ignore}

1. Оставить из недавних любимых треков только рок, исключая инди. Так как теги проставляются пользователями, у них есть показатель популярности (до 100). `minCount` - минимальное значение показателя включительно. Если будет меньше, трек удаляется не смотря на наличие тега.

```js
let tracks = Source.getSavedTracks(20);
Lastfm.rangeTags(tracks, {
  isRemoveUnknown: true,
  include: [
    { name: 'rock', minCount: 10 },
  ],
  exclude: [
    { name: 'indie', minCount: 10 },
  ]
});
```

2. Добавить к трекам теги, удалить неизвестные.

```js
let tracks = Source.getSavedTracks(20);
Lastfm.rangeTags(tracks, {
  isRemoveUnknown: true,
});
```

## removeRecentArtists

Удалить исполнителей по данным истории прослушиваний Last.fm.

### Аргументы :id=removerecentartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `original` | Массив | Треки, в которых нужно удалить элементы. |
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `count` | Число | Количество треков истории прослушиваний. По умолчанию 600. |
| `mode` | Строка | Режим выбора исполнителей. При `every` проверка каждого, при `first` только первого (как правило основной). По умолчанию `every`. |

### Возврат :id=removerecentartists-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

## removeRecentTracks

Удалить треки по данным истории прослушиваний Last.fm.

### Аргументы :id=removerecenttracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `original` | Массив | Треки, в которых нужно удалить элементы. |
| `user` | Строка | Логин пользователя Last.fm. По умолчанию используется значение из `config-файла`. |
| `count` | Число | Количество треков истории прослушиваний. По умолчанию 600. |
| `mode` | Строка | Режим выбора исполнителей. При `every` проверка каждого, при `first` только первого (как правило основной). По умолчанию `every`. |

### Возврат :id=removerecenttracks-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=removerecenttracks-examples {docsify-ignore}

1. Создать плейлист с любимыми треками, которые не были прослушаны за последнюю тысячу скробблов.

```js
let savedTracks = Source.getSavedTracks();
Lastfm.removeRecentTracks(savedTracks, 'login', 1000)
Playlist.saveAsNew({
  name: 'Давно не слушал',
  tracks: savedTracks,
});
```
