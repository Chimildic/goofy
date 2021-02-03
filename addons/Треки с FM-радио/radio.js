const Radio = (function () {
    const URL_BASE = 'https://top-radio.ru/';
    return {
        getTracks: getTracks,
        getTopTracks: getTopTracks,
    };

    function getTracks(station, date) {
        let url = `${URL_BASE}playlist/${station}`;
        if (typeof date != 'undefined') {
            url += `?date=${date}`;
        }
        return Search.multisearchTracks(parseTracks(url), parseNameTrack);
    }

    function getTopTracks(station) {
        let url = `${URL_BASE}tracks/${station}`;
        return Search.multisearchTracks(parseTracks(url), parseNameTrack);
    }

    function parseNameTrack(item) {
        let re = /( x | feat*\w+| vs*\W+|,|&|\/|[(])/gi;
        let artist = item.artist.split(re)[0];
        let song = item.song.split(re)[0];
        return `${artist} ${song}`.formatName();
    }

    function parseTracks(url) {
        let cheerio = createCherio(url);
        let songs = cheerio('.song');
        let tracks = [];
        cheerio('.artist').each((index, node) =>
            tracks.push({
                artist: cheerio(node).text(),
                song: cheerio(songs[index]).text(),
            })
        );
        return tracks;
    }

    function createCherio(url) {
        let content = CustomUrlFetchApp.fetch(url).getContentText();
        return Cheerio.load(content);
    }
})();
