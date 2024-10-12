# Source

Методы получения элементов Spotify.

### craftTracks

Возвращает массив треков, полученный от [getRecomTracks](/reference/source?id=getrecomtracks) для каждой пятерки элементов исходных треков. Дубликаты исходных треков игнорируются, в рекомендованных удаляются. Ограничение в пять элементов продиктовано Spotify API для функции рекомендаций. Можно частично повлиять на формируемые пятерки элементов. До вызова функции применив одну из сортировок `Order`.

Аргументы
- (массив) `tracks` - треки для которых получать рекомендации. При `key` равному `seed_artists` допустим массив исполнителей.
- (объект) `params` - дополнительные параметры.

Описание параметров
- (строка) `key` - определяет по какому ключу рекомендации. Допустимо: `seed_tracks` и `seed_artists`. По умолчанию `seed_tracks`.
- (объект) `query` - необязательный параметр, доступны все ключи [getRecomTracks](/reference/source?id=getrecomtracks), кроме указанного в `key`.

?> В `query` можно указать два из: `seed_tracks`, `seed_artists`, `seed_genres`. Третий выбирается исходя из `key`. Таким образом, можно задать статичные трек/исполнителя/жанр (до 4 значений на все). Оставшиеся свободные места будут подставляться исходя из `key`.

Пример 1 - Получить рекомендации по всем любимым трекам по их исполнителям
```js
let tracks = Source.getSavedTracks();
let recomTracks = Source.craftTracks(tracks, {
    key: 'seed_artists',
    query: {
        limit: 20, // по умолчанию и максимум 100
        min_energy: 0.4,
        min_popularity: 60,
        // target_popularity: 60,
    }
});
```

Пример 2 - Рекомендации с указанием статичного жанра и трека. Оставшиеся 3 места занимаются `seed_artists`.
```js
let recomTracks = Source.craftTracks(tracks, {
    key: 'seed_artists',
    query: {
        seed_genres: 'indie',
        seed_tracks: '6FZDfxM3a3UCqtzo5pxSLZ'
    }
});
```

Пример 3 - Можно указать только массив треков. Тогда будут рекомендации по ключу `seed_tracks`.
```js
let tracks = Source.getSavedTracks();
let recomTracks = Source.craftTracks(tracks);
```

### getAlbumsTracks

Возвращает массив треков из всех альбомов.

Аргументы
- (массив) `albums` - перечень альбомов
- (число) `limit` - если указано, случайно выбираются треки до указанного количества в каждом альбоме отдельно.

Пример 1 - Получить треки из топ-10 альбомов Lastfm
```js
let albums = Lastfm.getTopAlbums({ user: 'login', limit: 10 });
let tracks = Source.getAlbumsTracks(albums);
```

### getAlbumTracks

Возвращает массив треков указанного альбома.

Аргументы
- (объект) `album` - объект одного альбома
- (число) `limit` - если указано, случайно выбираются треки до указанного количества.

Пример 1 - Получить треки первого альбома массива
```js
let albums = Source.getArtistsAlbums(artists, {
    groups: 'album',
});
let albumTracks = Source.getAlbumTracks(albums[0]);
```

Пример 2 - Получить треки из всех альбомов
```js
let albums = Source.getArtistsAlbums(artists, {
    groups: 'album',
});
let tracks = [];
albums.forEach((album) => Combiner.push(tracks, Source.getAlbumTracks(album)));
```

### getArtists

Возвращает массив исполнителей согласно заданным `paramsArtist`.

Аргументы
- (объект) `paramsArtist` - перечень критериев отбора исполнителей. Объект соответствует описанию из [getArtistsTracks](/reference/source?id=getartiststracks) в части исполнителя.

Пример 1 - Получить массив отслеживаемых исполнителей
```js
let artists = Source.getArtists({
    followed_include: true,
});
```

### getArtistsAlbums

Возвращает массив со всеми альбомами указанных исполнителей.

Аргументы
- (массив) `artists` - массив исполнителей
- (объект) `paramsAlbum` - перечень критериев отбора альбомов. Объект соответствует описанию из [getArtistsTracks](/reference/source?id=getartiststracks) в части альбома.

Пример 1 - Получить массив синглов одного исполнителя
```js
let artist = Source.getArtists({
    followed_include: false,
    include: [ 
        { id: 'abc', name: 'Avril' }, 
    ],
});
let albums = Source.getArtistsAlbums(artist, {
    groups: 'single',
    // isFlat: false, // сгруппировать по исполнителю
});
```

### getArtistsTopTracks

Возвращает топ треков исполнителя в виде массива. До 10 треков на исполнителя.

Аргументы
- (массив) `artists` - массив исполнителей. Значимо только `id`.
- (булево) `isFlat` - если `false` результат группируется по исполнителям. Если `true` все треки в одном массиве. По умолчанию `true`.

Пример 1 - `isFlat = true`
```js
let tracks = Source.getArtistsTopTracks(artists);
tracks[0]; // первый трек первого исполнителя
tracks[10]; // первый трек второго исполнителя, если у первого 10 треков
```

Пример 2 - `isFlat = false`
```js
let tracks = Source.getArtistsTopTracks(artists, false);
tracks[0][0]; // первый трек первого исполнителя
tracks[1][0]; // первый трек второго исполнителя
```

### getArtistsTracks

Возвращает массив треков исполнителей согласно заданным `params`.

!> В выборку попадает множество альбомов. Особенно при большом количестве отслеживаемых исполнителей (100+). Для сокращения времени выполнения используйте фильтры для исполнителя и альбома. Можно указать случайный выбор N-количества.

?> У Spotify API есть баг. Не смотря на явное указание страны из токена, некоторые альбомы могут дублироваться (для разных стран). Используйте удаление дубликатов для треков.

Аргументы
- (объект) `params` - перечень критериев отбора исполнителей и их треков

| Ключ | Тип | Описание |
|-|-|-|
| isFlat | булево | При `false` результат группируется по исполнителям. По умолчанию `true`. |
| followed_include | булево | При `true` включает отслеживаемых исполнителей. При `false` исполнители берутся только из `include` |
| include | массив | Выборка исполнителей по `id` для получения альбомов. Ключ `name` для удобства и необязателен.  |
| exclude | массив | Выборка исполнителей по `id` для исключения исполнителей из выборки. Использовать в комбинации с `followed_include` |
| popularity | объект | Диапазон популярности исполнителя |
| followers | объект | Диапазон количества фолловеров исполнителя |
| genres | массив | Перечень жанров. Если хотя бы один есть, исполнитель проходит фильтр.  |
| ban_genres | массив | Перечень жанров для блокировки. Если хотя бы один есть, исполнитель удаляется из выборки. |
| groups | строка | Тип альбома. Допустимо: `album`, `single`, `appears_on`, `compilation` |
| release_date | объект | Дата выхода альбома. Относительный период при `sinceDays` и `beforeDays`. Абсолютный период при `startDate` и `endDate` |
| _limit | число | Если указано, выбирается случайное количество указанных элементов (artist, album, track) |

Пример объекта `params` со всеми ключами
```js
{
    isFlat: true,
    artist: {
        followed_include: true,
        popularity: { min: 0, max: 100 },
        followers: { min: 0, max: 100000 },
        artist_limit: 10,
        genres: ['indie'],
        ban_genres: ['rap', 'pop'],
        include: [
            { id: '', name: '' }, 
            { id: '', name: '' },
        ],
        exclude:  [
            { id: '', name: '' }, 
            { id: '', name: '' },
        ],
    },
    album: {
        groups: 'album,single',
        release_date: { sinceDays: 6, beforeDays: 0 },
        // release_date: { startDate: new Date('2020.11.30'), endDate: new Date('2020.12.30') },
        album_limit: 10,
        track_limit: 1,
    }
}
```

Пример 1 - Получить треки из синглов отслеживаемых исполнителей, вышедших за последнюю неделю включая сегодня. Исключить несколько исполнителей.
```js
let tracks = Source.getArtistsTracks({
    artist: {
        followed_include: true,
        exclude:  [
            { id: 'abc1', name: '' }, 
            { id: 'abc2', name: '' },
        ],
    },
    album: {
        groups: 'single',
        release_date: { sinceDays: 7, beforeDays: 0 },
    },
});
```

Пример 2 - Получить треки из альбомов и синглов за неделю десяти отслеживаемых исполнителей, выбранных случайным образом. Исполнители с не более чем 10 тысячами подписчиков. Только один трек из альбома.
```js
let tracks = Source.getArtistsTracks({
    artist: {
        followed_include: true,
        artist_limit: 10,
        followers: { min: 0, max: 10000 },
    },
    album: {
        groups: 'album,single',
        track_limit: 1,
        release_date: { sinceDays: 7, beforeDays: 0 },
    },
});
```

Пример 3 - Получить треки из альбомов и синглов указанных исполнителей
```js
let tracks = Source.getArtistsTracks({
    artist: {
        followed_include: false,
        include:  [
            { id: 'abc1', name: '' }, 
            { id: 'abc2', name: '' },
        ],
    },
    album: {
        groups: 'album,single',
    },
});
```

### getCategoryTracks

Возвращает массив треков из плейлистов указанной категории. Сортировка плейлистов по популярности. [Список категорий](/reference/desc?id=Категории-плейлистов).

Аргументы
- (строка) `category_id` - имя категории.
- (объект) `params` - дополнительные параметры.

Описание `params`
- (число) `limit` - ограничить число выбираемых плейлистов. Максимум 50, по умолчанию 20.
- (число) `offset` - пропустить указанное число треков. По умолчанию 0.
- (строка) `country` - название страны, в которой смотреть плейлисты категории. Например, `RU` или `AU`.

Пример 1 - Получить треки второй десятки плейлистов категории "фокус" из Австралии.
```js
let tracks = Source.getCategoryTracks('focus', { limit: 10, offset: 10, country: 'AU' });
```

Пример 2 - Получить треки 20 плейлистов в категории вечеринки.
```js
let tracks = Source.getCategoryTracks('party');
```

### getFollowedTracks

Возвращает массив треков отслеживаемых плейлистов и/или личных плейлистов указанного пользователя.

?> Если нужно выполнить разные действия над источником, создайте копию массива [sliceCopy](/reference/selector?id=slicecopy) вместо новых запросов к Spotify через getFollowedTracks.

Аргументы
- (объект) `params` - аргументы отбора плейлистов.

Описание ключей
- (строка) `type` - тип выбираемых плейлистов. По умолчанию `followed`.
- (строка) `userId` - [идентификатор пользователя](#идентификатор). Если не указан, устанавливается `userId` авторизированного пользователя, то есть ваш.
- (число) `limit` - если используется, плейлисты выбираются случайным образом.
- (массив) `exclude` - перечень плейлистов, которые нужно исключить. Значимо только `id`. Значение `name` необязательно, нужно лишь для понимания какой это плейлист. Можно обойтись комментарием.
- (булево) `isFlat` - если `false`, результат группируется по исполнителям. Если `true`, все треки в одном массиве (каждый содержит ключ `origin` с данными о плейлисте). По умолчанию `true`.

|type|Выбор|
|-|-|
| owned | Только личные плейлисты |
| followed | Только отслеживаемые плейлисты |
| all | Все плейлисты |

Полный объект `params`
```js
{
    type: 'followed',
    userId: 'abc',
    limit: 2,
    exclude: [
        { name: 'playlist 1', id: 'abc1' },
        { id: 'abc2' }, // playlist 2
    ],
}
```

Пример 1 - Получить треки только из моих отслеживаемых плейлистов.
```js
// Все значения по умолчанию, аргументы не указываются
let tracks = Source.getFollowedTracks();

// Тоже самое с явным указанием типа плейлистов
let tracks = Source.getFollowedTracks({
    type: 'followed',
});
```

Пример 2 - Получить треки только двух случайно выбранных личных плейлистов пользователя `example`, исключая несколько плейлистов по их id. 
```js
let tracks = Source.getFollowedTracks({
    type: 'owned',
    userId: 'example',
    limit: 2, 
    exclude: [
        { id: 'abc1' }, // playlist 1
        { id: 'abc2' }, // playlist 2
    ],
});
```

!> Следует избегать пользователей со слишком большим количеством плейлистов. Например, `glennpmcdonald` почти с 5 тысячами плейлистов. Ограничение связано с квотой на выполнение в Apps Script. За отведенное время не удастся получить такой объем треков. Подробнее в [описании ограничений](/details?id=Ограничения).


### getListCategory

Возвращает массив допустимых категорий для [getCategoryTracks](/reference/source?id=getcategorytracks).

Аргументы
- (объект) `params` - параметры отбора категорий.

Описание `params`
- (число) `limit` - ограничить число выбираемых категорий. Максимум 50, по умолчанию 20.
- (число) `offset` - пропустить указанное число категорий. По умолчанию 0. Используется для получения категорий после 50+.
- (строка) `country` - название страны, в которой смотреть категории. Например, `RU` или `AU`. Если нет, глобально доступные. Но возможна ошибка доступности. Чтобы не получить ошибки, указывайте одинаковые `country` для списка категорий и запроса плейлистов. 

Пример 1 - Получить треки 10 плейлистов из случайной категории
```js
let listCategory = Source.getListCategory({ limit: 50, country: 'RU' });
let category = Selector.sliceRandom(listCategory, 1);
let tracks = Source.getCategoryTracks(category[0].id, { limit: 10, country: 'RU' });
```

### getPlaylistTracks

Возвращает массив треков из одного плейлиста. Аналогично [getTracks](/reference/source?id=gettracks) с одним плейлистом.

Аргументы
- (строка) `name` - имя плейлиста.
- (строка) `id` - [идентификационный номер плейлиста](/reference/desc?id=Плейлист).
- (строка) `user` - [идентификационный номер пользователя](/reference/desc?id=Пользователь). По умолчанию ваш.
- (число) `count` - количество выбираемых треков.
- (булево) `inRow` - режим выбора. Если нет ключа или `true`, выбор первых `count` элементов, иначе случайный выбор

Пример 1 - Получить треки одного плейлиста
```js
let tracks = Source.getPlaylistTracks('Заблокированный треки', 'abcdef');
```

Пример 2 - Случайный выбор 10 треков
```js
// имя плейлиста и пользователя можно оставить пустым, если известно id плейлиста
let tracks = Source.getPlaylistTracks('', 'id', '', 10, false);
```

### getRecomTracks

Возвращает массив рекомендованных треков по заданным параметрам (до 100 треков). Для новых или малоизвестных исполнителей/треков возможно будет недостаточно накопленных данных для генерации рекомендаций. 

Аргументы
- (объект) `queryObj` - параметры для отбора рекомендаций.

Допустимые параметры
- limit - количество треков. Максимум 100.
- seed_* - до **5 значений** в любых комбинациях:
  - seed_artists - [идентификаторы исполнителей](/reference/desc?id=Идентификатор), разделенных запятой.
  - seed_tracks - [идентификаторы треков](/reference/desc?id=Идентификатор), разделенных запятой.
  - seed_genres - жанры, разделенные запятой. Допустимые значения смотреть [здесь](/reference/desc?id=Жанры-для-отбора-рекомендаций).
- max_* - предельное значение одной из [особенностей (features) трека](/reference/desc?id=Особенности-трека-features).
- min_* - минимальное значение одной из [особенностей (features) трека](/reference/desc?id=Особенности-трека-features).
- target_* - целевое значение одной из [особенностей (features) трека](/reference/desc?id=Особенности-трека-features). Выбираются наиболее близкие по значению.

?> Кроме того, в `features` доступен ключ `populatiry`. Например, `target_popularity`. В документации к API Spotify это скрыто.

!> При указании конкретного жанра в `seed_genres` необязательно придут треки данного жанра. Такой сид является отправной точкой для рекомендаций.

Пример объекта с параметрами
```js
let queryObj = {
    seed_artists: '',
    seed_genres: '',
    seed_tracks: '',
    max_*: 0,
    min_*: 0,
    target_*: 0,
};
```

Пример 1 - Получить рекомендации по жанру инди и альтернативы с позитивным настроением:
```js
let tracks = Source.getRecomTracks({
    seed_genres: 'indie,alternative',
    min_valence: 0.65,
});
```

Пример 2 - Получить рекомендации в жанре рок и электроники на основе 3 случайных любимых исполнителей (до 5 значений).
```js
let savedTracks = Source.getSavedTracks();
Selector.keepRandom(savedTracks, 3);

let artistIds = savedTracks.map(track => track.artists[0].id);

let tracks = Source.getRecomTracks({
    seed_artists: artistIds.join(','),
    seed_genres: 'rock,electronic'
});
```

Пример 3 - Подстановка жанров исполнителей. Во всех запросах `craftTracks` будут один раз случайно отобранные жанры. При следующем запуске уже другие.
```js
let artists = Source.getArtists({ followed_include: false });
let genres = Array.from(new Set(artists.reduce((genres, artist) => {
  return Combiner.push(genres, artist.genres);
}, [])));
let recomTracks = Source.craftTracks(artists, {
  key: 'seed_artists',
  query: {
    seed_genres: Selector.sliceRandom(genres, 3).join(','),
    min_popularity: 20,
  }
});
```

### getRelatedArtists

Возвращает массив похожих исполнителей по данным Spotify.

Аргументы
- (массив) `artists` - перечень исполнителей, для которых получить похожих. Значимо только `id`.
- (булево) `isFlat` - если `false` результат группируется по исполнителям. Если `true` все исполнители в одном массиве. По умолчанию `true`.

Пример 1 - `isFlat = true`
```js
let relatedArtists = Source.getRelatedArtists(artists);
relatedArtists[0]; // первый исполнитель
relatedArtists[10]; // 11 исполнитель
```

Пример 2 - `isFlat = false`
```js
let relatedArtists = Source.getRelatedArtists(artists, false);
relatedArtists[0][0]; // первый исполнитель, похожие на первого из источника
relatedArtists[1][0]; // первый исполнитель, похожие на второго из источника
```

### getRecentReleasesByArtists

Возвращает недавние релизы в рамках указанных исполнителей и периода.

Аргументы
- (объект) `params` - параметры отбора
  - (массив) `artists` - исполнители искомых альбомов. У каждого элемента значимо только `id`.
  - (объект) `date` - относительный или абсолютный период времени (`sinceDays` и `beforeDays` или `startDate` и `endDate`).
  - (массив) `type` - допустимный тип альбома (`single`, `album`).
  - (булево) `isFlat` - если `false` результат группируется по исполнителям. Если `true` все треки в одном массиве. По умолчанию `true`.

Пример 1 - Релизы отслеживаемых исполнителей за последнюю неделю
```js
let weekReleases = Source.getRecentReleasesByArtists({
  artists: Source.getArtists({ followed_include: true }),
  date: { sinceDays: 7, beforeDays: 0 },
  type: ['album', 'single'],
});
// Когда выбраны альбомы и синглы - могут появиться дубликаты треков, особенно при большом диапазоне дат
Filter.dedupTracks(weekReleases)
```

### getSavedAlbums

Возвращает массив сохраненных альбомов, каждый из которых содержит до 50 треков. Сортировка альбомов от недавних к старым по дате сохранения.

Аргументов нет.

Пример 1 - Получить треки из последнего сохраненного альбома
```js
let albums = Source.getSavedAlbums();
let tracks = albums[0].tracks.items;
```

### getSavedAlbumTracks

Возвращает массив треков со всех сохраненных альбомов. Можно задать выбор альбомов случайным образом.

Аргументы:
- (число) `limit` - если используется, альбомы выбираются случайно до указанного значения.

Пример 1 - Получить треки трех случайных альбомов
```js
let tracks = Source.getSavedAlbumTracks(3);
```

Пример 2 - Получить треки из всех сохраненных альбомов
```js
let tracks = Source.getSavedAlbumTracks();
```

### getSavedTracks

Возвращает массив любимых треков (лайков). Сортировка от новых к старым. Если лайки добавлялись автоматическими средствами, дата одинакова. Поэтому конечная сортировка массива и интерфейса Spotify может различаться.

?> Чтобы сократить количество запросов, используйте `Cache.read('SavedTracks.json')`. Кэш обновляется ежедневно.

Аргумент
- (число) `limit` - если указано, ограничивает количество треков и запросы для их получения. Когда не указано возвращаются все.

?> Если у вас много любимых треков и в скрипте нужно выполнить разные действия над ними, создайте копию массива [sliceCopy](/reference/selector?id=slicecopy) вместо новых запросов к Spotify.

Пример 1 - Получить массив любимых треков.
```js
let tracks = Source.getSavedTracks();
```

Пример 2 - Получить последние 5 лайков.
```js
let tracks = Source.getSavedTracks(5);
```

### getTopArtists

Возвращает топ исполнителей за выбранный период. До 98 исполнителей. 

Аргументы
- (строка) `timeRange` - период. По умолчанию `medium`. Возможные значения приведены в [getTopTracks](/reference/source?id=gettoptracks).

Пример 1 - Получить топ треков от топ 10 исполнителей
```js
let artists = Source.getTopArtists('long');
Selector.keepFirst(artists, 10);
let tracks = Source.getArtistsTopTracks(artists);
```

### getTopTracks

Возвращает массив треков с топом прослушиваний за выбранный период. До 98 треков.

Аргументы
- (строка) `timeRange` - период. По умолчанию `medium`.

|timeRange|Период|
|-|-|
| short | Примерно последний месяц |
| medium | Примерно последние 6 месяцев |
| long | За несколько лет |

!> Такие треки не содержат информации о дате добавления. При использовании [rangeDateRel](/reference/filter?id=rangedaterel) или [rangeDateAbs](/reference/filter?id=rangedateabs) им присваивается дата 01.01.2000

Пример 1 - Получить топ за последний месяц.
```js
let tracks = Source.getTopTracks('short');
```

Пример 2 - Получить топ за несколько лет.
```js
let tracks = Source.getTopTracks('long');
```

### getTracks

Возвращает массив треков из одного и более плейлистов.

Аргументы
- (массив) `playlistArray` - один и более плейлист. 

Формат *одного* плейлиста
- `id` - [идентификационный номер плейлиста](/reference/desc?id=Плейлист).
- `userId` - [идентификационный номер пользователя](/reference/desc?id=Пользователь).
- `name` - имя плейлиста.
- `count` - количество выбираемых треков.
- `inRow` - режим выбора. Если нет ключа или `true`, выбор первых `count` элементов, иначе случайный выбор

| id | name | userId | Действие |
|:-:|:-:|:-:|:-|
| ✓ | ☓ | ☓ | Взять плейлист с указанным id |
| ☓ | ✓ | ☓ | Поиск плейлиста по имени среди ваших |
| ☓ | ✓ | ✓ | Поиск плейлиста по имени у пользователя |

?> Рекомендуется всегда указывать `id` и `name`. Наиболее быстрый и удобный способ.

!> Если указано `name` без `id` и есть несколько плейлистов с таким именем, вернутся треки из первого встретившегося. Когда плейлист не найден, вернется пустой массив.

Пример 1 - Получить треки двух плейлистов по `id`. Значение `name` необязательно. Указывается для удобства.
```js
let tracks = Source.getTracks([
  { name: 'Главные хиты', id: '37i9dQZF1DX12G1GAEuIuj' },
  { name: 'Кардио', id: '37i9dQZF1DWSJHnPb1f0X3' },
]);
```

Пример 2 - Получить треки личных плейлистов The Best и Саундтреки.
```js
let tracks = Source.getTracks([
  { name: 'The Best' },
  { name: 'Саундтреки' },
]);
```

Пример 3 - Получить треки плейлиста с названием mint у пользователя spotify.
```js
let tracks = Source.getTracks([
  { name: 'mint', userId: 'spotify' },
]);
```

### getTracksRandom

Возвращает массив треков из одного и более плейлистов. Плейлисты выбираются случайным образом. 

Аргументы
- (массив) `playlistArray` - один и более плейлист. Аналогично [getTracks](/reference/source?id=gettracks).
- (число) `countPlaylist` - количество случайно выбираемых плейлистов. По умолчанию один.

Пример 1 - Получить треки одного случайно выбранного плейлиста из трех.
```js
let tracks = Source.getTracksRandom([
  { name: 'Главные хиты', id: '37i9dQZF1DX12G1GAEuIuj' },
  { name: 'Кардио', id: '37i9dQZF1DWSJHnPb1f0X3' },
  { name: 'Темная сторона', id: '37i9dQZF1DX73pG7P0YcKJ' },
]);
```

Пример 2 - Получить треки двух случайно выбранных плейлистов из трех.
```js
let playlistArray = [
  { name: 'Главные хиты', id: '37i9dQZF1DX12G1GAEuIuj' },
  { name: 'Кардио', id: '37i9dQZF1DWSJHnPb1f0X3' },
  { name: 'Темная сторона', id: '37i9dQZF1DX73pG7P0YcKJ' },
];
let tracks = Source.getTracksRandom(playlistArray, 2);
```

### mineTracks

Возвращает массив треков, найденных при поиске плейлистов, альбомов или треков по ключевым словам. Из результата удаляются дубликаты.

Аргументы
- (объект) `params` - параметры поиска.

Описание `params`
- (строка) `type` - тип поиска. Допустимо: `playlist`, `album`, `track`. По умолчанию `playlist`. При `track` можно использовать [расширенный поиск](https://support.spotify.com/by-ru/article/search/).
- (массив) `keyword` - перечень ключевых слов для поиска элементов.
- (число) `requestCount` - количество запросов на одно ключевое слово. С одного запроса 50 элементов, если они есть. Максимум 40 запросов. По умолчанию один.
- (число) `itemCount` - количество выбираемых элементов из всех найденных на одно ключевое слово. По умолчанию три.
- (число) `skipCount` - количество пропускаемых элементов от начала на одно ключевое слово. По умолчанию ноль. 
- (булево) `inRow` - если не указано или `false`, элементы выбираются случайно. Если `true` берутся первые `N` элементов (по значению `itemCount`).
- (число) `popularity` - минимальное значение популярности трека. По умолчанию ноль.
- (объект) `followers` - диапазон количества подписчиков плейлиста (границы включительно). Фильтр до выбора `itemCount`. Используйте только с малым количеством `requestCount` при `type = playlist`. 

!> Необходимо соблюдать баланс значений в `params`. Несколько больших значений могут занять много времени выполнения и совершить много запросов. Выясняйте на практике приемлемые комбинации.

> Можно вывести количество совершенных запросов. Добавьте строчку в конец функции: 
> `console.log('Число запросов', CustomUrlFetchApp.getCountRequest());`

Пример 1 - Выбор 5 случайных плейлистов по каждому ключевому слову с популярностью треков от 70. С ограниченным количеством подписчиков плейлистов.
```js
let tracks = Source.mineTracks({
    keyword: ['synth', 'synthpop', 'rock'],
    followers: { min: 2, max: 1000 },
    itemCount: 5,
    requestCount: 3,
    popularity: 70,
});
```

Пример 2 - Выбор 10 первых плейлистов по ключевому слову с любой популярностью треков
```js
let tracks = Source.mineTracks({
    keyword: ['indie'],
    itemCount: 10,
    inRow: true,
});
```

Пример 3 - Выбор треков из случайных альбомов
```js
let tracks = Source.mineTracks({
    type: 'album',
    keyword: ['winter', 'night'],
});
```

Пример 4 - Выбор треков в жанре инди за 2020 год
```js
let tracks = Source.mineTracks({
    type: 'track',
    keyword: ['genre:indie + year:2020'],
});
```
