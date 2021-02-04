const Release = (function () {
    const URL_BASE = 'http://everynoise.com/new_releases_by_genre.cgi';
    return {
        getTracks: getTracks,
    };

    function getTracks(params) {
        return getAlbums(params).reduce((tracks, album) => {
            return Combiner.push(tracks, album.tracks.items);
        }, []);
    }

    function getAlbums(params) {
        params.date = params.date ? params.date.replace(/-/g, '') : '';
        params.region = params.region || 'RU';
        params.type = params.type || 'album,single';

        let template = `%s?genre=%s&region=%s&date=%s&hidedupes=on`;
        let url = Utilities.formatString(template, URL_BASE, params.genre, params.region, params.date);

        let albumIds = parseAlbumIds(url, params.genre);
        let albums = SpotifyRequest.getFullObjByIds('albums', albumIds, 20);
        return albums.filter((album) => params.type.includes(album.album_type));
    }

    function parseAlbumIds(url, genre) {
        let albumsIds = [];
        let cheerio = createCherio(url);
        let rootId = genre.replace(/[- ]/g, '');
        let root = cheerio(`#${rootId}`).next();
        cheerio('.albumbox', '', root).each((index, node) => {
            let uri = cheerio('a[href^="spotify:album:"]', '', node).attr('href');
            let id = uri.split(':')[2];
            albumsIds.push(id);
        });
        return albumsIds;
    }

    function createCherio(url) {
        let content = CustomUrlFetchApp.fetch(url).getContentText();
        return Cheerio.load(content);
    }
})();
