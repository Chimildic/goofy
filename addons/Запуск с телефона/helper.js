const Helper = (function () {

    return {
      parseId: parseId,
    }
  
    function parseId(string) {
      let pattern = '[open.spotify.com|spotify]+[\/|:](track|playlist|album|artist|show|episode|concert|user)[\/|:]([^?/#& ]+)';
      let [fullMatch, type, id] = string.match(new RegExp(pattern, 'i')) || [];
      return id;
    }
  
  })();