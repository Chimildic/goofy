# Список шаблонов

Перед использованием шаблонов рекомендуется ознакомиться с обучением по созданию [первого плейлиста](/first-playlist). Значительно упростит работу с шаблонами, ответит на частые вопросы. Дополнительные шаблоны найдете на [форуме GitHub](https://github.com/Chimildic/goofy/discussions) и [4PDA](https://4pda.to/forum/index.php?s=&showtopic=715234&view=findpost&p=101196000).

## Незнакомый сет
```js
/**
 * Объединить треки из личных миксов в один плейлист
 * Удалить дубликаты, историю прослушиваний, лайки
 */
function updateUnknownSet() {
    let banTracks = [];
    let savedTracks = Source.getSavedTracks();
    let recentTracks = RecentTracks.get(1000);
    Combiner.push(banTracks, savedTracks, recentTracks);

    // Вставьте id плейлистов, которые берутся из ссылки или URI
    // Пример: https://chimildic.github.io/goofy/#/reference/desc?id=Идентификатор
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

    // Пример удаления исполнителей, если ведете бан-плейлист
    // let banArtists = Source.getPlaylistTracks('', 'вашеId');
    // Filter.removeArtists(onlyForYouTracks, banArtists);
    
    Filter.rangeTracks(onlyForYouTracks, {
        artist: {
            ban_genres: ['rap', 'r&b', 'metal', 'anime', 'soul', 'blues', 'punk'],
        },
    });
    
    // Подставьте id созданного плейлиста, после первого запуска кода, удалите комментарий
    Playlist.saveWithReplace({
        // id: 'вашеId',
        name: 'Незнакомый сет',
        tracks: Selector.sliceRandom(onlyForYouTracks, 60),
        description: Playlist.getDescription(onlyForYouTracks),
        randomCover: 'update',
    });
}
```

## Новые релизы
```js
/**
 * Сбор новых релизов от отслеживаемых исполнителей
 */
function updateNewReleases() {
  let newReleases = Source.getRecentReleasesByArtists({
    artists: Source.getArtists({ followed_include: true, }),
    date: { sinceDays: 7, beforeDays: 0 }, // за неделю, измените по необходимости
    type: ['album', 'single'],
  });
  Playlist.saveWithReplace({
    name: 'Новые релизы',
    tracks: newReleases,
  })
}
```

## Новые релизы по частям
```js
/**
 * Когда отслеживаемых исполнителей очень много, есть шанс достигнуть лимита на время выполнения или получить паузу от Spotify на сутки.
 * Можно разделить исполнителей на чанки. Например, установив триггер "каждый час" при размере чанка 100 за сутки проверится 2400 исполнителей.
 * Функция накапливает релизы в кэш. При желании можно подмешивать их в другие плейлисты. 
 */
function chunkDiscoverRecentReleases() {
  const CHUNK_SIZE = 100 // Количество проверяемых исполнителей за один запуск
  const FA_FILENAME = 'ChunkFollowedArtists.json'
  const RR_FILENAME = 'ChunkDiscoverRecentReleases.json'

  let followedArtists = Cache.read(FA_FILENAME)
  if (followedArtists.length == 0) {
    followedArtists = Source.getArtists({ followed_include: true })
    Cache.write(FA_FILENAME, followedArtists)
  }
  if (followedArtists.length > 0) {
    discover()
    saveWithReplace() // опциальное сохранение релизов в плейлист
  }

  function discover() {
    let discoverableArtists = followedArtists.splice(0, CHUNK_SIZE)
    Cache.write(FA_FILENAME, followedArtists)

    let remoteTracks = Source.getRecentReleasesByArtists({
      artists: discoverableArtists,
      date: { sinceDays: 1, beforeDays: 0 },
      type: ['album', 'single'],
      isFlat: true,
    })

    if (remoteTracks.length > 0) {
      Cache.compressTracks(remoteTracks)
      let combinedTracks = Combiner.push(remoteTracks, Cache.read(RR_FILENAME))
      Filter.dedupTracks(combinedTracks)
      Order.sort(combinedTracks, 'album.release_date', 'desc')
      Cache.write(RR_FILENAME, combinedTracks)
    }
  }

  function saveWithReplace() {
    Playlist.saveWithReplace({
      name: 'Новые релизы',
      tracks: Cache.read(RR_FILENAME),
      randomCover: 'update',
    })
  }
}
```

## Открытия с альбомов
```js
/**
 * Популярные треки с альбомов, в которых уже есть известные вам любимые треки
 */
function updateDiscoveryAlbums() {
  const LIMIT_TRACKS = 20;
  const LIMIT_ALB_TRACK = 1;

  let recentTracks = RecentTracks.get(3000);
  let savedTracks = Source.getSavedTracks();
  let banTracks = Combiner.push([], recentTracks, savedTracks);
  let banArtists = Selector.sliceCopy(recentTracks);
  Filter.rangeDateRel(banArtists, 2, 0);

  let tracks = savedTracks;
  Order.shuffle(tracks);

  let recomTracks = [];
  for (let i = 0; i < tracks.length; i++) {
    if (tracks[i].album.album_type == 'compilation' 
        || tracks[i].album.total_tracks == 1) {
      continue;
    }
    let albumTracks = Source.getAlbumTracks(tracks[i].album);
    Filter.matchOriginalOnly(albumTracks);
    Filter.removeArtists(albumTracks, banArtists);
    Filter.removeTracks(albumTracks, banTracks);
    if (albumTracks.length == 0) {
      continue;
    }

    Order.sort(albumTracks, 'meta.popularity', 'desc');
    Selector.keepFirst(albumTracks, LIMIT_ALB_TRACK);
    Combiner.push(recomTracks, albumTracks);

    Filter.dedupTracks(recomTracks);
    if (recomTracks.length >= LIMIT_TRACKS) {
      break;
    }
  }

  Playlist.saveWithReplace({
    name: 'Открытия с альбомов',
    description: 'Эти треки должны тебе понравится!',
    tracks: Selector.sliceFirst(recomTracks, LIMIT_TRACKS),
    randomCover: 'update',
  });
}
```

## Любимо и забыто
```js
/**
 * Собрать любимые треки, которые давно не прослушивались и добавлены больше месяца назад
 * Рекомендуется использовать после накопления хотя бы небольшой истории прослушиваний
 */
function updateSavedAndForgot(){
    let recentTracks = RecentTracks.get(3000);
    let savedTracks = Source.getSavedTracks(); 
    Filter.removeTracks(savedTracks, recentTracks);
    
    let startDate = new Date('2006-01-01');
    let endDate = Filter.getDateRel(30, 'endDay');
    Filter.rangeDateAbs(savedTracks, startDate, endDate);
    
    Selector.keepRandom(savedTracks, 20);    
    Order.sort(savedTracks, 'meta.added_at', 'asc');
    
    Playlist.saveWithReplace({
        // id: 'вашеId',
        name: 'Любимо и забыто',
        tracks: savedTracks,
        randomCover: 'update',
    });
}
```

## Отслеживание обновлений
```js
/**
 * Собрать из отслеживаемых плейлистов треки, которые были добавлены за неделю
 */
function updateFollowedTracks(){
    let followedTracks = Source.getFollowedTracks({
        type: 'followed',
    });
    // При необходимости измените период
    Filter.rangeDateRel(followedTracks, 7, 1);

    // Добавьте Order и Selector для ограничения количества

    Playlist.saveWithReplace({
        // id: 'вашеId',
        name: 'Отслеживание обновлений',
        tracks: followedTracks,
        randomCover: 'update',
    });
}
```

## Новинки редакций
```js
/**
 * Собрать новые релизы из подборок разных редакций (кураторов) за неделю
 */
function updateNewRelease(){
    let recentTracks = RecentTracks.get(2000);
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
        // id: 'вашеId',
        name: 'Новинки редакций',
        tracks: newReleaseTracks,
        randomCover: 'update',
    });
}
```

## Копилка
```js
/**
 * Накапливать треки из "Радара новинок", прослушанные треки удаляются
 */
function updateCollectorPlaylist(){
    // После первого создания плейлиста добавьте id копилки и удалите комментарии
    // const COLLECTOR_PLAYLIST_ID = '';
    let recentTracks = RecentTracks.get(1000);
    let newTracks = Source.getPlaylistTracks('Радар новинок', 'вашеId');

    // let currentTracks = Source.getPlaylistTracks('Копилка: Радар новинок', COLLECTOR_PLAYLIST_ID);
    // Combiner.push(newTracks, currentTracks);
    
    Filter.dedupTracks(newTracks);
    Filter.removeTracks(newTracks, recentTracks);
    
    Playlist.saveWithReplace({
      // id: COLLECTOR_PLAYLIST_ID,
      name: 'Копилка: Радар новинок',
      tracks: newTracks,
      randomCover: 'update',
    });
}
```