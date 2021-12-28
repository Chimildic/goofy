# Список изменений 

Текущая версия библиотеки отражена в константе `VERSION` файла `library`

Для добавления своих функций или переопределения существующих, используйте [инструкцию](https://github.com/Chimildic/goofy/discussions/18).

[Скопируйте обновленный код](https://script.google.com/d/1DnC4H7yjqPV2unMZ_nmB-1bDSJT9wQUJ7Wq-ijF4Nc7Fl3qnbT0FkPSr/edit?usp=sharing).

## Версия 1.6.3
- [#155](https://github.com/Chimildic/goofy/issues/155) Новая функция [Source.getReleasesByArtists](/reference/source?id=getreleasesbyartists). Собирает релизы исполнителей значительно быстрее прямого перебора, использовавшегося ранее при комбинации разных функций.
- [#162](https://github.com/Chimildic/goofy/issues/162) Аддон определения и фильтрации основного языка трека перенесен в основной код [Filter.detectLanguage](/reference/filter?id=detectlanguage). При первом запуске из редактора потребует разрешить доступ к Google Таблицам.

## Версия 1.6.2
- Уменьшено количество обращений к Google Диску. Операции чтения/записи одного и того же файла в рамках одного выполнения скрипта пройдут за меньшее время.
- Удалена функция `Cache.clear`. Используйте `Cache.write` для перезаписи файла.

## Версия 1.6.1
- Изменена структура данных на Диске для поддержки нескольких аккаунтов Spotify на одном аккаунте Google. 
  При первом запуске все файлы из папки `Goofy Data` будут помещены в новую папку с идентификаторов пользователя, для которого выполняется скрипт. Дальнейшие запуски будут изменять файлы из соответствующей пользователю папки.

  Если у вас один аккаунт Spotify, ничего делать не нужно.

  Если ранее уже настраивали несколько аккаунтов Spotify на одном аккаунте Google, выполните следующие действия:
  - запустите любой скрипт от первого аккаунта
  - верните файлам этого аккаунта стандартные имена на Диске
  - файлы других аккаунтов перенесите в папку `Goofy Data`
  - повторите для каждого аккаунта
- Добавлена возможность [создавать папки](/best-practices?id=Путь-до-файла)

## Версия 1.6.0
- Исправлены ошибки в отправке запросов. Количество пауз при запросах увеличится, время паузы сократится (при статусе ответа 429). 
- Добавление треков [RecentTracks.appendTracks](/reference/recenttracks?id=appendtracks) больше не сбивает алгоритм поиска новых прослушиваний в триггере обновления истории. 
- [Cache.append](/reference/cache?id=append) больше не добавляет данные в исходный массив (используйте [push](/reference/push?id=push)). Добавляет только в кэш файл. Возвращает количество всех элементов после добавления.
- Добавлена возможность отключить консольные сообщения от функций библиотеки. Глобальная настройка задается в [config-файле](/guide?=Параметры). Временная смена через функцию `Admin.setLogLevelOnce`. Из функций удалены аргументы `isLogging`.
- Без указания имени пользователя все функции из модуля `Lastfm` подставляют значение из `config-файла`.

## Версия 1.5.4
- Добавлена попытка повторного чтения/записи при неизвестной ошибки службы Google Диска.
- Добавлены функции: [Lastfm.rangeTags](/reference/lastfm?id=rangetags) и ряд Lastfm.getTop*ByTag.
- [addToQueue](/reference/player?id=addtoqueue) может добавлять массив треков в очередь.
- К [mineTracks](/reference/source?id=minetracks) добавлен параметр для пропуска элементов.
- К [removeUnavailable](/reference/filter?id=removeunavailable) добавлен аргумент отключения сообщений с логами.

## Версия 1.5.3
- Новая функция [checkFavoriteTracks](/reference/library?id=checkfavoritetracks).
- К [replaceWithSimilar](/reference/filter?id=replacewithsimilar) добавлен параметр, позволяющий удалить исходных исполнителей из рекомендаций.

## Версия 1.5.2
- Новые функции [getSavedAlbums](/reference/source?id=getsavedalbums), [followPlaylists](/reference/library?id=followPlaylists), [unfollowPlaylists](/reference/library?id=unfollowPlaylists).
- Функция [getFollowedTracks](/reference/source?id=getfollowedtracks) получила параметр `isFlat`.
- Из модуля `Yandex` удалены функции `getTracks` и `getAlbums`. Поскольку Яндекс перестал отвечать на такие запросы от Apps Script.

## Версия 1.5.1
- Новый модуль [Player](/reference/player). Нужно [обновить права доступа](/install?id=Обновить-права-доступа).
- `getPlayback` перемещен в `Player`.
- Добавлена функция [Player.transferPlayback](/reference/player?id=transferplayback)
- `removeTracks` и `removeArtists` получили режим проверки только основного исполнителя трека.
- Изменен формат входных параметров у [replaceWithSimilar](/reference/filter?id=replacewithsimilar).
- Исправлена ошибка с `getTop*`. Spotify не допускает в нем параметр `locale`. Пишите на форум если встретите ошибку `invalid request`.

## Версия 1.5.0
- Учитывать всех исполнителей трека в фильтр-функциях `remove*`, `match*`, `dedup*`.
- [getArtistsTracks](/reference/source?id=getartiststracks) и [getArtistsAlbums](/reference/source?id=getartistsalbums) получили параметр `isFlat`, позволяющий сгруппировать результат по исполнителю. По аналогии с [getArtistsTopTracks](/reference/source?id=getartiststoptracks). Поведение по умолчанию не изменилось, код менять не нужно.
- `rangeTracks` может фильтровать по типу альбома.
- `dedupTracks` получил новый аргумент для контроля отклонения продолжительности у треков с идентичными названиями. Подробнее [здесь](https://github.com/Chimildic/goofy/discussions/116).
- Все get-запросы из `SpotifyRequest` содержат параметр локали ([подробнее](https://github.com/Chimildic/goofy/discussions/79#discussioncomment-1019029)).

## Версия 1.4.9
- Эксперимент с функцией [sendMusicRequest](/reference/search?id=sendmusicrequest)
- Новый параметр в [Lastfm.getCustomTop](/reference/lastfm?id=getcustomtop), новая функция [Lastfm.convertToSpotify](/reference/lastfm?id=converttospotify) и шаблон с их использованием - [исполнители одного хита](/template?id=Исполнители-одного-хита).
- Удалена функция `getPlayingTrack`. Взамен добавлена [getPlayback](/reference/player?id=getplayback). Для использования нужно [обновить права доступа](/install?id=Обновить-права-доступа).
- `doGet` адаптирован под открытие `launch.html`, больше не нужно заменять функцию для [управления с телефона](https://github.com/Chimildic/goofy/discussions/9)
- Модифицирована функция `replaceWithSimilar`. Не должна создать дубликатов, запрашивает рекомендации с большим количеством данных от исходного трека.
- Багфикс [Alisa #99](https://github.com/Chimildic/goofy/discussions/99#discussioncomment-973227)

## Версия 1.4.8
- В [rangeTracks](/reference/filter?id=rangetracks) появились [вычисляемые значения](https://github.com/Chimildic/goofy/discussions/87): `anger`, `happiness` и `sadness`. Их нет со стороны Spotify, поэтому нельзя использовать при запросе рекомендаций. 
- Все функции match теперь проверяют и основного исполнителя трека, помимо альбома и названия.
- У [getCustomTop](/reference/lastfm?id=getcustomtop) появились параметры минимального и максимального количества прослушиваний.
- Удаление дубликатов альбомов при запросе альбомов от исполнителей. Баг Spotify, иногда возвращает одинаковые альбомы (для разных стран).
- Добавлена документация для модуля Search
- Нужно [обновить файл config](https://github.com/Chimildic/goofy/blob/main/config.js):
  - Добавлен параметр локали `RU` при запросе плейлистов. В связи с [постом](https://github.com/Chimildic/goofy/discussions/79#discussioncomment-814744): кириллическое название возвращалось на латинице.
  - Предел сохраняемой истории в 20 тысяч треков вынесен в конфиг, чтобы изменить и не терять при обновлении. Есть пример стабильной работы и с 40 тысячами.

## Версия 1.4.7
- Эксперимент. При неизвестной ошибке со стороны Google во время записи через `Cache.write` происходит повторная попытка записи после паузы. 
- [06.06.21]
  - [replaceWithSimilar](/reference/filter?id=replacewithsimilar) может принять сразу несколько массивов для замены. Если замены не нашлось, трек удаляется.
- [20.05.21] 
  - Эксперимент. Дополнительная проверка при поиске наилучшего совпадения (совпадение строк), [подробнее](https://github.com/Chimildic/goofy/discussions/64).
  - Order.sort может сортировать массивы исполнителей и альбомов.
  - Новая функция [Playlist.removeTracks](/reference/playlist?id=removetracks).
  - [getTracks](/reference/source?id=gettracks) может выбирать ограниченное количество треков из плейлистов.

## Версия 1.4.6
- Новая функция _getPlayingTrack_. Требуется [обновить права доступа](/install?id=Обновить-права-доступа).
- При создании плейлиста можно указать статичную обложку через прямую ссылку на нее.

## Версия 1.4.5
- Теперь [mineTracks](/reference/source?id=minetracks) может искать ключевые слова в названиях альбомов и самих треках. 
- В `mineTracks` аргумент `playlistCount` **переименован** в `itemCount`.
- Новая функция у Filter: [replaceWithSimilar](/reference/filter?id=replacewithsimilar).
- Новая функция у Lastfm: [getSimilarArtists](/reference/lastfm?id=getsimilarartists).

## Версия 1.4.4
- Новый фильтр [removeUnavailable](/reference/filter?id=removeunavailable).
- `Cache` может читать/писать файлы с расширением `.txt` при явном указании в имени файла.
- `getCustomTop` поддерживает тип `Date`, [подробнее](https://github.com/Chimildic/goofy/discussions/46#discussioncomment-351974).
- Исправление логической ошибки в `match` при отборе.

## Версия 1.4.3
- Теперь [getCustomTop](/reference/lastfm?id=getcustomtop) может составить топ по альбомам.
- При сортировке по дате релиза, треки сохраняют оригинальный порядок в рамках своего альбома, если изначально были в таком порядке
- Багфиксы

## Версия 1.4.2
- Теперь [craftTracks](/reference/source?id=crafttracks) может принимать статичные `seed_*` отличные от `key`.
- Новая функция к Lastfm: [getCustomTop](/reference/lastfm?id=getcustomtop).
- Новая функция к Selector: [pickYear](/reference/selector?id=pickyear).
- Новая функция к Order: [separateYears](/reference/order?id=separateyears).
- Улучшение для поиска. Если один и тот же элемент присутствует в массиве несколько раз (то есть имеет одинаковое ключевое слово для поиска), будет затрачен только один запрос поиска.
- Функции `Source`, связанные с плейлистами, добавляют к каждому треку объект `origin`, содержащий `name` и `id` плейлиста-источника.
- Предпринята попытка продолжить исполнение кода после получения исключения `Exception: Адрес недоступен`, [подробнее](https://github.com/Chimildic/goofy/discussions/27).

## Версия 1.4.1
- Ускорено время выполнения функции `craftTracks`.
- Найдена недокументированная возможность Spotify API. Функция [getRecomTracks](/reference/source?id=getrecomtracks) поддерживает ключ `popularity`. В связи с этим он **удален** у [craftTracks](/reference/source?id=crafttracks). Переместите его в параметр `query`, если использовали. 
- К `Order.sort` добавлена возможность сортировки по дате релиза альбома, которому принадлежит трек.
- Из списка функций, которым можно задать триггер скрыты `displayAuthResult`, `updateRecentTracks`, `logProperties`.

## Версия 1.4.0
- **Удалена** функция `Source.getRecentTracks`. Используйте `RecentTracks.get` или `Cache.read` для нужного файла истории.
- Новые функции к Source: [mineTracks](/reference/source?id=minetracks), [craftTracks](/reference/source?id=crafttracks).
- Новая функция к RecentTracks: [appendTracks](/reference/recenttracks?id=appendtracks).
- Структура файла `SpotifyRecentTracks` обновлена до обычного массива треков (как у остальных файлов истории). Обновление произойдет автоматически при первом запуске триггера. До этого момента `Cache.read` будет возвращать старую структуру.
- К Library добавлены функции сохранения и удаления альбомов библиотеки.

## Версия 1.3.4 
- Новые функции к Source: [getCategoryTracks](/reference/source?id=getcategorytracks), [getListCategory](/reference/source?id=getlistcategory).
- Появился параметр [REQUESTS_IN_ROW](/guide?id=Параметры).
- При чтении пустого файла через Cache.read выбрасывается исключение, чтобы предотвратить перезапись файла при баге со стороны Google ([подробнее](https://github.com/Chimildic/goofy/discussions/26)).
- Новая функция [Playlist.saveWithUpdate](/reference/playlist?id=savewithupdate).
- Функции match* могут принимать массив исполнителей. В случае массива треков, сравнение по названию трека и альбома (без исполнителя). В случае массива исполнителей, только его имя.
- В документацию добавлены шаблоны с форума (Назад в этот день, исполнитель дня)

## Версия 1.3.3
- Оптимизация запросов к Last.fm в механизме накопления. Поиск только тех треков, что являются новыми для истории прослушиваний.
- Новые функции к Lastfm: [getSimilarTracks](/reference/lastfm?id=getsimilartracks), [getTopArtists](/reference/lastfm?id=gettopartists-1), [getTopAlbums](/reference/lastfm?id=gettopalbums).
- Новые функция к Source: [getRelatedArtists](/reference/source?id=getrelatedartists), [getAlbumsTracks](/reference/source?id=getalbumstracks).
- Новая функция к Yandex: _getAlbums_._
- Теперь [dedupArtists](/reference/filter?id=dedupartists) может удалить дубликаты из массива исполнителей.
- Теперь [removeArtists](/reference/filter?id=removeartists) может удалять по массиву исполнителей.
- Корректировка группы методов match*
- При поиске и сравнивании из строки удаляются специальные символы (,!@# и тд).
- Более информативные сообщения в логах для истории прослушиваний и при поиске.

## Версия 1.3.2
- Обновлен механизм отправки запросов. Многие функции-источники стали отрабатывать быстрее за счет асинхронной отправки сразу N-количества запросов.
- Дополнение функции mixin. Теперь можно задавать соотношение более, чем двум массивам. Подробнее в [mixinMulti](/reference/combiner?id=mixinmulti).
- Новые функции: [getTopArtits](/reference/lastfm?id=gettopartists), [getArtistsTopTracks](/reference/lastfm?id=getartiststoptracks).

## Версия 1.3.1
- Новые функции для модуля Cache: [rename](/reference/cache?id=rename), [remove](/reference/cache?id=remove), [clear](/reference/cache?id=clear), [compressArtists](/reference/cache?id=compressArtists).
- Стали публичными функции: [getArtists](/reference/source?id=getartists), [getArtistsAlbums](/reference/source?id=getartistsalbums), [getAlbumTracks](/reference/source?id=getalbumtracks).
- Функция getTracksArtists **переименована** в getArtistsTracks.
- Повторный вызов getSavedTracks в том же скрипте отправляет новые запросы к Spotify, вместо возврата ранее полученного. Используйте [sliceCopy](/reference/selector?id=slicecopy) для создания копии.
- Количество отправленных запросов теперь получается через `CustomUrlFetchApp.getCountRequest`.
- Багфикс: spotify get с 404 прерывал скрипт; lastfm с ошибками 500+ прерывал скрипт.
- Багфикс: separateArtists не разделял исполнителей.
- Множество небольших правок.

## Версия 1.3.0
- Обновлены: инструкция и видео по установке.
- Функциям `removeTracks` и `removeArtists` добавлен аргумент `invert` (инверсия).
- Подавление ошибок от lastfm, чтобы не прерывать исполнение скрипта.
- Добавлено анонимное отслеживание распределения версий библиотеки через Google Forms. Отправляются значения версии и идентификатор скрипта. Чтобы иметь представление каково количество уникальных пользователей.

## Версия 1.2.0
- Добавлены `параметры` для отслеживания истории. Нужно сделать [миграцию](https://4pda.ru/forum/index.php?act=findpost&pid=102495416&anchor=migrate_params).
- Лимит истории прослушиваний увеличен с 10 до 20 тысяч.
- Трекам истории Lastfm добавляется дата прослушивания. Можно использовать `rangeDateRel`.
- Механизм накопления прослушиваний Lastfm, если установить `параметры`. Чтобы вместо `Lastfm.getRecentTracks` с малым числом треков из-за лимитов, получать много и быстро.
- Получать историю одной функцией `RecentTracks.get`, не зависимо от `параметров`, в том числе сводную из двух источников. В сводной удалены дубликаты, есть сортировка от свежих к старым прослушиваниям.
