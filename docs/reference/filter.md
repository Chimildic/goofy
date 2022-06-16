# Filter

Методы отсеивания элементов.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [dedupArtists](/reference/filter?id=dedupartists) | - | Удалить дубликаты исполнителей. |
| [dedupTracks](/reference/filter?id=deduptracks) | - | Удалить дубликаты треков. |
| [getDateRel](/reference/filter?id=getdaterel) | Дата | Вычислить дату по смещению в днях относительно сегодня. |
| [detectLanguage](/reference/filter?id=detectlanguage) | - | Определить по тексту основной язык исполнения треков. |
| [getLastOutRange](/reference/filter?id=getlastoutrange) | Массив | Узнать треки, которые не прошли последнюю фильтрацию [rangeTracks](/reference/filter?id=rangetracks) |
| [match](/reference/filter?id=match) | - | Удалить треки, которые не удовлетворяют регулярному выражению. |
| [matchExcept](/reference/filter?id=matchexcept) | - | Оболочка для [match](/reference/filter?id=match) с инверсией. |
| [matchExceptMix](/reference/filter?id=matchexceptmix) | - | Удалить треки, содержащие слова _mix_ и _club_. |
| [matchExceptRu](/reference/filter?id=matchexceptru) | - | Удалить треки, содержащие кириллицу в названии. |
| [matchLatinOnly](/reference/filter?id=matchlatinonly) | - | Удалить все треки, кроме содержащих латиницу в названии. |
| [matchOriginalOnly](/reference/filter?id=matchoriginalonly) | - | Удалить неоригинальные версии треков. |
| [rangeDateAbs](/reference/filter?id=rangedateabs) | - | Отобрать элементы, которые входят в период по абсолютным датам добавления или прослушивания. |
| [rangeDateRel](/reference/filter?id=rangedaterel) | - | Отобрать элементы, которые входят в период по относительным датам добавления или прослушивания. |
| [rangeTracks](/reference/filter?id=rangetracks) | - | Отобрать треки, которые входят в диапазон метаданных. |
| [removeArtists](/reference/filter?id=removeartists) | - | Исключить исполнителей из массива. |
| [removeTracks](/reference/filter?id=removetracks) | - | Исключить треки из массива. |
| [removeUnavailable](/reference/filter?id=removeunavailable) | - | Исключить треки, которые нельзя прослушать. |
| [replaceWithSimilar](/reference/filter?id=replacewithsimilar) | - | Заменить треки на похожие. |

## dedupArtists

Удалить дубликаты исполнителей по _id_. Останется один элемент от одного исполнителя.

### Аргументы :id=dedupartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив | Треки или исполнители, в которых требуется удалить дубликаты исполнителей. |

### Возврат :id=dedupartists-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=dedupartists-examples {docsify-ignore}

1. Удалить дубликаты исполнителей в треках.

```js
let tracks = Source.getTracks(playlistArray);
Filter.dedupArtists(tracks);
```

1. Удалить дубликаты исполнителей из массива исполнителей.

```js
let relatedArtists = Source.getRelatedArtists(artists);
Filter.dedupArtists(relatedArtists);
```

## dedupTracks

Удалить дубликаты треков по _id_ и _name_.

### Аргументы :id=deduptracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки, в которых требуется удалить дубликаты. |
| `offsetDurationMs` | Число | Отклонение в миллисекундах, при котором идентичные по названию треки считаются одинаковыми. По умолчанию 2000 миллисекунд (2 секунды). [Подробнее](https://github.com/Chimildic/goofy/discussions/116). |

### Возврат :id=deduptracks-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=deduptracks-examples {docsify-ignore}

1. Удалить дубликаты. Отклонение указывать необязательно.

```js
let tracks = Source.getTracks(playlistArray);
Filter.dedupTracks(tracks);
```

## getDateRel

Вычислить дату по смещению в днях относительно сегодня.

### Аргументы :id=getdaterel-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `days` | Число | Смещение в днях относительно сегодня. |
| `bound` | Строка | Граница времени. При `startDay` 00:00, при `endDay` 23:59. Если не указать, останется значение от момента выполнения метода. |

### Возврат :id=getdaterel-return {docsify-ignore}

`date` (дата) - искомая дата после смещения.

### Примеры :id=getdaterel-examples {docsify-ignore}

Пример в шаблоне [любимо и забыто](/template?id=Любимо-и-забыто).

## detectLanguage

Определить по тексту основной язык исполнения треков.

!> Требуется указать параметр `MUSIXMATCH_API_KEY`, [подробнее](/guide?id=Параметры). Сервис ограничивает количество запросов в день. Используйте функцию только после сокращения массива треков другими фильтрами.

### Аргументы :id=detectlanguage-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки, для которых требуется определить основной язык исполнения. |
| `params` | Объект | Параметры фильтрации. |

#### Параметры фильтрации :id=detectlanguage-params {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `isRemoveUnknown` | Булево | Действие при неизвестном языке (когда нет в базе `musixmatch` или он танцевальный). При `true` удаляет такие треки, при `false` оставляет. По умолчанию `false`. |
| `include` | Массив | Языки, которые нужно оставить. |
| `exclude` | Массив | Языки, которые нужно удалить. |

?> Принимаются двухбуквенные обозначения языка в нижнем регистре. [Список языков](https://ru.wikipedia.org/wiki/Коды_языков).

### Возврат :id=detectlanguage-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив при указании параметров фильтрации.

К трекам добавляется объект `lyrics`, который содержит обозначение языка `lang` и краткий отрывок текста `text`.

### Примеры :id=detectlanguage-examples {docsify-ignore}

1. Берем [топ Германии](https://open.spotify.com/playlist/37i9dQZEVXbJiZcmkrIHGU?si=33fdf90a2b854fc8) и оставляем только немецкий.

```js
let tracks = Source.getPlaylistTracks('', '37i9dQZEVXbJiZcmkrIHGU');
Filter.detectLanguage(tracks, {
  isRemoveUnknown: true,
  include: ['de'],
});
```

2. Схожая ситуация, исключаем русский.

```js
let tracks = Source.getPlaylistTracks('', '37i9dQZEVXbL8l7ra5vVdB');
Filter.detectLanguage(tracks, {
  isRemoveUnknown: true,
  exclude: ['ru'],
});
```

3. Узнать какие языки есть в массиве.

```js
let tracks = Source.getPlaylistTracks('', '37i9dQZEVXbL8l7ra5vVdB');
Filter.detectLanguage(tracks, { isRemoveUnknown: true });
console.log(Array.from(new Set(tracks.map(t => t.lyrics.lang))).join('\n'));
```

?> Для набора треков на разных языках подойдет функция поиска [mineTracks](/reference/source?id=minetracks).

## getLastOutRange

Узнать треки, которые не прошли последнюю фильтрацию [rangeTracks](/reference/filter?id=rangetracks).

### Аргументы :id=getlastoutrange-arguments {docsify-ignore}

Нет аргументов.

### Возврат :id=getlastoutrange-return {docsify-ignore}

`outRangeTracks` (массив) - треки, непрошедшие фильтрацию.

### Примеры :id=getlastoutrange-examples {docsify-ignore}

1. Получить треки непрошедшие фильтрацию.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeTracks(tracks, args);
let outRangeTracks = Filter.getLastOutRange();
```

## match

Удалить треки, которые не удовлетворяют регулярному выражению по названию трека, альбома и исполнителя.

### Аргументы :id=match-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив | Треки или исполнители для проверки регулярным выражением. |
| `strRegex` | Строка | Значение регулярного выражения |
| `invert` | Булево | Если `true` инвертирует результат. По умолчанию `false`. |

### Возврат :id=match-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=match-examples {docsify-ignore}

1. Удалить треки, содержащие в своем названии слова _cover_ или _live_.

```js
let tracks = Source.getTracks(playlistArray);
Filter.match(tracks, 'cover|live', true);
```

## matchExcept

Оболочка для [match](/reference/filter) с `invert = true`.

### Аргументы :id=matchexcept-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив | Треки или исполнители для проверки регулярным выражением. |
| `strRegex` | Строка | Значение регулярного выражения |

### Возврат :id=matchexcept-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=matchexcept-examples {docsify-ignore}

1. Удалить треки, содержащие в своем названии слова _cover_ или _live_.

```js
let tracks = Source.getTracks(playlistArray);
Filter.matchExcept(tracks, 'cover|live');
```

## matchExceptMix

Удалить треки, содержащие слова _mix_ и _club_. Оболочка для [matchExcept](/reference/filter?id=matchexcept) с аргументом `strRegex = 'mix|club'`.

### Аргументы :id=matchexceptmix-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки для проверки регулярным выражением. |

### Возврат :id=matchexceptmix-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=matchexceptmix-examples {docsify-ignore}

1. Удалить треки, содержащие в своем названии слова _mix_ или _club_.

```js
let tracks = Source.getTracks(playlistArray);
Filter.matchExceptMix(tracks);
```

## matchExceptRu

Удалить треки, содержащие кириллицу в названии. Оболочка для [matchExcept](/reference/filter?id=matchexcept) с аргументом `strRegex = '[а-яА-ЯёЁ]+'`.

?> Для фильтра по языку трека используйте [detectLanguage](/reference/filter?id=detectlanguage).

### Аргументы :id=matchexceptru-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки для проверки регулярным выражением. |

### Возврат :id=matchexceptru-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=matchexceptru-examples {docsify-ignore}

1. Удалить треки c кириллицей в названии.

```js
let tracks = Source.getTracks(playlistArray);
Filter.matchExceptRu(tracks);
```

## matchLatinOnly

Удалить все треки, кроме содержащих латиницу в названии. Оболочка для [match](/reference/filter?id=match) с аргументом `strRegex = '^[a-zA-Z0-9 ]+$'`.

?> Для фильтра по языку трека используйте [detectLanguage](/reference/filter?id=detectlanguage).

### Аргументы :id=matchlatinonly-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки для проверки регулярным выражением. |

### Возврат :id=matchlatinonly-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=matchlatinonly-examples {docsify-ignore}

1. Оставить только треки с латиницей в названии.

```js
let tracks = Source.getTracks(playlistArray);
Filter.matchLatinOnly(tracks);
```

## matchOriginalOnly

Удалить неоригинальные версии треков. Оболочка для [matchExcept](/reference/filter?id=matchexcept) с аргументом `strRegex = 'mix|club|radio|piano|acoustic|edit|live|version|cover|karaoke'`.

### Аргументы :id=matchoriginalonly-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки для проверки регулярным выражением. |

### Возврат :id=matchoriginalonly-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=matchoriginalonly-examples {docsify-ignore}

1. Оставить оригинальные версии треков.

```js
let tracks = Source.getTracks(playlistArray);
Filter.matchOriginalOnly(tracks);
```

## rangeDateAbs

Отобрать элементы, которые входят в период по абсолютным датам. Проверяется дата добавления или прослушивания.

?> Для фильтра по дате релиза альбома используйте [rangeTracks](/reference/filter?id=rangetracks).

### Аргументы :id=rangedateabs-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив | Проверяемые элементы. |
| `startDate` | Дата | Начало абсолютного периода. |
| `endDate` | Дата | Конец абсолютного периода. |

Формат даты `YYYY-MM-DDTHH:mm:ss.sss`, где
- `YYYY-MM-DD` - год, месяц, день
- `T` - разделитель для указания времени. Указать, если добавляется время.
- `HH:mm:ss.sss` - часы, минуты, секунды, миллисекунды

### Возврат :id=rangedateabs-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=rangedateabs-examples {docsify-ignore}

1. Треки, добавленные между 1 и 3 сентября.

```js
let tracks = Source.getTracks(playlistArray);
let startDate = new Date('2020-09-01');
let endDate = new Date('2020-09-03');
Filter.rangeDateAbs(tracks, startDate, endDate);
```

2. Треки, добавленные с 1 августа 15:00 по 20 августа 10:00.

```js
let tracks = Source.getTracks(playlistArray);
let startDate = new Date('2020-08-01T15:00');
let endDate = new Date('2020-08-20T10:00');
Filter.rangeDateAbs(tracks, startDate, endDate);
```

3. Треки, добавленные с 1 сентября по текущую дату и время.

```js
let tracks = Source.getTracks(playlistArray);
let startDate = new Date('2020-09-01');
let endDate = new Date();
Filter.rangeDateAbs(tracks, startDate, endDate);
```

## rangeDateRel

Отобрать элементы, которые входят в период по относительным датам. Проверяется дата добавления или прослушивания.

!> Если элемент не содержит даты, устанавливается 01.01.2000. Такое возможно, например, если трек добавлен в Spotify очень давно, источником является [getTopTracks](/reference/source?id=gettoptracks), это плейлисты "Мой микс дня #N" или ряд других источников.

### Аргументы :id=rangedaterel-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `items` | Массив | Проверяемые элементы. |
| `sinceDays` | Число | Начало относительного периода. |
| `beforeDays` | Число | Конец относительного периода. |

На схеме пример для `sinceDays = 7` и `beforeDays = 2`. То есть получить элементы, добавленные в плейлист с 3 сентября 00:00 по 8 сентября 23:59 относительно сегодня, 10 сентября.

![Пример использования sinceDays и beforeDays](../img/DaysRel.png ':size=60%')

?> Механизм получения даты начала отслеживания исполнителя описан [на форуме](https://github.com/Chimildic/goofy/discussions/98)

### Возврат :id=rangedaterel-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=rangedaterel-examples {docsify-ignore}

1. Треки, добавленные за последние 5 дней и сегодня.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeDateRel(tracks, 5);
// аналогично Filter.rangeDateRel(tracks, 5, 0);
```

2. Треки за последние 7 дней исключая сегодня.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeDateRel(tracks, 7, 1);
```

3. Треки за один день, который был 14 дней назад.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeDateRel(tracks, 14, 14);
```

4. Треки только за сегодня.
```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeDateRel(tracks);
// аналогично Filter.rangeDateRel(tracks, 0, 0);
```

## rangeTracks

Отобрать треки, которые входят в диапазон метаданных.

### Аргументы :id=rangetracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Проверяемые треки. |
| `params` | Объект | Параметры отбора. |

!> Функция запрашивает дополнительные данные. Чтобы сократить число запросов, используйте ее после сокращения массива треков другими способами (например, [rangeDateRel](/reference/filter?id=rangedaterel), [match](/reference/filter?id=match) и другие). Полученные данные кэшируются для **текущего** выполнения. Повторный вызов функции или сортировка [sort](/reference/order?id=sort) с теми же категориями не отправляют новых запросов.

#### Параметры отбора :id=rangetracks-params {docsify-ignore}

Ниже пример объекта `params` со всеми допустимыми условиями проверки. [Описание параметров](/guide?id=Описание-параметров-объектов).

```js
let params = {
    meta: {
        popularity: { min: 0, max: 100 },
        duration_ms: { min: 0, max: 10000 },
        explicit: false,
    },
    artist: {
        popularity: { min: 0, max: 100 },
        followers: { min: 0, max: 100000 },
        genres: ['indie'],
        ban_genres: ['rap', 'pop'],
        isRemoveUnknownGenre: false,
    },
    features: {
        acousticness: { min: 0.0, max: 1.0 },
        danceability: { min: 0.0, max: 1.0 },
        energy: { min: 0.0, max: 1.0 },
        instrumentalness: { min: 0.0, max: 1.0 },
        liveness: { min: 0.0, max: 1.0 },
        loudness: { min: -60, max: 0 },
        speechiness: { min: 0.0, max: 1.0 },
        valence: { min: 0.0, max: 1.0 },
        tempo: { min: 30, max: 210 },
        key: 0,
        mode: 0,
        time_signature: 1,

        // вычисляемые https://github.com/Chimildic/goofy/discussions/87
        anger: { min: 0.0, max: 1.0 },
        happiness: { min: 0.0, max: 1.0 },
        sadness: { min: 0.0, max: 1.0 }, 
        
        // дублирует args.meta.duration_ms, достаточно одного (выбор зависит от категории)
        duration_ms: { min: 0, max: 10000 },
    },
    album: {
        popularity: { min: 30, max: 70 },
        album_type: ['single', 'album'],
        release_date: { sinceDays: 6, beforeDays: 0 },
        // или release_date: { startDate: new Date('2020.11.30'), endDate: new Date('2020.12.30') },
    },
};
```

### Возврат :id=rangetracks-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=rangetracks-examples {docsify-ignore}

1. Удалить треки жанра рэп.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeTracks(tracks, {
    artist: {
      ban_genres: ['rap'],
    }
});
```

2. Отобрать треки в жанре инди и альтернативы.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeTracks(tracks, {
    artist: {
        genres: ['indie', 'alternative'],
    },
});
```

3. Отобрать малопопулярные треки от малоизвестных исполнителей.

```js
let tracks = Source.getTracks(playlistArray);
Filter.rangeTracks(tracks, {
    meta: {
      popularity: { min: 0, max: 49 },
    },
    artist: {
      followers: { min: 0, max: 9999 },
    },
});
```

## removeArtists

Исключить исполнителей из массива. Совпадение определяется по _id_ исполнителя трека.

### Аргументы :id=removeartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `original` | Массив | Проверяемые треки или исполнители. |
| `removable` | Массив | Треки или исполнители, которые нужно исключить. |
| `invert` | Булево | Инверсия результата. Если `true` удалять все, кроме `removable`. По умолчанию `false`. |
| `mode` | Строка | Режим выбора исполнителей. При `every` проверка каждого, при `first` только первого (как правило основной). По умолчанию `every`. |

### Возврат :id=removeartists-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=removeartists-examples {docsify-ignore}

1. Получить треки плейлистов и исключить исполнителей любимых треков.

```js
let sourceArray = Source.getTracks(playlistArray);
let removedArray = Source.getSavedTracks();
Filter.removeArtists(sourceArray, removedArray);
```

## removeTracks

Исключить треки из массива. Совпадение определяется по _id_ трека и по названию трека вместе с исполнителем.

?> Существует вероятность столкнуться с [проблемой релинка](https://github.com/Chimildic/goofy/discussions/99) при удалении истории прослушиваний.

### Аргументы :id=removetracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `original` | Массив | Проверяемые треки. |
| `removable` | Массив | Треки, которые нужно исключить. |
| `invert` | Булево | Инверсия результата. Если `true` удалять все, кроме `removable`. По умолчанию `false`. |
| `mode` | Строка | Режим выбора исполнителей. При `every` проверка каждого, при `first` только первого (как правило основной). По умолчанию `every`. |

### Возврат :id=removetracks-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=removetracks-examples {docsify-ignore}

1. Получить треки плейлистов и исключить любимые треки.

```js
let sourceArray = Source.getTracks(playlistArray);
let removedArray = Source.getSavedTracks();
Filter.removeTracks(sourceArray, removedArray);
```

## removeUnavailable

Исключить треки, которые нельзя прослушать. Не заменяет оригинал на аналог. То есть нет переадресации на другой трек, подробнее в [проблеме релинка](https://github.com/Chimildic/goofy/discussions/99). Совершает дополнительные запросы (1 на 50 треков) в случае, если трек находится в неопределенном состоянии.

?> Допустимо применять фильтр для треков из `Cache`, прошедших метод [compressTracks](/reference/cache?id=compresstracks). Если метод не применялся, состояние определяется по значению в кэшированном треке.

### Аргументы :id=removeunavailable-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Проверяемые треки. |
| `market` | Строка | Страна, в которой проверяется доступность треков. По умолчанию страна аккаунта. |

### Возврат :id=removeunavailable-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=removeunavailable-examples {docsify-ignore}

1. Удалить недоступные в России треки плейлиста.

```js
let tracks = Source.getPlaylistTracks('', 'id');
Filter.removeUnavailable(tracks, 'RU');
```

## replaceWithSimilar

Заменить треки на похожие. На одну замену N случайных треков из результатов [getRecomTracks](/reference/source?id=getrecomtracks). Рекомендации запрашиваются с параметрами `target_*` от исходного трека. Когда замены нет, трек удаляется.

### Аргументы :id=replacewithsimilar-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры замены. |

### Параметры замены :id=replacewithsimilar-params {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `origin` | Массив | Проверяемые треки. |
| `replace` | Массив | Треки, которые нужно заменить. |
| `count` | Число | Количество рекомендованных треков на место оригинала. По умолчанию 1, максимум 100. Выходное количество может быть меньше из-за отсутствия рекомендаций или фильтрации. |
| `isRemoveOriginArtists` | Булево | При `true` удаляет из рекомендаций исполнителей, встречающихся в `origin`. При `false` оставляет. По умолчанию `false`. |

### Возврат :id=replacewithsimilar-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=replacewithsimilar-examples {docsify-ignore}

1. Заменить недавно игравшие треки и лайки плейлиста на близкие аналоги.

```js
let tracks = Source.getPlaylistTracks('', 'id');
Filter.replaceWithSimilar({
    origin: tracks,
    replace: [RecentTracks.get(2000), Source.getSavedTracks()],
    count: 3
});
```

2. Получить рекомендации по любимым трекам без участия исходных исполнителей.

```js
let tracks = Source.getSavedTracks();
Filter.replaceWithSimilar({
  origin: tracks,
  replace: tracks,
  isRemoveOriginArtists: true,
})
```
