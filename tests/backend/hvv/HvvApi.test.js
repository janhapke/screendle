const { Response } = require('jest-express/lib/response');
const { DateTime } = require('luxon');

jest.mock('request-promise-native');

const HvvApi = require('../../../src/backend/hvv/HvvApi');

describe('backend/hvv/HvvApi', () => {

    beforeEach(() => {
        hvvConfig = {
            MONITOR_ID: '0-1-2-3-4',
        };

        monitorConfig = {
            "stationList": [
                {
                    "name": "Hauptbahnhof",
                    "id": "Master:1",
                    "city": "Hamburg",
                    "type": "STATION"
                }
            ],
            "filterList": [
                {
                    "serviceID": "BAHN-1",
                    "stationIDs": [
                        "Master:11"
                    ]
                },
                {
                    "serviceID": "BAHN-2",
                    "stationIDs": [
                        "Master:12"
                    ]
                }
            ],
            "timeOffset": "10"
        };

        departureList = {
            "returnCode": "OK",
            "time": {
              "date": "29.03.2020",
              "time": "14:05"
            },
            "departures": [
              {
                "line": {
                  "name": "S21",
                  "direction": "Ostbahnhof",
                  "origin": "Hauptbahnhof",
                  "type": {
                    "simpleType": "TRAIN",
                    "shortInfo": "S",
                    "longInfo": "S-Bahn",
                    "model": "S-Bahn"
                  },
                  "id": "BAHN-1"
                },
                "timeOffset": 10,
                "serviceId": 4711,
                "station": {
                  "combinedName": "Hauptbahnhof",
                  "id": "Master:1"
                },
                "platform": "Gleis 1"
              },
              {
                "line": {
                  "name": "RE1",
                  "direction": "Westbahnhof",
                  "origin": "Hauptbahnhof",
                  "type": {
                    "simpleType": "TRAIN",
                    "shortInfo": "RE",
                    "longInfo": "RegionalExpress",
                    "model": "Regional-Express"
                  },
                  "id": "BAHN-2"
                },
                "timeOffset": 30,
                "serviceId": 11833,
                "station": {
                  "combinedName": "Hauptbahnhof",
                  "id": "Master:1"
                },
                "platform": "Gleis 2"
              }
            ]
        };

        response = new Response();

        mockRequest = require('request-promise-native');
    });

    afterEach(() => {
        response.resetMocked();
        mockRequest.mockClear();
    });

    test('constructor', () => {
        const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
    });

    describe('getMontiorConfig', () => {
        
        beforeEach(() => {
            mockRequest.mockReturnValue(Promise.resolve(JSON.stringify(monitorConfig)));
        });

        test('makes request', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getMontiorConfig().then(config => {
                expect(mockRequest).toHaveBeenCalled();
            });
        });
    
        test('makes request to monitor config endpoint', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getMontiorConfig().then(config => {
                expect(mockRequest.mock.calls[0][0].url).toEqual('https://www.hvv.de/' + ['linking-service', 'abfahrten', 'show', hvvConfig.MONITOR_ID].join('/'));
            });
        });
    });

    describe('getDepartureList', () => {
        
        beforeEach(() => {
            mockRequest.mockReturnValue(Promise.resolve(JSON.stringify(departureList)));
        });

        test('makes request', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(list => {
                expect(mockRequest).toHaveBeenCalled();
            });
        });
    
        test('makes request to geofox departureList endpoint', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(config => {
                expect(mockRequest.mock.calls[0][0].url).toEqual('https://www.hvv.de/' + ['geofox', 'departureList'].join('/'));
            });
        });
    
        test('makes JSON POST request', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(config => {
                expect(mockRequest.mock.calls[0][0].method).toEqual('POST');
                expect(mockRequest.mock.calls[0][0].headers['Accept']).toEqual('application/json');
                expect(mockRequest.mock.calls[0][0].headers['Content-Type']).toEqual('application/json');
            });
        });
    
        test('sends JSON body', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(config => {
                const body = mockRequest.mock.calls[0][0].body;
                const parsedBody = JSON.parse(body);
                expect(parsedBody).not.toEqual(null);
            });
        });
    
        test('sends stations', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(config => {
                const body = mockRequest.mock.calls[0][0].body;
                const parsedBody = JSON.parse(body);
                expect(parsedBody.stations).toEqual(monitorConfig.stationList);
            });
        });
    
        test('sends filter', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(config => {
                const body = mockRequest.mock.calls[0][0].body;
                const parsedBody = JSON.parse(body);
                expect(parsedBody.filter).toEqual(monitorConfig.filterList);
            });
        });
    
        test('sends time', () => {
            const hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            return hvvApi.getDepartureList(monitorConfig).then(config => {
                const now = DateTime.local().setZone('Europe/Berlin');
                const body = mockRequest.mock.calls[0][0].body;
                const parsedBody = JSON.parse(body);
                const parsedTime = DateTime.fromFormat(parsedBody.time.date + ' ' + parsedBody.time.time, 'dd.LL.yyyy HH:mm', {zone: 'Europe/Berlin'});
                expect(parseInt(parsedTime.toFormat('x'))).toBeLessThanOrEqual(parseInt(now.plus({minute: 1}).toFormat('x')));
                expect(parseInt(parsedTime.toFormat('x'))).toBeGreaterThanOrEqual(parseInt(now.minus({minute: 1}).toFormat('x')));
            });
        });

    });

    describe('formatDepartureList', () => {

        beforeEach(() => {
            hvvApi = new HvvApi(hvvConfig.MONITOR_ID);
            result = hvvApi.formatDepartureList(departureList);
        });

        test('returns the correct structure', () => {
            expect(result.data).toBeDefined();
            expect(result.data.attributes).toBeDefined();
            expect(result.data.attributes.departures).toBeDefined();
            expect(Array.isArray(result.data.attributes.departures)).toEqual(true);
        });

        test('renames lines', () => {
            expect(result.data.attributes.departures[0].line).toEqual('S21');
            expect(result.data.attributes.departures[1].line).toEqual('RE1');
        });

        test('renames directions', () => {
            expect(result.data.attributes.departures[0].direction).toEqual('Ostbahnhof');
            expect(result.data.attributes.departures[1].direction).toEqual('Westbahnhof');
        });

        test('applies time offsets', () => {
            expect(result.data.attributes.departures[0].time).toEqual('14:15');
            expect(result.data.attributes.departures[1].time).toEqual('14:35');
        });

    });

});
