const Radio = (function () {
    const URL_BASE = 'https://top-radio.ru/';
    return {
        getTracks: getTracks, // треки за день, не более недели
        getTopTracks: getTopTracks, // топ-100
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

    function parseNameTrack(str) {
        return str
            .formatName()
            .replace(/( x )/g, ' ')
            .replace(/( feat )/g, ' ');
    }

    function parseTracks(url) {
        let tracks = [];
        let cheerio = createCherio(url);
        let songs = cheerio('.song');
        cheerio('.artist').each((index, node) => {
            let artist = cheerio(node).text().split(/,|&|x|feat/)[0];
            let track = cheerio(songs[index]).text().split('(')[0];
            tracks.push(`${artist} ${track}`);
        });
        return tracks;
    }

    function createCherio(url) {
        let content = CustomUrlFetchApp.fetch(url).getContentText();
        return Cheerio.load(content);
    }
})();
