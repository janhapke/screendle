const request = require('request');

module.exports = cfg => {

    const monitorUrlMatches = cfg.MONITOR_URL.match(new RegExp('^https?://abfahrten\.hvv\.de/(?:vorschau/)?([a-f0-9-]+)/?$'));

    if (!monitorUrlMatches || monitorUrlMatches.length !== 2) {
        throw new Error('Invalid MONITOR_URL in configuration!')
    }

    const config = {
        MONITOR_URL: cfg.MONITOR_URL,
        MONITOR_ID: monitorUrlMatches[1],
    };

    return function(req, res) {
        const url = 'https://abfahrten.hvv.de/api/monitors/' + config.MONITOR_ID;
        request(
            url,
            {
                headers: {
                    'Accept': '*/*',
                    'Accept-Encoding': 'gzip, deflate',
                    'Content-Type': 'application/vnd.api+json',
                    'Referrer': config.MONITOR_URL,
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0',
                    'X-Requested-With': 'XMLHttpRequest',
                }
            }
        ).pipe(res);
    };

}
