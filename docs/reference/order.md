# Order

Методы сортировки.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [reverse](/reference/order?id=reverse) | - | Отсортировать в обратном порядке. |
| [separateArtists](/reference/order?id=separateartists) | - | Отделить треки одного и того же исполнителя друг от друга. |
| [separateYears](/reference/order?id=separateyears) | Объект | Распределить треки по году релиза. |
| [shuffle](/reference/order?id=shuffle) | - | Перемешать элементы массива случайным образом. |
| [sort](/reference/order?id=sort) | - | Сортировать массив по метаданным. |

## reverse

Отсортировать в обратном порядке.

### Аргументы :id=reverse-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `array` | Массив | Сортируемый массив. |

### Возврат :id=reverse-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=reverse-examples {docsify-ignore}

1. Обратная сортировка для массива чисел.

```js
let array = [1, 2, 3, 4, 5, 6];

Order.reverse(array);
// результат 6, 5, 4, 3, 2, 1

Order.reverse(array);
// результат 1, 2, 3, 4, 5, 6
```

2. Обратная сортировка для массива треков.

```js
let tracks = Source.getTracks(playlistArray);
Order.reverse(tracks);
```

## separateArtists

Отделить треки одного и того же исполнителя друг от друга. Треки, которые не удалось разместить будут исключены.

### Аргументы :id=separateartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Сортируемые треки. |
| `space` | Число | Минимальный отступ. |
| `isRandom` | Булево | Если `true` выполняется случайная сортировка оригинального массива, что повлияет на порядок при разделении исполнителей. Если `false` без случайной сортировки. Тогда результат при одинаковых входных треках будет тоже одинаковыми. По умолчанию `false`. |

### Возврат :id=separateartists-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=separateartists-examples {docsify-ignore}

1. Пример разделения

```js
let array = ['cat', 'cat', 'dog', 'lion']
Order.separateArtists(array, 1, false);
// результат cat, dog, cat, lion

array = ['cat', 'cat', 'dog', 'lion']
Order.separateArtists(array, 1, false);
// повторный вызов, результат тот же: cat, dog, cat, lion

array = ['cat', 'cat', 'dog', 'lion']
Order.separateArtists(array, 1, true);
// повторный вызов и случайная сортировка: cat, lion, dog, cat
```

2. Разделить одного и того же исполнителя минимум двумя другими.

```js
let tracks = Source.getTracks(playlistArray);
Order.separateArtists(tracks, 2);
```

## separateYears

Распределить треки по году релиза. Треки не сортируются по дате.

### Аргументы :id=separateyears-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Сортируемые треки. |

### Возврат :id=separateyears-return {docsify-ignore}

`tracksByYear` (объект) - массивы треков, распределенные по годам.

### Примеры :id=separateyears-examples {docsify-ignore}

1. Получить треки вышедшие только в 2020 году

```js
let tracks2020 = Order.separateYears(tracks)['2020'];
```

2. Возможна ошибка, при которой среди треков нет указанного года. Выберите одно из: используйте [pickYear](/reference/selector?id=pickyear), подмените пустым массивом, проверьте условием.

```js
// Подменить на пустой массив, если нет треков указанного года
let tracks2020 = Order.separateYears(tracks)['2020'] || [];

// Проверка через условие
let tracksByYear = Order.separateYears(tracks);
if (typeof tracksByYear['2020'] != 'undefined'){
    // треки есть
} else {
    // треков нет
}
```

## shuffle

Перемешать элементы массива случайным образом.

### Аргументы :id=shuffle-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `array` | Массив | Сортируемый массив. |
| `factor` | Число | Коэффициент случайности. По умолчанию 1. Чем ближе к 0 тем меньше перестановок и ближе к исходной позиции. |

### Возврат :id=shuffle-return {docsify-ignore}

Изменяет входной массив. Возвращает его же.

### Примеры :id=shuffle-examples {docsify-ignore}

1. Случайная сортировка на массиве чисел с разным коэффициентом. Запустите функцию `testShuffleWithFactor` несколько раз с разными значениями `factor` для наглядности.

```js
function testShuffleWithFactor() {
    let array = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    console.log('0.0:', Order.shuffle(array, 0.0)); // без изменений: 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    console.log('0.3:', Order.shuffle(array, 0.3)); // близкие перестановки: 0, 1, 3, 2, 6, 5, 4, 7, 8, 9
    console.log('0.6:', Order.shuffle(array, 0.6)); // результат: 3, 0, 8, 1, 2, 5, 4, 7, 6, 9
    console.log('1.0:', Order.shuffle(array)) ; // по умолчанию 1.0, результат: 6, 0, 9, 5, 7, 4, 8, 1, 2, 3
}
```

1. Случайная сортировка на массиве треков.

```js
let tracks = Source.getTracks(playlistArray);
Order.shuffle(tracks);
```

## sort

Сортировать массив по метаданным.

!> Функция делает дополнительные запросы. Чтобы сократить число запросов, используйте ее после максимального сокращения массива треков другими способами. Подробнее в [rangeTracks](/reference/filter?id=rangetracks).

?> Если смешивается несколько источников треков, не у всех есть указанный ключ. Например, `played_at` есть только у истории прослушиваний.

### Аргументы :id=sort-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `source` | Массив | Сортируемый массив. |
| `pathKey` | Строка | Ключ сортировки. |
| `direction` | Строка | Направление сортировки: _asc_ по возрастанию, _desc_ по убыванию. По умолчанию _asc_. |

#### Ключ сортировки

Ключ имеет формат `категория.данные`. [Описание метаданных](/reference/desc?id=Описание-параметров-объектов).

| Категория | Данные |
|-|-|
| meta | name, popularity, duration_ms, explicit, added_at, played_at |
| features | acousticness, danceability, energy, instrumentalness, liveness, loudness, speechiness, valence, tempo, key, mode, time_signature, duration_ms |
| artist | popularity, followers, name |
| album | popularity, name, release_date |

?> При использовании категории `features` общий поток любых треков становится приятнее.

### Возврат :id=sort-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=sort-examples {docsify-ignore}

1. Сортировать по убывающей популярности исполнителей.

```js
Order.sort(tracks, 'artist.popularity', 'desc');
```

2. Сортировать по возрастающей энергичности.

```js
Order.sort(tracks, 'features.energy', 'asc');
```
