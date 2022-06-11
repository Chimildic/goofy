function setProperties(){
    // Описание параметров: chimildic.github.io/goofy/#/guide?id=Параметры
    UserProperties.setProperty('CLIENT_ID', 'вашеЗначение');
    UserProperties.setProperty('CLIENT_SECRET', 'вашеЗначение');
    UserProperties.setProperty('LASTFM_API_KEY', 'вашеЗначение');
    UserProperties.setProperty('MUSIXMATCH_API_KEY', 'вашеЗначение');

    UserProperties.setProperty('ON_SPOTIFY_RECENT_TRACKS', 'true');
    UserProperties.setProperty('ON_LASTFM_RECENT_TRACKS', 'false');
    UserProperties.setProperty('COUNT_RECENT_TRACKS', '60000');

    UserProperties.setProperty('LASTFM_LOGIN', 'вашЛогин');
    UserProperties.setProperty('LASTFM_RANGE_RECENT_TRACKS', '30');

    UserProperties.setProperty('LOG_LEVEL', 'info');
    UserProperties.setProperty('LOCALE', 'RU');
    UserProperties.setProperty('REQUESTS_IN_ROW', '40');
}

// Чтобы посмотреть текущие значения параметров
// console.log(UserProperties.getProperties());

// Чтобы сбросить авторизацию и параметры
// Admin.reset();