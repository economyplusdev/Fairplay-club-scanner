const { key, webhook, realmid, realmcode } = require('./config.json');


var clubscan = require('./modules/clubscan.js');
clubscan.clubscan(realmcode, key, webhook)