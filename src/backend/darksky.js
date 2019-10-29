const request = require('request');

module.exports = cfg => {
    const config = {
        API_KEY: cfg.API_KEY,
        LAT: cfg.LAT,
        LON: cfg.LON,
        LANGUAGE: cfg.LANGUAGE || 'en',
        UNITS: cfg.UNITS || 'si',
        API_HOST: cfg.API_HOST || 'api.darksky.net',
    };

    if (!config.API_KEY) {
        throw new Error('DarkSky API Key must be set in config as API_KEY!');
    }

    if (!config.LAT || !config.LON) {
        throw new Error('LAT and LON must be specified in config!');
    }

    return (req, res) => {
        const url = 'https://' + config.API_HOST + '/forecast/' + config.API_KEY + '/' + config.LAT + ',' + config.LON;

        request(url, { qs: { units: config.UNITS, lang: config.LANGUAGE } }).pipe(res);
    };

};
