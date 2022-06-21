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
    return Search.multisearchTracks(strTracks);
  }

  function parseTracks(station, type) {
    let tracknames = [];
    let cheerio = createCherio(`${URL_BASE}playlist/${station}`);
    let root = type == 'top' ? cheerio('#tophit-list') : cheerio('#track-list');
    cheerio('.tkl-title', '', root).each((i, titleNode) => {
      let [artist, track] = loadRow(titleNode.children);
      tracknames.push(`${artist} ${track ? parseNameTrack(track) : ''}`.formatName());
    });
    return tracknames.slice(1);

    function loadRow(children) {
      let row = [];
      cheerio(children).each((j, childNode) => {
        let col = cheerio(childNode).text().trim();
        col.length > 0 && row.push(col);
      })
      return row;
    }
  }

  function createCherio(url) {
    return Cheerio.load(CustomUrlFetchApp.fetch(url).getContentText());
  }

  function parseNameTrack(item) {
    let re = /( x | feat*\w+| vs*\W+|,|\/|[(]| \+ id)/gi;
    return item.split(re)[0];
  }
})();