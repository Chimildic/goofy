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
      cheerio('.tkl-item', '', root).each((index, node) => {
        tracks.push(cheerio(node).children('.tkl-title').text());
      });
      return tracks.slice(1);
    }
  
    function createCherio(url) {
      return Cheerio.load(CustomUrlFetchApp.fetch(url).getContentText());
    }
  
    function parseNameTrack(item) {
      let re = /( x | feat*\w+| vs*\W+)/gi;
      return item.split(re)[0].formatName();
    }
  })();