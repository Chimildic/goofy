# Selector

Методы отбора и ветвления.

### isDayOfWeek

Возвращает булево значение: `true` если сегодня день недели `strDay` и `false` если нет.

Аргументы
- (строка) `strDay` - день недели.
- (строка) `locale` - локаль дня недели. По умолчанию `en-US`, для которой допустимы значения: `sunday`, `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`.

Пример использования
```js
if (Selector.isDayOfWeek('friday')){
    // сегодня пятница
} else {
    // другой день недели
}
```

### isDayOfWeekRu

Возвращает булево значение: `true` если сегодня день недели `strDay` и `false` если нет. Значение дня недели кириллицей.

Аргументы
- (строка) `strDay` - день недели. Допустимые значения: `понедельник`, `вторник`, `среда`, `четверг`, `пятница`, `суббота`, `воскресенье`.

Пример использования
```js
if (Selector.isDayOfWeekRu('понедельник')){
    // сегодня понедельник
} else if (Selector.isDayOfWeekRu('среда')) {
    // сегодня среда
} else {
    // другой день недели
}
```

### isWeekend

Возвращает булево значение: `true` если сегодня суббота или пятница и `false` если нет.

Аргументов нет.

Пример использования
```js
if (Selector.isWeekend()){
    // сегодня выходной
} else {
   // будни
}
```

### keepAllExceptFirst / sliceAllExceptFirst

Изменяет / возвращает массив, состоящий из всех элементов массива `array` кроме `skipCount` первых.

> Разница функций `keep*` и `slice*`:
> 
> - `keep*` изменяет содержимое оригинального массива, 
> - `slice*` возвращает новый массив, не изменяя оригинала.

Аргументы
- (массив) `array` - массив, из которого берутся элементы.
- (число) `skipCount` - количество пропускаемых элементов.

Пример 1 - Получить все треки кроме первых 10.
```js
let tracks = Source.getTracks(playlistArray);
tracks = Selector.sliceAllExceptFirst(tracks, 10);
```

### keepAllExceptLast / sliceAllExceptLast

Изменяет / возвращает массив, состоящий из всех элементов массива `array` кроме `skipCount` последних.

Аргументы
- (массив) `array` - массив, из которого берутся элементы.
- (число) `skipCount` - количество пропускаемых элементов.

Пример 1 - Получить все треки кроме последних 10.
```js
let tracks = Source.getTracks(playlistArray);
tracks = Selector.sliceAllExceptLast(tracks, 10);
```

### keepFirst / sliceFirst

Изменяет / возвращает массив, состоящий из первых `count` элементов массива `array`.

Аргументы
- (массив) `array` - массив, из которого берутся элементы.
- (число) `count` - количество элементов.

Пример 1 - Получить первые 100 треков.
```js
let tracks = Source.getTracks(playlistArray);
tracks = Selector.sliceFirst(tracks, 100);
```

### keepLast / sliceLast

Изменяет / возвращает массив, состоящий из последних `count` элементов массива `array`.

Аргументы
- (массив) `array` - массив, из которого берутся элементы.
- (число) `count` - количество элементов.

Пример 1 - Получить последние 100 треков.
```js
let tracks = Source.getTracks(playlistArray);
tracks = Selector.sliceLast(tracks, 100);
```

### keepNoLongerThan / sliceNoLongerThan

Изменяет / возвращает массив треков с общей длительностью не более, чем `minutes` минут.

Аргументы
- (массив) `tracks` - исходный массив треков.
- (число) `minutes` - количество минут.

Пример 1 - Получить треки с общей продолжительностью не более, чем 60 минут.
```js
let tracks = Source.getTracks(playlistArray);
tracks = Selector.sliceNoLongerThan(tracks, 60);
```

Пример 2 - Чтобы вычислить продолжительность треков из массива, используйте один из вариантов
```js
let tracks = Source.getPlaylistTracks('', '37i9dQZF1DX5PcuIKocvtW');
let duration_ms = tracks.reduce((d, t) => d + t.duration_ms, 0); // миллесекунды
let duration_s = tracks.reduce((d, t) => d + t.duration_ms, 0) / 1000; // секунды
let duration_min = tracks.reduce((d, t) => d + t.duration_ms, 0) / 1000 / 60; // минуты
let duration_h = tracks.reduce((d, t) => d + t.duration_ms, 0) / 1000 / 60 / 60; // часы
```

### keepRandom / sliceRandom

Изменяет / возвращает массив, состоящий из случайно отобранных элементов исходного массива.

Аргументы
- (массив) `array` - массив, из которого берутся элементы.
- (число) `count` - количество случайно выбираемых элементов.

Пример 1 - Получить 20 случайных треков.
```js
let tracks = Source.getTracks(playlistArray);
tracks = Selector.sliceRandom(tracks, 20);
```

### pickYear

Возвращает массив треков, релиз которых был в указанном году. Если таких треков нет, выбирается ближайший год.

Аргументы
- (массив) `tracks` - треки, среди которых выбирать.
- (строка) `year` - год релиза.
- (число) `offset` - допустимое смещение для ближайшего года. По умолчанию 5.

Пример 1 - Выбрать любимые треки, вышедшие в 2020 году
```js
let tracks = Selector.pickYear(savedTracks, '2020');
```

### sliceCopy

Возвращает новый массив, который является копией исходного массива.

?> Используйте создание копии, если в одном скрипте нужно выполнить разные действия над источником. Позволит ускорить время выполнения и не отправлять тех же запросов дважды.

Аргументы
- (массив) `array` - исходный массив, копию которого нужно создать.

Пример 1 - Создать копию массива.
```js
let tracks = Source.getTracks(playlistArray);
let tracksCopy = Selector.sliceCopy(tracks);
```
