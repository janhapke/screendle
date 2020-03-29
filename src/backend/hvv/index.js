const HvvApi = require('./HvvApi');

module.exports = cfg => {

    const monitorUrlMatches = cfg.MONITOR_URL.match(new RegExp('^https?://abfahrten\.hvv\.de/(?:vorschau/)?([a-f0-9-]+)/?$'));

    if (!monitorUrlMatches || monitorUrlMatches.length !== 2) {
        throw new Error('Invalid MONITOR_URL in configuration!')
    }

    const config = {
        MONITOR_URL: cfg.MONITOR_URL,
        MONITOR_ID: monitorUrlMatches[1].replace(/-/g, ''),
    };

    const hvvApi = new HvvApi(config.MONITOR_ID);

    return async function(req, res) {
        try {
            const monitorConfig = await hvvApi.getMontiorConfig();
            const departureList = await hvvApi.getDepartureList(monitorConfig);

            return res.json(hvvApi.formatDepartureList(departureList));
        } catch (error) {
            console.error(error);
            return res.status(500).json(error);
        }
    };

}
