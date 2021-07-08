const Helper = (function () {
    const FILENAME = 'LaunchState.json';

    return {
        parseId: parseId,
        readState: readState,
        updateState: updateState,
    };

    function parseId(string) {
        let pattern = '[open.spotify.com|spotify]+[\/|:](track|playlist|album|artist|show|episode|concert|user)[\/|:]([^?/#& ]+)';
        let [fullMatch, type, id] = string.match(new RegExp(pattern, 'i')) || [];
        return id;
    }

    function readState(id) {
        return readAllStates()[id] || {};
    }

    function updateState(id, value = {}) {
        let states = readAllStates();
        states[id] = value;
        Cache.write(FILENAME, states);
    }

    function readAllStates(){
        let states = Cache.read(FILENAME);
        return Array.isArray(states) ? {} : states;
    }

})();