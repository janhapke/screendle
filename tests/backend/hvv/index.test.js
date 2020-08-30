const { Response } = require('jest-express/lib/response');
const HvvApi = require('../../../src/backend/hvv/HvvApi');
const hvv = require('../../../src/backend/hvv');

const mockGetMonitorConfig = jest.fn();

const mockGetDepartureList = jest.fn();
mockGetDepartureList.mockReturnValue(Promise.resolve({}));

const mockFormatDepartureList = jest.fn();

jest.mock('../../../src/backend/hvv/HvvApi', () => {
  return jest.fn().mockImplementation(() => {
    return {
        getMontiorConfig: mockGetMonitorConfig,
        getDepartureList: mockGetDepartureList,
        formatDepartureList: mockFormatDepartureList,
    };
  });
});

describe('backend/hvv', () => {

    beforeEach(() => {
        hvvConfig = {
            MONITOR_URL: 'https://abfahrten.hvv.de/1-2-3-4',
        }

        response = new Response();

        HvvApi.mockClear();
        mockGetMonitorConfig.mockClear();
        mockGetDepartureList.mockClear();
        mockFormatDepartureList.mockClear();

        mockMonitorConfig = {
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
                }
            ],
            "timeOffset": "10"
        };
        
        mockDepartureList = {
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
              }
            ]
        };

        mockFormattedDepartureList = {
            data: {
                attributes: {
                    departures: [
                        {
                            line: 'S21',
                            direction: 'Ostbahnhof',
                            time: '14:15',
                        }
                    ]
                }
            }
        }
    });

    afterEach(() => {
        response.resetMocked();
    });

    test('module exports a function that returns a function', () => {
        expect(typeof hvv(hvvConfig)).toEqual('function');
    });

    test('throws error if MONITOR_URL is missing from config', () => {
        expect(() => hvv({})).toThrow();
    });

    test('throws error if MONITOR_URL has bad format', () => {
        expect(() => hvv({MONITOR_URL: 'http://example.com/'})).toThrow();
    });

    test('accepts old MONITOR_URL format', () => {
        expect(() => hvv({MONITOR_URL: 'https://abfahrten.hvv.de/1-2-3-4-5'})).not.toThrow();
    });

    test('accepts new MONITOR_URL format', () => {
        expect(() => hvv({MONITOR_URL: 'https://www.hvv.de/de/fahrplaene/abruf-fahrplaninfos/abfahrten-auf-ihrem-monitor/abfahrten-anzeige?show=12345'})).not.toThrow();
    });

    test('calls getMonitorConfig', () => {
        const routeHandler = hvv(hvvConfig);
        routeHandler(null, response);
        expect(mockGetMonitorConfig).toHaveBeenCalled();
    });

    test('calls getDepartureList with monitorConfig', async () => {
        mockGetMonitorConfig.mockReturnValue(Promise.resolve(mockMonitorConfig));

        const routeHandler = hvv(hvvConfig);
        await routeHandler(null, response);
        expect(mockGetDepartureList).toHaveBeenCalled();
        expect(mockGetDepartureList.mock.calls[0][0]).toEqual(mockMonitorConfig);
    });

    test('calls formatDepartureList with departureList', async () => {
        const routeHandler = hvv(hvvConfig);
        
        mockGetDepartureList.mockReturnValue(Promise.resolve(mockDepartureList));

        await routeHandler(null, response);

        expect(mockFormatDepartureList).toHaveBeenCalled();
        expect(mockFormatDepartureList.mock.calls[0][0]).toEqual(mockDepartureList);
    });

    test('calls response.json', async () => {
        const routeHandler = hvv(hvvConfig);
        await routeHandler(null, response);
        expect(response.json.mock.calls.length).toEqual(1);
    });

    test('sends result of formatDepartureList', async () => {
        const routeHandler = hvv(hvvConfig);
        mockFormatDepartureList.mockReturnValue(mockFormatDepartureList);
        await routeHandler(null, response);
        expect(response.json.mock.calls[0][0]).toEqual(mockFormatDepartureList);
    });

});
