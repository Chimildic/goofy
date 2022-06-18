# Cache {docsify-ignore}

Методы управления данными Google Диска.

По умолчанию, без указания расширения файла, подразумевается `json`. При явном указании поддерживается текстовый формат `txt`.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [append](/reference/cache?id=append) | Число | Присоединить данные к массиву из файла. |
| [compressArtists](/reference/cache?id=compressartists) | - | Удалить незначимые данные о исполнителях. |
| [compressTracks](/reference/cache?id=compresstracks) | - | Удалить незначимые данные о треках. |
| [copy](/reference/cache?id=copy) | Строка | Создать копию файла в папке исходного файла. |
| [read](/reference/cache?id=read) | Массив/Объект/Строка | Прочитать данные из файла. |
| [remove](/reference/cache?id=remove) | - | Переместить файл в корзину Google Диска. |
| [rename](/reference/cache?id=rename) | - | Переименовать файл. |
| [write](/reference/cache?id=write) | - | Записать данные в файл. |

## append

Присоединить данные к массиву из файла. Создает файл, если его не существует.

### Аргументы :id=append-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `filepath` | Строка | [Путь до файла](/best-practices?id=Путь-до-файла). |
| `content` | Массив | Данные для добавления. |
| `place` | Строка | Место соединения: `begin` - начало, `end` - конец. По умолчанию `end`. |
| `limit` | Число | Ограничить число элементов массива после присоединения новых данных. </br> По умолчанию 200 тысяч элементов. |

### Возврат :id=append-return {docsify-ignore}

`contentLength` (число) - количество элементов после добавления.

### Примеры :id=append-examples {docsify-ignore}

1. Присоединить треки плейлиста в начало файла. Ограничить массив 5 тысячами треков после присоединения.

```js
let tracks = Source.getPlaylistTracks('playlist name', 'id');
Cache.append('filename.json', tracks, 'begin', 5000);
```

2. Присоединить треки плейлиста в конец файла.

```js
let tracks = Source.getPlaylistTracks('playlist name', 'id');
Cache.append('filename.json', tracks);
```

## compressArtists

Удалить незначимые данные о исполнителях. Использовать до сохранения в файл для уменьшения его размера.

### Аргументы :id=compressartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `artists` | Массив | Исполнители, к которых требуется удалить незначимые данные. |

### Возврат :id=compressartists-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=compressartists-examples {docsify-ignore}

1. Уменьшить размер файла с массивом исполнителей.

```js
let filename = 'artists.json';
let artists = Cache.read(filename);
Cache.compressArtists(artists);
Cache.write(filename, artists);
```

## compressTracks

Удалить незначимые данные о треках. Использовать до сохранения в файл для уменьшения его размера. Включает вызов [compressArtists](/reference/cache?id=compressartists)

### Аргументы :id=compresstracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки, в которых требуется удалить незначимые данные. |

### Возврат :id=compresstracks-return {docsify-ignore}

Нет возвращаемого значения. Изменяет входной массив.

### Примеры :id=compresstracks-examples {docsify-ignore}

1. Уменьшить размер файла с массивом треков.

```js
let filename = 'tracks.json';
let tracks = Cache.read(filename);
Cache.compressTracks(tracks);
Cache.write(filename, tracks);
```

## copy

Создать копию файла в папке исходного файла.

### Аргументы :id=copy-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `filepath` | Строка | [Путь до файла](/best-practices?id=Путь-до-файла). |

### Возврат :id=copy-return {docsify-ignore}

`filecopypath` (строка) - путь до созданной копии.

### Примеры :id=copy-examples {docsify-ignore}

1. Создать копию файла и прочитать ее данные.

```js
let filename = 'tracks.json';
let filecopyname = Cache.copy(filename);
let tracks = Cache.read(filecopyname);
```

## read

Прочитать данные из файла.

### Аргументы :id=read-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `filepath` | Строка | [Путь до файла](/best-practices?id=Путь-до-файла). |

### Возврат :id=read-return {docsify-ignore}

`content` (массив/объект/строка) - данные из файла.

Если файла не существует, проверяется расширение в строке `filepath`. При отсутствии или равенстве _json_ - вернет пустой массив. В остальных случаях - пустую строку.

### Примеры :id=read-examples {docsify-ignore}

1. Прочитать данные из файла и добавить в плейлист.

```js
let tracks = Cache.read('tracks.json');
Playlist.saveAsNew({
    name: 'Треки из файла',
    tracks: tracks,
});
```

## remove

Переместить файл в корзину Google Диска. Данные из корзины удаляются через 30 дней.

### Аргументы :id=remove-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `filepath` | Строка | [Путь до файла](/best-practices?id=Путь-до-файла). |

### Возврат :id=remove-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=remove-examples {docsify-ignore}

1. Переместить файл в корзину

```js
Cache.remove('filepath.json');
```

## rename

Переименовать файл.

!> Не используйте имена `SpotifyRecentTracks`, `LastfmRecentTracks`, `BothRecentTracks`. Они нужны в механизме накопления [истории прослушиваний](/details?id=История-прослушиваний).

### Аргументы :id=rename-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `filepath` | Строка | [Путь до файла](/best-practices?id=Путь-до-файла). |
| `newFilename` | Строка | Новое имя файла (не путь) |

### Возврат :id=rename-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=rename-examples {docsify-ignore}

1. Переименовать файл.

```js
Cache.rename('filename.json', 'newname.json');
```

## write

Записать данные в файл. Создает файл, если его не существует. Перезаписывает файл, если он существует.

### Аргументы :id=write-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `filepath` | Строка | [Путь до файла](/best-practices?id=Путь-до-файла). |
| `content`  | Массив | Данные для записи.                                 |

### Возврат :id=write-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=write-examples {docsify-ignore}

1. Записать любимые треки в файл.

```js
let tracks = Sourct.getSavedTracks();
Cache.write('liked.json', tracks);
```
