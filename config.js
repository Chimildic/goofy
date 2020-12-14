// Описание параметров: https://github.com/Chimildic/goofy/blob/main/guide/README.md#параметры
function setProperties(){
    let userProperties = PropertiesService.getUserProperties();
    userProperties.setProperty('CLIENT_ID', 'вашеЗначение');
    userProperties.setProperty('CLIENT_SECRET', 'вашеЗначение');
    userProperties.setProperty('LASTFM_API_KEY', 'вашеЗначение');
    userProperties.setProperty('ON_SPOTIFY_RECENT_TRACKS', 'true');
    userProperties.setProperty('ON_LASTFM_RECENT_TRACKS', 'false');
    userProperties.setProperty('LASTFM_RANGE_RECENT_TRACKS', '30');
    userProperties.setProperty('LASTFM_LOGIN', 'вашЛогин');
}

function logProperties(){
    console.log(PropertiesService.getUserProperties().getProperties());
}