// Документация: https://chimildic.github.io/goofy
// Телеграм: https://t.me/forum_goofy
// Форум: https://github.com/Chimildic/goofy/discussions
const VERSION = '2.2.0';
const UserProperties = PropertiesService.getUserProperties();
const KeyValue = UserProperties.getProperties();
const API_BASE_URL = 'https://api.spotify.com/v1';
const DEFAULT_DATE = new Date('2000-01-01');

function doGet() {
    return Auth.hasAccess() ? displayLaunchPage_() : Auth.displayAuthPage();
}

function doPost(args) {
    if (args.parameter.from?.includes("audiolist")) {
        return Audiolist.onPost.bind(this)(args) || Audiolist.response()
    }
}

function displayAuthResult_(request) {
    return Auth.displayAuthResult(request);
}

function displayLaunchPage_() {
    try {
        return HtmlService.createHtmlOutputFromFile('launch.html')
            .addMetaTag('viewport', 'width=device-width, initial-scale=1')
            .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
    } catch {
        return HtmlService.createHtmlOutput('Авторизация прошла успешно');
    }
}

function runTasks_() {
    RecentTracks.update();
    let isUpdatedSavedTracks = Clerk.runOnceAWeek('monday', '01:00', updateSavedTracks);
    !isUpdatedSavedTracks && Clerk.runOnceAfter('01:00', appendSavedTracks);

    function updateSavedTracks(tracks) {
        tracks = tracks || Source.getSavedTracks();
        Cache.compressTracks(tracks);
        Cache.write('SavedTracks.json', tracks);
    }

    function appendSavedTracks() {
        let cacheTracks = Cache.read('SavedTracks.json');
        let remoteTracks = Source.getSavedTracks(50);
        Filter.removeTracks(remoteTracks, cacheTracks);
        if (remoteTracks.length == 50 || cacheTracks.length == 0) {
            updateSavedTracks();
        } else if (remoteTracks.length > 0) {
            updateSavedTracks(Combiner.push(remoteTracks, cacheTracks));
        }
    }
}

String.prototype.formatName = function () {
    return this.toLowerCase()
        .replace(/['`,?!@#$%^&*()+-./\\]/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/ё/g, 'е')
        .trim();
};

Date.prototype.setBound = function (value) {
    if (value == 'startDay') {
        this.setHours(0, 0, 0, 0);
    } else if (value == 'endDay') {
        this.setHours(23, 59, 59, 999);
    }
    return this;
};

Date.prototype.getTimestampUNIX = function (bound) {
    return Math.trunc(this.setBound(bound).getTime() / 1000);
};

Object.prototype.isEmpty = function () {
    return Object.keys(this).length == 0;
}

Array.prototype.toObject = function (parseMethod) {
    return this.reduce((accumulator, element, i) => (accumulator[parseMethod(element)] = i, accumulator), {});
}

JSON.parseFromString = function (content) {
    try {
        return JSON.parse(content);
    } catch (error) {
        Admin.printError('Не удалось преобразовать строку JSON в объект JavaScript\n', error.stack, '\nКонтент:', `"${content}"`);
        return undefined;
    }
}

JSON.parseFromResponse = function (response) {
    let content = response.getContentText();
    if (content.length == 0) {
        return { msg: 'Пустое тело ответа', status: response.getResponseCode() };
    }
    return JSON.parseFromString(content);
}

HtmlService.createCheerio = function (response) {
    try {
        return Cheerio.load(response.getContentText());
    } catch (error) {
        Admin.printInfo(error);
    }
}

const CustomUrlFetchApp = (function () {
    let countRequest = 0;
    return {
        fetch, fetchAll, parseQuery,
        getCountRequest: () => countRequest,
    };

    function fetch(url, params = {}) {
        params.muteHttpExceptions = true;
        return readResponse(tryFetch(url, params), url, params);
    }

    function fetchAll(requests) {
        requests.forEach((request) => (request.muteHttpExceptions = true));
        let responses = [];
        let limit = KeyValue.REQUESTS_IN_ROW || 20;
        let count = Math.ceil(requests.length / limit);
        for (let i = 0; i < count; i++) {
            let requestPack = requests.splice(0, limit);
            let responsePack = sendPack(requestPack).map((response, index) =>
                readResponse(response, requestPack[index].url, {
                    headers: requestPack[index].headers,
                    payload: requestPack[index].payload,
                    muteHttpExceptions: requestPack[index].muteHttpExceptions,
                })
            );
            Combiner.push(responses, responsePack);
        }
        return responses;

        function sendPack(requests) {
            let raw = tryFetchAll(requests);
            if (typeof raw == 'undefined') {
                return [];
            }
            let failed = raw.reduce((failed, response, index) => {
                if (response.getResponseCode() == 429) {
                    failed.requests.push(requests[index])
                    failed.syncIndexes.push(index);
                    let seconds = parseRetryAfter(response);
                    if (failed.seconds < seconds) {
                        failed.seconds = seconds;
                    }
                }
                return failed;
            }, { seconds: 0, requests: [], syncIndexes: [] });

            if (failed.seconds > 0) {
                Admin.pause(failed.seconds);
                sendPack(failed.requests).forEach((response, index) => {
                    let requestIndex = failed.syncIndexes[index];
                    raw[requestIndex] = response;
                });
            }
            return raw;
        }

        function tryFetchAll(requests) {
            return tryCallback(() => {
                countRequest += requests.length;
                return UrlFetchApp.fetchAll(requests)
            });
        }
    }

    function readResponse(response, url, params = {}) {
        if (isSuccess(response.getResponseCode())) {
            return onSuccess();
        }
        return onError();

        function isSuccess(code) {
            return code >= 200 && code < 300;
        }

        function onSuccess() {
            let type = response.getHeaders()['Content-Type'] || '';
            if (type.includes('json')) {
                return JSON.parseFromResponse(response) || [];
            }
            return response;
        }

        function onError() {
            let responseCode = response.getResponseCode();
            if (responseCode == 429) {
                return onRetryAfter();
            }
            writeErrorLog();
            if (responseCode >= 500) {
                return tryFetchOnce();
            }
        }

        function onRetryAfter() {
            Admin.pause(parseRetryAfter(response));
            return fetch(url, params);
        }

        function tryFetchOnce() {
            Admin.pause(2);
            response = tryFetch(url, params);
            if (isSuccess(response.getResponseCode())) {
                return onSuccess();
            }
            writeErrorLog();
        }

        function writeErrorLog() {
            let errorText = response.getContentText().substring(0, 500)
            if (errorText.toLowerCase().includes('access not granted')) {
                throw `Нет прав доступа. Для повторной авторизации:\n1) Нажмите "начать развертывание > пробные развертывания"\n2) Перейдите по ссылке "веб-приложение"\n3) Подтвердите права доступа\n\nОшибка может возникать при смене пароля от Spotify аккаунта.\n\nЕсли при переходе по ссылке веб-приложения страница не открывается, повторите шаги в режиме инкогнито\n(Google делает автоматический редирект на другой аккаунт, где ваш проект с goofy недоступен).`
            } else {
                Admin.printError(`Номер: ${response.getResponseCode()}\nАдрес: ${url}\nМетод: ${params.method}\nТекст ответа: ${errorText}`);
            }
        }
    }

    function parseRetryAfter(response) {
        return 1 + (parseInt(response.getHeaders()['Retry-After']) || 2);
    }

    function tryFetch(url, params) {
        return tryCallback(() => {
            countRequest++;
            return UrlFetchApp.fetch(url, params)
        });
    }

    function tryCallback(callback, attempt = 0) {
        try {
            return callback();
        } catch (error) {
            Admin.printError('При отправке запроса произошла ошибка:\n', error.stack);
            if (attempt++ < 2) {
                Admin.pause(5);
                return tryCallback(callback, attempt);
            }
        }
    }

    function parseQuery(obj) {
        return Object.keys(obj)
            .map((k) => (typeof obj[k] != 'string' && obj[k] != undefined) || (typeof obj[k] == 'string' && obj[k].length > 0)
                ? `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`
                : ''
            ).filter(s => s.length > 0).join('&');
    }
})();

const Audiolist = (function () {
    const MESSAGE_TYPES = { DEFAULT: 'default', ERROR: 'error', WARNINNG: 'warning' }
    const VARIABLE_TYPES = {
        SPOTIFY_TRACK: { entityType: 'TRACK', platform: 'SPOTIFY', classType: 'SpotifyGoofyTrack' },
        LASTFM_TRACK: { entityType: 'TRACK', platform: 'LASTFM', classType: 'LastfmGoofyTrack' },
        TEXT_TRACK: { entityType: 'TRACK', platform: 'TEXT', classType: 'TrackFromText' }
    }

    function responseMessage(text, type = MESSAGE_TYPES.DEFAULT) {
        return response({ message: text, messageType: type })
    }

    function responseItems(items, type) {
        return response({ items, variableType: type })
    }

    function response(params = {}) {
        if (params.items != undefined) {
            if (params.variableType == undefined) {
                throw "Отсутствует variableType"
            } else if (!Array.isArray(params.items)) {
                throw "items может быть только массивом"
            } else {
                if (params.variableType == VARIABLE_TYPES.LASTFM_TRACK) {
                    params.items = mapLastfmTracks(params.items)
                } else if (params.variableType == VARIABLE_TYPES.TEXT_TRACK) {
                    params.items = mapTextTracks(params.items)
                }
                params.items.forEach(i => (i.executorClassType = params.variableType.classType))
            }
        }
        return ContentService.createTextOutput(JSON.stringify(params))
    }

    function mapLastfmTracks(items) {
        return items.map(item => ({
            artist: item.artist?.["#text"] || item.artist?.name || '',
            album: item.album?.["#text"] || '',
            name: item.name || '',
            dateAt: parseInt(item.date?.uts) * 1000 || 0,
        }))
    }

    function mapTextTracks(items) {
        return items.map(item => {
            let query = ''
            if (typeof item == 'string') {
                query = item
            } else {
                let artists = item.artists?.map(a => a.name).join(', ') || item.artist?.["#text"] || item.artist?.name || ''
                let title = item?.name || item?.title || ''
                query = `${artists} - ${title}`
            }
            return { query }
        })
    }

    function parseINI(iniRaw) {
        if (iniRaw == undefined || iniRaw.length == 0) {
            return undefined
        }
        let ini = {}
        let currentSection = ini
        let lines = iniRaw.split(/\r?\n/)
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim()
            if (!line) {
                currentSection = ini
            } else if (line.startsWith(';')) {
                continue
            } else if (line.startsWith('[')) {
                let sectionName = line.slice(1, -1)
                let sectionParts = sectionName.split('.')
                for (let part of sectionParts) {
                    if (!currentSection[part]) {
                        currentSection[part] = {}
                    }
                    currentSection = currentSection[part]
                }
            } else {
                let [keyRaw, valueRaw] = line.split('=').map(s => s.trim())
                if (keyRaw && valueRaw) {
                    setValue(currentSection, keyRaw, valueRaw)
                }
            }
        }
        return ini

        function setValue(currentSection, keyRaw, valueRaw) {
            let value
            if (valueRaw === 'true') {
                value = true
            } else if (valueRaw === 'false') {
                value = false
            } else if (!isNaN(Number(valueRaw))) {
                value = Number(valueRaw)
            } else {
                let escaped = valueRaw.replace(/\\,/g, "__ESCAPED_COMMA__")
                let items = escaped.split(',').map(item => item.trim().replace(/__ESCAPED_COMMA__/g, ","))
                if (items.length > 1) {
                    value = items
                } else {
                    value = valueRaw.replace(/\\n/g, '\n')
                }
            }

            let keyParts = keyRaw.split('.')
            let target = currentSection
            for (let i = 0; i < keyParts.length - 1; i++) {
                let part = keyParts[i]
                if (!target[part]) {
                    target[part] = {}
                }
                target = target[part]
            }
            let lastKey = keyParts[keyParts.length - 1]
            target[lastKey] = value
        }
    }

    return {
        MESSAGE_TYPES, VARIABLE_TYPES, responseMessage, responseItems, response,

        onPost(args) {
            try {
                this.Audiolist = Audiolist
                let { funcName, ...data } = JSON.parse(args.postData.contents)
                let func = funcName.split('.').reduce((acc, key) => acc?.[key], this)
                if (func == undefined) {
                    return Audiolist.responseMessage(`Не удалось найти функцию с именем ${funcName}. Проверьте регистр букв и обновите развертывание.`, Audiolist.MESSAGE_TYPES.ERROR)
                }
                data.ini = parseINI(data.iniRaw)
                return func(data)
            } catch (e) {
                return Audiolist.responseMessage(e.message, Audiolist.MESSAGE_TYPES.ERROR)
            }
        },

        hello() {
            return responseMessage('Hello world! Тебе удалось соединить goofy и Audiolist. Можешь запускать любые функции и отправлять ответы. Например, встроенная функция "Audiolist.history" пришлет все треки из истории прослушиваний goofy. Чтобы использовать их в следующих командах, добавь выходную переменную для команды "Функция goofy".')
        },

        history() {
            let recentTracks = RecentTracks.get()
            return responseItems(recentTracks, Audiolist.VARIABLE_TYPES.SPOTIFY_TRACK)
        }
    }
})()

const Source = (function () {
    return {
        getTracks, getTracksRandom, getPlaylistTracks, getTopTracks, getTopArtists, getFollowedTracks, getFollowedPlaylists, getSavedTracks,
        getSavedAlbumTracks, getSavedAlbums, getRecomTracks, getArtists, getArtistsAlbums, getArtistsTracks,
        getAlbumTracks, getAlbumsTracks, getArtistsTopTracks, getRelatedArtists, getCategoryTracks,
        getListCategory, mineTracks, craftTracks, extractTracks, createUrlForRecomTracks, getRecentReleasesByArtists, getRecomArtists
    };

    function getTopTracks(timeRange) {
        return getTop(timeRange, 'tracks');
    }

    function getTopArtists(timeRange) {
        return getTop(timeRange, 'artists');
    }

    function getTop(timeRange, type) {
        // Баг Spotify: https://community.spotify.com/t5/Spotify-for-Developers/Bug-with-offset-for-method-quot-Get-User-s-Top-Artists-and/td-p/5032362
        let template = `${API_BASE_URL}/me/top/%s?offset=%s&limit=%s&time_range=%s_term`;
        return SpotifyRequest.getAll([
            Utilities.formatString(template, type, 0, 49, timeRange),
            Utilities.formatString(template, type, 49, 49, timeRange),
        ], false).reduce((items, response) => {
            return Combiner.push(items, response.items);
        }, []);
    }

    function getListCategory(params = {}) {
        let query = CustomUrlFetchApp.parseQuery(params);
        let url = `${API_BASE_URL}/browse/categories?${query}`;
        return SpotifyRequest.get(url).items;
    }

    function getCategoryTracks(category_id, params = {}) {
        let query = CustomUrlFetchApp.parseQuery(params);
        let url = `${API_BASE_URL}/browse/categories/${category_id}/playlists?${query}`;
        return getTracks(SpotifyRequest.get(url).items);
    }

    function getRelatedArtists(artists, isFlat = true) {
        return getArtistsByPath(artists, '/artists/%s/related-artists', isFlat);
    }

    function getArtistsTopTracks(artists, isFlat = true) {
        return getArtistsByPath(artists, '/artists/%s/top-tracks?market=from_token', isFlat);
    }

    function getArtistsByPath(artists, path, isFlat) {
        let template = API_BASE_URL + path;
        let urls = artists.reduce((urls, artist) => {
            urls.push(Utilities.formatString(template, artist.id));
            return urls;
        }, []);
        let responses = SpotifyRequest.getAll(urls);
        return isFlat ? responses.flat(1) : responses;
    }

    function getRecomTracks(queryObj) {
        let url = createUrlForRecomTracks(queryObj);
        return SpotifyRequest.get(url).tracks;
    }

    function getRecomArtists(artists, queryObj = {}, isFlat = true) {
        let isFullArtist = queryObj.isFullArtist
        delete queryObj.isFullArtist
        let urls = artists.map(artist => {
            let params = Object.assign({}, queryObj)
            params.limit = params.limit || 50
            if (queryObj.seed_artists == undefined) {
                params.seed_artists = artist.id
            } else {
                params.seed_artists += `,${artist.id}`
            }
            return createUrlForRecomTracks(params)
        })
        let recomTrackGroups = SpotifyRequest.getAll(urls)
        let result = recomTrackGroups
            .map(response => response.tracks.reduce((acc, track) => {
                if (artists && artists.length > 0) {
                    acc.push(track.artists[0])
                }
                return acc
            }, []))
        if (isFullArtist) {
            result = result.map(artists => Source.getArtists({ include: artists }))
        }
        return isFlat ? result.flat(1) : result
    }

    function getFollowedTracks(params = {}) {
        let playlists = getFollowedPlaylists(params.type, params.userId, params.exclude);
        Selector.keepRandom(playlists, params.limit);
        return !params.hasOwnProperty('isFlat') || params.isFlat ? getTracks(playlists) : playlists.map(p => {
            p.tracks.items = getTracks([p]);
            return p;
        });
    }

    function getArtistsTracks(params) {
        let artists = getArtists(params.artist);
        params.album = params.album || {};
        params.album.isFlat = false;
        let tracks = getArtistsAlbums(artists, params.album).reduce((tracks, albums) => {
            tracks.push(getAlbumsTracks(albums, params.album.track_limit));
            return tracks;
        }, []);
        return !params.hasOwnProperty('isFlat') || params.isFlat ? tracks.flat(1) : tracks;
    }

    function getArtists(paramsArtist) {
        let artists = [];
        if (paramsArtist.include) {
            Combiner.push(artists, getArtistsById(paramsArtist.include));
        }
        if (paramsArtist.followed_include) {
            Combiner.push(artists, getFollowedArtists());
        }
        if (paramsArtist.exclude) {
            let excludeIds = paramsArtist.exclude.map((item) => item.id);
            artists = artists.filter((item) => !excludeIds.includes(item.id));
        }
        artists = artists.filter((artist) => {
            artist.followers = artist.followers.total || artist.followers;
            return (
                RangeTracks.isBelong(artist, paramsArtist) &&
                RangeTracks.isBelongGenres(artist.genres, paramsArtist.genres) &&
                !RangeTracks.isBelongBanGenres(artist.genres, paramsArtist.ban_genres)
            );
        });
        return Selector.sliceRandom(artists, paramsArtist.artist_limit);
    }

    function getArtistsById(artistsArray) {
        let ids = artistsArray.map((item) => item.id);
        return SpotifyRequest.getFullObjByIds('artists', ids, 50);
    }

    function getFollowedArtists() {
        return SpotifyRequest.getItemsByPath('me/following?type=artist&limit=50');
    }

    function getArtistsAlbums(artists, params = {}) {
        let groups = params.groups || 'album,single';
        let albums = artists.reduce((albums, artist) => {
            let path = `artists/${artist.id}/albums?include_groups=${groups}&limit=50&market=from_token`;
            let response = SpotifyRequest.getItemsByPath(path).filter((album) => RangeTracks.isBelongReleaseDate(album.release_date, params.release_date));
            Filter.dedupAlbums(response);
            albums.push(Selector.sliceRandom(response, params.album_limit));
            return albums;
        }, []);
        return !params.hasOwnProperty('isFlat') || params.isFlat ? albums.flat(1) : albums;
    }

    function getAlbumsTracks(albums, limit) {
        return albums.reduce((tracks, album) => {
            return Combiner.push(tracks, getAlbumTracks(album, limit));
        }, []);
    }

    function getAlbumTracks(album, limit) {
        let items = SpotifyRequest.getItemsByPath(`albums/${album.id}/tracks`);
        Selector.keepRandom(items, limit);
        return items.map((item) => {
            item.album = album;
            return item;
        });
    }

    function getSavedAlbumTracks(limit) {
        let items = getSavedAlbums();
        Selector.keepRandom(items, limit);
        return items.reduce((tracks, album) => {
            let albumTracks = album.tracks.items.map(item => (item.album = album, item));
            // Фикс ошибки при использовании JSON.stringify
            // TypeError: Converting circular structure to JSON
            delete album.tracks;
            return Combiner.push(tracks, albumTracks)
        }, []);
    }

    function getSavedAlbums() {
        return SpotifyRequest.getItemsByPath('me/albums?limit=50', 400).map((item) => {
            let album = item.album;
            album.added_at = item.added_at;
            return album;
        });
    }

    function getFollowedPlaylists(type = 'followed', userId = User.id, excludePlaylist = []) {
        let playlistArray = Playlist.getPlaylistArray(userId);
        if (type != 'all') {
            playlistArray = playlistArray.filter((playlist) => {
                let isOwned = playlist.owner.id == userId;
                return type == 'owned' ? isOwned : !isOwned;
            });
        }
        if (excludePlaylist.length > 0) {
            let ids = excludePlaylist.map((item) => item.id);
            playlistArray = playlistArray.filter((item) => !ids.includes(item.id));
        }
        return playlistArray;
    }

    function getRecentReleasesByArtists(params) {
        if (params.artists.length >= 300) {
            console.warn(`При большом количестве исполнителей (запрошено ${params.artists.length}) функция может не уложиться в лимит времени выполнения\nили получить временный бан от Spotify за спам запросами.\n\nВоспользуйтесь шаблоном: https://chimildic.github.io/goofy/#/template?id=Новые-релизы-по-частям`)
        }
        let initDateStr = new Date().toISOString()
        let startDate = params.date.hasOwnProperty('sinceDays') ? Filter.getDateRel(params.date.sinceDays, 'startDay') : params.date.startDate
        let types = params.type.sort((a, b) => a.localeCompare(b))
        let requestUrls = params.artists.map(artist => `${API_BASE_URL}/artists/${artist.id}/albums?include_groups=${types.join(",")}&limit=50&market=from_token`)

        let foundReleases = {}
        let uncompleteRequests = []
        let responses = SpotifyRequest.getAll(requestUrls)
        responses.forEach((response, index) => {
            let minFoundDateStrings = types.reduce((acc, type) => (acc[type] = initDateStr, acc), {})
            let artistId = params.artists[index].id

            foundReleases[artistId] = foundReleases[artistId] || []
            foundReleases[artistId] = response.items.filter(album => {
                minFoundDateStrings[album.album_type] = album.release_date
                return RangeTracks.isBelongReleaseDate(album.release_date, params.date)
            })

            if (response.items.length == 50 && response.next != undefined) {
                let notFoundTypes = []
                Object.entries(minFoundDateStrings).forEach(([albumType, dateStr]) => {
                    let minFoundDate = new Date(dateStr)
                    if (startDate < minFoundDate) {
                        notFoundTypes.push(albumType)
                    }
                })
                if (notFoundTypes.length > 0) {
                    uncompleteRequests.push({ id: artistId, groups: notFoundTypes })
                }
            }
        })

        if (params.isOnlyAlbums === true) {
            return Object.values(foundReleases)
        }
        uncompleteRequests.forEach((item, index) => {
            let response = getRecentReleasesByArtists({
                artists: [uncompleteRequests[index]],
                date: params.date,
                type: uncompleteRequests[index].groups,
                isOnlyAlbums: true,
            })
            Combiner.push(foundReleases[item.id], response.flat(1))
        })

        let trackGroups = Object.values(foundReleases).map(albums => {
            Filter.dedupAlbums(albums)
            return Source.getAlbumsTracks(albums) || []
        })

        if (!params.hasOwnProperty('isFlat') || params.isFlat) {
            let tracks = trackGroups.flat(1)
            Order.sort(tracks, 'album.release_date', 'desc')
            return tracks
        }
        return trackGroups
    }

    function mineTracks(params) {
        let findMethod, getTracksMethod;
        let selectMethod = params.hasOwnProperty('inRow') && params.inRow ? Selector.keepFirst : Selector.keepRandom;
        if (params.type == 'album') {
            findMethod = Search.findAlbums;
            getTracksMethod = getAlbumsTracks;
        } else if (params.type == 'track') {
            findMethod = Search.findTracks;
            // getTracksMethod - не нужно, треки уже в результате поиска
        } else {
            params.type = 'playlist';
            findMethod = Search.findPlaylists;
            getTracksMethod = getTracks;
        }

        let result = findMethod(params.keyword, params.requestCount);
        if (params.type == 'playlist' && params.hasOwnProperty('followers')) {
            filterByFollowers();
        }
        let tracks = reduceResult();
        Filter.dedupTracks(tracks);
        return tracks;

        function reduceResult() {
            return result.reduce((tracks, array) => {
                selectMethod(array, params.itemCount || 3);
                Selector.keepAllExceptFirst(array, params.skipCount || 0);
                let trackItems = getTracksMethod ? getTracksMethod(array) : array;
                return Combiner.push(tracks, filterPopularity(trackItems));
            }, []);
        }

        function filterByFollowers() {
            for (let i = 0; i < result.length; i++) {
                result[i] = getFullPlaylistObject(result[i]).filter((p) => {
                    return isBelongRangeFollowers(p.followers.total);
                });
            }
        }

        function filterPopularity(array) {
            if (!params.hasOwnProperty('popularity')) {
                return array;
            }
            if (array[0] && !array[0].hasOwnProperty('popularity')) {
                let ids = array.map((t) => t.id);
                array = SpotifyRequest.getFullObjByIds('tracks', ids, 50);
            }
            return array.filter((t) => t.popularity >= (params.popularity || 0));
        }

        function getFullPlaylistObject(array) {
            let urls = array.map(p => `${API_BASE_URL}/playlists/${p.id}`);
            return SpotifyRequest.getAll(urls);
        }

        function isBelongRangeFollowers(value) {
            return value >= params.followers.min && value <= params.followers.max;
        }
    }

    function craftTracks(tracks, params = {}) {
        let recomTracks = SpotifyRequest.getAll(createUrls()).reduce((recomTracks, response) => {
            return Combiner.push(recomTracks, response.tracks);
        }, []);
        Filter.dedupTracks(recomTracks);
        return recomTracks;

        function createUrls() {
            let urls = [];
            let queryObj = params.query || {};
            let ids = mapToIds();
            let availablePosition = findAvailablePosition();
            let count = Math.ceil(ids.length / availablePosition);
            for (let i = 0; i < count; i++) {
                queryObj[params.key] = ids.splice(0, availablePosition).join(',');
                urls.push(createUrlForRecomTracks(queryObj));
            }
            return urls;
        }

        function mapToIds() {
            let ids;
            if (params.key == 'seed_artists') {
                ids = tracks.map((t) => (t.artists ? t.artists[0].id : t.id));
            } else {
                ids = tracks.map((t) => t.id);
                params.key = 'seed_tracks';
            }
            return Array.from(new Set(ids));
        }

        function findAvailablePosition() {
            let value = 5;
            if (!params.hasOwnProperty('query')) {
                return value;
            }
            if (params.query.hasOwnProperty('seed_genres')) {
                value -= params.query.seed_genres.split(',').length;
            }
            if (params.query.hasOwnProperty('seed_tracks') && params.key != 'seed_tracks') {
                value -= params.query.seed_tracks.split(',').length;
            }
            if (params.query.hasOwnProperty('seed_artists') && params.key != 'seed_artists') {
                value -= params.query.seed_artists.split(',').length;
            }
            if (value <= 0) {
                throw `Не осталось места под ${params.key}. Уменьшите количество значения других seed_*`;
            }
            return value;
        }
    }

    function createUrlForRecomTracks(queryObj) {
        queryObj.limit = queryObj.limit > 100 ? 100 : queryObj.limit || 100;
        queryObj.market = queryObj.market || 'from_token';
        let query = CustomUrlFetchApp.parseQuery(queryObj);
        return `${API_BASE_URL}/recommendations?${query}`;
    }

    function getTracksRandom(playlistArray, countPlaylist = 1) {
        return getTracks(Selector.sliceRandom(playlistArray, countPlaylist));
    }

    function getPlaylistTracks(name, id, userId, count, inRow) {
        return getTracks([{ id: id, name: name, userId: userId, count: count, inRow: inRow == undefined ? true : inRow }]);
    }

    function getTracks(playlistArray) {
        return extractTracks(getTrackItems(playlistArray));
    }

    function getTrackItems(playlistArray) {
        return playlistArray.reduce((items, playlist) => {
            let playlistItems = [];
            if (typeof playlist == 'undefined') {
                return items;
            }
            if (playlist.id) {
                playlistItems = getItemsByPlaylistId(playlist.id);
            } else if (playlist.name) {
                playlistItems = getItemsByPlaylistName(playlist.name, playlist.userId);
            }
            if (!playlist.hasOwnProperty('inRow') || playlist.inRow) {
                Selector.keepFirst(playlistItems, playlist.count);
            } else {
                Selector.keepRandom(playlistItems, playlist.count);
            }
            return Combiner.push(items, playlistItems);
        }, []);
    }

    function getItemsByPlaylistId(playlistId) {
        let playlist = Playlist.getById(playlistId);
        return getItemsByPlaylistObject(playlist);
    }

    function getItemsByPlaylistName(playlistName, userId) {
        let playlist = Playlist.getByName(playlistName, userId);
        if (!playlist || !playlist.id) {
            return [];
        }
        return getItemsByPlaylistId(playlist.id);
    }

    function getItemsByPlaylistObject(obj) {
        let items = [];
        if (obj && obj.tracks && obj.tracks.items) {
            items = obj.tracks.total <= 100 ? obj.tracks.items : SpotifyRequest.getItemsByNext(obj.tracks);
            items.forEach((item) => (item.origin = { id: obj.id, name: obj.name, type: obj.type }));
        }
        return items;
    }

    function getSavedTracks(limit = 200000) {
        let requestCount = Math.ceil(limit / 50);
        let items = SpotifyRequest.getItemsByPath('me/tracks?limit=50', requestCount);
        return Selector.sliceFirst(extractTracks(items), limit);
    }

    function extractTracks(items) {
        if (!items || items.length == 0) return [];
        let key = items[0].played_at ? 'played_at' : 'added_at';
        return items.reduce((tracks, item) => {
            if ((!item.hasOwnProperty('is_local') || !item.is_local) && item.track && item.track.artists && item.track.artists.length > 0) {
                let date = item[key] ? item[key] : DEFAULT_DATE.toISOString();
                item.track[key] = date;
                if (item.hasOwnProperty('origin')) {
                    item.track.origin = item.origin;
                }
                tracks.push(item.track);
            }
            return tracks;
        }, []);
    }
})();

const Player = (function () {
    return {
        getPlayback, transferPlayback, getAvailableDevices, next, previous, pause, resume, toggleShuffle, setRepeatMode, addToQueue,
    };

    function getPlayback() {
        return SpotifyRequest.get(`${API_BASE_URL}/me/player`) || {};
    }

    function transferPlayback(deviceId, isPlay) {
        return SpotifyRequest.put(`${API_BASE_URL}/me/player`, { device_ids: [deviceId], play: isPlay, });
    }

    function getAvailableDevices() {
        return SpotifyRequest.get(`${API_BASE_URL}/me/player/devices`);
    }

    function next(deviceId) {
        return SpotifyRequest.post(createUrl('/me/player/next', deviceId));
    }

    function previous(deviceId) {
        return SpotifyRequest.post(createUrl('/me/player/previous', deviceId));
    }

    function pause(deviceId) {
        return SpotifyRequest.put(createUrl('/me/player/pause', deviceId));
    }

    function toggleShuffle(state, deviceId) {
        return SpotifyRequest.put(createUrl('/me/player/shuffle', deviceId, { state: state }));
    }

    function setRepeatMode(state, deviceId) {
        return SpotifyRequest.put(createUrl('/me/player/repeat', deviceId, { state: state }));
    }

    function resume(params = {}) {
        if (params.hasOwnProperty('tracks')) {
            params.uris = params.tracks.map(t => t.uri || `spotify:track:${t.id}`);
            delete params.tracks;
        }
        let url = createUrl('/me/player/play', params.deviceId);
        return SpotifyRequest.put(url, params);
    }

    function addToQueue(tracks, deviceId) {
        Array.isArray(tracks) ? tracks.forEach(t => addItem(t.id)) : addItem(tracks.id);

        function addItem(id) {
            let queryObj = { uri: `spotify:track:${id}` };
            let url = createUrl('/me/player/queue', deviceId, queryObj);
            return SpotifyRequest.post(url);
        }
    }

    function createUrl(path, deviceId = '', queryObj = {}) {
        queryObj.device_id = queryObj.device_id || deviceId;
        let query = CustomUrlFetchApp.parseQuery(queryObj);
        return API_BASE_URL + path + `?${query ? query : ''}`;
    }

})();

const RecentTracks = (function () {
    const ON_SPOTIFY_RECENT_TRACKS = 'true' === KeyValue.ON_SPOTIFY_RECENT_TRACKS;
    const ON_LASTFM_RECENT_TRACKS = 'true' === KeyValue.ON_LASTFM_RECENT_TRACKS;
    const SPOTIFY_FILENAME = 'SpotifyRecentTracks.json';
    const LASTFM_FILENAME = 'LastfmRecentTracks.json';
    const BOTH_SOURCE_FILENAME = 'BothRecentTracks.json';
    const ITEMS_LIMIT = parseInt(KeyValue.COUNT_RECENT_TRACKS) || 60000;
    return {
        get, update, compress, appendTracks,
    };

    function get(limit, isDedup = true) {
        let tracks = []
        if (ON_SPOTIFY_RECENT_TRACKS && ON_LASTFM_RECENT_TRACKS) {
            tracks = Cache.read(BOTH_SOURCE_FILENAME)
            return Selector.sliceFirst(tracks, limit)
        } else if (ON_SPOTIFY_RECENT_TRACKS) {
            tracks = Cache.read(SPOTIFY_FILENAME)
        } else if (ON_LASTFM_RECENT_TRACKS) {
            tracks = Cache.read(LASTFM_FILENAME)
        }
        isDedup && Filter.dedupTracks(tracks)
        Selector.keepFirst(tracks, limit)
        return tracks
    }

    function update() {
        let hasUpdate = 0;
        if (ON_SPOTIFY_RECENT_TRACKS) {
            hasUpdate += updatePlatformRecentTracks(getSpotifyRecentTracks(), SPOTIFY_FILENAME, findNewPlayed);
        }
        if (ON_LASTFM_RECENT_TRACKS) {
            let lastfmTracks = Lastfm.getLastfmRecentTracks(KeyValue.LASTFM_LOGIN, parseInt(KeyValue.LASTFM_RANGE_RECENT_TRACKS));
            hasUpdate += updatePlatformRecentTracks(lastfmTracks, LASTFM_FILENAME, Lastfm.findNewPlayed);
        }
        if (hasUpdate > 0 && ON_SPOTIFY_RECENT_TRACKS && ON_LASTFM_RECENT_TRACKS) {
            updateBothSourceRecentTracks();
        }
    }

    function updatePlatformRecentTracks(recentTracks, filename, findNewPlayedMethod) {
        let fileItems = Cache.read(filename);
        let newItems = findNewPlayedMethod(recentTracks, fileItems);
        return appendNewPlayed(newItems, filename);
    }

    function updateBothSourceRecentTracks() {
        let spotifyTracks = Cache.read(SPOTIFY_FILENAME);
        let lastfmTracks = Cache.read(LASTFM_FILENAME);
        Combiner.push(spotifyTracks, lastfmTracks);
        Order.sort(spotifyTracks, 'meta.played_at', 'desc');
        Filter.dedupTracks(spotifyTracks);
        Cache.write(BOTH_SOURCE_FILENAME, spotifyTracks);
    }

    function appendNewPlayed(newItems, filename) {
        if (newItems.length == 0) {
            Admin.printInfo(`Нет новых треков ${filename}`);
            return false;
        }
        Cache.compressTracks(newItems);
        let total = Cache.append(filename, newItems, 'begin', ITEMS_LIMIT);
        Admin.printInfo(`+${newItems.length}, всего: ${total} (${filename})`);
        return true;
    }

    function getSpotifyRecentTracks() {
        let url = `${API_BASE_URL}/me/player/recently-played?limit=50`;
        return Source.extractTracks(SpotifyRequest.get(url).items);
    }

    function findNewPlayed(recentItems, fileItems) {
        if (fileItems.length == 0) {
            return recentItems;
        }

        let lastPlayedTime = new Date(fileItems[0].played_at).getTime();
        for (let i = recentItems.length - 1; i >= 0; i--) {
            let time = new Date(recentItems[i].played_at).getTime();
            if (time - lastPlayedTime == 0) {
                return recentItems.slice(0, i);
            }
        }

        return recentItems.filter(recentItem => {
            return -1 == fileItems.findIndex(fileItem =>
                fileItem.name == recentItem.name
                && fileItem.played_at == recentItem.played_at);
        });
    }

    function appendTracks(filename, tracks) {
        tracks.forEach((t) => {
            t.played_at = Order.getDateValue(t)
            if (t.played_at == DEFAULT_DATE) {
                t.played_at = new Date().toISOString()
            }
        });
        Cache.compressTracks(tracks);
        let fileItems = Cache.read(filename);
        Combiner.push(fileItems, tracks);
        Order.sort(fileItems, 'meta.played_at', 'desc');
        Cache.write(filename, fileItems);
    }

    function compress() {
        if (ON_SPOTIFY_RECENT_TRACKS) {
            compressFile(SPOTIFY_FILENAME);
        }
        if (ON_LASTFM_RECENT_TRACKS) {
            compressFile(LASTFM_FILENAME);
        }
        if (ON_SPOTIFY_RECENT_TRACKS && ON_LASTFM_RECENT_TRACKS) {
            compressFile(BOTH_SOURCE_FILENAME);
        }
    }

    function compressFile(filename) {
        Cache.copy(filename);
        let tracks = Cache.read(filename);
        Cache.compressTracks(tracks);
        Cache.write(filename, tracks);
    }
})();

const Combiner = (function () {
    return {
        alternate, mixinMulti, mixin, replace, push,
    };

    function replace(oldArray, newArray) {
        oldArray.length = 0;
        push(oldArray, newArray);
    }

    function push(sourceArray, ...additionalArray) {
        additionalArray.forEach((array) => {
            array = Array.isArray(array) ? array : [array];
            if (array.length < 1000) {
                sourceArray.push.apply(sourceArray, array);
            } else {
                array.forEach((item) => sourceArray.push(item));
            }
        });
        return sourceArray;
    }

    function alternate(bound, ...arrays) {
        let limitLength = getLimitLength(bound, arrays);
        const resultArray = [];
        for (let i = 0; i < limitLength; i++) {
            pushPack(i);
        }
        return resultArray;

        function pushPack(index) {
            arrays.forEach((array) => {
                if (array.length > index) {
                    resultArray.push(array[index]);
                }
            });
        }
    }

    function mixin(xArray, yArray, xRow, yRow, toLimitOn) {
        return mixinMulti({
            toLimitOn: toLimitOn || false,
            source: [xArray, yArray],
            inRow: [xRow, yRow],
        });
    }

    function mixinMulti(params) {
        let resultArray = [];
        if (params.source.length != params.inRow.length || (params.toLimitOn && !isEnoughItems())) {
            return resultArray;
        }
        let limitLength = getLimitLength('max', params.source);
        for (let i = 0; i < limitLength; i++) {
            let hasNextFullPack = pushAllPack(i);
            if (params.toLimitOn && !hasNextFullPack) {
                break;
            }
        }
        return resultArray;

        function pushAllPack(step) {
            let hasNextFullPack = true;
            params.source.forEach((array, rowIndex) => {
                let hasNextPack = pushPack(array, step, params.inRow[rowIndex]);
                hasNextFullPack = hasNextFullPack && hasNextPack;
            });
            return hasNextFullPack;
        }

        function pushPack(array, step, inRow) {
            let startIndex = step * inRow;
            let endIndex = startIndex + inRow;
            push(resultArray, array.slice(startIndex, endIndex));
            let nextEndIndex = endIndex + inRow - 1;
            return array[nextEndIndex] != undefined;
        }

        function isEnoughItems() {
            for (let i = 0; i < params.source.length; i++) {
                if (params.source[i].length < params.inRow[i]) {
                    return false;
                }
            }
            return true;
        }
    }

    function getLimitLength(type, arrays) {
        let lengthArray = arrays.map((item) => item.length);
        let mathMethod = type == 'min' ? Math.min : Math.max;
        return mathMethod(...lengthArray);
    }
})();

const RangeTracks = (function () {
    const BAN_KEYS = ['genres', 'ban_genres', 'release_date', 'followed_include', 'include', 'exclude', 'groups', 'artist_limit', 'album_limit', 'track_limit', 'isRemoveUnknownGenre'];
    let _cachedTracks, _lastOutRange, _params;
    return { rangeTracks, getLastOutRange, isBelong, isBelongGenres, isBelongBanGenres, isBelongReleaseDate, };

    function getLastOutRange() {
        return _lastOutRange ? _lastOutRange.slice() : [];
    }

    function rangeTracks(tracks, params) {
        _params = params;
        _lastOutRange = [];
        _cachedTracks = getCachedTracks(tracks, params);

        let filteredTracks = tracks.filter((track) => {
            if (isBelongMeta(track) && isBelongFeatures(track) && isBelongArtist(track) && isBelongAlbum(track)) {
                return true;
            } else {
                _lastOutRange.push(track);
                return false;
            }
        });

        Combiner.replace(tracks, filteredTracks);
    }

    function isBelongMeta(track) {
        if (!_params.meta) {
            return true;
        }

        let trackMeta = _cachedTracks.meta[track.id] ? _cachedTracks.meta[track.id] : track;
        return _params.meta ? isBelong(trackMeta, _params.meta) : true;
    }

    function isBelongFeatures(track) {
        if (!_params.features) {
            return true;
        }

        let trackFeatures = _cachedTracks.features[track.id];
        return isBelong(trackFeatures, _params.features);
    }

    function isBelongArtist(track) {
        if (!_params.artist) {
            return true;
        }

        let trackArtist;
        if (_cachedTracks.artists[track.artists[0].id]) {
            trackArtist = _cachedTracks.artists[track.artists[0].id];
        } else {
            trackArtist = track.artists[0];
        }

        if (trackArtist.followers && typeof trackArtist.followers === 'object') {
            trackArtist.followers = trackArtist.followers.total;
        }
        return (
            isBelong(trackArtist, _params.artist) &&
            isBelongGenres(trackArtist.genres, _params.artist.genres, _params.artist.isRemoveUnknownGenre) &&
            !isBelongBanGenres(trackArtist.genres, _params.artist.ban_genres, _params.artist.isRemoveUnknownGenre)
        );
    }

    function isBelongAlbum(track) {
        if (!_params.album) {
            return true;
        }

        let trackAlbum;
        if (_cachedTracks.albums[track.album.id]) {
            trackAlbum = _cachedTracks.albums[track.album.id];
        } else {
            trackAlbum = track.album;
        }

        return (
            isBelong(trackAlbum, _params.album) &&
            isBelongReleaseDate(trackAlbum.release_date, _params.album.release_date)
        );
    }

    function isBelongReleaseDate(albumReleaseDate, targetPeriod) {
        if (!targetPeriod) {
            return true;
        }
        let releaseDateTime = new Date(albumReleaseDate).getTime();
        let startDate, endDate;
        if (targetPeriod.hasOwnProperty('sinceDays')) {
            startDate = Filter.getDateRel(targetPeriod.sinceDays, 'startDay');
            endDate = Filter.getDateRel(targetPeriod.beforeDays, 'endDay');
        } else if (targetPeriod.hasOwnProperty('startDate')) {
            startDate = targetPeriod.startDate;
            endDate = targetPeriod.endDate;
        }
        if (releaseDateTime < startDate.getTime() || releaseDateTime > endDate.getTime()) {
            return false;
        }
        return true;
    }

    function isBelongGenres(objGeners, selectedGenres, isRemoveUnknown = true) {
        if (!selectedGenres || selectedGenres.length == 0) {
            return true;
        } else if (!objGeners || objGeners.length == 0) {
            return !isRemoveUnknown;
        }
        return isSomeIncludes(objGeners, selectedGenres);
    }

    function isBelongBanGenres(objGeners, banGenres, isRemoveUnknown = true) {
        if (!banGenres || banGenres.length == 0) {
            return false;
        } else if (!objGeners || objGeners.length == 0) {
            return isRemoveUnknown;
        }
        return isSomeIncludes(objGeners, banGenres);
    }

    function isSomeIncludes(targetArray, valueArray) {
        if (!targetArray) return false;
        return valueArray.some((str) => {
            return targetArray.some((item) => item.includes(str));
        });
    }

    function isBelong(obj, args) {
        if (!obj) {
            return false;
        }
        for (let key in args) {
            if (BAN_KEYS.includes(key)) {
                continue;
            } else if ((Array.isArray(args[key]) && !args[key].some(value => value == obj[key]))
                || (typeof args[key] == 'object' && (obj[key] < args[key].min || obj[key] > args[key].max))
                || (typeof args[key] != 'object' && args[key] != obj[key])
            ) {
                return false
            }
        }
        return true;
    }
})();

const Filter = (function () {
    function removeUnavailable(tracks, market) {
        market = market || User.country;
        let availableState = [];
        let unavailableState = [];
        let unclearState = [];

        identifyState();
        defineUnavailableState();
        removeUnavailableTracks();

        function identifyState() {
            tracks.forEach((t) => {
                if (t.hasOwnProperty('available_markets') && t.available_markets.includes(market)) {
                    availableState.push(t.id);
                } else {
                    unclearState.push(t.id);
                }
            });
        }

        function defineUnavailableState() {
            if (unclearState.length == 0) return;
            SpotifyRequest.getFullObjByIds('tracks', unclearState, 50, market).forEach((t, i) => {
                if (!t) {
                    let id = unclearState[i];
                    let track = tracks.find(t => t.id == id);
                    Admin.printInfo(`У трека изменился id, старое значение ${id} (${getTrackKeys(track)})`);
                    unavailableState.push(id);
                } else if (t.hasOwnProperty('is_playable') && t.is_playable) {
                    let id = t.linked_from ? t.linked_from.id : t.id;
                    availableState.push(id);
                } else {
                    unavailableState.push(t.id);
                    Admin.printInfo('Трек нельзя послушать:', t.id, '-', getTrackKeys(t)[0]);
                }
            });
        }

        function removeUnavailableTracks() {
            if (availableState.length == tracks.length) return;
            let availableTracks = tracks.filter((t) => !unavailableState.includes(t.id));
            Combiner.replace(tracks, availableTracks);
        }
    }

    function removeTracks(original, removable, invert = false, mode = 'every') {
        let ids = removable.toObject((item) => item.id);
        let names = removable.map(item => getTrackKeys(item, mode)).flat(1);
        let filteredTracks = original.filter((item) => invert ^ (
            !ids.hasOwnProperty(item.id) &&
            !getTrackKeys(item, mode).some(name => names.includes(name))
        ));
        Combiner.replace(original, filteredTracks);
    }

    function removeArtists(original, removable, invert = false, mode = 'every') {
        let artists = removable.map(item => item.artists
            ? mode == 'every' ? item.artists : item.artists[0]
            : item
        ).flat(1);
        let ids = artists.toObject((item) => item.id);
        let filteredTracks = original.filter((item) => invert ^ !getArtistIds(item, mode).some(id => ids.hasOwnProperty(id)));
        Combiner.replace(original, filteredTracks);
    }

    function getTrackKeys(track, mode) {
        return mode == 'every'
            ? track.artists.map(artist => `${artist.name} ${track.name}`.formatName())
            : [`${track.artists[0].name} ${track.name}`.formatName()];
    }

    function getArtistIds(item, mode) {
        return mode == 'every'
            ? item.artists ? item.artists.map(a => a.id) : [item.id]
            : item.artists ? [item.artists[0].id] : [item.id]
    }

    function replaceWithSimilar(params) {
        let replacementTracks = Combiner.push([], params.replace.flat(1));
        let copyTracks = Selector.sliceCopy(params.origin);
        Filter.removeTracks(copyTracks, replacementTracks, true);
        let features = getCachedTracks(copyTracks, { features: {} }).features;

        let urls = [];
        copyTracks.forEach((t) => {
            if (!features[t.id] || !features[t.id].danceability) {
                return;
            }
            let params = {
                seed_tracks: t.id,
                seed_artists: Selector.sliceFirst(t.artists.map(a => a.id), 4).join(','),
            };
            Object.entries(features[t.id]).forEach(item => {
                if (!isNaN(item[1])) {
                    params['target_' + item[0]] = item[1];
                }
            });
            urls.push(Source.createUrlForRecomTracks(params));
        });

        let similarTracks = {};
        SpotifyRequest.getAll(urls).forEach((r) => {
            let item = r.seeds.find((s) => s.type.toLowerCase() == 'track');
            similarTracks[item.id] = similarTracks[item.id] || [];
            Combiner.push(similarTracks[item.id], r.tracks);
            Filter.dedupTracks(similarTracks[item.id]);
            if (params.isRemoveOriginArtists) {
                Filter.removeArtists(similarTracks[item.id], params.origin);
            }
        });

        let keys = Object.keys(similarTracks);
        let removedTracks = Combiner.push([], replacementTracks, params.origin);
        let resultTracks = params.origin.map((track) => {
            if (keys.includes(track.id)) {
                if (similarTracks[track.id].length > 0) {
                    Filter.removeTracks(similarTracks[track.id], removedTracks.flat(1));
                    track = Selector.sliceRandom(similarTracks[track.id], params.count || 1);
                    removedTracks.push(track);
                } else {
                    track = null;
                }
            }
            return track;
        }).flat(1);
        Combiner.replace(params.origin, resultTracks.filter(t => t != null));
    }

    function matchExceptMix(items) {
        matchExcept(items, 'mix|club');
    }

    function matchExceptRu(items) {
        matchExcept(items, '[а-яА-ЯёЁ]+');
    }

    function matchLatinOnly(items) {
        match(items, '^[a-zA-Z0-9 ]+$');
    }

    function matchOriginalOnly(items) {
        matchExcept(items, 'mix|club|radio|piano|acoustic|edit|live|version|cover|karaoke');
    }

    function matchExcept(items, strRegex) {
        match(items, strRegex, true);
    }

    function match(items, strRegex, invert = false) {
        let regex = new RegExp(strRegex, 'i');
        let filteredTracks = items.filter((item) => {
            if (typeof item == 'undefined') {
                return false;
            } else if (item.hasOwnProperty('album') && item.hasOwnProperty('artists')) {
                return invert ^ (
                    regex.test(item.name.formatName()) ||
                    regex.test(item.album.name.formatName()) ||
                    item.artists.every(a => regex.test(a.name.formatName())) ||
                    (item.album.artists && item.album.artists.every(a => regex.test(a.name.formatName())))
                );
            }
            return invert ^ regex.test(item.name.formatName());
        });
        Combiner.replace(items, filteredTracks);
    }

    function detectLanguage(tracks, params) {
        if (!KeyValue.MUSIXMATCH_API_KEY) {
            throw 'Задайте параметр MUSIXMATCH_API_KEY для работы с функцией detectLanguage';
        }

        let isError = getLyrics();
        if (!isError) {
            detectLanguage();
            match();
        }

        function match() {
            Combiner.replace(tracks, tracks.filter(track => {
                if (![undefined, 'und', '#ERROR!'].includes(track.lyrics.lang)) {
                    return RangeTracks.isBelongGenres([track.lyrics.lang], params.include)
                        && !RangeTracks.isBelongBanGenres([track.lyrics.lang], params.exclude)
                }
                return !params.isRemoveUnknown;
            }));
        }

        function getLyrics() {
            const url = 'https://api.musixmatch.com/ws/1.1/matcher.lyrics.get?';
            let unknownLyrics = tracks.filter(t => !t.lyrics || !t.lyrics.lang);
            let urls = unknownLyrics.reduce((urls, track) => {
                let queryObj = {
                    q_track: track.name.formatName(),
                    q_artist: track.artists[0].name.formatName(),
                    apikey: KeyValue.MUSIXMATCH_API_KEY,
                }
                urls.push(url + CustomUrlFetchApp.parseQuery(queryObj));
                return urls;
            }, []);

            return CustomUrlFetchApp.fetchAll(urls).some((response, i) => {
                let json = JSON.parseFromResponse(response);
                let text = json.message.body.lyrics
                    ? json.message.body.lyrics.lyrics_body.split(' ').slice(10, 25).join(' ')
                    : '';
                unknownLyrics[i].lyrics = {
                    text: text.formatName().replace(/["']/g, '').replace(/\n/g, ' ')
                }

                if (json.message.header.status_code == 404) {
                    Admin.printInfo('Не найден текст для', `${unknownLyrics[i].artists[0].name} - ${unknownLyrics[i].name}`)
                    unknownLyrics[i].lyrics.lang = 'und';
                } else if (json.message.header.status_code != 200) {
                    Admin.printError('Ошибка при получении текста',
                        'Возможно превышен лимит от musixmatch.',
                        'Код:', json.message.header.status_code);
                    return true;
                }
            });
        }

        function detectLanguage() {
            const FILENAME = 'DetectLanguage';
            let unknownLang = tracks.filter(t => !t.lyrics.lang);
            let row = unknownLang.map(t => `=DETECTLANGUAGE("${t.lyrics.text}")`);
            if (!row || row.length == 0) {
                Admin.printInfo('Ноль треков для распознавания языка среди', tracks.length, 'треков');
                return;
            }

            let spreadsheet;
            let files = Cache.UserFolder.getFilesByName(FILENAME);
            if (files.hasNext()) {
                spreadsheet = SpreadsheetApp.open(files.next());
            } else {
                spreadsheet = SpreadsheetApp.create(FILENAME);
                let file = DriveApp.getFileById(spreadsheet.getId());
                file.moveTo(Cache.UserFolder);
            }

            let sheet = spreadsheet.getActiveSheet();
            sheet.clear();
            sheet.appendRow(row);
            SpreadsheetApp.flush();
            sheet.getDataRange().getValues()[0].forEach((c, i) => {
                if (c == '#ERROR!') {
                    Admin.printError('Ошибка при попытки идентификации языка:', unknownLang[i].lyrics.text);
                }
                unknownLang[i].lyrics.lang = c;
            });
        }
    }

    function rangeDateRel(items, sinceDays, beforeDays) {
        extractItemsRel(items, sinceDays, beforeDays);
    }

    function rangeDateAbs(items, startDate, endDate) {
        extractItemsAbs(items, startDate, endDate);
    }

    function extractItemsRel(items, sinceDays, beforeDays) {
        let startDate = getDateRel(sinceDays, 'startDay');
        let endDate = getDateRel(beforeDays, 'endDay');
        extractItemsAbs(items, startDate, endDate);
    }

    function extractItemsAbs(items, startDate, endDate) {
        let startTime = startDate ? startDate.getTime() : Date.now();
        let endTime = endDate ? endDate.getTime() : Date.now();

        if (startTime >= endTime) {
            Admin.printError('Левая граница больше чем правая:', startDate, endDate);
            return;
        }

        let filteredItems = items.reduce((_items, item) => {
            let key = item.played_at ? 'played_at' : 'added_at';
            let date = item[key] ? new Date(item[key]) : DEFAULT_DATE;
            let time = date.getTime();
            if (time >= startTime && time <= endTime) {
                _items.push(item);
            }
            return _items;
        }, []);

        Combiner.replace(items, filteredItems);
    }

    function getDateRel(days, bound) {
        let date = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date();
        return date.setBound(bound);
    }

    const Deduplicator = (function () {
        let _items;
        let _duplicates;

        function dedupTracks(tracks, offsetDurationMs = 2000) {
            _items = tracks;
            findTracksDuplicated(offsetDurationMs);
            removeDuplicated();
        }

        function dedupArtists(items) {
            _items = items;
            findArtistsDuplicated();
            removeDuplicated();
        }

        function dedupAlbums(items) {
            _items = items;
            findAlbumsDuplicated();
            removeDuplicated();
        }

        function separateArtistsDuplicated(items) {
            _items = items;
            findArtistsDuplicated();
            let indexArray = _duplicates.map((item) => item.index);
            let result = { original: [], duplicate: [] };
            for (let i = 0; i < _items.length; i++) {
                let key = indexArray.includes(i) ? 'duplicate' : 'original';
                result[key].push(_items[i]);
            }
            return result;
        }

        function findTracksDuplicated(offsetDurationMs) {
            const seenIds = {};
            const seenTrackKeys = {};
            _duplicates = _items.reduce((duplicates, track, index) => {
                if (track === null || track.id === null) {
                    return duplicates;
                } else if (seenIds.hasOwnProperty(track.id) || isDuplicateByName(track)) {
                    duplicates.push({
                        index: index,
                        track: track,
                        reason: seenIds.hasOwnProperty(track.id) ? 'same-track-id' : 'same-track-name',
                    });
                } else {
                    seenIds[track.id] = true;
                    getTrackKeys(track).forEach(key => {
                        seenTrackKeys[key] = seenTrackKeys[key] || [];
                        seenTrackKeys[key].push(track.duration_ms);
                    });
                }
                return duplicates;
            }, []);

            function isDuplicateByName(track) {
                return getTrackKeys(track).some(key => seenTrackKeys.hasOwnProperty(key)
                    && seenTrackKeys[key].filter((duration) => Math.abs(duration - track.duration_ms) < offsetDurationMs).length > 0);
            }
        }

        function findArtistsDuplicated() {
            const seenArtists = {};
            _duplicates = _items.reduce((duplicates, item, index) => {
                const artistId = getArtistId(item);
                if (artistId == undefined) {
                    return duplicates;
                } else if (seenArtists.hasOwnProperty(artistId)) {
                    duplicates.push({
                        index: index,
                        item: item,
                        reason: 'same-artist-id',
                    });
                } else {
                    seenArtists[artistId] = true;
                }
                return duplicates;
            }, []);

            function getArtistId(item) {
                if (item && item.hasOwnProperty('artists') && item.artists.length > 0) {
                    return item.artists[0].id;
                } else if (item) {
                    return item.id;
                }
            }
        }

        function findAlbumsDuplicated() {
            const seenAlbums = {};
            _duplicates = _items.reduce((duplicates, item, index) => {
                const albumId = getAlbumId(item);
                if (albumId == undefined) {
                    return duplicates;
                } else if (seenAlbums.hasOwnProperty(albumId)) {
                    duplicates.push({
                        index: index,
                        item: item,
                    });
                } else {
                    seenAlbums[albumId] = true;
                }
                return duplicates;
            }, []);

            function getAlbumId(item) {
                try {
                    return item.album
                        ? `${item.artists[0].name} ${item.album.name}`.formatName() + ` ${item.album.release_date} ${item.album.total_tracks}`
                        : `${item.artists[0].name} ${item.name}`.formatName() + ` ${item.release_date} ${item.total_tracks}`;
                } catch (error) {
                    Admin.printError(error)
                    return undefined
                }
            }
        }

        function removeDuplicated() {
            let offset = 0;
            _duplicates.forEach((item) => {
                _items.splice(item.index - offset, 1);
                offset++;
            });
        }

        return {
            dedupTracks: dedupTracks,
            dedupArtists: dedupArtists,
            dedupAlbums: dedupAlbums,
            separateArtistsDuplicated: separateArtistsDuplicated,
        };
    })();

    return {
        removeTracks, removeArtists, removeUnavailable, getDateRel, rangeDateRel, rangeDateAbs, replaceWithSimilar,
        match, matchExcept, matchExceptRu, matchExceptMix, matchLatinOnly, matchOriginalOnly, detectLanguage,
        dedupTracks: Deduplicator.dedupTracks,
        dedupArtists: Deduplicator.dedupArtists,
        dedupAlbums: Deduplicator.dedupAlbums,
        separateArtistsDuplicated: Deduplicator.separateArtistsDuplicated,
        rangeTracks: RangeTracks.rangeTracks,
        getLastOutRange: RangeTracks.getLastOutRange,
    };
})();

const Selector = (function () {
    return {
        keepFirst, keepLast, keepAllExceptFirst, keepAllExceptLast, keepRandom, keepNoLongerThan, sliceFirst, sliceLast, sliceAllExceptFirst,
        sliceAllExceptLast, sliceRandom, sliceNoLongerThan, sliceCopy, pickYear, isWeekend, isDayOfWeekRu, isDayOfWeek,
    };

    function keepFirst(array, count) {
        Combiner.replace(array, sliceFirst(array, count));
    }

    function keepLast(array, count) {
        Combiner.replace(array, sliceLast(array, count));
    }

    function keepAllExceptFirst(array, skipCount) {
        Combiner.replace(array, sliceAllExceptFirst(array, skipCount));
    }

    function keepAllExceptLast(array, skipCount) {
        Combiner.replace(array, sliceAllExceptLast(array, skipCount));
    }

    function keepRandom(array, count) {
        if (!count) return;
        Order.shuffle(array);
        keepFirst(array, count);
    }

    function keepNoLongerThan(tracks, minutes) {
        Combiner.replace(tracks, sliceNoLongerThan(tracks, minutes));
    }

    function sliceFirst(array, count) {
        return array.slice(0, count);
    }

    function sliceLast(array, count) {
        let startIndex = getLimitIndexForLast(array, count);
        return array.slice(startIndex);
    }

    function sliceAllExceptFirst(array, skipCount) {
        return array.slice(skipCount);
    }

    function sliceAllExceptLast(array, skipCount) {
        let endIndex = getLimitIndexForLast(array, skipCount);
        return array.slice(0, endIndex);
    }

    function getLimitIndexForLast(array, count) {
        return array.length < count ? 0 : array.length - count;
    }

    function sliceRandom(array, count) {
        if (!count) return array;
        let copyArray = sliceCopy(array);
        Order.shuffle(copyArray);
        return sliceFirst(copyArray, count);
    }

    function sliceCopy(array) {
        return Array.isArray(array) || typeof array == 'string'
            ? array.slice()
            : Object.assign({}, array);
    }

    function sliceNoLongerThan(tracks, minutes) {
        let totalDuration = minutes * 60 * 1000;
        let currentDuration = 0;
        let resultTracks = [];
        tracks.forEach((track) => {
            let checkDuration = currentDuration + track.duration_ms;
            if (checkDuration <= totalDuration) {
                resultTracks.push(track);
                currentDuration = checkDuration;
            }
        });
        return resultTracks;
    }

    function isWeekend() {
        return isDayOfWeek('saturday') || isDayOfWeek('sunday');
    }

    function isDayOfWeekRu(strDay) {
        return isDayOfWeek(strDay, 'ru-RU');
    }

    function isDayOfWeek(strDay, locale = 'en-US') {
        let today = new Date();
        let strWeekday = today.toLocaleDateString(locale, { weekday: 'long' });
        return strDay.toLowerCase() === strWeekday.toLowerCase();
    }

    function pickYear(tracks, year, offset = 5) {
        let tracksByYear = Order.separateYears(tracks);
        if (tracksByYear.hasOwnProperty(year) || tracks.length == 0) {
            return tracksByYear[year] || [];
        }
        Admin.printInfo(`Среди ${tracks.length} треков нет вышедших в ${year} году`);
        year = parseInt(year);
        let keys = Object.keys(tracksByYear).map((item) => parseInt(item));
        let nearYear = keys.sort((x, y) => Math.abs(year - x) - Math.abs(year - y))[0];
        if (typeof nearYear != 'undefined' && Math.abs(nearYear - year) <= offset) {
            Admin.printInfo(`Выбран ближайший год: ${nearYear}`);
            return tracksByYear[nearYear.toString()];
        }
        Admin.printInfo(`При смещении ${offset}, ближайший год не найден`);
        return [];
    }
})();

const Order = (function () {
    const DATE_FIELDS = ['played_at', 'added_at', 'playedAt', 'addedAt', 'dateAt', 'release_date']

    function shuffle(array, factor = 1.0) {
        let indexArray = Array.from(Array(array.length).keys()).sort(_ => Math.random() - 0.5)
        for (let i = 0; i < (array.length * factor); i++) {
            let x = indexArray[i];
            let r = Math.floor(Math.random() * (x + 1));
            let y = Math.floor(r * factor + x * (1 - factor));
            [array[x], array[y]] = [array[y], array[x]];
        }
        return array
    }

    function reverse(array) {
        array.reverse();
    }

    const sort = (function () {
        let _source, _direction, _key;

        return function (tracks, pathKey, direction = 'asc') {
            _source = tracks;
            _direction = direction;
            _key = pathKey.split('.')[1];
            if (pathKey.includes('artist')) {
                sortArtist();
            } else if (pathKey.includes('features')) {
                sortFeatures();
            } else if (pathKey.includes('album')) {
                sortAlbum();
            } else if (pathKey.includes('meta')) {
                sortMeta();
            }
        };

        function sortArtist() {
            // popularity, followers, name
            let items = getCachedTracks(_source, { artist: {} }).artists;

            if (_key == 'followers') {
                for (let id in items) {
                    if (items[id].followers && typeof items[id].followers == 'object') {
                        items[id].followers = items[id].followers.total;
                    }
                }
            }

            let arrayItems = Object.values(items);
            let compareMethod = _key == 'name' ? compareString : compareNumber;
            _source.sort((x, y) => compareMethod(getItem(x), getItem(y)));

            function getItem(x) {
                let artist = x.artists ? x.artists[0] : x;
                return items[artist.id] || arrayItems.find(i => i.name == artist.name) || {};
            }
        }

        function sortFeatures() {
            // acousticness, danceability, energy, instrumentalness, liveness,
            // loudness, speechiness, valence, tempo, key, mode, time_signature, duration_ms
            let items = getCachedTracks(_source, { features: {} }).features;
            _source.sort((x, y) => compareNumber(items[x.id], items[y.id]));
        }

        function sortMeta() {
            // name, popularity, duration_ms, explicit, dates
            let hasKey = _source.every((t) => t[_key] != undefined);
            if (!hasKey) {
                let items = getCachedTracks(_source, { meta: {} }).meta;
                _source.forEach((s, i) => {
                    if (!s.hasOwnProperty(_key)) {
                        _source[i][_key] = items[s.id][_key];
                    }
                });
            }
            if (_key == 'name') {
                _source.sort((x, y) => compareString(x, y));
            } else if (DATE_FIELDS.includes(_key)) {
                _source.sort((x, y) => compareDate(x, y));
            } else {
                _source.sort((x, y) => compareNumber(x, y));
            }
        }

        function sortAlbum() {
            // popularity, name, release_date
            let hasKey = _source.every((t) => extract(t)[_key] != undefined);
            let items = {};
            if (hasKey) {
                _source.forEach((t) => (items[extract(t).id] = extract(t)));
            } else {
                items = getCachedTracks(_source, { album: {} }).albums;
            }

            if (_key == 'name') {
                _source.sort((x, y) => compareString(items[extract(x).id], items[extract(y).id]));
            } else if (_key == 'release_date') {
                _source.sort((x, y) => compareDate(items[extract(x).id], items[extract(y).id]));
            } else if (_key == 'popularity') {
                _source.sort((x, y) => compareNumber(items[extract(x).id], items[extract(y).id]));
            }

            function extract(item) {
                return item.album || item;
            }
        }

        function compareNumber(x, y) {
            if (!Number.parseFloat(x[_key]) || !Number.parseFloat(y[_key])) return 0;
            return _direction == 'asc' ? x[_key] - y[_key] : y[_key] - x[_key];
        }

        function compareString(x, y) {
            if (_direction == 'asc') {
                return (x[_key] > y[_key]) - (x[_key] < y[_key]);
            }
            return (x[_key] < y[_key]) - (x[_key] > y[_key]);
        }

        function compareDate(x, y) {
            let xDate = new Date(getDateValue(x))
            let yDate = new Date(getDateValue(y))
            if (_direction == 'asc') {
                return xDate.getTime() - yDate.getTime();
            }
            return yDate.getTime() - xDate.getTime();
        }

    })();

    function getDateValue(obj) {
        for (let fieldName of DATE_FIELDS) {
            if (obj.hasOwnProperty(fieldName)) {
                return obj[fieldName]
            }
        }
        return DEFAULT_DATE
    }

    function separateArtists(items, space, isRandom = false) {
        if (isRandom) {
            shuffle(items);
        }
        let response = Filter.separateArtistsDuplicated(items);
        let original = response.original;
        let duplicate = response.duplicate;
        duplicate.forEach((item) => tryInsert(item));
        Combiner.replace(items, original);

        function tryInsert(item) {
            for (let i = 0; i <= original.length; i++) {
                let startIndex = i - space > 0 ? i - space : 0;
                let endIndex = i + space < original.length ? i + space : original.length;
                if (isCorrectRow(item, startIndex, endIndex)) {
                    original.splice(i, 0, item);
                    break;
                }
            }
        }

        function isCorrectRow(item, startIndex, endIndex) {
            let id = getArtistId(item);
            for (let i = startIndex; i <= endIndex; i++) {
                if (original[i] && getArtistId(original[i]) === id) {
                    return false;
                }
            }
            return true;
        }

        function getArtistId(item) {
            return item.followers ? item.id : item.artists[0].id;
        }
    }

    function separateYears(tracks) {
        return tracks.reduce((tracksByYear, track) => {
            if (track.hasOwnProperty('album') && track.album.hasOwnProperty('release_date')) {
                let year = new Date(track.album.release_date).getFullYear();
                tracksByYear[year] = tracksByYear[year] || [];
                tracksByYear[year].push(track);
            }
            return tracksByYear;
        }, {});
    }

    return {
        shuffle, reverse, sort, separateArtists, separateYears, getDateValue
    };
})();

const Playlist = (function () {
    const LIMIT_TRACKS = 11000;
    const LIMIT_DESCRIPTION = 300;
    const SIZE = ['500', '600', '700', '800', '900', '1000'];
    const ARGS = `?limit=50`;

    const getPlaylistArray = (function () {
        let playlistsOfUsers = {};
        return get;

        function get(userId) {
            let key = userId == null ? 'me' : userId;
            if (playlistsOfUsers[key] == null) {
                let path = userId == null ? 'me/playlists' : `users/${userId}/playlists`;
                playlistsOfUsers[key] = SpotifyRequest.getItemsByPath(path + ARGS);
            }
            return playlistsOfUsers[key];
        }
    })();

    return {
        getById, getByName, getDescription, getPlaylistArray, saveAsNew, saveWithReplace, saveWithAppend, saveWithUpdate,
        removeTracks: removeNonExistingTracks,
    };

    function getById(playlistId) {
        let url = `${API_BASE_URL}/playlists/${playlistId}${ARGS}`;
        return SpotifyRequest.get(url);
    }

    function getByName(playlistName, userId) {
        let path = userId == null ? 'me/playlists' : `users/${userId}/playlists`;
        let url = `${API_BASE_URL}/${path}${ARGS}`;
        let response = SpotifyRequest.get(url);
        while (true) {
            const name = playlistName;
            let foundItem = response.items.find((item) => {
                return item.name == name;
            });
            if (!foundItem && response.next) {
                response = SpotifyRequest.get(response.next);
            } else {
                return foundItem;
            }
        }
    }

    function getDescription(tracks, limit = 5) {
        let artists = Array.from(new Set(tracks.map(t => t.artists[0].name)));
        return `${Selector.sliceRandom(artists, limit).join(', ')} и не только`;
    }

    function removeNonExistingTracks(id, localTracks) {
        let remoteTrackIds = Source.getPlaylistTracks('', id).map(t => t.id);
        localTracks = localTracks.filter(t => remoteTrackIds.includes(t.id));
        removeTracksRequest(id, localTracks);
    }

    function saveAsNew(data) {
        let payload = createPayload(data);
        let playlist = createPlaylist(payload);
        addTracks({ id: playlist.id, tracks: data.tracks });
        if (data.hasOwnProperty('sourceCover')) {
            setCover(playlist.id, getCover(data.sourceCover));
        } else if (data.hasOwnProperty('randomCover')) {
            setCover(playlist.id, getRandomCover());
        }
        data.id = playlist.id
        changeDetails(data)
        return playlist.id;
    }

    function createPlaylist(payload) {
        let url = `${API_BASE_URL}/users/${User.id}/playlists`;
        return SpotifyRequest.post(url, payload);
    }

    function saveWithReplace(data) {
        return saveWithModify(replaceTracks, data);
    }

    function saveWithAppend(data) {
        return saveWithModify(addTracks, data);
    }

    function saveWithUpdate(data) {
        return saveWithModify(updateTracks, data);
    }

    function saveWithModify(modifyMethod, data) {
        if (data.tracks.length > LIMIT_TRACKS) {
            Selector.keepFirst(data.tracks, LIMIT_TRACKS);
        }

        if (data.id) {
            modifyMethod(data);
            changeDetails(data);
            changeCover(data);
            return data.id;
        }

        let playlist = getByName(data.name);
        if (playlist == null) {
            return saveAsNew(data);
        } else {
            data.id = playlist.id;
            return saveWithModify(modifyMethod, data);
        }
    }

    function addTracks(data) {
        if (data.tracks.length > 0) {
            modifyTracks('post', data);
        }
    }

    function replaceTracks(data) {
        modifyTracks('put', data);
    }

    function updateTracks(data) {
        let remoteTracks = Source.getPlaylistTracks('', data.id);
        let newTracks = Selector.sliceCopy(data.tracks);
        Filter.removeTracks(newTracks, remoteTracks);
        Filter.removeTracks(remoteTracks, data.tracks);
        removeTracksRequest(data.id, remoteTracks);
        addTracks({ id: data.id, tracks: newTracks, position: data.position });
    }

    function removeTracksRequest(id, tracks) {
        if (tracks.length > 0) {
            let params = {
                url: `${API_BASE_URL}/playlists/${id}/tracks`,
                key: 'tracks',
                limit: 100,
                items: getTrackUris(tracks, 'object'),
            }
            SpotifyRequest.deleteItems(params);
        }
    }

    function modifyTracks(requestType, data) {
        const SIZE = 100;
        let uris = getTrackUris(data.tracks);
        let count = Math.ceil(uris.length / SIZE);
        let url = `${API_BASE_URL}/playlists/${data.id}/tracks`;
        if (count == 0 && requestType == 'put') {
            // Удалить треки в плейлисте
            SpotifyRequest.put(url, { uris: [] });
            return;
        }

        let attempt = 0;
        for (let i = 0; i < count; i++) {
            let begin = i * SIZE;
            let payload = { uris: uris.slice(begin, begin + SIZE) };
            if (requestType == 'post' && data.position == 'begin') {
                payload.position = begin;
            }
            if (SpotifyRequest[requestType](url, payload) != undefined) {
                requestType = 'post'; // сменить тип запроса, чтобы добавлять треки после первого put-запроса
            } else if (attempt++ < 3) {
                if (attempt == 1) {
                    createTrackBackup()
                    if (Playlist.getById(data.id) == undefined) {
                        throw `Невозможно добавить треки. Плейлиста с id ${data.id} не существует. Исправьте id у функции Playlist.save*`
                    }
                }
                i--; // повторить запрос
                Admin.pause(5);
            } else {
                Admin.printInfo('Прервано добавление треков после 3 неудачных попыток');
                break;
            }
        }

        function createTrackBackup() {
            let filepath = `backup/playlists/${data.id}.json`;
            Cache.compressTracks(data.tracks);
            Cache.write(filepath, data.tracks);
            Admin.printInfo(`Создана резервная копия треков: ${filepath}`);
        }
    }

    function getTrackUris(tracks, type) {
        return tracks.reduce((uris, track) => {
            let item = track.uri || `spotify:track:${track.id}`;
            uris.push(type == 'object' ? { uri: item } : item);
            return uris;
        }, []);
    }

    function changeDetails(data) {
        let url = `${API_BASE_URL}/playlists/${data.id}`;
        let payload = createPayload(data);
        SpotifyRequest.put(url, payload);
    }

    function changeCover(data) {
        let img;
        if (data.hasOwnProperty('sourceCover')) {
            img = getCover(data.sourceCover);
        } else if (data.randomCover == 'update' || (data.randomCover == 'once' && hasMosaicCover(data.id))) {
            img = getRandomCover();
        }
        setCover(data.id, img);
    }

    function getCover(url) {
        let img = CustomUrlFetchApp.fetch(url);
        return Utilities.base64Encode(img.getContent());
    }

    function hasMosaicCover(playlistId) {
        let playlist = getById(playlistId);
        return playlist.images.length > 0 && playlist.images[0].url.includes('mosaic');
    }

    function getRandomCover() {
        let response = CustomUrlFetchApp.fetch('https://picsum.photos/' + getRandomSize());
        let img = Utilities.base64Encode(response.getContent());
        // https://stackoverflow.com/a/32140193/5894542
        let byteSize = ((4 * img.length / 3) + 3) & ~3;
        return byteSize > 300000 ? getRandomCover() : img;
    }

    function getRandomSize() {
        let index = Math.floor(Math.random() * SIZE.length);
        return SIZE[index];
    }

    function setCover(playlistId, img) {
        img && SpotifyRequest.putImage(`${API_BASE_URL}/playlists/${playlistId}/images`, img);
    }

    function createPayload(data) {
        let payload = {
            name: data.name,
            public: data.hasOwnProperty('public') ? data.public : true,
        };
        if (data.description) {
            payload.description = Selector.sliceFirst(data.description, LIMIT_DESCRIPTION);
        }
        return payload;
    }
})();

const Library = (function () {
    return {
        checkFavoriteTracks, deleteAlbums, deleteFavoriteTracks, followArtists, followPlaylists, saveAlbums, saveFavoriteTracks, unfollowArtists, unfollowPlaylists,
    };

    function checkFavoriteTracks(tracks) {
        let urls = [];
        let limit = 50;
        let offset = 50;
        for (let i = 0; i < Math.ceil(tracks.length / limit); i++) {
            let ids = tracks.slice(i * limit, offset).map(t => t.id);
            urls.push(`${API_BASE_URL}/me/tracks/contains?ids=${ids}`);
            offset += limit;
        }
        SpotifyRequest.getAll(urls).flat(1).map((value, i) => {
            tracks[i].isFavorite = value;
        })
    }

    function followArtists(artists) {
        modifyFollowArtists(SpotifyRequest.putItems, artists);
    }

    function unfollowArtists(artists) {
        modifyFollowArtists(SpotifyRequest.deleteItems, artists);
    }

    function modifyFollowArtists(method, artists) {
        let url = `${API_BASE_URL}/me/following?type=artist`;
        let ids = artists.map((artist) => artist.id);
        method({ url: url, items: ids, limit: 50, key: 'ids' });
    }

    function followPlaylists(playlists) {
        modifyFollowPlaylists(SpotifyRequest.put, playlists);
    }

    function unfollowPlaylists(playlists) {
        modifyFollowPlaylists(SpotifyRequest.deleteRequest, playlists);
    }

    function modifyFollowPlaylists(method, playlists) {
        playlists = Array.isArray(playlists) ? playlists : playlists.split(',').map(id => { return { id: id } });
        let urls = playlists.map(p => `${API_BASE_URL}/playlists/${p.id}/followers`);
        urls.forEach(url => method(url));
    }

    function saveFavoriteTracks(tracks) {
        modifyFavoriteTracks(SpotifyRequest.putItems, tracks);
    }

    function deleteFavoriteTracks(tracks) {
        modifyFavoriteTracks(SpotifyRequest.deleteItems, tracks);
    }

    function modifyFavoriteTracks(method, tracks) {
        let url = `${API_BASE_URL}/me/tracks`;
        let ids = tracks.map((track) => track.id);
        method({ url: url, items: ids, limit: 50, key: 'ids' });
    }

    function saveAlbums(albums) {
        modifyAlbums(SpotifyRequest.putItems, albums);
    }

    function deleteAlbums(albums) {
        modifyAlbums(SpotifyRequest.deleteItems, albums);
    }

    function modifyAlbums(method, albums) {
        let url = `${API_BASE_URL}/me/albums`;
        let ids = albums.map((album) => album.id);
        method({ url: url, items: ids, limit: 50, key: 'ids' });
    }
})();

const Lastfm = (function () {
    const LASTFM_API_BASE_URL = 'http://ws.audioscrobbler.com/2.0/?';
    const LASTFM_STATION = 'https://www.last.fm/player/station/user';
    return {
        rangeTags, removeRecentTracks, removeRecentArtists, getLovedTracks, getRecentTracks, getLastfmRecentTracks, findNewPlayed, getTopTracks,
        getTopTracksByTag, getTopArtists, getTopArtistsByTag, getTopAlbums, getTopAlbumsByTag, getMixStation, getLibraryStation,
        getRecomStation, getNeighboursStation, getSimilarTracks, getSimilarArtists, getCustomTop, convertToSpotify, getTracksByTag, getArtistsByTag, getAlbumsByTag,
    };

    function getSimilarTracks(tracks, match, limit, isFlat = true) {
        return getSimilar({
            searchMethod: Search.multisearchTracks,
            formatMethod: formatTrackNameLastfm,
            apiMethodStr: 'track.getsimilar',
            items: tracks,
            limit: limit,
            match: match,
            parentKey: 'similartracks',
            childKey: 'track',
            isFlat: isFlat,
        });
    }

    function getSimilarArtists(items, match, limit, isFlat = true) {
        return getSimilar({
            searchMethod: Search.multisearchArtists,
            formatMethod: formatArtistNameLastfm,
            apiMethodStr: 'artist.getsimilar',
            items: items,
            limit: limit,
            match: match,
            parentKey: 'similarartists',
            childKey: 'artist',
            isFlat: isFlat,
        });
    }

    function getSimilar(params) {
        let requests = createRequests();
        let items = getAll();
        if (params.isFlat) {
            return params.searchMethod(items, params.formatMethod);
        }
        return items.reduce((result, array) => {
            result.push(params.searchMethod(array, params.formatMethod));
            return result;
        }, []);

        function createRequests() {
            return params.items.reduce((requests, item) => {
                let queryStr = {
                    method: params.apiMethodStr,
                    autocorrect: '1',
                    artist: item.artists ? item.artists[0].name : item.name,
                    limit: params.limit || 50,
                    format: 'json',
                    api_key: KeyValue.LASTFM_API_KEY,
                };
                if (params.apiMethodStr.includes('track')) {
                    queryStr.track = item.name;
                }
                requests.push({ url: LASTFM_API_BASE_URL + CustomUrlFetchApp.parseQuery(queryStr) });
                return requests;
            }, []);
        }

        function getAll() {
            return CustomUrlFetchApp.fetchAll(requests).reduce((similarItems, response) => {
                if (response[params.parentKey]) {
                    let filteredItems = response[params.parentKey][params.childKey].filter((item) => item.match >= params.match);
                    _ = params.isFlat ? Combiner.push(similarItems, filteredItems) : similarItems.push(filteredItems);
                }
                return similarItems;
            }, []);
        }
    }

    function removeRecentTracks(original, user, count = 600, mode = 'every') {
        let removableTracks = getLastfmRecentTracks(validUser(user), count);
        let removableNames = removableTracks.map((item) => formatLastfmTrackKey(item));
        let filteredTracks = original.filter((item) => !formatSpotifyTrackKeys(item, mode).some(name => removableNames.includes(name)));
        Combiner.replace(original, filteredTracks);
    }

    function removeRecentArtists(original, user, count = 600, mode = 'every') {
        let removableTracks = getLastfmRecentTracks(validUser(user), count);
        let removableNames = removableTracks.map((item) => item.artist['#text'].formatName());
        let filteredTracks = original.filter((item) => !formatSpotifyArtistKeys(item, mode).some(name => removableNames.includes(name)));
        Combiner.replace(original, filteredTracks);
    }

    function getRecentTracks(user, count) {
        let tracks = getLastfmRecentTracks(validUser(user), count);
        return Search.multisearchTracks(tracks, formatTrackNameLastfm);
    }

    function getLastfmRecentTracks(user, count) {
        let queryObj = { method: 'user.getrecenttracks', user: validUser(user), limit: 200 };
        let tracks = getTrackPages(queryObj, count);
        if (isNowPlayling(tracks[0])) {
            tracks.splice(0, 1);
        }
        return tracks;
    }

    function findNewPlayed(lastfmTracks, spotifyTracks) {
        if (spotifyTracks.length > 0) {
            lastfmTracks = sliceNewPlayed();
        }
        return Search.multisearchTracks(lastfmTracks, formatTrackNameLastfm);

        function sliceNewPlayed() {
            let lastPlayedTime = new Date(spotifyTracks[0].played_at).getTime();
            for (let i = lastfmTracks.length - 1; i >= 0; i--) {
                let time = new Date(lastfmTracks[i].date['#text']).getTime();
                if (time - lastPlayedTime == 0) {
                    return lastfmTracks.slice(0, i);
                }
            }

            return lastfmTracks.filter(lastfmItem => {
                return -1 == spotifyTracks.findIndex(spotifyItem =>
                    spotifyItem.played_at == lastfmItem.date['#text']);
            });
        }
    }

    function getLovedTracks(user, limit) {
        let queryObj = { method: 'user.getlovedtracks', user: validUser(user), limit: limit || 200 };
        let tracks = getPage(queryObj);
        if (!tracks.lovedtracks) {
            Admin.printError('Ошибка при получении любимых треков', tracks);
            return [];
        }
        return Search.multisearchTracks(tracks.lovedtracks.track, formatTrackNameLastfm);
    }

    function getTopTracks(params) {
        params.method = 'user.gettoptracks';
        let tracks = getTopPage(params);
        if (!tracks.toptracks) {
            Admin.printError('Ошибка при получении топа треков', tracks);
            return [];
        }
        return Search.multisearchTracks(tracks.toptracks.track, formatTrackNameLastfm);
    }

    function getTopArtists(params) {
        params.method = 'user.gettopartists';
        let artists = getTopPage(params);
        if (!artists.topartists) {
            Admin.printError('Ошибка при получении топа исполнителей', artists);
            return [];
        }
        return Search.multisearchArtists(artists.topartists.artist, formatArtistNameLastfm);
    }

    function getTopAlbums(params) {
        params.method = 'user.gettopalbums';
        let albums = getTopPage(params);
        if (!albums.topalbums) {
            Admin.printError('Ошибка при получении топа альбомов', albums);
            return [];
        }
        return Search.multisearchAlbums(albums.topalbums.album, formatAlbumNameLastfm);
    }

    function getTopPage(params) {
        params.period = params.period || 'overall';
        params.limit = params.limit || 50;
        return getPage(params);
    }

    function getMixStation(user, countRequest) {
        return getStationPlaylist(validUser(user), 'mix', countRequest);
    }

    function getLibraryStation(user, countRequest) {
        return getStationPlaylist(validUser(user), 'library', countRequest);
    }

    function getRecomStation(user, countRequest) {
        return getStationPlaylist(validUser(user), 'recommended', countRequest);
    }

    function getNeighboursStation(user, countRequest) {
        return getStationPlaylist(validUser(user), 'neighbours', countRequest);
    }

    function getStationPlaylist(user, type, countRequest) {
        let stationTracks = getStationTracks(validUser(user), type, countRequest);
        let tracks = Search.multisearchTracks(stationTracks, formatTrackNameLastfm);
        Filter.dedupTracks(tracks);
        return tracks;
    }

    function getStationTracks(user, type, countRequest) {
        let url = `${LASTFM_STATION}/${validUser(user)}/${type}`;
        let stationTracks = [];
        for (let i = 0; i < countRequest; i++) {
            let response = CustomUrlFetchApp.fetch(url);
            if (typeof response === 'object' && response.playlist) {
                Combiner.push(stationTracks, response.playlist);
            }
        }
        return stationTracks;
    }

    function getTrackPages(queryObj, count) {
        if (!queryObj.page) {
            queryObj.page = 1;
        }
        let methodKey = queryObj.method.split('.get')[1];
        let requestCount = Math.ceil(count / queryObj.limit);
        let response = [];
        for (let i = 0; i < requestCount; i++) {
            Combiner.push(response, getPage(queryObj)[methodKey].track);
            queryObj.page++;
        }
        return Selector.sliceFirst(response, count);
    }

    function convertToSpotify(items, type) {
        let [formatMethod, searchMethod] = obtainMethodNamesByType(type);
        return searchMethod(items, formatMethod);
    }

    function getCustomTop(params) {
        let [formatMethod, searchMethod] = obtainMethodNamesByType(params.type);
        let tracks = getTracksForPeriod(params);
        let played = calcCountPlayed(tracks, formatMethod);

        params.minPlayed = params.minPlayed || 0;
        params.maxPlayed = params.maxPlayed || 100000;
        played = played.filter(p => p.count >= params.minPlayed && p.count <= params.maxPlayed);
        played.sort((x, y) => y.count - x.count);

        if (!params.isRawItems) {
            Selector.keepAllExceptFirst(played, params.offset || 0);
            Selector.keepFirst(played, params.count || 40);
        }
        let items = played.map((p) => {
            p.item.countPlayed = p.count;
            return p.item;
        });
        return params.isRawItems ? items : searchMethod(items, formatMethod);

        function getTracksForPeriod(params) {
            let fromDate = params.from instanceof Date ? params.from : new Date(params.from);
            let toDate = params.to instanceof Date ? params.to : new Date(params.to);
            let queryObj = {
                method: 'user.getrecenttracks',
                user: validUser(params.user),
                from: fromDate.getTimestampUNIX('startDay'),
                to: toDate.getTimestampUNIX('endDay'),
                limit: 200,
                page: 1,
            };
            let firstPage = getPage(queryObj);
            let totalPages = parseInt(firstPage.recenttracks['@attr'].totalPages);
            if (totalPages == 0) {
                return [];
            }

            let urls = [];
            for (let i = 2; i <= totalPages; i++) {
                queryObj.page = i;
                urls.push(createUrl(queryObj));
            }

            let tracks = [...firstPage.recenttracks.track];
            CustomUrlFetchApp.fetchAll(urls).forEach((response) => {
                if (response.recenttracks) {
                    let items = response.recenttracks.track;
                    if (isNowPlayling(items[0])) {
                        items.splice(0, 1);
                    }
                    Combiner.push(tracks, items);
                }
            });
            return tracks;
        }

        function calcCountPlayed(tracks, formatMethod) {
            let items = {};
            tracks.forEach((track) => {
                let key = formatMethod(track);
                if (typeof items[key] == 'undefined') {
                    items[key] = {
                        item: track,
                        count: 0,
                    };
                }
                items[key].count++;
            });
            return Object.values(items);
        }
    }

    function getAlbumsByTag(tag, limit) {
        return getItemsFromTagPage({
            tag: tag,
            limit: limit,
            type: 'album',
            countPerPage: 20,
            callback: (cheerio) => {
                let names = [];
                cheerio('.resource-list--release-list-item', '', cheerio('.col-main')).each((index, node) => {
                    let album = cheerio(node).children('.resource-list--release-list-item-name').text().trim();
                    let artist = cheerio(node).children('.resource-list--release-list-item-artist').text().trim();
                    names.push(`${artist} ${album}`.formatName());
                });
                return names;
            }
        })
    }

    function getArtistsByTag(tag, limit) {
        return getItemsFromTagPage({
            tag: tag,
            limit: limit,
            type: 'artist',
            countPerPage: 21,
            callback: (cheerio) => {
                let names = [];
                cheerio('.big-artist-list-title', '', cheerio('.big-artist-list')).each((index, node) => {
                    names.push(cheerio(node).text().formatName());
                });
                return names;
            }
        })
    }

    function getTracksByTag(tag, limit) {
        return getItemsFromTagPage({
            tag: tag,
            limit: limit,
            type: 'track',
            countPerPage: 50,
            callback: (cheerio) => {
                let names = [];
                cheerio('.chartlist-row', '', cheerio('.chartlist')).each((index, node) => {
                    let name = cheerio(node).children('.chartlist-name').text().trim();
                    let artist = cheerio(node).children('.chartlist-artist').text().trim();
                    names.push(`${artist} ${name}`.formatName());
                });
                return names;
            }
        })
    }

    function getItemsFromTagPage(params) {
        let names = Selector.sliceFirst(parseNames(), params.limit);
        let [formatMethod, searchMethod] = obtainMethodNamesByType(params.type);
        return searchMethod(names);

        function parseNames() {
            let urls = [];
            let pageCount = Math.ceil(params.limit / params.countPerPage);
            for (let i = 0; i < pageCount; i++) {
                urls.push(`https://www.last.fm/tag/${params.tag}/${params.type}s?page=${i + 1}`);
            }
            let names = [];
            let responses = CustomUrlFetchApp.fetchAll(urls);
            for (let i = 0; i < responses.length; i++) {
                let cheerio = HtmlService.createCheerio(responses[i]);
                cheerio && names.push(...params.callback(cheerio));
                if (names.length >= params.limit || !cheerio) break;
            }
            return names;
        }
    }

    function getTopTracksByTag(params) {
        params.method = 'tag.gettoptracks';
        return getTopByTag(params, 'track');
    }

    function getTopArtistsByTag(params) {
        params.method = 'tag.gettopartists';
        return getTopByTag(params, 'artist');
    }

    function getTopAlbumsByTag(params) {
        params.method = 'tag.gettopalbums';
        return getTopByTag(params, 'album');
    }

    function getTopByTag(queryObj, type) {
        let url = createUrl(queryObj);
        let response = CustomUrlFetchApp.fetch(url);
        let key = Object.keys(response)[0];
        return convertToSpotify(response[key][type], type)
    }

    function obtainMethodNamesByType(type = 'track') {
        let formatMethod, searchMethod;
        if (type == 'artist') {
            formatMethod = formatArtistNameLastfm;
            searchMethod = Search.multisearchArtists;
        } else if (type == 'album') {
            formatMethod = formatAlbumNameLastfm;
            searchMethod = Search.multisearchAlbums;
        } else {
            formatMethod = formatTrackNameLastfm;
            searchMethod = Search.multisearchTracks;
        }
        return [formatMethod, searchMethod];
    }

    function getPage(queryObj) {
        let url = createUrl(queryObj);
        return CustomUrlFetchApp.fetch(url) || [];
    }

    function isNowPlayling(track) {
        return track['@attr'] && track['@attr'].nowplaying === 'true';
    }

    function rangeTags(spotifyTracks, params) {
        spotifyTracks.forEach(t => {
            let queryObj = {
                method: 'track.gettoptags',
                user: validUser(params.user),
                artist: t.artists[0].name.formatName(),
                track: t.name.formatName(),
                autocorrect: 1,
            };
            let response = CustomUrlFetchApp.fetch(createUrl(queryObj));
            let trackname = `${t.artists[0].name} - ${t.name}`;
            if (response.toptags && response.toptags.tag) {
                if (response.toptags.tag.length > 0) {
                    t.tags = response.toptags.tag
                } else if (response.toptags.tag.length == 0) {
                    Admin.printInfo('У трека нет тегов', trackname);
                }
            } else if (response.error) {
                Admin.printInfo(`${response.message}. Трек: ${trackname}`);
            }
        });

        Combiner.replace(spotifyTracks, spotifyTracks.filter(t => {
            if (!t.hasOwnProperty('tags') || t.tags.length == 0) {
                return !params.isRemoveUnknown;
            }
            return isSomeBelong(t, params.include, true) && !isSomeBelong(t, params.exclude, false);
        }));

        function isSomeBelong(track, inputTags, defaultResult) {
            if (!track || !Array.isArray(inputTags)) {
                return defaultResult;
            }
            return inputTags.some(inputTag => {
                return track.tags.some(trackTag =>
                    trackTag.name == inputTag.name
                    && trackTag.count >= (inputTag.minCount || 0)
                );
            });
        }
    }

    function createUrl(queryObj) {
        queryObj.api_key = KeyValue.LASTFM_API_KEY;
        queryObj.format = 'json';
        return LASTFM_API_BASE_URL + CustomUrlFetchApp.parseQuery(queryObj);
    }

    function validUser(login) {
        return login && login.length > 0 ? login : KeyValue.LASTFM_LOGIN;
    }

    function formatLastfmTrackKey(item) {
        let artist = item.artist.name ? item.artist.name : item.artist['#text'];
        return `${artist} ${item.name}`.formatName();
    }

    function formatSpotifyTrackKeys(item, mode) {
        return mode == 'every'
            ? item.artists.map(artist => `${artist.name} ${item.name}`.formatName())
            : [`${item.artists[0].name} ${item.name}`.formatName()];
    }

    function formatSpotifyArtistKeys(item, mode) {
        return mode == 'every'
            ? item.artists.map(artist => `${artist.name}`.formatName())
            : [item.artists[0].name.formatName()];
    }

    function formatTrackNameLastfm(item) {
        return `${formatArtistNameLastfm(item)} ${item.name}`.formatName();
    }

    function formatAlbumNameLastfm(item) {
        let name = item.name;
        if (item.hasOwnProperty('album')) {
            name = item.album['#text'];
        }
        return `${name} ${formatArtistNameLastfm(item)}`.formatName();
    }

    function formatArtistNameLastfm(item) {
        let name = item.name;
        if (item.artist) {
            name = item.artist.name || item.artist['#text'];
        } else if (item.artists) {
            name = item.artists[0].name;
        }
        return name.formatName();
    }
})();

const Search = (function () {
    const TEMPLATE = API_BASE_URL + '/search?%s';
    let minDiceRating = KeyValue.hasOwnProperty('MIN_DICE_RATING') ? parseFloat(KeyValue.MIN_DICE_RATING) : 0.6005;
    let noFound = [];

    function setDiceRating(value) {
        minDiceRating = value
    }

    const Translit = (function () {
        const TABLE = {
            'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'e', 'ж': 'zh', 'з': 'z',
            'и': 'i', 'й': 'i', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o', 'п': 'p',
            'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'kh', 'ц': 'ts', 'ч': 'ch',
            'ш': 'sh', 'щ': 'shch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'iu', 'я': 'ia'
        }
        return { transform }

        function transform(inputStr) {
            return inputStr.split('').map(s => TABLE.hasOwnProperty(s) ? TABLE[s] : s).join('');
        }
    })();

    // https://github.com/aceakash/string-similarity
    const DiceCoefficient = (function () {
        return { findBestMatch, compareTwoStrings, }

        function findBestMatch(mainString, targetStrings) {
            const ratings = [];
            let bestMatchIndex = 0;
            for (let i = 0; i < targetStrings.length; i++) {
                const currentTargetString = targetStrings[i];
                const currentRating = compareTwoStrings(mainString, currentTargetString);
                ratings.push({ target: currentTargetString, rating: currentRating });
                if (currentRating > ratings[bestMatchIndex].rating) {
                    bestMatchIndex = i;
                }
            }
            return { ratings: ratings, bestMatch: ratings[bestMatchIndex], bestMatchIndex: bestMatchIndex };
        }

        function compareTwoStrings(first, second) {
            first = first.replace(/\s+/g, '');
            second = second.replace(/\s+/g, '');

            if (first === second) return 1; // identical or empty
            if (first.length < 2 || second.length < 2) return 0; // if either is a 0-letter or 1-letter string

            let firstBigrams = new Map();
            for (let i = 0; i < first.length - 1; i++) {
                const bigram = first.substring(i, i + 2);
                const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) + 1 : 1;
                firstBigrams.set(bigram, count);
            }

            let intersectionSize = 0;
            for (let i = 0; i < second.length - 1; i++) {
                const bigram = second.substring(i, i + 2);
                const count = firstBigrams.has(bigram) ? firstBigrams.get(bigram) : 0;
                if (count > 0) {
                    firstBigrams.set(bigram, count - 1);
                    intersectionSize++;
                }
            }

            return (2.0 * intersectionSize) / (first.length + second.length - 2);
        }
    })();

    return {
        DicesCoefficient: DiceCoefficient, multisearchTracks, multisearchArtists, multisearchAlbums,
        findPlaylists, findAlbums, findTracks, findArtists, getNoFound: () => noFound, setDiceRating
    }

    function multisearchTracks(items, parseNameMethod) {
        return multisearch(items, 'track', parseNameMethod);
    }

    function multisearchArtists(items, parseNameMethod) {
        return multisearch(items, 'artist', parseNameMethod);
    }

    function multisearchAlbums(items, parseNameMethod) {
        return multisearch(items, 'album', parseNameMethod);
    }

    function multisearch(items, type, parseNameMethod) {
        if (!items || items.length == 0) {
            return [];
        }
        let originKeywords = parseNameMethod ? items.map((item) => parseNameMethod(item)) : items;
        let uniqueItems = findUniqueItems(originKeywords);
        return restoreOrigin();

        function findUniqueItems() {
            let uniqueKeywords = Array.from(new Set(originKeywords));
            let searchResult = findBest(uniqueKeywords, type);
            let resultItems = [];
            for (let i = 0; i < uniqueKeywords.length; i++) {
                let item = searchResult[i];
                if (item && item.id) {
                    item.keyword = uniqueKeywords[i];
                    resultItems.push(item);
                } else {
                    noFound.push({ type: type, keyword: uniqueKeywords[i], item: items[originKeywords.findIndex(item => item == uniqueKeywords[i])] });
                    Admin.printInfo('Spotify по типу', type, 'не нашел:', uniqueKeywords[i]);
                }
            }
            return resultItems;
        }

        function restoreOrigin() {
            return originKeywords
                .map((keyword, i) => {
                    let item = uniqueItems.find((item) => item.keyword == keyword);
                    if (item && items[i].hasOwnProperty('date')) {
                        item.played_at = items[i].date['#text'];
                    }
                    if (item && items[i].hasOwnProperty('countPlayed')) {
                        item.countPlayed = items[i].countPlayed;
                    }
                    return item;
                })
                .filter((item) => {
                    if (typeof item != 'undefined') {
                        delete item.keyword;
                        return true;
                    }
                });
        }
    }

    function findBest(keywords, type) {
        let urls = keywords.map((keyword) => {
            let queryObj = { q: keyword.slice(0, 100), type: type, limit: 20 };
            return Utilities.formatString(TEMPLATE, CustomUrlFetchApp.parseQuery(queryObj));
        });
        return SpotifyRequest.getAll(urls).map((response, index) => {
            if (response == undefined || response.items == undefined || response.items.length == 0) {
                return {}
            }
            let targetStrings = response.items.filter(item => {
                return item != undefined
            }).map(item => {
                let str = (type == 'track' ? `${item.artists[0].name} ${item.name}` : item.name).formatName();
                return Translit.transform(str);
            })
            if (targetStrings.length == 0) {
                return {}
            }
            let result = DiceCoefficient.findBestMatch(Translit.transform(keywords[index]), targetStrings);
            return result.bestMatch.rating >= minDiceRating ? response.items[result.bestMatchIndex] : {};
        });
    }

    function findPlaylists(keywords, requestCount) {
        return find(keywords, 'playlist', requestCount);
    }

    function findAlbums(keywords, requestCount) {
        return find(keywords, 'album', requestCount);
    }

    function findTracks(keywords, requestCount) {
        return find(keywords, 'track', requestCount);
    }

    function findArtists(keywords, requestCount) {
        return find(keywords, 'artist', requestCount);
    }

    function find(keywords, type, requestCount = 1) {
        const limit = 50;
        let resultForKeyword = [];
        keywords.forEach((text) => {
            let result = [];
            SpotifyRequest.getAll(createUrls(text)).forEach((response) => {
                Combiner.push(result, response ? response.items : []);
            });
            resultForKeyword.push(result);
        });
        return resultForKeyword;

        function createUrls(keyword) {
            let urls = [];
            for (let i = 0; i < requestCount; i++) {
                let queryObj = { q: keyword.slice(0, 100), type: type, limit: limit, offset: i * limit };
                urls.push(Utilities.formatString(TEMPLATE, CustomUrlFetchApp.parseQuery(queryObj)));
            }
            return urls;
        }
    }
})();

const getCachedTracks = (function () {
    let cachedTracks = { meta: {}, artists: {}, albums: {}, features: {} };
    let uncachedTracks;
    let _tracks, _args;
    return function getCache(tracks, args) {
        cache(tracks, args);
        return cachedTracks;
    };

    function cache(tracks, args) {
        _tracks = tracks;
        _args = args;
        uncachedTracks = { meta: [], artists: [], albums: [], features: [] };
        findIdsOfUncachedObj();
        cacheToFullObj();
    }

    function findIdsOfUncachedObj() {
        _tracks.forEach((sourceItem) => {
            if (_args.features && !cachedTracks.features[sourceItem.id]) {
                uncachedTracks.features.push(sourceItem.id);
            }
            if (_args.meta && !cachedTracks.meta[sourceItem.id] && isSimplified(sourceItem)) {
                uncachedTracks.meta.push(sourceItem.id);
            } else if (_args.meta && !isSimplified(sourceItem)) {
                cachedTracks.meta[sourceItem.id] = sourceItem;
            }

            let targetItem;
            targetItem = sourceItem.artists ? sourceItem.artists[0] : sourceItem;
            if (_args.artist && !cachedTracks.artists[targetItem.id] && isSimplified(targetItem)) {
                uncachedTracks.artists.push(targetItem.id);
            } else if (_args.artist && !isSimplified(targetItem)) {
                cachedTracks.artists[targetItem.id] = targetItem;
            }

            targetItem = sourceItem.album ? sourceItem.album : sourceItem;
            if (_args.album && !cachedTracks.albums[targetItem.id] && isSimplified(targetItem)) {
                uncachedTracks.albums.push(targetItem.id);
            } else if (_args.album && !isSimplified(targetItem)) {
                cachedTracks.albums[targetItem.id] = targetItem;
            }
        });
    }

    function cacheToFullObj() {
        if (uncachedTracks.meta.length > 0) {
            let fullTracks = SpotifyRequest.getFullObjByIds('tracks', uncachedTracks.meta, 50);
            fullTracks.forEach((track, i) => isNull(track, uncachedTracks.meta[i], 'meta') ? false : (cachedTracks.meta[track.id] = track));
        }
        if (uncachedTracks.artists.length > 0) {
            let fullArtists = SpotifyRequest.getFullObjByIds('artists', uncachedTracks.artists, 50);
            fullArtists.forEach((artist, i) => isNull(artist, uncachedTracks.artists[i], 'artist') ? false : (cachedTracks.artists[artist.id] = artist));
        }
        if (uncachedTracks.albums.length > 0) {
            let fullAlbums = SpotifyRequest.getFullObjByIds('albums', uncachedTracks.albums, 20);
            fullAlbums.forEach((album, i) => isNull(album, uncachedTracks.albums[i], 'album') ? false : (cachedTracks.albums[album.id] = album));
        }
        if (uncachedTracks.features.length > 0) {
            // limit = 100, но UrlFetchApp.fetch выдает ошибку о превышении длины URL
            // При limit 85, длина URL для этого запроса 2001 символ
            let features = SpotifyRequest.getFullObjByIds('audio-features', uncachedTracks.features, 85);
            features.forEach((item, i) => {
                if (item == null) {
                    let id = uncachedTracks.features[i];
                    cachedTracks.features[id] = {};
                    Admin.printInfo(`У трека нет features, id: ${id}`);
                } else {
                    item.anger = item.energy * (1 - item.valence);
                    item.happiness = item.energy * item.valence;
                    item.sadness = (1 - item.energy) * (1 - item.valence);
                    cachedTracks.features[item.id] = item;
                }
            });
        }
    }

    // В объектах Track, Album, Artist Simplified нет ключа popularity
    function isSimplified(item) {
        return !item.popularity;
    }

    function isNull(item, sourceId, type) {
        !item && Admin.printInfo(`По типу ${type} нет данных о ${sourceId}`);
        return !item;
    }
})();

const Auth = (function () {
    const SCOPE = [
        'user-read-private', 'user-read-recently-played', 'user-read-currently-playing', 'user-read-playback-position',
        'user-read-playback-state', 'user-modify-playback-state', 'user-library-read', 'user-library-modify',
        'user-top-read', 'user-follow-read', 'user-follow-modify', 'playlist-read-private', 'playlist-modify-private',
        'playlist-modify-public', 'ugc-image-upload',
    ];
    const publicService = createService('spotify', false)
    const privateService = KeyValue.CLIENT_ID == KeyValue.PRIVATE_CLIENT_ID ? publicService : createService('private-spotify', true)
    return {
        reset, hasAccess, getPublicAccessToken, getPrivateAccessToken, displayAuthPage, displayAuthResult,
    };

    function createService(name, isPrivate) {
        let service = OAuth2.createService(name)
            .setAuthorizationBaseUrl('https://accounts.spotify.com/authorize')
            .setTokenUrl('https://accounts.spotify.com/api/token')
            .setCallbackFunction('displayAuthResult_')
            .setRedirectUri('https://chimildic.github.io/spotify/auth')
            .setPropertyStore(UserProperties)
            .setScope(SCOPE)
            .setParam('response_type', 'code')

        if (isPrivate && KeyValue.PRIVATE_CLIENT_SECRET != undefined) {
            if (KeyValue.PRIVATE_CLIENT_SECRET.length > 32) {
                let decoded = Utilities.base64Decode(KeyValue.PRIVATE_CLIENT_SECRET)
                KeyValue.PRIVATE_CLIENT_SECRET = Utilities.newBlob(decoded).getDataAsString()
            }
            service.setClientId(KeyValue.PRIVATE_CLIENT_ID)
                .setClientSecret(KeyValue.PRIVATE_CLIENT_SECRET)
        } else {
            service.setClientId(KeyValue.CLIENT_ID)
                .setClientSecret(KeyValue.CLIENT_SECRET)
        }
        return service
    }

    function displayAuthResult(request) {
        let isAuthorized
        if (request.parameters.serviceName == 'spotify') {
            isAuthorized = publicService.handleCallback(request)
        } else if (request.parameters.serviceName == 'private-spotify') {
            isAuthorized = privateService.handleCallback(request)
        }
        return HtmlService.createHtmlOutput(isAuthorized ? 'Успешно' : 'Отказано в доступе');
    }

    function displayAuthPage() {
        let redirectTemplate = `https://chimildic.github.io/spotify/auth?baseurl=https://accounts.spotify.com/authorize&projectId=${ScriptApp.getScriptId()}&`
        let htmlTemplate = '<p>При первой установке: добавьте нижнюю ссылку в поле Redirect URIs вашего приложения в Spotify Dashboard</p><p>https://chimildic.github.io/spotify/auth</p><p>Для работы всех функций предоставьте доступ каждому приложению:</p><ul><li><a href="%s" target="_blank">Выдать публичные права</a></li><li><a href="%s" target="_blank">Выдать приватные права</a></li>';

        let publicAuthUrl = publicService.getAuthorizationUrl()
        let privateAuthUrl = privateService.getAuthorizationUrl()

        let publicRestParams = publicAuthUrl.split('?')[1]
        let privateRestParams = privateAuthUrl.split('?')[1]

        let html = Utilities.formatString(htmlTemplate, redirectTemplate + publicRestParams, redirectTemplate + privateRestParams)
        return HtmlService.createHtmlOutput(html)
    }

    function getRedirectUri() {
        let scriptId = encodeURIComponent(ScriptApp.getScriptId())
        return `https://script.google.com/macros/d/${scriptId}/usercallback`
    }

    function hasAccess() {
        return publicService.hasAccess() && privateService.hasAccess()
    }

    function getPublicAccessToken() {
        return publicService.getAccessToken()
    }

    function getPrivateAccessToken() {
        return privateService.getAccessToken()
    }

    function reset() {
        publicService.reset()
        privateService.reset()
    }
})();

const SpotifyRequest = (function () {
    const PRIVATE_API = ['37i9d', new RegExp('\/users\/.*\/playlists'), 'me/playlists', '/recommendations', '/related-artists', '/audio-features', '/browse']
    return {
        get, getAll, getItemsByPath, getItemsByNext, getFullObjByIds, post, put, putImage, putItems, deleteItems, deleteRequest,
    };

    function getItemsByPath(urlPath, limitRequestCount) {
        let url = `${API_BASE_URL}/${urlPath}`;
        let response = get(url);
        if (response.items.length < response.total) {
            let method = response.cursors ? getItemsByCursor : getItemsByNext;
            return method(response, limitRequestCount - 1);
        }
        return response.items.filter(item => item != undefined);
    }

    function getItemsByCursor(response, limitRequestCount = 220) {
        let items = response.items;
        let count = 1;
        while (response.next != null && count != limitRequestCount) {
            response = get(response.next);
            Combiner.push(items, response.items);
            count++;
        }
        return items.filter(item => item != undefined);
    }

    function getItemsByNext(response, limitRequestCount = 220) {
        let itemsLength = response.items ? response.items.length : 0;
        let count = Math.ceil((response.total - itemsLength) / response.limit);
        if (count > limitRequestCount) {
            count = limitRequestCount;
        }

        let [baseurl, query] = (response.next || response.href).split('?');
        query = urlStringToObj(query);
        query.limit = query.limit || 50;
        query.offset = itemsLength || 0;

        let urls = [];
        for (let i = 0; i < count; i++) {
            urls.push(`${baseurl}?${CustomUrlFetchApp.parseQuery(query)}`);
            query.offset = parseInt(query.offset) + parseInt(query.limit);
        }

        let items = response.items;
        getAll(urls).forEach((responseItem) => {
            responseItem = extractContent(responseItem);
            if (responseItem && responseItem.items) {
                Combiner.push(items, responseItem.items);
            }
        });
        return items.filter(item => item != undefined);
    }

    function urlStringToObj(str) {
        try {
            str = '{"' + decodeURI(str).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}';
            return JSON.parseFromString(str);
        } catch (error) {
            Admin.printError(`Не удалось преобразовать строку в объект JavaScript\nСтрока: ${str}\n`, error.stack);
            return {};
        }
    }

    function getFullObjByIds(objType, ids, limit, market) {
        market = market ? `&market=${market}` : '';
        let requestCount = Math.ceil(ids.length / limit);
        let offset = limit;
        let urls = [];
        for (let i = 0; i < requestCount; i++) {
            let strIds = ids.slice(i * limit, offset).join(',');
            urls.push(`${API_BASE_URL}/${objType}/?ids=${strIds}${market}`);
            offset += limit;
        }
        return getAll(urls).reduce((fullObj, response) => {
            response && Combiner.push(fullObj, response);
            return fullObj;
        }, []);
    }

    function get(url) {
        return extractContent(fetch(appendLocale(url)));
    }

    function getAll(urls, allowLocale = true) {
        let requests = [];
        urls.forEach((url) => {
            requests.push({
                url: allowLocale ? appendLocale(url) : url,
                headers: getHeaders(url, 'get'),
                method: 'get',
            });
        });
        return CustomUrlFetchApp.fetchAll(requests).map((response) => extractContent(response));
    }

    function appendLocale(url) {
        if (!url.includes('locale')) {
            url += `${url.includes('?') ? '&' : '?'}locale=${KeyValue.LOCALE || "RU"}`;
        }
        return url;
    }

    function extractContent(response) {
        if (!response) return;
        let keys = Object.keys(response);
        if (keys.length == 1 && !response.items) {
            response = response[keys[0]];
        }
        return response;
    }

    function post(url, payload) {
        return fetch(url, {
            method: 'post',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
        });
    }

    function deleteRequest(url, payload) {
        return fetch(url, {
            method: 'delete',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
        });
    }

    function put(url, payload) {
        return fetch(url, {
            method: 'put',
            contentType: 'application/json',
            payload: JSON.stringify(payload),
        });
    }

    function putImage(url, img) {
        return fetch(url, {
            method: 'put',
            contentType: 'image/jpeg',
            payload: img,
        });
    }

    function putItems(params) {
        pushRequestsWithItems(put, params);
    }

    function deleteItems(params) {
        pushRequestsWithItems(deleteRequest, params);
    }

    function pushRequestsWithItems(method, params) {
        let count = Math.ceil(params.items.length / params.limit);
        for (let i = 0; i < count; i++) {
            let payload = params.items.splice(0, params.limit)
            payload = { [params.key]: payload }
            method(params.url, payload);
        }
    }

    function fetch(url, params = {}) {
        params.headers = getHeaders(url, params.method);
        return CustomUrlFetchApp.fetch(url, params);
    }

    function getHeaders(url, method = 'get') {
        let isPrivate = method == 'get' && isBelongPrivateAPI(url)
        return {
            Authorization: `Bearer ${isPrivate ? Auth.getPrivateAccessToken() : Auth.getPublicAccessToken()}`,
        }
    }

    function isBelongPrivateAPI(url) {
        return PRIVATE_API.some(path => {
            if (path instanceof RegExp) {
                return path.test(url)
            }
            return url.includes(path)
        })
    }
})();

const User = (function () {
    !KeyValue['userId'] && setProfile();
    return {
        get id() { return KeyValue['userId'] },
        get country() { return getUser().country },
    };

    function setProfile() {
        let user = getUser();
        if (user) {
            KeyValue['userId'] = user.id;
            UserProperties.setProperty('userId', KeyValue['userId']);
        }
    }

    function getUser() {
        try {
            return SpotifyRequest.get(API_BASE_URL + '/me');
        } catch (error) {
            return undefined;
        }
    }
})();

const Cache = (function () {
    const ROOT_FOLDER = getFolder(DriveApp, 'Goofy Data', true);
    const USER_FOLDER = User.id ? getFolder(ROOT_FOLDER, User.id, true) : ROOT_FOLDER;
    const Storage = (function () {
        let storage = {};
        return {
            getFile: (filepath) => get(filepath, 'file'),
            setFile: (filepath, file) => set(filepath, 'file', file),
            getContent: (filepath) => get(filepath, 'content'),
            setContent: (filepath, content) => set(filepath, 'content', content),
        }

        function get(rootKey, valueKey) {
            return storage[rootKey] && storage[rootKey][valueKey]
                ? storage[rootKey][valueKey]
                : undefined;
        }

        function set(rootKey, valueKey, value) {
            storage[rootKey] = storage[rootKey] || {};
            storage[rootKey][valueKey] = value;
        }
    })();

    if (ROOT_FOLDER.getId() != USER_FOLDER.getId()) {
        let rootFiles = ROOT_FOLDER.getFiles();
        while (rootFiles.hasNext()) {
            rootFiles.next().moveTo(USER_FOLDER);
        }
    }
    return {
        get RootFolder() { return ROOT_FOLDER; },
        get UserFolder() { return USER_FOLDER; },
        read, write, append, copy, remove, rename, compressTracks, compressArtists,
    };

    function read(filepath) {
        let content = Storage.getContent(filepath);
        if (!content) {
            content = getContentFromFile();
            Storage.setContent(filepath, content);
        }
        return Selector.sliceCopy(content);

        function getContentFromFile(attempt = 0) {
            if (attempt == 3)
                throw new Error(`Неизвестная ошибка при чтении файла ${filepath}`);
            let file = findFile(filepath);
            let ext = obtainFileExtension(filepath);
            if (!file) {
                return ext == 'json' ? [] : '';
            }
            let str = tryGetBlobAsString(file);
            if (str.length == 0) {
                Admin.printInfo('Пустая строка из blob-объекта');
                Admin.pause(2);
                return getContentFromFile(++attempt)
            }
            return ext == 'json' ? JSON.parseFromString(str) : str;
        }
    }

    function append(filepath, content, place = 'end', limit = 200000) {
        if (!content || content.length == 0) return;
        let currentContent = read(filepath);
        let ext = obtainFileExtension(filepath);
        return ext == 'json' ? appendJSON() : appendString();

        function appendJSON() {
            return place == 'begin'
                ? appendNewData(content, currentContent)
                : appendNewData(currentContent, content);

            function appendNewData(xData, yData) {
                let allData = [];
                Combiner.push(allData, xData, yData);
                Selector.keepFirst(allData, limit);
                write(filepath, allData);
                return allData.length;
            }
        }

        function appendString() {
            let raw = place == 'begin' ? (content + currentContent) : (currentContent + content);
            write(filepath, raw);
            return raw.length;
        }
    }

    function write(filepath, content) {
        let file = findFile(filepath) || createFile(filepath);
        let ext = obtainFileExtension(filepath);
        let raw = ext == 'json' ? JSON.stringify(content) : content;
        trySetContent();

        function trySetContent() {
            try {
                file.setContent(raw);
                Storage.setContent(filepath, content);
                if (raw.length > 0 && file.getSize() == 0) {
                    trySetContent();
                }
            } catch (error) {
                Admin.printError(`При записи в файл произошла ошибка\n`, error.stack);
                Admin.pause(5);
                trySetContent();
            }
        }
    }

    function copy(filepath) {
        let file = findFile(filepath);
        if (file) {
            let path = filepath.split('/');
            let filename = formatFileExtension('Copy ' + path.splice(-1, 1)[0]);
            path.push(filename);
            file.makeCopy().setName(filename);
            return path.join('/');
        }
    }

    function remove(filepath) {
        let file = findFile(filepath);
        if (file) {
            file.setTrashed(true);
        }
    }

    function rename(oldFilepath, newFilename) {
        let file = findFile(oldFilepath);
        if (file) {
            file.setName(formatFileExtension(newFilename));
        }
    }

    function compressTracks(tracks) {
        if (!(tracks && tracks.length > 0 && (tracks[0].album || tracks[0].track))) {
            return;
        }

        tracks.forEach((item) => {
            if (typeof item.track === 'object') {
                delete item.context;
                item = item.track;
            }

            delete item.uri;
            delete item.type;
            delete item.track_number;
            delete item.is_local;
            delete item.preview_url;
            delete item.href;
            delete item.external_urls;
            delete item.external_ids;
            delete item.disc_number;
            delete item.available_markets;
            delete item.track;
            delete item.playedAt;
            delete item.addedAt;
            delete item.dateAt;
            delete item.executorClassType;

            compressAlbum(item.album);
            compressArtists(item.artists);
        });
    }

    function compressAlbum(item) {
        if (!item) {
            return;
        }

        delete item.available_markets;
        delete item.external_urls;
        delete item.href;
        delete item.images;
        delete item.type;
        delete item.uri;
        compressArtists(item.artists);
    }

    function compressArtists(items) {
        if (!items || items.length == 0) {
            return;
        }

        items.forEach((item) => {
            delete item.href;
            delete item.type;
            delete item.uri;
            delete item.external_urls;
            delete item.images;

            if (item.followers && item.followers.total) {
                item.followers = item.followers.total;
            }
        });
    }

    function findFile(filepath) {
        let file = Storage.getFile(filepath);
        if (!file) {
            let [folder, filename] = parsePath(filepath, false);
            if (folder) {
                let iterator = folder.getFilesByName(filename)
                file = iterator.hasNext() ? iterator.next() : undefined;
            }
            Storage.setFile(filepath, file);
        }
        return file;
    }

    function createFile(filepath) {
        let [folder, filename] = parsePath(filepath, true);
        let file = folder.createFile(filename, '');
        Storage.setFile(filepath, file);
        return file;
    }

    function parsePath(filepath, isCreateFolder) {
        let path = filepath.split('/');
        let filename = path.splice(-1, 1)[0];
        let rootFolder = USER_FOLDER;
        if (path.length > 0) {
            if (['user', '.'].includes(path[0])) {
                path.splice(0, 1);
            } else if (['root', '..'].includes(path[0])) {
                rootFolder = ROOT_FOLDER;
                path.splice(0, 1);
            }
        }
        return [path.reduce((root, name) => getFolder(root, name, isCreateFolder), rootFolder),
        formatFileExtension(filename)];
    }

    function getFolder(root, name, isCreateFolder) {
        if (!root) return;
        let iterator = root.getFoldersByName(name);
        if (iterator.hasNext()) {
            return iterator.next()
        } else if (isCreateFolder) {
            return root.createFolder(name);
        }
    }

    function formatFileExtension(filename) {
        if (!filename.includes('.')) {
            filename += `.${obtainFileExtension(filename)}`;
        }
        return filename;
    }

    function obtainFileExtension(filename) {
        let ext = filename.split('.');
        return ext.length == 2 ? ext[1] : 'json';
    }

    function tryGetBlobAsString(file) {
        try {
            return file.getBlob().getDataAsString();
        } catch (error) {
            Admin.printError('При получении данных из файла произошла ошибка\n', error.stack);
            Admin.pause(5);
            return tryGetBlobAsString(file);
        }
    }
})();

const Trigger = (function () {
    return { remove, create, get }

    function get(name) {
        let triggers = ScriptApp.getProjectTriggers();
        for (let i = 0; i < triggers.length; i++) {
            if (name === triggers[i].getHandlerFunction()) {
                return triggers[i];
            }
        }
    }

    function remove(trigger) {
        trigger && ScriptApp.deleteTrigger(trigger);
    }

    function create(name, minutes) {
        ScriptApp.newTrigger(name).timeBased().everyMinutes(minutes).create();
    }
})()

const Clerk = (function () {
    let tasks;
    let functionName = 'runTasks_';
    let taskTrigger = Trigger.get(functionName);
    if (taskTrigger && taskTrigger.isDisabled()) {
        Trigger.remove(taskTrigger);
        taskTrigger = undefined;
    }
    if (!taskTrigger) {
        Trigger.create(functionName, 15);
    }
    return {
        runOnceAfter, runOnceAWeek,
    }

    function runOnceAfter(timeStr, callback) {
        if (isTimeToRun(callback.name, timeStr, 1)) {
            return run(callback)
        }
    }

    function runOnceAWeek(dayStr, timeStr, callback) {
        if (Selector.isDayOfWeek(dayStr) && isTimeToRun(callback.name, timeStr, 7)) {
            return run(callback)
        }
    }

    function run(callback) {
        callback()
        updateLastRunDate(callback.name, new Date())
        return true
    }

    function isTimeToRun(name, timeStr, targetDiffDays) {
        let now = new Date();
        let [hours, minutes] = timeStr.split(':').map(value => parseInt(value));
        let comparable = readDate(name);
        if (comparable == undefined) {
            return now.getHours() > hours || (now.getHours() == hours && now.getMinutes() >= minutes);
        }
        comparable.setHours(hours, minutes);
        let diffDays = Math.abs(now - comparable) / (1000 * 60 * 60 * 24);
        return diffDays >= targetDiffDays;
    }

    function readDate(name) {
        let dateStr = getTasks()[name];
        return dateStr ? new Date(dateStr) : undefined;
    }

    function updateLastRunDate(name, date) {
        let tasks = getTasks();
        tasks[name] = date.toISOString();
        UserProperties.setProperty('ClerkTasks', JSON.stringify(tasks));
    }

    function getTasks() {
        if (!tasks) {
            tasks = KeyValue.ClerkTasks ? JSON.parse(KeyValue.ClerkTasks) : {};
        }
        return tasks;
    }
})();

const Admin = (function () {
    let isInfoLvl, isErrorLvl;
    setLogLevelOnce(KeyValue.LOG_LEVEL);
    if (VERSION != KeyValue.VERSION) {
        if (KeyValue.REQUESTS_IN_ROW == 40) {
            UserProperties.setProperty('REQUESTS_IN_ROW', '20')
        }
        UserProperties.setProperty('VERSION', VERSION);
        sendVersion(VERSION);
        ['updateSavedTracks', 'updateSavedTracks_'].forEach(name => Trigger.remove(Trigger.get(name)));
    }
    return {
        reset, setLogLevelOnce, printInfo, printError, pause,
    };

    function setLogLevelOnce(level = 'info') {
        if (level == 'info') {
            isInfoLvl = isErrorLvl = true;
        } else if (level == 'error') {
            isInfoLvl = false;
            isErrorLvl = true;
        } else {
            isInfoLvl = isErrorLvl = false;
        }
    }

    function printInfo(...data) {
        isInfoLvl && console.info(...data);
    }

    function printError(...data) {
        isErrorLvl && console.error(...data, `\n\nОписание и решение ошибок: https://chimildic.github.io/goofy/#/errors\nТелеграм: https://t.me/forum_goofy`);
    }

    function pause(seconds) {
        isInfoLvl && console.info(`Операция продолжится после паузы ${seconds}с.`);
        Utilities.sleep(seconds * 1000);
    }

    function sendVersion(value) {
        let id = '1FAIpQLSeSe9Jgw5Ml1XxTlz1HHnyHGoFcA65CabbAAJcvk5elXL2gZw';
        CustomUrlFetchApp.fetch(`https://docs.google.com/forms/u/0/d/e/${id}/formResponse`, {
            method: 'post',
            payload: {
                'entry.1598003363': value,
                'entry.1594601658': ScriptApp.getScriptId(),
                'entry.1666409024': User.id || 'install',
            },
        });
    }

    function reset() {
        Auth.reset();
        UserProperties.deleteAllProperties();
    }
})();
