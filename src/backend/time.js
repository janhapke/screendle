const { DateTime } = require('luxon');

/**
 * Time Route Handler
 * 
 * Returns the current timestamp and the offset to a configurable time zone.
 * This allows the frontend to display the server-side time, which should be
 * more accurate than the Kindle's built-in clock.
 */
module.exports = cfg => {

    const config = {
        TIMEZONE: cfg.TIMEZONE || 'UTC',
    };

    return (req, res) => {
        const utc = DateTime.utc();
        const local = DateTime.utc().setZone(config.TIMEZONE);
        res.json({
            utc: utc.toFormat('x'),
            zoneName: local.zoneName,
            zoneOffset: local.offset,
        })
    }

};
