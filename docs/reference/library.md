# Library

Методы по управлению лайками и подписка.

### checkFavoriteTracks

Проверяет каждый трек на наличие в любимых (лайках). К трекам добавляется ключ `isFavorite` с булевым значением.

Аргументы
- (массив) `tracks` - массив проверяемых треков.

Пример 1 - Оставить только отсутствующие в любимых треки
```js
let tracks = Source.getPlaylistTracks('', 'id')
Library.checkFavoriteTracks(tracks);
tracks = tracks.filter(t => !t.isFavorite);
```

### deleteAlbums

Удалить альбомы из библиотеки.

Аргументы
- (массив) `albums` - перечень альбомов для удаления. Значимо только `id`.

### deleteFavoriteTracks

Удалить треки из любимых (снять лайки)

Аргументы
- (массив) `tracks` - перечень треков. Значимо только `id`.

Пример 1 - Очистить все лайки Spotify
```js
let savedTracks = Source.getSavedTracks();
Library.deleteFavoriteTracks(savedTracks);
```

### followArtists

Подписаться на исполнителей

Аргументы
- (массив) `artists` - перечень исполнителей. Значимо только `id`.

Пример в [Yandex.getArtists](/func?id=getartists)

### followPlaylists

Подписаться на плейлисты

Аргумент
- (массив/строка) `playlists` - перечень плейлистов (значимо только _id_) или строка с _id_, разделенными запятой.

### saveAlbums

Добавить альбомы в библиотеку.

Аргументы
- (массив) `albums` - перечень альбомов для добавления. Значимо только `id`.

### saveFavoriteTracks

Добавить треки в любимые (поставить лайк)

Аргументы
- (массив) `tracks` - перечень треков. Значимо только `id`.

### unfollowArtists

Отписаться от исполнителей

Аргументы
- (массив) `artists` - перечень исполнителей. Значимо только `id`.

Пример аналогичен [Yandex.getArtists](/func?id=getartists). Только использовать `unfollowArtists`.

### unfollowPlaylists

Отписаться от плейлистов

Аргумент
- (массив/строка) `playlists` - перечень плейлистов (объекты с _id_) или строка с _id_, разделенными запятой.
