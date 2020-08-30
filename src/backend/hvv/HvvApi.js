const request = require('request-promise-native');
const { DateTime} = require('luxon');

class HvvApi {
    constructor(monitorId) {
        this.baseUrl = 'https://www.hvv.de/';
        this.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:75.0) Gecko/20100101 Firefox/75.0';
        this.monitorId = monitorId;
    }

    getMontiorConfig() {
        return request(
            {
                url: this.baseUrl + ['linking-service', 'abfahrten', 'show', this.monitorId].join('/'),
                headers: {
                    'Accept': '*/*',
                    'User-Agent': this.userAgent,
                }
            }
        )
        .then(JSON.parse)
    }

    getDepartureList(monitorConfig) {
        const requestBody = {
            "version": 36,
            "stations": monitorConfig.stationList,
            "filter": monitorConfig.filterList,
            "time": {
                "date": DateTime.local().setZone('Europe/Berlin').toFormat('dd.LL.yyyy'),
                "time": DateTime.local().setZone('Europe/Berlin').toFormat('HH:mm')
            },
            "maxList": 20,
            "allStationsInChangingNode": true,
            "maxTimeOffset": 200,
            "useRealtime": true
        };
        return request(
            {
                method: 'POST',
                url: this.baseUrl + ['geofox', 'departureList'].join('/'),
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': this.userAgent,
                    'X-Platform': 'web',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Referer': this.baseUrl + ['de', 'fahrplaene', 'abruf-fahrplaninfos', 'abfahrten-auf-ihrem-monitor', 'abfahrten-anzeige?show=' + this.monitorId].join('/'),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            }
        )
        .then(JSON.parse)
    }

    formatDepartureList(departureList) {
        const startDate = departureList.time ? DateTime.fromFormat(departureList.time.date + ' ' + departureList.time.time, 'dd.LL.yyyy HH:mm') : DateTime.local();
        const departures = (Array.isArray(departureList.departures) ? departureList.departures : []).map(departure => {
            return {
                line: departure.line.name,
                direction: departure.line.direction,
                time: startDate.plus({minute: departure.timeOffset}).toFormat('HH:mm'),
                hasDelay: !!(departure.delay),
                delay: departure.delay ? '(+' + Math.round(departure.delay / 60) + ')' : '',
            };
        });

        return {
            data: {
                attributes: {
                    departures: departures
                }
            }
        };
    }
}

module.exports = HvvApi;
