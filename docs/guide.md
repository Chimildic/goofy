# Дополнительно

# Параметры

Описание параметров из файла `config`

| Параметр | Тип | Описание |
|-|-|-|
| `CLIENT_ID` и `CLIENT_SECRET` | строка | Ключи для доступа к Spotify Web API. Получаются во время [первой установки](/install). |
| `LASTFM_API_KEY` | строка | Ключ для работы с Last.fm API. Получается [дополнительно](/install?id=Настройка-lastfm). |
| `ON_SPOTIFY_RECENT_TRACKS` | бул | При `true` отслеживание истории прослушиваний Spotify. При `false` отключается. |
| `ON_LASTFM_RECENT_TRACKS` | бул | При `true` отслеживание истории прослушиваний Last.fm. При `false` отключается. |
| `COUNT_RECENT_TRACKS` | число | Количество сохраняемых треков истории. По умолчанию 20 тысяч. На практике работает нормально и с 40 тысячами. Предел это объем файла в 50 мб. |
| `LOG_LEVEL`| строка | При `info` выводятся сообщения с информацией и ошибками от функций библиотеки. При `error` только сообщения об ошибках. При пустой строке отключает сообщения. В параметрах `config` задается значение по умолчанию, действующие при каждом запуске. В своем коде можно изменить уровень логов на время текущего выполнения `Admin.setLogLevelOnce('значение')`. |
| `LOCALE` | строка | Локаль при запросе плейлистов. Влияет на то, в каком виде представляются названия треков. [Известны случаи](https://github.com/Chimildic/goofy/discussions/79#discussioncomment-814744), когда исполнитель на кириллице возвращался с аналогом на латинице. Значение по умолчанию `RU`. |
| `LASTFM_RANGE_RECENT_TRACKS` | число | Количество последних треков, которые просматриваются в истории Last.fm за прошедшие 15 минут. |
| `LASTFM_LOGIN` | строка | Логин пользователя Last.fm, чья история собирается. |
| `REQUESTS_IN_ROW` | число | Количество одновременно отправляемых запросов. По умолчанию 40. Влияет на скорость получения данных. Например, запрос треков плейлиста. При получении большего количества ошибок номер `503` или наличию алгоритмов с очень большим числом запросов, рекомендуется снизить значение данного параметра. Повышение не рекомендуется. |

# Идентификатор

Таблицы ниже показывают как получить идентификатор из ссылки или URI.

## Плейлист {docsify-ignore}

| id или playlistId | URI | Ссылка |
|-|-|-|
| 5ErHcGR1VdYQmsrd6vVeSV | spotify:playlist:**5ErHcGR1VdYQmsrd6vVeSV** | [open.spotify.com/playlist/**5ErHcGR1VdYQmsrd6vVeSV**?si=123](open.spotify.com/playlist/5ErHcGR1VdYQmsrd6vVeSV) |
| 4vTwFTW4DytSY1N62itnwz | spotify:playlist:**4vTwFTW4DytSY1N62itnwz** | [open.spotify.com/playlist/**4vTwFTW4DytSY1N62itnwz**?si=123](open.spotify.com/playlist/4vTwFTW4DytSY1N62itnwz) |

## Пользователь {docsify-ignore}

Для старых аккаунтов равен логину. Для новых аккаунтов последовательность букв и цифр.

| userId | URI | Ссылка |
|-|-|-|
| glennpmcdonald | spotify:user:**glennpmcdonald** | [open.spotify.com/user/**glennpmcdonald**](open.spotify.com/user/glennpmcdonald) |
| ldxdnznzgvvftcpw09kwqm151 | spotify:user:**ldxdnznzgvvftcpw09kwqm151** | [open.spotify.com/user/**ldxdnznzgvvftcpw09kwqm151**](open.spotify.com/user/ldxdnznzgvvftcpw09kwqm151) |

# Описание параметров объектов

Таблица описывает основные ключи объектов Spotify в вольном переводе. Оригинал можно прочитать [здесь](https://developer.spotify.com/documentation/web-api/reference/tracks/get-audio-features/).

| Ключ | Диапазон | Описание |
|-|-|-|
| `popularity` | 0 - 100 |Популярность трека, исполнителя или альбома. Более популярны те, что ближе к 100.</br> <ul><li>Трек. Рассчитывается исходя из общего числа прослушиваний и насколько они недавние. Трек с большим количеством недавних прослушиваний будет более популярным, чем трек с большим количество старых прослушиваний. Значение может иметь лаг в несколько дней, то есть не обновляется в реальном времени.</li> <li>Исполнитель и альбом. Рассчитывается исходя из популярности треков.</li></ul> 
| `duration_ms` | 0 - 0+ | Продолжительность трека в миллисекундах ([калькулятор](https://www.google.ru/search?ie=UTF-8&q=%D0%BC%D0%B8%D0%BD%D1%83%D1%82%D1%8B%20%D0%B2%20%D0%BC%D0%B8%D0%BB%D0%BB%D0%B8%D1%81%D0%B5%D0%BA%D1%83%D0%BD%D0%B4%D1%8B%20%D0%BA%D0%B0%D0%BB%D1%8C%D0%BA%D1%83%D0%BB%D1%8F%D1%82%D0%BE%D1%80)). Полезно для удаления треков с маленькой продолжительностью путем установки минимального значения. Или наоборот большой продолжительностью.|
| `explicit` | булево | Присутствие или отсутствие ненормативной лексики. В случае функции [rangeTracks](/func?id=rangetracks) значение `false` удалит треки с ненормативной лексикой. Значение `true` или отсутствие этого ключа оставит все треки.
| `added_at` | строка | Дата добавления трека в плейлист в формате строки. Пример использования в шаблоне [любимо и забыто](/template?id=Любимо-и-забыто).
| `genres` и `ban_genres` | массив | Жанры исполнителя или альбома. Тесты показывают, что у альбомов список всегда пуст. В случае функции [rangeTracks](/func?id=rangetracks) будут выбраны только те треки, у которых есть хотя бы один жанр из заданного массива `genres` и нет ни одного из массива `ban_genres`.
| `release_date` | даты | Период, в котором вышел альбом рассматриваемого трека в формате даты ([формат описан здесь](/func?id=rangedateabs)). Например, между 2018 и 2020 годами: `{ min: new Date('2018'), max: new Date('2020') }`

## Особенности трека (features) {docsify-ignore}
| Ключ | Диапазон | Описание |
|-|-|-|
| `acousticness` | 0.0 - 1.0 | Доверительный интервал, оценивающий является ли трек акустическим. Значение 1.0 показывает высокую уверенность в этом. ![Распределение значений acousticness](/img/acousticness.png)
| `danceability` | 0.0 - 1.0 | Оценивает насколько трек подходит для танца, основываясь на его темпе, стабильности ритма, битах и общих закономерностях показателей. Менее танцевальны треки близкие к 0.0 и более к 1.0 ![Распределение значений danceability](/img/danceability.png)
| `energy` | 0.0 - 1.0 | Оценка интенсивности и активности трека. Как правило, энергичные треки кажутся быстрыми, громкими и шумными. Например, треки жанра дэт-метал. Расчет основывается на динамическом диапазоне, громкости, тембре, скорости нарастания и общей энтропии. Менее энергичны треки близкие к 0.0 и более к 1.0 ![Распределение значений energy](/img/energy.png)
| `instrumentalness` | 0.0 - 1.0 | Оценка наличия вокала. Например, рэп или разговорный трек явно имеет вокал. Чем ближе значение к 1.0 тем более вероятно, что трек не содержит вокала. Значение выше 0.5 понимается как инструментальный трек, но вероятность выше при приближении к единице. ![Распределение значений instrumentalness](/img/instrumentalness.png)
| `liveness` | 0.0 - 1.0 | Оценка присутствия аудитории в записи трека или live-трек. Значения выше 0.8 отражают высокую вероятность этого. ![Распределение значений liveness](/img/liveness.png)
| `loudness` | -60 до 0 | Общая громкость в децибелах. Значение громкости усредняется по всему треку. Полезно при сравнении относительность громкости треков. Как правило, диапазон от -60 до 0 дБ. ![Распределение значений loudness](/img/loudness.png)
| `speechiness` | 0.0 - 1.0 | Оценка количества произнесенных слов в треке. Значение близкое к 1.0 характеризует дорожку как ток-шоу, подкаст или аудио-книгу. Треки со значением выше 0.66 вероятно полностью состоят из слов. От 0.33 до 0.66 могут содержать как речь, так и музыку. Ниже 0.33 для музыки и треков без речи. ![Распределение значений speechiness](/img/speechiness.png)
| `valence` | 0.0 - 1.0 | Оценка позитивности трека. Высокое значение говорит о более счастливом, веселом настроении. Низкое значение характерно для треков с грустным, депрессивным настроем. ![Распределение значений valence](/img/valence.png)
| `tempo` | 30 - 210 | Общий темп трека из расчета ударов в минуту (BPM).  ![Распределение значений tempo](/img/tempo.png)
| `key` | 0+ | Общий ключ трека. Значения подбираются исходя из [Pitch Class](https://en.wikipedia.org/wiki/Pitch_class). То есть 0 = C, 1 = C♯/D♭, 2 = D и так далее. Если ключ не установлен, значение -1.
| `mode` | 0 или 1 | Модальность трека. Мажор = 1, минор = 0.
| `time_signature` | 1+ | Общая оценка сигнатуры трека - условно обозначение для определения количества ударов в каждом такте. 

# Жанры для отбора рекомендаций

Данный перечень нужен только для [getRecomTracks](/func?id=getrecomtracks). В [rangeTracks](/func?id=rangetracks) можно использовать [такой перечень](http://everynoise.com/everynoise1d.cgi?scope=all).

```
a: acoustic, afrobeat, alt-rock, alternative, ambient, anime, 
b: black-metal, bluegrass, blues, bossanova, brazil, breakbeat, british, 
c: cantopop, chicago-house, children, chill, classical, club, comedy, country, 
d: dance, dancehall, death-metal, deep-house, detroit-techno, disco, disney, drum-and-bass, dub, dubstep, 
e: edm, electro, electronic, emo, 
f: folk, forro, french, funk, 
g: garage, german, gospel, goth, grindcore, groove, grunge, guitar, 
h: happy, hard-rock, hardcore, hardstyle, heavy-metal, hip-hop, holidays, honky-tonk, house, 
i: idm, indian, indie, indie-pop, industrial, iranian, 
j: j-dance, j-idol, j-pop, j-rock, jazz, 
k: k-pop, kids, 
l: latin, latino, 
m: malay, mandopop, metal, metal-misc, metalcore, minimal-techno, movies, mpb, 
n: new-age, new-release, 
o: opera, 
p: pagode, party, philippines-opm, piano, pop, pop-film, post-dubstep, power-pop, progressive-house, psych-rock, punk, punk-rock, 
r: r-n-b, rainy-day, reggae, reggaeton, road-trip, rock, rock-n-roll, rockabilly, romance, 
s: sad, salsa, samba, sertanejo, show-tunes, singer-songwriter, ska, sleep, songwriter, soul, soundtracks,
spanish, study, summer, swedish, synth-pop, 
t: tango, techno, trance, trip-hop, turkish, 
w: work-out, world-music
```

# Категории плейлистов

Чтобы получить список доступных категорий для страны, запустите следующий код. Результаты в логах.
```js
let listCategory = Source.getListCategory({ limit: 50, country: 'RU' });
console.log(listCategory.map(c => c.id).join('\n'));
```

Ниже категории плейлистов для `country = RU`
```
a: alternative, anime, at_home
b: blues
c: caribbean, chill, classical, country
d: decades, dinner
e: edm_dance
f: family, focus, funk
g: gaming
h: hiphop, holidays
i: indie_alt, instrumental
j: jazz
k: kpop
l: latin
m: metal, mood
p: party, pop, punk
r: rnb, rock, romance, roots, russian_rap
s: sessions, sleep, soul
t: toplists, travel
w: wellness, workout
```
