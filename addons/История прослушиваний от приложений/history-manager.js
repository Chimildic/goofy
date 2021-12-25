const HistoryManager = (function () {
    const FILES = ['SpotifyHistoryPC', 'SpotifyHistoryPhone'];
    return {
        getTracks: getTracks,
        removeTracks: removeTracks,
        readTrackIds: readTrackIds,
    };

    function getTracks() {
        return SpotifyRequest.getFullObjByIds('tracks', readTrackIds(), 50);
    }

    function removeTracks(tracks) {
        let trackHistoryIds = readTrackIds();
        return tracks.filter((track) => !trackHistoryIds.includes(track.id));
    }

    function readTrackIds() {
        let tracks = [];
        for (let i = 0; i < FILES.length; i++) {
            let data = tryParseJSON(getFile(FILES[i]));
            if (data.play_history && data.play_history.tracks) {
                let validTracks = data.play_history.tracks.filter(t => t.uri.includes('spotify:track'));
                Combiner.push(tracks, validTracks);
            }
        }
        let trackIds = tracks.map((track) => track.uri.replace('spotify:track:', ''));
        return Array.from(new Set(trackIds));
    }

    function tryParseJSON(file) {
        if (!file) return {};
        try {
            let dataAsString = tryGetBlob(file);
            let hashIndex = dataAsString.indexOf('#');
            return JSON.parse(dataAsString.substring(hashIndex + 1));
        } catch (error) {
            Admin.printError(error.stack);
            return {};
        }
    }

    function tryGetBlob(file) {
        if (!file) return '';
        try {
            return file.getBlob().getDataAsString();
        } catch (error) {
            Admin.printError('При получении данных из файла произошла ошибка\n', error.stack);
            Admin.pause(5);
            return tryGetBlob(file);
        }
    }

    function getFile(filename) {
        let files = Cache.UserFolder.getFilesByName(filename);
        if (files.hasNext()) {
            return files.next();
        }
    }
})();