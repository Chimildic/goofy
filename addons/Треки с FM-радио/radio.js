// Описание https://github.com/Chimildic/goofy/discussions/35
const Radio = (function () {
  const URL_BASE = 'http://the-radio.ru/';
  return {
    getTracks: getTracks,
    getTopTracks: getTopTracks,
  };

  function getTracks(station, limit) {
    return start(station, 'tracklist', limit);
  }

  function getTopTracks(station, limit) {
    return start(station, 'top', limit);
  }

  function start(station, type, limit) {
    let strTracks = Selector.sliceFirst(parseTracks(station, type), limit);
    return Search.multisearchTracks(strTracks, parseNameTrack);
  }

  function parseTracks(station, type) {
    let tracks = [];
    let cheerio = createCherio(`${URL_BASE}playlist/${station}`);
    let root = type == 'top' ? cheerio('#tophit-list') : cheerio('#track-list');
    cheerio('.tkl-title', '', root).each((index, node) => {
      let artist = cheerio(node).children('.tkl-artist').text();
      let track = parseNameTrack(cheerio(node).children('.tkl-clr').text());
      tracks.push(`${artist} ${track}`.formatName());
    });
    return tracks.slice(1);
  }

  function createCherio(url) {
    return Cheerio.load(CustomUrlFetchApp.fetch(url).getContentText());
  }

  function parseNameTrack(item) {
    let re = /( x | feat*\w+| vs*\W+|,|\/|[(]| \+ id)/gi;
    return item.split(re)[0].formatName();
  }
})();