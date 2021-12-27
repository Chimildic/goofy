# Combiner {docsify-ignore}

Методы комбинирования элементов.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [alternate](/reference/combiner?id=alternate) | Массив | Чередовать элементы массивов. Один шаг - один элемент массива. |
| [mixin](/reference/combiner?id=mixin) | Массив | Чередовать элементы двух массивов. Один шаг - один и больше элементов от одного массива. |
| [mixinMulti](/reference/combiner?id=mixinmulti) | Массив | Чередовать элементы неограниченного количества массивов. Один шаг - один и больше элементов от одного массива. |
| [push](/reference/combiner?id=push) | Массив | Добавить в конец первого массива элементы второго массива и так далее. |

## alternate

Чередовать элементы массивов. Один шаг - один элемент массива.

### Аргументы :id=alternate-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `bound` | Строка | Граница чередования. При `min` чередование заканчивается, когда один из источников закончится. При `max` чередование продолжается до тех пор, пока есть незатронутые элементы. |
| ``...arrays`` | Массивы | Источники элементов для чередования. |

### Возврат :id=alternate-return {docsify-ignore}

`resultArray` (массив) - новый массив, в котором чередуются элементы источников.

### Примеры :id=alternate-examples {docsify-ignore}

1. Чередовать элементы трех массивов.

```js
let firstArray = [1, 3, 5];
let secondeArray = [2, 4, 6, 8, 10];
let thirdArray = [100, 200, 300];
let resultArray = Combiner.alternate('max', firstArray, secondeArray, thirdArray);
// результат 1, 2, 100, 3, 4, 200, 5, 6, 300, 8, 10
```

2. Чередовать топ прослушиваний за месяц и любимые треки.

```js
let topTracks = Source.getTopTracks('short'); // допустим, 50 треков
let savedTracks = Source.getSavedTracks(20); //допустим, 20 треков
let resultArray = Combiner.alternate('min', topTracks, savedTracks);
// результат содержит 40 треков
```

## mixin

Чередовать элементы двух массивов. Один шаг - один и больше элементов от одного массива. Включает вызов [mixinMulti](/reference/combiner?id=mixinmulti).

### Аргументы :id=mixin-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `xArray` | Массив | Первый источник. |
| `yArray` | Массив | Второй источник. |
| `xRow` | Число | Количество элементов подряд от первого источника. |
| `yRow` | Число | Количество элементов подряд от второго источника. |
| `toLimitOn` | Булево | Элементы чередуются до тех пор, пока пропорцию можно сохранить. Если `true` лишние элементы не включаются в результат. Если `false` добавляются в конец результата. По умолчанию `false`. |

### Возврат :id=mixin-return {docsify-ignore}

`resultArray` (массив) - новый массив, в котором чередуются элементы двух источников в заданной пропорции.

### Примеры :id=mixin-examples {docsify-ignore}

1. Чередовать треки плейлистов и любимые треки в соотношении 5 к 1. Отбросить лишнее.

```js
let tracks = Source.getTracks(playlistArray);
let savedTracks = Source.getSavedTracks();
let resultArray = Combiner.mixin(tracks, savedTracks, 5, 1, true);
```

## mixinMulti

Чередовать элементы неограниченного количества массивов. Один шаг - один и больше элементов от одного массива.

### Аргументы :id=mixinmulti-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `params` | Объект | Параметры чередования. |

#### Параметры чередования :id=mixinmulti-params {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `source` | Массив | Массив из массивов источников. |
| `inRow` | Массив | Массив, элементы которого устанавливают количество подряд идущих элементов для каждого источника. |
| `toLimitOn` | Булево | Элементы чередуются до тех пор, пока пропорцию можно сохранить. Если `true` лишние элементы не включаются в результат. Если `false` добавляются в конец результата. По умолчанию `false`. При `toLimitOn = true`, первая итерация проверяет количество элементов. Если элементов меньше, чем задано соотношением, вернется пустой массив. |

### Возврат :id=mixinmulti-return {docsify-ignore}

`resultArray` (массив) - новый массив, в котором чередуются элементы источников в заданной пропорции.

### Примеры :id=mixinmulti-examples {docsify-ignore}

1. Чередовать элементы в соотношении 1:1:1. Сохранить все элементы.

```js
let x = [1, 2, 3, 4, 5];
let y = [10, 20, 30, 40];
let z = [100, 200, 300];
let result = Combiner.mixinMulti({
    source: [x, y, z],
    inRow: [1, 1, 1],
});
// 1, 10, 100, 2, 20, 200, 3, 30, 300, 4, 40, 5
```

2. Чередовать элементы в соотношении 2:4:2 до тех пор, пока можно сохранить последовательность.

```js
let x = [1, 2, 3, 4, 5];
let y = [10, 20, 30, 40];
let z = [100, 200, 300];
let result = Combiner.mixinMulti({
    toLimitOn: true,
    source: [x, y, z],
    inRow: [2, 4, 2],
});
// 1, 2, 10, 20, 30, 40, 100, 200
```

3. Чередовать рекомендации, любимые треки и историю прослушиваний в соотношении 4:1:1 до тех пор, пока можно сохранить последовательность.

```js
let recom = Source.getRecomTracks();
let saved = Source.getSavedTracks();
let recent = RecentTracks.get();
let tracks = Combiner.mixinMulti({
    toLimitOn: true,
    source: [recom, saved, recent],
    inRow: [4, 1, 1],
});
```

## push

Добавить в конец первого массива элементы второго массива и так далее.

### Аргументы :id=push-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `sourceArray` | Массив | Первый массив. К нему добавляются элементы последующих массивов. |
| `...additionalArray` | Массивы | Последующие массивы для добавления к предыдущему. |

### Возврат :id=push-return {docsify-ignore}

`sourceArray` (массив) - оригинальный первый массив после добавления элементов из других массивов.

### Примеры :id=push-examples {docsify-ignore}

1. Добавить элементы второго массива в конец первого массива.

```js
let firstArray = Source.getTracks(playlistArray); // допустим, 20 треков
let secondeArray = Source.getSavedTracks(); // допустим, 40 треков
Combiner.push(firstArray, secondeArray);
// теперь в firstArray 60 треков
```

2. Добавить к первому массиву элементы двух других.

```js
let firstArray = Source.getTracks(playlistArray); // допустим, 25 треков
let secondeArray = Source.getSavedTracks(); // допустим, 100 треков
let thirdArray = Source.getPlaylistTracks(); // допустим, 20 треков
Combiner.push(firstArray, secondeArray, thirdArray);
// теперь в firstArray 145 треков
```
