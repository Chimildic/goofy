# Список изменений 

Текущая версия библиотеки отражена в константе `VERSION` файла `Library`

Подробности о работе функций смотреть в [справочнике](/func)

Для добавления своих функций или переопределения существующих, используйте [инструкциию](https://github.com/Chimildic/goofy/discussions/18).

## Версия 1.3.4 
- Новые функции к Source: [getCategoryTracks](/func?id=getcategorytracks), [getListCategory](/func?id=getlistcategory).
- Появился параметр [REQUESTS_IN_ROW](/guide?id=Параметры).
- При чтении пустого файла через Cache.read выбрасывается исключение, чтобы предотвратить перезапись файла при баге со стороны Google ([подробнее](https://github.com/Chimildic/goofy/discussions/26)).
- Новая функция [Playlist.saveWithUpdate](//func?id=savewithupdate).

## Версия 1.3.3
- Оптимизация запросов к Last.fm в механизме накопления. Поиск только тех треков, что являются новыми для истории прослушиваний.
- Новые функции к Lastfm: [getSimilarTracks](/func?id=getsimilartracks), [getTopArtists](/func?id=gettopartists-1), [getTopAlbums](/func?id=gettopalbums).
- Новые функция к Source: [getRelatedArtists](/func?id=getrelatedartists), [getAlbumsTracks](/func?id=getalbumstracks).
- Новая функция к Yandex: [getAlbums](/func?id=getalbums).
- Теперь [dedupArtists](/func?id=dedupartists) может удалить дубликаты из массива исполнителей.
- Теперь [removeArtists](/func?id=removeartists) может удалять по массиву исполнителей.
- Корректировка группы методов match*
- При поиске и сравнивании из строки удаляются специальные символы (,!@# и тд).
- Более информативные сообщения в логах для истории прослушиваний и при поиске.

## Версия 1.3.2
- Обновлен механизм отправки запросов. Многие функции-источники стали отрабатывать быстрее за счет асинхронной отправки сразу N-количества запросов.
- Дополнение функции mixin. Теперь можно задавать соотношение более, чем двум массивам. Подробнее в [mixinMulti](/func?id=mixinmulti).
- Новые функции: [getTopArtits](/func?id=gettopartists), [getArtistsTopTracks](/func?id=getartiststoptracks).

## Версия 1.3.1
- Новые функции для модуля Cache: [rename](/func?id=rename), [remove](/func?id=remove), [clear](/func?id=clear), [compressArtists](/func?id=compressArtists).
- Стали публичными функции: [getArtists](/func?id=getartists), [getArtistsAlbums](/func?id=getartistsalbums), [getAlbumTracks](/func?id=getalbumtracks).
- Функция getTracksArtists **переименована** в getArtistsTracks.
- Повторный вызов getSavedTracks в том же скрипте отправляет новые запросы к Spotify, вместо возврата ранее полученного. Используйте [sliceCopy](/func?id=slicecopy) для создания копии.
- Количество отправленных запросов теперь получается через `CustomUrlFetchApp.getCountRequest`.
- Багфикс: spotify get с 404 прерывал скрипт; lastfm с ошибками 500+ прерывал скрипт.
- Багфикс: separateArtists не разделял исполнителей.
- Множество небольших правок.

## Версия 1.3.0
- Обновлены: инструкция и видео по установке.
- Функциям `removeTracks` и `removeArtists` добавлен аргумент `invert` (инверсия).
- Мьют ошибок от lastfm, чтобы не прерывать исполнение скрипта.
- Добавлено анонимное отслеживание распределения версий библиотеки через Google Forms. Отправляются значения версии и идентификатор скрипта. Чтобы иметь представление каково количество уникальных пользователей.

## Версия 1.2.0
- Добавлены `параметры` для отслеживания истории. Нужно сделать [миграцию](https://4pda.ru/forum/index.php?act=findpost&pid=102495416&anchor=migrate_params).
- Лимит истории прослушиваний увеличен с 10 до 20 тысяч.
- Трекам истории Lastfm добавляется дата прослушивания. Можно использовать `rangeDateRel`.
- Механизм накопления прослушиваний Lastfm, если установить `параметры`. Чтобы вместо `Lastfm.getRecentTracks` с малым числом треков из-за лимитов, получать много и быстро.
- Получать историю одной функцией `RecentTracks.get`, не зависимо от `параметров`, в том числе сводную из двух источников. В сводной удалены дубликаты, есть сортировка от свежих к старым прослушиваниям.