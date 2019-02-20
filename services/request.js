const request = require('request');
 
_EXTERNAL_URL = 'http://omo.akamai.opta.net/competition.php?competition=24&season_id=2018&feed_type=F40&user=fanlive&psw=sP0n5oRl1v3';

const callExternalApiUsingRequest = (callback) => {
    request(_EXTERNAL_URL, { json: true }, (err, res, body) => {
    if (err) { 
        return callback(err);
     }
    return callback(body);
    });
}

module.exports.callApi = callExternalApiUsingRequest;