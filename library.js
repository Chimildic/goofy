// Документация: https://chimildic.github.io/goofy/
const VERSION = '1.4.8';
const UserProperties = PropertiesService.getUserProperties();
const KeyValue = UserProperties.getProperties();
const API_BASE_URL = 'https://api.spotify.com/v1';
const DEFAULT_DATE = new Date('2000-01-01');

function doGet() {
    return Auth.hasAccess() ? HtmlService.createHtmlOutput('Успешно') : Auth.displayAuthPage();
}

function displayAuthResult_(request) {
    return Auth.displayAuthResult(request);
}

function updateRecentTracks_() {
    RecentTracks.update();
}

const CustomUrlFetchApp = (function () {
    let countRequest = 0;
    return {
        fetch: fetch,
        fetchAll: fetchAll,
        parseQuery: parseQuery,
        getCountRequest: () => countRequest,
    };

    function fetch(url, params = {}) {
        countRequest++;
        params.muteHttpExceptions = true;
        let response = UrlFetchApp.fetch(url, params);
        return readResponse(response, url, params);
    }

    function fetchAll(requests) {
        countRequest += requests.length;
        requests.forEach((request) => (request.muteHttpExceptions = true));
        let responseArray = [];
        let limit = KeyValue.REQUESTS_IN_ROW || 40;
        let count = Math.ceil(requests.length / limit);
        for (let i = 0; i < count; i++) {
            let requestPack = requests.splice(0, limit);
            let responseRaw = sendPack(requestPack);
            let responses = responseRaw.map((response, index) => {
                return readResponse(response, requestPack[index].url, {
                    headers: requestPack[index].headers,
                    payload: requestPack[index].payload,
                    muteHttpExceptions: requestPack[index].muteHttpExceptions,
                });
            });
            Combiner.push(responseArray, responses);
        }
        return responseArray;

        function sendPack(requests) {
            let raw = tryFetchAll(requests);
            if (typeof raw == 'undefined') {
                return [];
            }
            let result = [];
            let failed = [];
            let seconds = 0;
            raw.forEach((response, index) => {
                if (response.getResponseCode() == 429) {
                    seconds = 1 + (response.getHeaders()['Retry-After'] || 2);
                    failed.push(requests[index]);
                } else {
                    result.push(response);
                }
            });
            if (seconds > 0) {
                console.info('Пауза в отправке запросов', seconds);
                Utilities.sleep(seconds * 1000);
                Combiner.push(result, sendPack(failed));
            }
            return result;
        }

        function tryFetchAll(requests, attempt = 0) {
            try {
                return UrlFetchApp.fetchAll(requests);
            } catch (e) {
                console.error(e.stack);
                if (attempt++ < 2) {
                    console.error(`Повторная отправка через 10 секунд. Попытка ${attempt}`);
                    Utilities.sleep(10000);
                    return tryFetchAll(requests, attempt);
                }
            }
        }
    }

    function readResponse(response, url, params = {}) {
        if (isSuccess(response.getResponseCode())) {
            return onSuccess();
        }
        return onError();

        function onRetryAfter() {
            let value = 1 + (response.getHeaders()['Retry-After'] || 2);
            console.info('Пауза в отправке запросов', value);
            Utilities.sleep(value * 1000);
            return fetch(url, params);
        }

        function tryFetchOnce() {
            Utilities.sleep(3500);
            countRequest++;
            response = UrlFetchApp.fetch(url, params);
            if (isSuccess(response.getResponseCode())) {
                return onSuccess();
            }
            writeErrorLog();
        }

        function onSuccess() {
            let type = response.getHeaders()['Content-Type'] || '';
            if (type.includes('json')) {
                return parseJSON(response);
            }
            return response;
        }

        function onError() {
            writeErrorLog();
            let responseCode = response.getResponseCode();
            if (responseCode == 429) {
                return onRetryAfter();
            } else if (responseCode >= 500) {
                return tryFetchOnce();
            }
        }

        function isSuccess(code) {
            return code >= 200 && code < 300;
        }

        function writeErrorLog() {
            console.error('URL:', url, '\nCode:', response.getResponseCode(), '\nContent:', response.getContentText());
        }
    }

    function parseJSON(response) {
        let content = response.getContentText();
        return content.length > 0 ? tryParseJSON(content) : { msg: 'Пустое тело ответа', status: response.getResponseCode() };
    }

    function tryParseJSON(content) {
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Не удалось перевести строку JSON в объект. ', e, e.stack, content);
            return [];
        }
    }

    function parseQuery(obj) {
        return Object.keys(obj)
            .map((k) => `${encodeURIComponent(k)}=${encodeURIComponent(obj[k])}`)
            .join('&');
    }
})();

const Source = (function () {
    return {
        getTracks: getTracks,
        getTracksRandom: getTracksRandom,
        getPlaylistTracks: getPlaylistTracks,
        getTopTracks: getTopTracks,
        getTopArtists: getTopArtists,
        getFollowedTracks: getFollowedTracks,
        getSavedTracks: getSavedTracks,
        getSavedAlbumTracks: getSavedAlbumTracks,
        getRecomTracks: getRecomTracks,
        getArtists: getArtists,
        getArtistsAlbums: getArtistsAlbums,
        getArtistsTracks: getArtistsTracks,
        getAlbumTracks: getAlbumTracks,
        getAlbumsTracks: getAlbumsTracks,
        getArtistsTopTracks: getArtistsTopTracks,
        getRelatedArtists: getRelatedArtists,
        getCategoryTracks: getCategoryTracks,
        getListCategory: getListCategory,
        mineTracks: mineTracks,
        craftTracks: craftTracks,
        extractTracks: extractTracks,
        createUrlForRecomTracks: createUrlForRecomTracks,
    };

    function getTopTracks(timeRange) {
        return getTop(timeRange, 'tracks');
    }

    function getTopArtists(timeRange) {
        return getTop(timeRange, 'artists');
    }

    function getTop(timeRange, type) {
        timeRange = isValidTimeRange(timeRange) ? timeRange : 'medium';
        // Баг Spotify: https://community.spotify.com/t5/Spotify-for-Developers/Bug-with-offset-for-method-quot-Get-User-s-Top-Artists-and/td-p/5032362
        let template = API_BASE_URL + '/me/top/%s?offset=%s&limit=%s&&time_range=%s_term';
        return SpotifyRequest.getAll([
            Utilities.formatString(template, type, 0, 49, timeRange),
            Utilities.formatString(template, type, 49, 49, timeRange),
        ]).reduce((items, response) => {
            return Combiner.push(items, response.items);
        }, []);
    }

    function isValidTimeRange(timeRange) {
        return ['short', 'medium', 'long'].includes(timeRange);
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

    function getFollowedTracks(params = {}) {
        let items = getFollowedItems(params.type, params.userId, params.exclude);
        return getTracks(Selector.sliceRandom(items, params.limit));
    }

    function getArtistsTracks(params) {
        let artists = getArtists(params.artist);
        params.album = params.album || {};
        return getArtistsAlbums(artists, params.album).reduce((tracks, album) => {
            return Combiner.push(tracks, getAlbumTracks(album, params.album.track_limit));
        }, []);
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

    function getArtistsAlbums(artists, paramsAlbum = {}) {
        let groups = paramsAlbum.groups || 'album,single';
        let albums = artists
            .reduce((albums, artist) => {
                let path = `artists/${artist.id}/albums?include_groups=${groups}&limit=50&market=from_token`;
                return Combiner.push(albums, SpotifyRequest.getItemsByPath(path));
            }, [])
            .filter((album) => RangeTracks.isBelongReleaseDate(album.release_date, paramsAlbum.release_date));
        return Selector.sliceRandom(albums, paramsAlbum.album_limit);
    }

    function getAlbumsTracks(albums) {
        return albums.reduce((tracks, album) => {
            return Combiner.push(tracks, getAlbumTracks(album));
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
        let items = getSavedAlbumItems();
        Selector.keepRandom(items, limit);
        return extractAlbumTracks(items);
    }

    function extractAlbumTracks(albums) {
        return albums.reduce((tracks, album) => Combiner.push(tracks, album.tracks.items), []);
    }

    function getSavedAlbumItems() {
        return SpotifyRequest.getItemsByPath('me/albums?limit=50', 400).map((item) => {
            let album = item.album;
            album.added_at = item.added_at;
            return album;
        });
    }

    function getFollowedItems(type = 'followed', userId = User.getId(), excludePlaylist = []) {
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
            let urls = [];
            array.forEach((playlist) => {
                urls.push(`https://api.spotify.com/v1/playlists/${playlist.id}`);
            });
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

    function getSavedTracks() {
        let items = SpotifyRequest.getItemsByPath('me/tracks?limit=50', 400);
        return extractTracks(items);
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

const RecentTracks = (function () {
    const ON_SPOTIFY_RECENT_TRACKS = 'true' === KeyValue.ON_SPOTIFY_RECENT_TRACKS;
    const ON_LASTFM_RECENT_TRACKS = 'true' === KeyValue.ON_LASTFM_RECENT_TRACKS;
    const SPOTIFY_FILENAME = 'SpotifyRecentTracks.json';
    const LASTFM_FILENAME = 'LastfmRecentTracks.json';
    const BOTH_SOURCE_FILENAME = 'BothRecentTracks.json';
    const TRIGGER_FUCTION_NAME = 'updateRecentTracks_';
    const MINUTES = 15;
    const ITEMS_LIMIT = parseInt(KeyValue.COUNT_RECENT_TRACKS) || 20000;

    if (getTrigger('updateRecentTracks')) {
        // Удаляет триггер предыдущих версий библиотеки
        deleteTrigger('updateRecentTracks');
    }

    if (!ON_SPOTIFY_RECENT_TRACKS && !ON_LASTFM_RECENT_TRACKS) {
        deleteTrigger(TRIGGER_FUCTION_NAME);
    } else if (!getTrigger(TRIGGER_FUCTION_NAME)) {
        createTrigger(TRIGGER_FUCTION_NAME);
    }

    return {
        getPlayingTrack: getPlayingTrack,
        get: getRecentTracks,
        update: update,
        compress: compress,
        appendTracks: appendTracks,
    };

    function deleteTrigger(name) {
        let trigger = getTrigger(name);
        if (trigger) {
            ScriptApp.deleteTrigger(trigger);
        }
    }

    function createTrigger(name) {
        ScriptApp.newTrigger(name).timeBased().everyMinutes(MINUTES).create();
    }

    function getTrigger(name) {
        let triggers = ScriptApp.getProjectTriggers();
        for (let i = 0; i < triggers.length; i++) {
            if (name === triggers[i].getHandlerFunction()) {
                return triggers[i];
            }
        }
    }

    function getPlayingTrack() {
        let url = `${API_BASE_URL}/me/player/currently-playing`;
        return SpotifyRequest.get(url).item || {};
    }

    function getRecentTracks(limit) {
        let tracks = [];
        if (ON_SPOTIFY_RECENT_TRACKS && ON_LASTFM_RECENT_TRACKS) {
            tracks = readValidArray(BOTH_SOURCE_FILENAME);
        } else if (ON_SPOTIFY_RECENT_TRACKS) {
            tracks = readValidArray(SPOTIFY_FILENAME);
        } else if (ON_LASTFM_RECENT_TRACKS) {
            tracks = readValidArray(LASTFM_FILENAME);
        }
        return Selector.sliceFirst(tracks, limit);
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
        let fileItems = readValidArray(filename);
        let newItems = findNewPlayedMethod(recentTracks, fileItems);
        return appendNewPlayed(newItems, filename);
    }

    function updateBothSourceRecentTracks() {
        let spotifyTracks = readValidArray(SPOTIFY_FILENAME);
        let lastfmTracks = readValidArray(LASTFM_FILENAME);
        Combiner.push(spotifyTracks, lastfmTracks);
        Order.sort(spotifyTracks, 'meta.played_at', 'desc');
        Filter.dedupTracks(spotifyTracks);
        Cache.write(BOTH_SOURCE_FILENAME, spotifyTracks);
    }

    function appendNewPlayed(newItems, filename) {
        if (newItems.length == 0) {
            console.info('Нет новых треков для файла', filename);
            return false;
        }
        Cache.compressTracks(newItems);
        console.info('Новых треков:', newItems.length, 'в файле', filename);
        Cache.append(filename, newItems, 'begin', ITEMS_LIMIT);
        console.info('Общее количество:', newItems.length);
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
        return recentItems;
    }

    function appendTracks(filename, tracks) {
        Cache.compressTracks(tracks);
        tracks.forEach((t) => {
            if (t.hasOwnProperty('added_at')) {
                t.played_at = t.added_at;
                delete t.added_at;
            } else if (!t.hasOwnProperty('played_at')) {
                t.played_at = DEFAULT_DATE;
            }
        });
        let fileItems = readValidArray(filename);
        Combiner.push(fileItems, tracks);
        Order.sort(fileItems, 'meta.played_at', 'desc');
        Cache.write(filename, fileItems);
    }

    function readValidArray(filename) {
        let items = Cache.read(filename) || [];
        if (items.length > 0 && items[0].hasOwnProperty('track')) {
            return updateToValidArray(items, filename);
        }
        return items;
    }

    function updateToValidArray(data, filename) {
        let items = Source.extractTracks(data);
        Cache.write(filename, items);
        return items;
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
        let tracks = readValidArray(filename);
        Cache.compressTracks(tracks);
        Cache.write(filename, tracks);
    }
})();

const Combiner = (function () {
    return {
        alternate: alternate,
        mixinMulti: mixinMulti,
        mixin: mixin,
        replace: replace,
        push: push,
    };

    function replace(oldArray, newArray) {
        oldArray.length = 0;
        push(oldArray, newArray);
    }

    function push(sourceArray, ...additionalArray) {
        additionalArray.forEach((array) => {
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
    const BAN_KEYS = [
        'genres',
        'release_date',
        'followed_include',
        'include',
        'exclude',
        'groups',
        'artist_limit',
        'album_limit',
        'track_limit',
    ];

    let _cachedTracks;
    let _lastOutRange;
    let _args;

    return {
        rangeTracks: rangeTracks,
        getLastOutRange: getLastOutRange,
        isBelong: isBelong,
        isBelongGenres: isBelongGenres,
        isBelongBanGenres: isBelongBanGenres,
        isBelongReleaseDate: isBelongReleaseDate,
    };

    function getLastOutRange() {
        return _lastOutRange ? _lastOutRange.slice() : [];
    }

    function rangeTracks(tracks, args) {
        _args = args;
        _lastOutRange = [];
        _cachedTracks = getCachedTracks(tracks, args);

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
        if (!_args.meta) {
            return true;
        }

        let trackMeta = _cachedTracks.meta[track.id] ? _cachedTracks.meta[track.id] : track;
        return _args.meta ? isBelong(trackMeta, _args.meta) : true;
    }

    function isBelongFeatures(track) {
        if (!_args.features) {
            return true;
        }

        let trackFeatures = _cachedTracks.features[track.id];
        return isBelong(trackFeatures, _args.features);
    }

    function isBelongArtist(track) {
        if (!_args.artist) {
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
            isBelong(trackArtist, _args.artist) &&
            isBelongGenres(trackArtist.genres, _args.artist.genres) &&
            !isBelongBanGenres(trackArtist.genres, _args.artist.ban_genres)
        );
    }

    function isBelongAlbum(track) {
        if (!_args.album) {
            return true;
        }

        let trackAlbum;
        if (_cachedTracks.albums[track.album.id]) {
            trackAlbum = _cachedTracks.albums[track.album.id];
        } else {
            trackAlbum = track.album;
        }

        return (
            isBelong(trackAlbum, _args.albums) &&
            isBelongGenres(trackAlbum.genres, _args.album.genres) &&
            !isBelongBanGenres(trackAlbum.genres, _args.album.ban_genres) &&
            isBelongReleaseDate(trackAlbum.release_date, _args.album.release_date)
        );
    }

    function isBelongReleaseDate(albumReleaseDate, targetPeriod) {
        if (!targetPeriod) {
            return true;
        }

        let releaseDateTime = new Date(albumReleaseDate).getTime();
        let startDate, endDate;
        if (targetPeriod.sinceDays) {
            startDate = Filter.getDateRel(targetPeriod.sinceDays, 'startDay');
            endDate = Filter.getDateRel(targetPeriod.beforeDays, 'endDay');
        } else if (targetPeriod.startDate) {
            startDate = targetPeriod.startDate;
            endDate = targetPeriod.endDate;
        }
        if (releaseDateTime < startDate.getTime() || releaseDateTime > endDate.getTime()) {
            return false;
        }
        return true;
    }

    function isBelongGenres(objGeners, selectedGenres) {
        if (!selectedGenres || selectedGenres.length == 0) {
            return true;
        }
        return isSomeIncludes(objGeners, selectedGenres);
    }

    function isBelongBanGenres(objGeners, banGenres) {
        if (!banGenres || banGenres.length == 0) {
            return false;
        }
        return isSomeIncludes(objGeners, banGenres);
    }

    function isSomeIncludes(targetArray, valueArray) {
        return valueArray.some((str) => {
            return targetArray.some((item) => item.includes(str));
        });
    }

    function isBelong(obj, args) {
        if (!obj) {
            return false;
        }
        for (let key in args) {
            if ((typeof obj[key] === 'boolean' && !obj[key]) || BAN_KEYS.includes(key)) {
                continue;
            }

            if (typeof args[key] == 'object' && (obj[key] < args[key].min || obj[key] > args[key].max)) {
                return false;
            } else if (typeof args[key] != 'object' && args[key] != obj[key]) {
                return false;
            }
        }
        return true;
    }
})();

const Filter = (function () {
    function removeUnavailable(tracks, market = 'RU') {
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
                if (t.hasOwnProperty('is_playable') && t.is_playable) {
                    let id = t.linked_from ? t.linked_from.id : t.id;
                    availableState.push(id);
                } else {
                    unavailableState.push(t.id);
                    console.log('Трек нельзя послушать:', t.id, '-', getTrackKey(t));
                }
            });
        }

        function removeUnavailableTracks() {
            if (availableState.length == tracks.length) return;
            let availableTracks = tracks.filter((t) => !unavailableState.includes(t.id));
            Combiner.replace(tracks, availableTracks);
        }
    }

    function removeTracks(sourceArray, removedArray, invert = false) {
        let removedIds = removedArray.map((item) => item.id);
        let removedNames = removedArray.map((item) => getTrackKey(item));
        let filteredTracks = sourceArray.filter((item) => {
            return invert ^ (!removedIds.includes(item.id) && !removedNames.includes(getTrackKey(item)));
        });
        Combiner.replace(sourceArray, filteredTracks);
    }

    function removeArtists(sourceArray, removedArray, invert = false) {
        let removedIds = removedArray.map((item) => getArtistId(item));
        let filteredTracks = sourceArray.filter((item) => {
            return invert ^ !removedIds.includes(getArtistId(item));
        });
        Combiner.replace(sourceArray, filteredTracks);
    }

    function getTrackKey(track) {
        return `${track.name} ${track.artists[0].name}`.formatName();
    }

    function getArtistId(item) {
        return item.artists ? item.artists[0].id : item.id;
    }

    function replaceWithSimilar(originTracks, ...replacementArrayTracks) {
        let replacementTracks = Combiner.push([], ...replacementArrayTracks);
        let copyTracks = Selector.sliceCopy(originTracks);
        Filter.removeTracks(copyTracks, replacementTracks, true);
        let features = getCachedTracks(copyTracks, { features: {} }).features;

        let urls = [];
        copyTracks.forEach((t) => {
            if (!features[t.id] || !features[t.id].danceability) {
                console.log(`У трека ${t.artists[0].name} ${t.name} нет features`);
                return;
            }
            urls.push(
                Source.createUrlForRecomTracks({
                    seed_tracks: t.id,
                    seed_artists: t.artists[0].id,
                    target_acousticness: features[t.id].acousticness,
                    target_danceability: features[t.id].danceability,
                    target_energy: features[t.id].energy,
                    target_instrumentalness: features[t.id].instrumentalness,
                    target_liveness: features[t.id].liveness,
                    target_loudness: features[t.id].loudness,
                    target_speechiness: features[t.id].speechiness,
                    target_valence: features[t.id].valence,
                    target_tempo: features[t.id].tempo,
                })
            );
        });

        let similarTracks = {};
        SpotifyRequest.getAll(urls).forEach((r) => {
            let item = r.seeds.find((s) => s.type.toLowerCase() == 'track');
            similarTracks[item.id] = r.tracks;
        });

        let keys = Object.keys(similarTracks);
        let resultTracks = originTracks.map((t) => {
            if (keys.includes(t.id)) {
                if (similarTracks[t.id].length > 0) {
                    Filter.removeTracks(similarTracks[t.id], replacementTracks);
                    t = Selector.sliceRandom(similarTracks[t.id], 1)[0];
                } else {
                    t = null;
                }
            }
            return t;
        });
        Combiner.replace(originTracks, resultTracks.filter(t => t != null));
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
                    regex.test(item.artists[0].name.formatName())
                );
            }
            return invert ^ regex.test(item.name.formatName());
        });
        Combiner.replace(items, filteredTracks);
    }

    function rangeDateRel(tracks, sinceDays, beforeDays) {
        extractTracksRel(tracks, sinceDays, beforeDays);
    }

    function rangeDateAbs(tracks, startDate, endDate) {
        extractTracksAbs(tracks, startDate, endDate);
    }

    function extractTracksRel(items, sinceDays, beforeDays) {
        let startDate = getDateRel(sinceDays, 'startDay');
        let endDate = getDateRel(beforeDays, 'endDay');
        extractTracksAbs(items, startDate, endDate);
    }

    function extractTracksAbs(items, startDate, endDate) {
        if (!items) {
            console.error('Filter.extractTracksAbs: items is null');
            return;
        }

        let startTime = startDate ? startDate.getTime() : Date.now();
        let endTime = endDate ? endDate.getTime() : Date.now();

        if (startTime >= endTime) {
            console.error('Начальная граница больше, чем конечная граница:', startDate, endDate);
            return;
        }

        let filteredTracks = items.reduce((tracks, track) => {
            let key = track.played_at ? 'played_at' : 'added_at';
            let date = track[key] ? new Date(track[key]) : DEFAULT_DATE;
            let time = date.getTime();
            if (time >= startTime && time <= endTime) {
                tracks.push(track);
            }
            return tracks;
        }, []);

        Combiner.replace(items, filteredTracks);
    }

    function getDateRel(days, bound) {
        let date = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : new Date();
        return date.setBound(bound);
    }

    const Deduplicator = (function () {
        const TYPE_TRACKS = 'tracks';
        const TYPE_ARTISTS = 'artists';

        let _items;
        let _duplicates;

        function dedupTracks(tracks) {
            dedup(tracks, TYPE_TRACKS);
        }

        function dedupArtists(tracks) {
            dedup(tracks, TYPE_ARTISTS);
        }

        function separateArtistsDuplicated(tracks) {
            _items = tracks;
            _duplicates = findArtistsDuplicated();
            let indexArray = _duplicates.map((item) => item.index);
            let result = { original: [], duplicate: [] };
            for (let i = 0; i < _items.length; i++) {
                let key = indexArray.includes(i) ? 'duplicate' : 'original';
                result[key].push(_items[i]);
            }
            return result;
        }

        function dedup(items, type) {
            _items = items;
            _duplicates = type == TYPE_ARTISTS ? findArtistsDuplicated() : findTracksDuplicated();
            removeTracksDuplicated();
        }

        function findTracksDuplicated() {
            const seenIds = {};
            const seenTrackKeys = {};
            return _items.reduce((duplicates, track, index) => {
                if (track === null || track.id === null) {
                    return duplicates;
                } else if (isDuplicateByTrackId(track.id) || isDuplicateByName(track)) {
                    duplicates.push({
                        index: index,
                        track: track,
                        reason: track.id in seenIds ? 'same-track-id' : 'same-track-name',
                    });
                } else {
                    seenIds[track.id] = true;
                    const trackKey = getTrackKey(track);
                    seenTrackKeys[trackKey] = seenTrackKeys[trackKey] || [];
                    seenTrackKeys[trackKey].push(track.duration_ms);
                }
                return duplicates;

                function isDuplicateByTrackId(id) {
                    return id in seenTrackKeys;
                }

                function isDuplicateByName(track) {
                    const trackKey = getTrackKey(track);
                    return (
                        trackKey in seenTrackKeys &&
                        0 != seenTrackKeys[trackKey].filter((duration) => Math.abs(duration - track.duration_ms) < 2000).length
                    );
                }
            }, []);
        }

        function findArtistsDuplicated() {
            const seenArtists = {};
            return _items.reduce((duplicates, item, index) => {
                const artistId = getArtistId(item);
                if (artistId == undefined) {
                    return duplicates;
                } else if (isDuplicateByArtistId(artistId)) {
                    duplicates.push({
                        index: index,
                        item: item,
                        reason: 'same-artist-id',
                    });
                } else {
                    seenArtists[artistId] = true;
                }
                return duplicates;

                function getArtistId(item) {
                    if (item && item.hasOwnProperty('artists') && item.artists.length > 0) {
                        return item.artists[0].id;
                    } else if (item) {
                        return item.id;
                    }
                }

                function isDuplicateByArtistId(artistId) {
                    return artistId in seenArtists;
                }
            }, []);
        }

        function removeTracksDuplicated() {
            let offset = 0;
            _duplicates.forEach((item) => {
                _items.splice(item.index - offset, 1);
                offset++;
            });
        }

        return {
            dedupTracks: dedupTracks,
            dedupArtists: dedupArtists,
            separateArtistsDuplicated: separateArtistsDuplicated,
        };
    })();

    return {
        removeTracks: removeTracks,
        removeArtists: removeArtists,
        removeUnavailable: removeUnavailable,
        dedupTracks: Deduplicator.dedupTracks,
        dedupArtists: Deduplicator.dedupArtists,
        getDateRel: getDateRel,
        rangeDateRel: rangeDateRel,
        rangeDateAbs: rangeDateAbs,
        rangeTracks: RangeTracks.rangeTracks,
        getLastOutRange: RangeTracks.getLastOutRange,
        replaceWithSimilar: replaceWithSimilar,
        match: match,
        matchExcept: matchExcept,
        matchExceptRu: matchExceptRu,
        matchExceptMix: matchExceptMix,
        matchLatinOnly: matchLatinOnly,
        matchOriginalOnly: matchOriginalOnly,
        separateArtistsDuplicated: Deduplicator.separateArtistsDuplicated,
    };
})();

const Selector = (function () {
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
        return array.slice();
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
        console.log(`Среди ${tracks.length} треков нет вышедших в ${year} году`);
        year = parseInt(year);
        let keys = Object.keys(tracksByYear).map((item) => parseInt(item));
        let nearYear = keys.sort((x, y) => Math.abs(year - x) - Math.abs(year - y))[0];
        if (typeof nearYear != 'undefined' && Math.abs(nearYear - year) <= offset) {
            console.log(`Выбран ближайший год: ${nearYear}`);
            return tracksByYear[nearYear.toString()];
        }
        console.log(`При смещении ${offset}, ближайший год не найден`);
        return [];
    }

    return {
        keepFirst: keepFirst,
        keepLast: keepLast,
        keepAllExceptFirst: keepAllExceptFirst,
        keepAllExceptLast: keepAllExceptLast,
        keepRandom: keepRandom,
        keepNoLongerThan: keepNoLongerThan,
        sliceFirst: sliceFirst,
        sliceLast: sliceLast,
        sliceAllExceptFirst: sliceAllExceptFirst,
        sliceAllExceptLast: sliceAllExceptLast,
        sliceRandom: sliceRandom,
        sliceNoLongerThan: sliceNoLongerThan,
        sliceCopy: sliceCopy,
        pickYear: pickYear,
        isWeekend: isWeekend,
        isDayOfWeekRu: isDayOfWeekRu,
        isDayOfWeek: isDayOfWeek,
    };
})();

const Order = (function () {
    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            let j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
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

            let compareMethod = _key == 'name' ? compareString : compareNumber;
            _source.sort((x, y) => {
                let keyX = x.artists ? x.artists[0].id : x.id;
                let keyY = y.artists ? y.artists[0].id : y.id;
                return compareMethod(items[keyX], items[keyY])
            });
        }

        function sortFeatures() {
            // acousticness, danceability, energy, instrumentalness, liveness,
            // loudness, speechiness, valence, tempo, key, mode, time_signature, duration_ms
            let items = getCachedTracks(_source, { features: {} }).features;
            _source.sort((x, y) => compareNumber(items[x.id], items[y.id]));
        }

        function sortMeta() {
            // name, popularity, duration_ms, explicit, added_at, played_at
            let hasKey = _source.every((t) => t[_key] != undefined);
            let items = {};
            if (hasKey) {
                _source.forEach((t) => (items[t.id] = t));
            } else {
                items = getCachedTracks(_source, { meta: {} }).meta;
            }
            if (_key == 'name') {
                _source.sort((x, y) => compareString(items[x.id], items[y.id]));
            } else if (_key == 'added_at' || _key == 'played_at') {
                _source.sort((x, y) => compareDate(items[x.id], items[y.id]));
            } else {
                _source.sort((x, y) => compareNumber(items[x.id], items[y.id]));
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
            return _direction == 'asc' ? x[_key] - y[_key] : y[_key] - x[_key];
        }

        function compareString(x, y) {
            if (_direction == 'asc') {
                return (x[_key] > y[_key]) - (x[_key] < y[_key]);
            }
            return (x[_key] < y[_key]) - (x[_key] > y[_key]);
        }

        function compareDate(x, y) {
            let xDate = x[_key] ? new Date(x[_key]) : DEFAULT_DATE;
            let yDate = y[_key] ? new Date(y[_key]) : DEFAULT_DATE;
            if (_direction == 'asc') {
                return xDate.getTime() - yDate.getTime();
            }
            return yDate.getTime() - xDate.getTime();
        }
    })();

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
        shuffle: shuffle,
        reverse: reverse,
        sort: sort,
        separateArtists: separateArtists,
        separateYears: separateYears,
    };
})();

const Playlist = (function () {
    const LIMIT_TRACKS = 11000;
    const LIMIT_DESCRIPTION = 300;
    const SIZE = ['500', '600', '700', '800', '900', '1000'];
    const ARGS = `?limit=50&locale=${KeyValue.LOCALE || "RU"}`;

    const getPlaylistArray = (function () {
        let playlistsOfUsers = {};
        return get;

        function get(userId) {
            let key = userId == null ? 'me' : userId;
            if (playlistsOfUsers[key] == null) {
                let path = userId == null ? 'me/playlists' : `users/${userId}/playlists`;
                path += ARGS;
                playlistsOfUsers[key] = SpotifyRequest.getItemsByPath(path);
            }
            return playlistsOfUsers[key];
        }
    })();

    return {
        getById: getById,
        getByName: getByName,
        getDescription: getDescription,
        getPlaylistArray: getPlaylistArray,
        saveAsNew: saveAsNew,
        saveWithReplace: saveWithReplace,
        saveWithAppend: saveWithAppend,
        saveWithUpdate: saveWithUpdate,
        removeTracks: removeNonExistingTracks,
    };

    function getById(playlistId) {
        let url = `${API_BASE_URL}/playlists/${playlistId}` + ARGS;
        return SpotifyRequest.get(url);
    }

    function getByName(playlistName, userId) {
        let path = userId == null ? 'me/playlists' : `users/${userId}/playlists`;
        let url = `${API_BASE_URL}/${path + ARGS}`;
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
        let copyTracks = Selector.sliceCopy(tracks);
        Filter.dedupArtists(copyTracks);
        let artists = Selector.sliceRandom(copyTracks, limit);
        let strArtists = artists.map((track) => track.artists[0].name).join(', ');
        return `${strArtists} и не только`;
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
            setCover(playlist.id, getCoverContent(data.sourceCover));
        } else if (data.hasOwnProperty('randomCover')) {
            setCover(playlist.id, getRandomCoverContent());
        }
    }

    function createPlaylist(payload) {
        let url = `${API_BASE_URL}/users/${User.getId()}/playlists`;
        return SpotifyRequest.post(url, payload);
    }

    function saveWithReplace(data) {
        saveWithModify(replaceTracks, data);
    }

    function saveWithAppend(data) {
        saveWithModify(addTracks, data);
    }

    function saveWithUpdate(data) {
        saveWithModify(updateTracks, data);
    }

    function saveWithModify(modifyMethod, data) {
        if (data.tracks.length > LIMIT_TRACKS) {
            Selector.keepFirst(data.tracks, LIMIT_TRACKS);
        }

        if (data.id) {
            modifyMethod(data);
            changeDetails(data);
            changeCover(data);
            return;
        }

        let playlist = getByName(data.name);
        if (playlist == null) {
            saveAsNew(data);
        } else {
            data.id = playlist.id;
            saveWithModify(modifyMethod, data);
        }
    }

    function addTracks(data) {
        modifyTracks('post', data);
    }

    function replaceTracks(data) {
        modifyTracks('put', data);
    }

    function updateTracks(data) {
        let currentTracks = Source.getPlaylistTracks('', data.id);

        addNewTracks();
        removeOldTracks();

        function addNewTracks() {
            let currentIds = currentTracks.map((t) => t.id);
            let tracksToAdd = data.tracks.filter((t) => !currentIds.includes(t.id));
            if (tracksToAdd.length > 0) {
                addTracks({ id: data.id, tracks: tracksToAdd, toEnd: data.toEnd });
            }
        }

        function removeOldTracks() {
            let newIds = data.tracks.map((t) => t.id);
            let tracksToDelete = currentTracks.filter((t) => !newIds.includes(t.id));
            removeTracksRequest(data.id, tracksToDelete);
        }
    }

    function removeTracksRequest(id, tracks) {
        if (tracks.length > 0) {
            SpotifyRequest.deleteItems({
                url: `${API_BASE_URL}/playlists/${id}/tracks`,
                key: 'tracks',
                limit: 100,
                items: getTrackUris(tracks, 'object'),
            });
        }
    }

    function modifyTracks(requestType, data) {
        let size = 100;
        let uris = getTrackUris(data.tracks);
        let count = Math.ceil(uris.length / size);
        let url = `${API_BASE_URL}/playlists/${data.id}/tracks`;
        if (count == 0 && requestType == 'put') {
            // Удалить треки в плейлисте
            SpotifyRequest.put(url, { uris: [] });
            return;
        }

        for (let i = 0; i < count; i++) {
            let begin = i * size;
            let end = begin + size;
            let payload = { uris: uris.slice(begin, end) };
            if ((!data.hasOwnProperty('toEnd') || !data.toEnd) && requestType === 'post') {
                // добавлять треки вначало плейлиста со смещением begin, чтобы сохранить оригинальную сортировку
                payload.position = begin;
            }

            if (requestType === 'post') {
                // post-запрос добавляет треки в плейлист
                SpotifyRequest.post(url, payload);
            } else if (requestType === 'put') {
                // put-запрос заменяет все треки плейлиста
                SpotifyRequest.put(url, payload);
                // сменить тип запроса, чтобы добавлять остальные треки
                requestType = 'post';
            }
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
        let imageContent;
        if (data.hasOwnProperty('sourceCover')) {
            imageContent = getCoverContent(data.sourceCover);
        } else if (data.randomCover == 'update' || (data.randomCover == 'once' && hasMosaicCover(data.id))) {
            imageContent = getRandomCoverContent();
        }
        setCover(data.id, imageContent);
    }

    function hasMosaicCover(playlistId) {
        let playlist = getById(playlistId);
        return playlist.images.length > 0 && playlist.images[0].url.includes('mosaic');
    }

    function getRandomSize() {
        let index = Math.floor(Math.random() * SIZE.length);
        return SIZE[index];
    }

    function getRandomCoverContent() {
        let img = CustomUrlFetchApp.fetch('https://picsum.photos/' + getRandomSize());
        if (img.getAllHeaders()['content-length'] > 250000) {
            return getRandomCoverContent();
        }
        return img ? img.getContent() : undefined;
    }

    function getCoverContent(url) {
        let img = CustomUrlFetchApp.fetch(url);
        return img ? img.getContent() : undefined;
    }

    function setCover(playlistId, imageContent) {
        if (typeof imageContent == 'undefined') return;
        let url = `${API_BASE_URL}/playlists/${playlistId}/images`;
        SpotifyRequest.putImage(url, imageContent);
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
        followArtists: followArtists,
        unfollowArtists: unfollowArtists,
        saveFavoriteTracks: saveFavoriteTracks,
        deleteFavoriteTracks: deleteFavoriteTracks,
        saveAlbums: saveAlbums,
        deleteAlbums: deleteAlbums,
    };

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
        removeRecentTracks: removeRecentTracks,
        removeRecentArtists: removeRecentArtists,
        getLovedTracks: getLovedTracks,
        getRecentTracks: getRecentTracks,
        getLastfmRecentTracks: getLastfmRecentTracks,
        findNewPlayed: findNewPlayed,
        getTopTracks: getTopTracks,
        getTopArtists: getTopArtists,
        getTopAlbums: getTopAlbums,
        getMixStation: getMixStation,
        getLibraryStation: getLibraryStation,
        getRecomStation: getRecomStation,
        getNeighboursStation: getNeighboursStation,
        getSimilarTracks: getSimilarTracks,
        getSimilarArtists: getSimilarArtists,
        getCustomTop: getCustomTop,
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

    function removeRecentTracks(sourceArray, user, count = 600) {
        let removedArray = getLastfmRecentTracks(user, count);
        let removedNames = removedArray.map((item) => formatLastfmTrackKey(item));
        let filteredTracks = sourceArray.filter((item) => !removedNames.includes(formatSpotifyTrackKey(item)));
        Combiner.replace(sourceArray, filteredTracks);
    }

    function removeRecentArtists(sourceArray, user, count = 600) {
        let removedArray = getLastfmRecentTracks(user, count);
        let removedNames = removedArray.map((item) => item.artist['#text']);
        let filteredTracks = sourceArray.filter((item) => !removedNames.includes(item.artists[0].name));
        Combiner.replace(sourceArray, filteredTracks);
    }

    function getRecentTracks(user, count) {
        let tracks = getLastfmRecentTracks(user, count);
        return Search.multisearchTracks(tracks, formatTrackNameLastfm);
    }

    function getLastfmRecentTracks(user, count) {
        let queryObj = { method: 'user.getrecenttracks', user: user, limit: 200 };
        let tracks = getTrackPages(queryObj, count);
        if (isNowPlayling(tracks[0])) {
            tracks.splice(0, 1);
        }
        return tracks;
    }

    function findNewPlayed(lastfmTracks, spotifyTracks) {
        if (spotifyTracks.length > 0) {
            let lastPlayedTime = new Date(spotifyTracks[0].played_at).getTime();
            lastfmTracks = sliceOldPlayed(lastfmTracks, lastPlayedTime);
        }
        return Search.multisearchTracks(lastfmTracks, formatTrackNameLastfm);
    }

    function sliceOldPlayed(lastfmTracks, lastPlayedTime) {
        for (let i = lastfmTracks.length - 1; i >= 0; i--) {
            let time = new Date(lastfmTracks[i].date['#text']).getTime();
            if (time - lastPlayedTime == 0) {
                return lastfmTracks.slice(0, i);
            }
        }
        return lastfmTracks;
    }

    function getLovedTracks(user, limit) {
        let queryObj = { method: 'user.getlovedtracks', user: user, limit: limit || 200 };
        let tracks = getPage(queryObj);
        if (!tracks.lovedtracks) {
            console.error('Ошибка при получении любимых треков', tracks);
            return [];
        }
        return Search.multisearchTracks(tracks.lovedtracks.track, formatTrackNameLastfm);
    }

    function getTopTracks(params) {
        params.method = 'user.gettoptracks';
        let tracks = getTopPage(params);
        if (!tracks.toptracks) {
            console.error('Ошибка при получении топа треков', tracks);
            return [];
        }
        return Search.multisearchTracks(tracks.toptracks.track, formatTrackNameLastfm);
    }

    function getTopArtists(params) {
        params.method = 'user.gettopartists';
        let artists = getTopPage(params);
        if (!artists.topartists) {
            console.error('Ошибка при получении топа исполнителей', artists);
            return [];
        }
        return Search.multisearchArtists(artists.topartists.artist, formatArtistNameLastfm);
    }

    function getTopAlbums(params) {
        params.method = 'user.gettopalbums';
        let albums = getTopPage(params);
        if (!albums.topalbums) {
            console.error('Ошибка при получении топа альбомов', albums);
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
        return getStationPlaylist(user, 'mix', countRequest);
    }

    function getLibraryStation(user, countRequest) {
        return getStationPlaylist(user, 'library', countRequest);
    }

    function getRecomStation(user, countRequest) {
        return getStationPlaylist(user, 'recommended', countRequest);
    }

    function getNeighboursStation(user, countRequest) {
        return getStationPlaylist(user, 'neighbours', countRequest);
    }

    function getStationPlaylist(user, type, countRequest) {
        let stationTracks = getStationTracks(user, type, countRequest);
        let tracks = Search.multisearchTracks(stationTracks, formatTrackNameLastfm);
        Filter.dedupTracks(tracks);
        return tracks;
    }

    function getStationTracks(user, type, countRequest) {
        let url = `${LASTFM_STATION}/${user}/${type}`;
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

    function getCustomTop(params) {
        let formatMethod, searchMethod;
        if (params.type == 'artist') {
            formatMethod = formatArtistNameLastfm;
            searchMethod = Search.multisearchArtists;
        } else if (params.type == 'album') {
            formatMethod = formatAlbumNameLastfm;
            searchMethod = Search.multisearchAlbums;
        } else {
            formatMethod = formatTrackNameLastfm;
            searchMethod = Search.multisearchTracks;
        }
        let tracks = getTracksForPeriod(params);
        let played = calcCountPlayed(tracks, formatMethod);

        params.minPlayed = params.minPlayed || 0;
        params.maxPlayed = params.maxPlayed || 100000;
        played = played.filter(p => p.count >= params.minPlayed && p.count <= params.maxPlayed);

        played.sort((x, y) => y.count - x.count);
        Selector.keepAllExceptFirst(played, params.offset || 0);
        Selector.keepFirst(played, params.count || 40);
        let items = played.map((p) => {
            p.item.countPlayed = p.count;
            return p.item;
        });
        return searchMethod(items, formatMethod);

        function getTracksForPeriod(params) {
            let fromDate = params.from instanceof Date ? params.from : new Date(params.from);
            let toDate = params.to instanceof Date ? params.to : new Date(params.to);
            let queryObj = {
                method: 'user.getrecenttracks',
                user: params.user,
                from: fromDate.getTimestampUNIX('startDay'),
                to: toDate.getTimestampUNIX('endDay'),
                limit: 200,
                page: 1,
            };
            let firstPage = getPage(queryObj);
            let totalPages = parseInt(firstPage.recenttracks['@attr'].totalPages);

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

    function getPage(queryObj) {
        let url = createUrl(queryObj);
        return CustomUrlFetchApp.fetch(url) || [];
    }

    function createUrl(queryObj) {
        queryObj.api_key = KeyValue.LASTFM_API_KEY;
        queryObj.format = 'json';
        return LASTFM_API_BASE_URL + CustomUrlFetchApp.parseQuery(queryObj);
    }

    function isNowPlayling(track) {
        return track['@attr'] && track['@attr'].nowplaying === 'true';
    }

    function formatLastfmTrackKey(item) {
        let artist = item.artist.name ? item.artist.name : item.artist['#text'];
        return `${item.name} ${artist}`.formatName();
    }

    function formatSpotifyTrackKey(item) {
        return `${item.name} ${item.artists[0].name}`.formatName();
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

const Yandex = (function () {
    const YANDEX_PLAYLIST = 'https://music.mts.ru/handlers/playlist.jsx?';
    const YANDEX_LIBRARY = 'https://music.mts.ru/handlers/library.jsx?';

    return {
        getTracks: getTracks,
        getArtists: getArtists,
        getAlbums: getAlbums,
    };

    function getTracks(owner, kinds, limit, offset) {
        let responsePlaylist = getPlaylist({
            owner: owner,
            kinds: kinds,
            light: false,
        });
        if (!(typeof responsePlaylist === 'object' && responsePlaylist.playlist)) {
            return [];
        }
        let trackItems = slice(responsePlaylist.playlist.tracks, limit, offset);
        return Search.multisearchTracks(trackItems, getTrackNameYandex);
    }

    function getArtists(owner, limit, offset) {
        let responseLibrary = getLibrary({ owner: owner, filter: 'artists' });
        let artistItems = slice(responseLibrary.artists, limit, offset);
        return Search.multisearchArtists(artistItems, getArtistNameYandex);
    }

    function getAlbums(owner, limit, offset) {
        let responseLibrary = getLibrary({ owner: owner, filter: 'albums' });
        let albumsItems = slice(responseLibrary.albums, limit, offset);
        return Search.multisearchAlbums(albumsItems, getAlbumNameYandex);
    }

    function getLibrary(queryObj) {
        let url = YANDEX_LIBRARY + CustomUrlFetchApp.parseQuery(queryObj);
        return CustomUrlFetchApp.fetch(url) || {};
    }

    function getPlaylist(queryObj) {
        let url = YANDEX_PLAYLIST + CustomUrlFetchApp.parseQuery(queryObj);
        return CustomUrlFetchApp.fetch(url) || {};
    }

    function getTrackNameYandex(item) {
        if (!item.title) {
            return '';
        }
        if (item.artists.length == 0 || !item.artists[0].name) {
            return item.title.formatName();
        }
        return `${item.artists[0].name} ${item.title}`.formatName();
    }

    function getArtistNameYandex(item) {
        return item && item.name ? item.name.formatName() : '';
    }

    function getAlbumNameYandex(item) {
        if (item && item.title) {
            return `${item.title} ${item.artists[0].name}`.formatName();
        }
        return '';
    }

    function slice(array, limit, offset) {
        if (array && limit) {
            offset = offset ? offset : 0;
            return array.slice(offset, offset + limit);
        }
        return array;
    }
})();

const Cache = (function () {
    const FOLDER_NAME = 'Goofy Data';
    const rootFolder = getRootFolder();

    return {
        read: read,
        write: write,
        append: append,
        clear: clear,
        copy: copy,
        remove: remove,
        rename: rename,
        compressTracks: compressTracks,
        compressArtists: compressArtists,
    };

    function read(filename) {
        let file = getFile(filename);
        let ext = obtainFileExtension(filename);
        if (ext == 'json') {
            return tryParseJSON(file);
        } else if (ext == 'txt' && file) {
            return file.getBlob().getDataAsString();
        }
        return '';
    }

    function append(filename, content, place = 'end', limit = 100000) {
        if (!content || content.length == 0) return;
        let currentContent = read(filename) || [];
        let ext = obtainFileExtension(filename);
        ext == 'json' ? appendJSON() : appendString();

        function appendJSON() {
            if (place == 'begin') {
                appendNewData(content, currentContent);
            } else if (place == 'end') {
                appendNewData(currentContent, content);
            }

            function appendNewData(xData, yData) {
                Combiner.push(xData, yData);
                Selector.keepFirst(xData, limit);
                write(filename, xData);
            }
        }

        function appendString() {
            let raw;
            if (place == 'begin') {
                raw = content + currentContent;
            } else if (place == 'end') {
                raw = currentContent + content;
            }
            write(filename, raw);
        }
    }

    function clear(filename) {
        write(filename, []);
    }

    function write(filename, content) {
        let file = getFile(filename);
        if (!file) {
            file = createFile(filename);
        }
        let ext = obtainFileExtension(filename);
        let raw = ext == 'json' ? JSON.stringify(content) : content;

        let count = 3;
        do {
            setContent();
            if (content.length == 0 || file.getSize() > 0) {
                break;
            }
            console.error(`Неизвестная ошибка при записи файла`);
            Utilities.sleep(5000);
        } while (--count != 0);

        function setContent() {
            file = file.setContent(raw);
        }
    }

    function copy(filename) {
        let file = getFile(filename);
        if (file) {
            filename = `Copy ${filename}`;
            file.makeCopy().setName(filename);
            return filename;
        }
    }

    function remove(filename) {
        let file = getFile(filename);
        if (file) {
            file.setTrashed(true);
        }
    }

    function rename(oldFilename, newFilename) {
        let file = getFile(oldFilename);
        if (file) {
            file.setName(formatFileExtension(newFilename));
        }
    }

    function getFile(filename) {
        let files = getFileIterator(filename);
        if (files.hasNext()) {
            return files.next();
        }
    }

    function createFile(filename) {
        return rootFolder.createFile(formatFileExtension(filename), '');
    }

    function getFileIterator(filename) {
        return rootFolder.getFilesByName(formatFileExtension(filename));
    }

    function tryParseJSON(file) {
        if (!file) return [];
        let content = file.getBlob().getDataAsString();
        try {
            return JSON.parse(content);
        } catch (e) {
            console.error('Не удалось перевести строку JSON в объект. Length:', content.length, 'content:', content);
            console.error(e, e.stack);
            throw 'Ошибка чтения файла';
        }
    }

    function getRootFolder() {
        let folders = DriveApp.getFoldersByName(FOLDER_NAME);
        if (folders.hasNext()) {
            return folders.next();
        }
        return DriveApp.createFolder(FOLDER_NAME);
    }

    function formatFileExtension(filename) {
        let ext = obtainFileExtension(filename);
        if (!filename.includes('.')) {
            filename += `.${ext}`;
        }
        return filename;
    }

    function obtainFileExtension(filename) {
        let ext = filename.split('.');
        if (ext.length == 2) {
            return ext[1];
        }
        return 'json';
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
})();

const Search = (function () {
    const TEMPLATE = API_BASE_URL + '/search?%s';

    let noFound = [];

    return {
        multisearchTracks: multisearchTracks,
        multisearchArtists: multisearchArtists,
        multisearchAlbums: multisearchAlbums,
        findPlaylists: findPlaylists,
        findAlbums: findAlbums,
        findTracks: findTracks,
        findArtists: findArtists,
        getNoFound: () => noFound,
    };

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
        let originKeyword = items.map((item) => parseNameMethod(item));
        let uniqueItems = findUniqueItems(originKeyword);
        return restoreOrigin();

        function findUniqueItems() {
            let uniqueKeyword = Array.from(new Set(originKeyword));
            let searchResult = findBest(uniqueKeyword, type);
            let resultItems = [];
            for (let i = 0; i < uniqueKeyword.length; i++) {
                let item = searchResult[i];
                if (item && item.id) {
                    item.keyword = uniqueKeyword[i];
                    resultItems.push(item);
                } else {
                    noFound.push({ type: type, keyword: uniqueKeyword[i] });
                    console.info('Spotify по типу', type, 'не нашел:', uniqueKeyword[i]);
                }
            }
            return resultItems;
        }

        function restoreOrigin() {
            return originKeyword
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

    function findBest(textArray, type) {
        let urls = textArray.map((text) => {
            let queryObj = { q: text, type: type, limit: '20' };
            return Utilities.formatString(TEMPLATE, CustomUrlFetchApp.parseQuery(queryObj));
        });
        return SpotifyRequest.getAll(urls).map((response, index) => {
            if (!response || !response.items) {
                return {};
            }
            let foundItem = response.items.find(item => {
                let foundName = item.name.formatName();
                let keyword = textArray[index].formatName();
                return foundName == keyword;
            });
            return foundItem || response.items[0];
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
                let queryObj = { q: keyword, type: type, limit: limit, offset: i * limit };
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
            fullTracks.forEach((track) => (cachedTracks.meta[track.id] = track));
        }
        if (uncachedTracks.artists.length > 0) {
            let fullArtists = SpotifyRequest.getFullObjByIds('artists', uncachedTracks.artists, 50);
            fullArtists.forEach((artist) => (cachedTracks.artists[artist.id] = artist));
        }
        if (uncachedTracks.albums.length > 0) {
            let fullAlbums = SpotifyRequest.getFullObjByIds('albums', uncachedTracks.albums, 20);
            fullAlbums.forEach((album) => (cachedTracks.albums[album.id] = album));
        }
        if (uncachedTracks.features.length > 0) {
            // limit = 100, но UrlFetchApp.fetch выдает ошибку о превышении длины URL
            // При limit 85, длина URL для этого запроса 2001 символ
            let features = SpotifyRequest.getFullObjByIds('audio-features', uncachedTracks.features, 85);
            features.forEach((item) => {
                if (item != null) {
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
})();

const Auth = (function () {
    const SCOPE = [
        'user-read-private',
        'user-library-read',
        'user-library-modify',
        'user-read-recently-played',
        'user-read-currently-playing',
        'user-top-read',
        'user-follow-read',
        'user-follow-modify',
        'playlist-read-private',
        'playlist-modify-private',
        'playlist-modify-public',
        'ugc-image-upload',
    ];
    const service = createService();

    return {
        reset: reset,
        hasAccess: hasAccess,
        getAccessToken: getAccessToken,
        displayAuthPage: displayAuthPage,
        displayAuthResult: displayAuthResult,
    };

    function createService() {
        return OAuth2.createService('spotify')
            .setAuthorizationBaseUrl('https://accounts.spotify.com/authorize')
            .setTokenUrl('https://accounts.spotify.com/api/token')
            .setClientId(KeyValue.CLIENT_ID)
            .setClientSecret(KeyValue.CLIENT_SECRET)
            .setCallbackFunction('displayAuthResult_')
            .setPropertyStore(UserProperties)
            .setScope(SCOPE)
            .setParam('response_type', 'code')
            .setParam('redirect_uri', getRedirectUri());
    }

    function displayAuthResult(request) {
        let isAuthorized = service.handleCallback(request);
        return HtmlService.createHtmlOutput(isAuthorized ? 'Успешно!' : 'Отказано в доступе');
    }

    function displayAuthPage() {
        let template = '<a href="%s" target="_blank">Authorize</a><p>%s</p>';
        let html = Utilities.formatString(template, service.getAuthorizationUrl(), getRedirectUri());
        return HtmlService.createHtmlOutput(html);
    }

    function getRedirectUri() {
        let scriptId = encodeURIComponent(ScriptApp.getScriptId());
        return `https://script.google.com/macros/d/${scriptId}/usercallback`;
    }

    function hasAccess() {
        return service.hasAccess();
    }

    function getAccessToken() {
        return service.getAccessToken();
    }

    function reset() {
        service.reset();
    }
})();

const User = (function () {
    const USER_ID = 'userId';
    return {
        getId: getId,
    };

    function getId() {
        return KeyValue[USER_ID] ? KeyValue[USER_ID] : setId();
    }

    function setId() {
        KeyValue[USER_ID] = getUser().id;
        UserProperties.setProperty(USER_ID, KeyValue[USER_ID]);
        return KeyValue[USER_ID];
    }

    function getUser() {
        return SpotifyRequest.get(API_BASE_URL + '/me');
    }
})();

const SpotifyRequest = (function () {
    return {
        get: get,
        getAll: getAll,
        getItemsByPath: getItemsByPath,
        getItemsByNext: getItemsByNext,
        getFullObjByIds: getFullObjByIds,
        post: post,
        put: put,
        putImage: putImage,
        putItems: putItems,
        deleteItems: deleteItems,
        deleteRequest: deleteRequest,
    };

    function getItemsByPath(urlPath, limitRequestCount) {
        let url = `${API_BASE_URL}/${urlPath}`;
        let response = get(url);
        if (response.items.length < response.total) {
            let method = response.cursors ? getItemsByCursor : getItemsByNext;
            return method(response, limitRequestCount);
        }
        return response.items;
    }

    function getItemsByCursor(response, limitRequestCount = 220) {
        let items = response.items;
        let count = 1;
        while (response.next != null && count != limitRequestCount) {
            response = get(response.next);
            Combiner.push(items, response.items);
            count++;
        }
        return items;
    }

    function getItemsByNext(response, limitRequestCount = 220) {
        let count = Math.ceil(response.total / response.limit);
        if (count > limitRequestCount) {
            count = limitRequestCount;
        }

        let href = response.href.split('?');
        let baseurl = href[0];
        let query = urlStringToObj(href[1]);
        query.limit = query.limit || 50;
        query.offset = query.offset || 0;

        let urls = [];
        for (let i = 1; i < count; i++) {
            query.offset = parseInt(query.offset) + parseInt(query.limit);
            urls.push(`${baseurl}?${CustomUrlFetchApp.parseQuery(query)}`);
        }

        let items = response.items;
        getAll(urls).forEach((responseItem) => {
            responseItem = extractContent(responseItem);
            if (responseItem && responseItem.items) {
                Combiner.push(items, responseItem.items);
            }
        });
        return items;
    }

    function urlStringToObj(str) {
        try {
            str = '{"' + decodeURI(str).replace(/"/g, '\\"').replace(/&/g, '","').replace(/=/g, '":"') + '"}';
            return JSON.parse(str);
        } catch (e) {
            console.error('urlStringToObj', e, e.stack, str);
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

        let fullObj = [];
        getAll(urls).forEach((response) => {
            if (response) {
                Combiner.push(fullObj, response);
            }
        });
        return fullObj;
    }

    function get(url) {
        return extractContent(fetch(url));
    }

    function getAll(urls) {
        let requests = [];
        urls.forEach((url) =>
            requests.push({
                url: url,
                headers: getHeaders(),
                method: 'get',
            })
        );
        return CustomUrlFetchApp.fetchAll(requests).map((response) => extractContent(response));
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

    function putImage(url, imgBytes) {
        return fetch(url, {
            method: 'put',
            contentType: 'image/jpeg',
            payload: Utilities.base64Encode(imgBytes),
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
            let payload = {};
            payload[params.key] = params.items.splice(0, params.limit);
            method(params.url, payload);
        }
    }

    function fetch(url, params = {}) {
        params.headers = getHeaders();
        return CustomUrlFetchApp.fetch(url, params);
    }

    function getHeaders() {
        return {
            Authorization: 'Bearer ' + Auth.getAccessToken(),
        };
    }
})();

const Admin = (function () {
    if (VERSION != KeyValue.VERSION) {
        UserProperties.setProperty('VERSION', VERSION);
        sendVersion(VERSION);
    }

    return {
        reset: reset,
    };

    function sendVersion(value) {
        let id = '1FAIpQLSeSe9Jgw5Ml1XxTlz1HHnyHGoFcA65CabbAAJcvk5elXL2gZw';
        CustomUrlFetchApp.fetch(`https://docs.google.com/forms/u/0/d/e/${id}/formResponse`, {
            method: 'post',
            payload: {
                'entry.1598003363': value,
                'entry.1594601658': ScriptApp.getScriptId(),
                'entry.1666409024': User.getId(),
            },
        });
    }

    function reset() {
        Auth.reset();
        UserProperties.deleteAllProperties();
    }
})();

String.prototype.formatName = function () {
    return this.toLowerCase()
        .replace(/[',?!@#$%^&*()+-./\\]/g, ' ')
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
