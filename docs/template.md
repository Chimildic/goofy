# Список шаблонов

Предлагает ряд готовых функций. Можно модифицировать предлагаемые источники, фильтры и прочие составляющие по своему усмотрению. Для этого ознакомьтесь со справочником по [списку функций](https://chimildic.github.io/goofy/#/func).

Если хотите предложить свой шаблон или вам нужна помощь, напишите на [форум](https://github.com/Chimildic/goofy/discussions).

# **Установка шаблона**

- Прочитайте описание шаблона и комментарии в коде
- Скопируйте функцию в конец файла `main` или в новый файл (меню `Файл` - `Создать` - `Скрипт`)
- Если требуется, замените `вашеId` на соответствующие значения и модифицируйте шаблон в соответствии с комментариями или личными предпочтениями
- Выполните [отладку](/first-playlist?id=Отладка)
- Задайте триггер, пример в [первом плейлисте](/first-playlist)

# Незнакомый сет

`Рекомендуется` Ежедневный триггер, до 60 треков, история 1 тысячи прослушанных треков 

`Источник` Плейлисты: Радар новинок, Открытия недели и Микс дня 1-6

`Фильтр` удаляются любимые треки, недавняя история прослушиваний, дубликаты треков и исполнителей. Остаются только оригинальные версии треков без кириллицы. Блокировка ряда жанров, менять по вкусу. 

```js
function templateUnknownSet() {
    let banTracks = [];
    let savedTracks = Source.getSavedTracks();
    let recentTracks = RecentTracks.get(1000);
    Combiner.push(banTracks, savedTracks, recentTracks);

    // Вставьте свои id плейлистов, которые берутся из ссылки или URI
    // https://chimildic.github.io/goofy/#/guide?id=Идентификатор
    let onlyForYouTracks = Source.getTracks([
        { name: 'Микс дня 1', id: 'вашеId' },
        { name: 'Микс дня 2', id: 'вашеId' },
        { name: 'Микс дня 3', id: 'вашеId' },
        { name: 'Микс дня 4', id: 'вашеId' },
        { name: 'Микс дня 5', id: 'вашеId' },
        { name: 'Микс дня 6', id: 'вашеId' },
        { name: 'Радар новинок', id: 'вашеId' },
        { name: 'Открытия недели', id: 'вашеId' },
    ]);
    
    Filter.dedupTracks(onlyForYouTracks);
    Filter.dedupArtists(onlyForYouTracks);
    Filter.removeTracks(onlyForYouTracks, banTracks);
    Filter.matchOriginalOnly(onlyForYouTracks);
    Filter.matchExceptRu(onlyForYouTracks);

    // Способ удаления дизлаков, если собираете такой плейлист
    // let banArtists = Source.getPlaylistTracks('', 'вашеId');
    // Filter.removeArtists(onlyForYouTracks, banArtists);
    
    Filter.rangeTracks(onlyForYouTracks, {
        artist: {
            ban_genres: ['rap', 'r&b', 'metal', 'anime', 'soul', 'blues', 'punk'],
        },
    });

    Selector.keepRandom(onlyForYouTracks, 60);
    
    Playlist.saveWithReplace({
        // id: 'вашеId', // подставьте id созданного плейлиста, после первого запуска кода
        name: 'Незнакомый сет',
        tracks: onlyForYouTracks,
        description: Playlist.getDescription(onlyForYouTracks),
        randomCover: 'update',
    });
}
```

# Отслеживание обновлений

`Рекомендация` Изменить период для [rangeDateRel](/func?id=rangetracks)

`Источник` Отслеживаемые плейлисты. Можно включить свои, подробнее в [getFollowedTracks](/func?id=getfollowedtracks)

`Фильтр` За последние три дня исключая сегодня

```js
function templateFollowedTracks(){
    let followedTracks = Source.getFollowedTracks();
    Filter.rangeDateRel(followedTracks, 3, 1);

    // Добавить Order и Selector для ограничения количества

    Playlist.saveWithReplace({
        name: 'Отслеживание обновлений',
        tracks: followedTracks,
        description: Playlist.getDescription(followedTracks),
        randomCover: 'update',
    });
}
```

# Любимо и забыто

`Рекомендация` Еженедельный триггер, до 20 треков, история 2.5 тысяч прослушанных треков
`Источник` Любимые треки
`Фильтр` Добавлено более 30 дней назад и не прослушивается более 125 часов (2.5 тысячи истории * 3 минуты)

> Наиболее актуально после набора большой [истории прослушиваний](/overview?id=История-прослушиваний)

```js
function templateSavedAndForgot(){
    let recentTracks = RecentTracks.get(2500);
    let savedTracks = Source.getSavedTracks(); 
    Filter.removeTracks(savedTracks, recentTracks);
    
    let startDate = new Date('2006-01-01');
    let endDate = Filter.getDateRel(30, 'endDay');
    Filter.rangeDateAbs(savedTracks, startDate, endDate);
    
    Selector.keepRandom(savedTracks, 20);    
    Order.sort(savedTracks, 'meta.added_at', 'asc');
    Playlist.saveWithReplace({
        // id: 'вашеId', // после первого создания плейлиста
        name: 'Любимо и забыто',
        tracks: savedTracks,
        description: Playlist.getDescription(savedTracks),
        randomCover: 'update',
    });
}
```

# Новинки редакций

`Рекомендация` Еженедельный триггер, до 60 треков, история 1 тысячи прослушанных треков
`Источник` Плейлисты с новинками от редакций Spotify, MTV, Topsify и других
`Фильтр` За неделю исключая сегодня. Удаляется недавняя история прослушиваний, дубликаты треков. Без кириллицы и миксов. Блокировка ряда жанров, менять по вкусу. С установкой минимального порога популярности.

```js
function templateNewRelease(){
    let recentTracks = RecentTracks.get(1000);
    let newReleaseTracks = Source.getTracks([
        // Популярные редакции
        { name: 'All New Indie', id: '37i9dQZF1DXdbXrPNafg9d' },
        { name: 'New music friday', id: '37i9dQZF1DX4JAvHpjipBk' },
        { name: 'NMEs Best New Tracks', id: '4NzWle6sDBwHLQ1tuqLKhp' },
        { name: 'Best New Music by Complex', id: '5PKZSKuHP4d27SXO5fB9Wl' },
        { name: 'MTV PUSH: Radar', id: '1RpijnCwXVGB2fxMA8km5K' },
        { name: 'Pop n Fresh by Spotify', id: '37i9dQZF1DX50KNyX4Fc9O' },
        { name: 'New Music Friday UK', id: '37i9dQZF1DX4W3aJJYCDfV' },
        { name: 'New This Week by Topsify', id: '4f0IMCLd3iciiLR4V6qXcp' },
        { name: 'Pop Rising by Topsify', id: '37i9dQZF1DWUa8ZRTfalHk' },
        
        // Менее популярные редакции
        { name: 'Disco Naivete', id: '4c6G93bHqsUbwqlqRDND9k' },
        { name: 'The Line Of Best Fit', id: '5359l8Co8qztllR0Mxk4Zv' },
        { name: 'Going Solo', id: '1ozCM0k4h6vrMlAzNaJCyy' },
        { name: '[PIAS] Monday', id: '59y1SSfAYf2DE4PmHhwNh1' },
        { name: 'undercurrents', id: '37i9dQZF1DX9myttyycIxA' },
        { name: 'XL Play', id: '1IUF5q4IvkjylMhd9P0urE' },
        { name: 'HumanHuman Most Promising', id: '5VMDrQb7imexrTLjLVjbnO' },
        { name: 'ESNS Chart', id: '72qhgUjoFVONkcQcBNQYcY' },
    ]);

    Filter.dedupTracks(newReleaseTracks);
    Filter.rangeDateRel(newReleaseTracks, 7, 1);
    Filter.removeTracks(newReleaseTracks, recentTracks);  
    Filter.matchExceptMix(newReleaseTracks);
    Filter.matchExceptRu(newReleaseTracks);
    Filter.rangeTracks(newReleaseTracks, {
        meta: {
            popularity: { min: 35, max: 100 },
        },
        artist: {
            ban_genres: ['pop', 'hip hop', 'rap', 'r&b', 'blues', 'punk', 'hollywood', 'latin', 'african', 'house'],
        },
    }); 
    
    Order.sort(newReleaseTracks, 'meta.popularity', 'desc');
    Selector.keepFirst(newReleaseTracks, 60);
        
    Playlist.saveWithReplace({
        // id: 'вашеId', // после первого создания плейлиста
        name: 'Новинки редакций',
        tracks: newReleaseTracks,
        description: Playlist.getDescription(newReleaseTracks),
        randomCover: 'update',
    });
}
```

# Радар жанра

`Рекомендация`| Ежедневный триггер. Но обновление плейлиста произойдет только в назначенный день.
`Источник` Рекомендации по жанру и добавления в плейлисты пользователя [spotify](https://open.spotify.com/user/spotify) за неделю
`Фильтр` Удаляются дубликаты треков и исполнителей. Только оригинальные версии без кириллицы.

> ❗️ Выполнение занимает около 4 минут и отправляет порядка 2 тысяч запросов. Подробнее в [ограничениях](/overview?id=Ограничения) и [getFollowedTracks](/func?id=getfollowedtracks)

```js
function templateRandarGenre(){
    // Выбор жанра в зависимости от дня недели
    // До 5 в один день из-за getRecomTracks, подробности в справочнике
    let genres;
    if (Selector.isDayOfWeekRu('понедельник')){
        genres = ['indie'];
    } else if (Selector.isDayOfWeekRu('среда')){
        genres = ['alternative'];
    } else if (Selector.isDayOfWeekRu('пятница')){
        genres = ['rock', 'post'];
    } else {
        // Если сегодня другой день недели, не выполнять 
        return;
    }
    
    let spotifyTracks = cleanTracks(Source.getFollowedTracks({
      type: 'owned',
      userId: 'spotify'
    }));
    Filter.rangeDateRel(spotifyTracks, 7, 1);
    Filter.rangeTracks(spotifyTracks, {
        artist: {
            popularity: { min: 25, max: 100},
            genres: genres,
            ban_genres: ['rap', 'r&b', 'edm', 'hip-hop', 'metal', 'anime', 
                         'soul', 'blues', 'punk', 'dance', 'latino', 'african'],
        },
    });
    
    let recomTracks = cleanTracks(Source.getRecomTracks({
        seed_genres: genres.join(','),
    }));
    
    let tracks = Combiner.mixin(spotifyTracks, recomTracks, 2, 2, true);
    Selector.keepFirst(tracks, 60);
    
    Playlist.saveWithReplace({
        name: 'Радар жанра',
        tracks: tracks,
        description: Playlist.getDescription(tracks),
        randomCover: 'update',
    });
   
    console.log('Число запросов', CustomUrlFetchApp.getCountRequest());

    // Вспомогательная функция
    function cleanTracks(tracksArray){
        Filter.dedupTracks(tracksArray);
        Filter.dedupArtists(tracksArray);
        Filter.matchOriginalOnly(tracksArray);
        Filter.matchExceptRu(tracksArray); 
        return tracksArray;
    }
}
```

# Копилка

`Рекомендация` Один или несколько плейлистов, которые обновляются раз в неделю
`Источник` Например, плейлист `Радар новинок`
`Фильтр` Удаляются дубликаты треков, а также ранее прослушанное 

```js
function templateCollectPlaylist(){
    let recentTracks = RecentTracks.get(1000);
    let newTracks = Source.getPlaylistTracks('Радар новинок', 'вашеId');

    // После первого создания плейлиста 
    // let currentTracks = Source.getPlaylistTracks('Копилка: Радар новинок', 'вашеId');
    // Combiner.push(newTracks, currentTracks);
    
    Filter.dedupTracks(newTracks);
    Filter.removeTracks(newTracks, recentTracks);
    // Если используется история прослушиваний с lastfm
    // Lastfm.removeRecentTracks(newTracks, 'ваш логин lastfm', 1000);
    
    Playlist.saveWithReplace({
      // id: 'вашеId', // После первого создания плейлиста 
      name: 'Копилка: Радар новинок',
      tracks: newTracks,
      randomCover: 'update',
    });
}
```

# Односторонняя синхронизация

Добавлять в любимое треки, взятые с лайков Яндекс.Музыки. Сразу все может не получиться из-за квоты на время выполнения скрипта. Подробнее в [ограничениях](/overview?id=Ограничения). Поэтому предлагается установить триггер раз в неделю и подстроить под себя число треков для поиска. К пример, в коде это 50. Значит каждую неделю проверяются последние 50 лайков Яндекс.Музыки и если есть новые, добавляются в Spotify.
```js
function templateYandexSync() {
    let yandexTracks = Yandex.getTracks('owner', '3', 50);
    let savedTracks = Source.getSavedTracks();
    Filter.removeTracks(yandexTracks, savedTracks);
    console.log('Лайков с Яндекса за неделю', yandexTracks.length);
    Library.saveFavoriteTracks(yandexTracks);
}
```

# Исполнитель дня

Механизм выбора случайного исполнителя из отслеживаемых, которого не было в предыдущие дни. Логика отбора треков на ваше усмотрение.

## Константы

`BORDER_DATE_REL`  - граница в днях, после которой исполнитель может повториться. В случае, когда все исполнители уже были по одному разу.
`RECENT_TRACKS` - число удаляемых из выборки треков истории прослушиваний.
`ARTISTS` - перечень исполнителей для выбора. По умолчанию, все отслеживаемые. Соответствует аргументам [getArtists](https://chimildic.github.io/goofy/#/func?id=getartists).
`FILENAME` - имя кэш-файла на Google Диск

## Функции

Следующий код выбирает исполнителя
```js
let todayArtist = [findNextArtist()];
```
Можно сразу несколько
```js
let todayArtist = [findNextArtist(), findNextArtist()];
```

Вся логика отбора треков и создания плейлиста находится в функции `createPlaylist`. В примере это альбомы и синглы исполнителя, которые выпущены за последние 4 года, исключая 1 последний. Удалена недавняя история прослушиваний и выполнен отбор только оригинальных версий треков. 

Следующий блок из функции `createPlaylist` отвечает за то, чтобы, в случае нулевого количества треков после всех фильтров, повторить механизм поиска исполнителя. Поэтому функция `createPlaylist` должна возвращать `true` в случае успешного обновления плейлиста.
```js
if (tracks.length == 0){
    return false;
}
```

Остальные функции не требуют никаких изменений.

## Код 
```js
function templateArtistOfDay() {
    const FILENAME = 'FollowedArtists.json';
    const BORDER_DATE_REL = 30;
    const RECENT_TRACKS = 1000;
    const ARTISTS = { followed_include: true };

    let cacheArtists = Cache.read(FILENAME);
    if (cacheArtists.length == 0 || Selector.isDayOfWeek('monday')) {
        updateArtists();
    }

    let todayArtist = [findNextArtist()];
    Cache.write(FILENAME, cacheArtists);
    let isSuccess = createPlaylist();
    if (!isSuccess){
        templateArtistOfDay();
    }

    function createPlaylist() {
        let tracks = Source.getArtistsTracks({
            artist: { followed_include: false, include: todayArtist },
            album: { groups: 'album,single', release_date: { sinceDays: 1825, beforeDays: 365 },},
        });
        
        Filter.removeTracks(tracks, RecentTracks.get(RECENT_TRACKS));
        Filter.matchOriginalOnly(tracks);
        
        if (tracks.length == 0){
            return false;
        }
        
        Playlist.saveWithReplace({
            // id: 'id вашего плейлиста', // после первого создания
            name: 'Исполнитель дня',
            tracks: tracks,
        });
        
        return true;
    }

    function findNextArtist() {
        let artist = getNextArtist();
        if (!artist) {
            updateArtists();
            cleanOldTags();
            artist = getNextArtist();
        }
        return artist || cacheArtists[0];
    }

    function getNextArtist() {
        Order.shuffle(cacheArtists);
        return cacheArtists.find((artist) => {
            if (!artist.hasOwnProperty('wasArtistOfDay')) {
                artist.wasArtistOfDay = new Date().toISOString();
                return artist;
            }
        });
    }

    function cleanOldTags() {
        let borderDateTime = Filter.getDateRel(BORDER_DATE_REL, 'startDay').getTime();
        cacheArtists.forEach((artist) => {
            if (artist.hasOwnProperty('wasArtistOfDay') && new Date(artist.wasArtistOfDay).getTime() <= borderDateTime) {
                delete artist.wasArtistOfDay;
            }
        });
    }

    function updateArtists() {
        let spotifyArtists = Source.getArtists(ARTISTS);
        let ids = cacheArtists.map((artist) => artist.id);
        spotifyArtists.forEach((artist) => {
            if (!ids.includes(artist.id)) {
                cacheArtists.push(artist);
            }
        });
    }
}
```

# Назад в этот день

Собирает альбомы отслеживаемых исполнителей, которые вышли в этот день (число, месяц), но в другие года. Удаляет миксы и слишком короткие треки (интро). 

Текущий год не включается. Чтобы включался, удалите условие `&& releaseDate.getFullYear() < year`

Можно менять смещение дня, изменив значение `0` в `Filter.getDateRel(0, 'endDay')`

## Код
```js
function templateOnThisDay() {
    let artists = Source.getArtists({ followed_include: true });
    let albums = filterAlbums(Source.getArtistsAlbums(artists, {}));
    let tracks = getAlbumsTracks(albums);
    Filter.matchExceptMix(tracks, 'mix');
    Filter.rangeTracks(tracks, {
        meta: {
            duration_ms: { min: 120000 },
        },
    });
    Playlist.saveWithReplace({
        // id: 'вашеId',
        name: 'Назад в этот день',
        tracks: tracks, 
        randomCover: 'update',
    });
    
    function filterAlbums(albums) {
        let today = Filter.getDateRel(0, 'endDay');
        let date = today.getDate();
        let month = today.getMonth();
        let year = today.getFullYear();
        return albums.filter((album) => {
            let releaseDate = new Date(album.release_date);
            return releaseDate.getDate() == date && 
                   releaseDate.getMonth() == month && 
                   releaseDate.getFullYear() < year;
        });
    }

    function getAlbumsTracks(albums){
        let tracks = [];
        albums.forEach((album) => Combiner.push(tracks, Source.getAlbumTracks(album)));
        return tracks;
    }
}
```