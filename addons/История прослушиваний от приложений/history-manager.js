const HistoryManager = (function () {
    const FOLDER_NAME = 'Goofy Data';
    const FILES = ['SpotifyHistoryPC', 'SpotifyHistoryPhone'];
    const rootFolder = getRootFolder();

    return {
        getTracks: getTracks,
        removeTracks: removeTracks,
        readTrackIds: readTrackIds,
        read: read,
    };

    function getTracks(){
        return SpotifyRequest.getFullObjByIds('tracks', readTrackIds(), 50);
    }

    function removeTracks(tracks){
        let trackHistoryIds = readTrackIds();
        return tracks.filter((track) => !trackHistoryIds.includes(track.id));
    }

    function readTrackIds() {
        let tracks = [];
        for (let i = 0; i < FILES.length; i++){
            let data = read(FILES[i]);
            if (data.play_history && data.play_history.tracks){
                Combiner.push(tracks, data.play_history.tracks);
            }
        }
        return dedup(tracks.map((track) => {
            return track.uri.replace('spotify:track:', '');
        }));
    }

    function dedup(trackIds){
        return Array.from(new Set(trackIds));
    }

    function read(filename) {
        return tryParseJSON(getFile(filename));
    }

    function tryParseJSON(file) {
        if (!file) return {};
                console.log('file', file.getName());
        let blob = file.getBlob();
        console.log('blob', blob.toString());
        let text = blob.getDataAsString();
        console.log('text length', text.length);
        console.log('text', text);
        try {
            let hashIndex = text.indexOf('#');
            return JSON.parse(text.substring(hashIndex + 1));
        } catch (e) {
            console.error(e, e.stack, text);
            return {};
        }
    }

    function getFile(filename) {
        let files = getFileIterator(filename);
        if (files.hasNext()) {
            return files.next();
        }
    }

    function getFileIterator(filename) {
        return rootFolder.getFilesByName(filename);
    }

    function getRootFolder() {
        let folders = DriveApp.getFoldersByName(FOLDER_NAME);
        if (folders.hasNext()) {
            return folders.next();
        }
        return DriveApp.createFolder(FOLDER_NAME);
    }
})();
