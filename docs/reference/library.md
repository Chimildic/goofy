# Library

Методы по управлению лайками и подписками.

| Метод | Тип результата | Краткое описание |
|-------|----------------|------------------|
| [checkFavoriteTracks](/reference/library?id=checkfavoritetracks) | - | Проверить каждый трек на наличие в любимых (лайках). |
| [deleteAlbums](/reference/library?id=deletealbums) | - | Удалить альбомы из библиотеки (лайки на альбомах). |
| [deleteFavoriteTracks](/reference/library?id=deletefavoritetracks) | - | Удалить треки из любимых (убрать лайки). |
| [followArtists](/reference/library?id=followartists) | - | Подписаться на исполнителей. |
| [followPlaylists](/reference/library?id=followplaylists) | - | Подписаться на плейлисты. |
| [saveAlbums](/reference/library?id=savealbums) | - | Сохранить альбомы в библиотеку. |
| [saveFavoriteTracks](/reference/library?id=savefavoritetracks) | - | Добавить треки в любимые (поставить лайк). |
| [unfollowArtists](/reference/library?id=unfollowartists) | - | Отписаться от исполнителей. |
| [unfollowPlaylists](/reference/library?id=unfollowplaylists) | - | Отписаться от плейлистов. |

## checkFavoriteTracks

Проверить каждый трек на наличие в любимых (лайках).

### Аргументы :id=checkfavoritetracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Проверяемы треки. Значимо только _id_. |

### Возврат :id=checkfavoritetracks-return {docsify-ignore}

Нет возвращаемого значения.

К трекам добавляется булево значение `isFavorite`, обозначающим наличие или отсутствие трека в любимых.

### Примеры :id=checkfavoritetracks-examples {docsify-ignore}

1. Оставить только треки плейлиста без лайков.

```js
let tracks = Source.getPlaylistTracks('', 'id')
Library.checkFavoriteTracks(tracks);
tracks = tracks.filter(t => !t.isFavorite);
```

## deleteAlbums

Удалить альбомы из библиотеки (лайки на альбомах).

### Аргументы :id=deletealbums-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `albums` | Массив | Альбомы для удаления. Значимо только _id_. |

### Возврат :id=deletealbums-return {docsify-ignore}

Нет возвращаемого значения.

## deleteFavoriteTracks

Удалить треки из любимых (убрать лайки).

### Аргументы :id=deletefavoritetracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки для удаления. Значимо только _id_. |

### Возврат :id=deletefavoritetracks-return {docsify-ignore}

Нет возвращаемого значения.

### Примеры :id=deletefavoritetracks-examples {docsify-ignore}

1. Очистить все лайки

```js
let savedTracks = Source.getSavedTracks();
Library.deleteFavoriteTracks(savedTracks);
```

## followArtists

Подписаться на исполнителей.

### Аргументы :id=followartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `artists` | Массив | Исполнители для подписки. Значимо только _id_. |

### Возврат :id=followartists-return {docsify-ignore}

Нет возвращаемого значения.

## followPlaylists

Подписаться на плейлисты.

### Аргументы :id=followplaylists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `playlists` | Массив/Строка | Плейлисты (значимо только _id_) или строка с _id_, разделенные запятыми. |

### Возврат :id=followplaylists-return {docsify-ignore}

Нет возвращаемого значения.

## saveAlbums

Сохранить альбомы в библиотеку.

### Аргументы :id=savealbums-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `albums` | Массив | Альбомы для добавления. Значимо только _id_. |

### Возврат :id=savealbums-return {docsify-ignore}

Нет возвращаемого значения.

## saveFavoriteTracks

Добавить треки в любимые (поставить лайк).

### Аргументы :id=savefavoritetracks-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `tracks` | Массив | Треки для добавления. Значимо только _id_. |

### Возврат :id=savefavoritetracks-return {docsify-ignore}

Нет возвращаемого значения.

## unfollowArtists

Отписаться от исполнителей.

### Аргументы :id=unfollowartists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `artists` | Массив | Исполнители для отписки. Значимо только _id_. |

### Возврат :id=unfollowartists-return {docsify-ignore}

Нет возвращаемого значения.

## unfollowPlaylists

Отписаться от плейлистов.

### Аргументы :id=unfollowplaylists-arguments {docsify-ignore}

| Имя | Тип | Описание |
|-----|-----|----------|
| `playlists` | Массив/Строка | Плейлисты (значимо только _id_) или строка с _id_, разделенные запятыми. |

### Возврат :id=unfollowplaylists-return {docsify-ignore}

Нет возвращаемого значения.
