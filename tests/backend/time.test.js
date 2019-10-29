const { Response } = require('jest-express/lib/response');
const { DateTime } = require('luxon');

const time = require('../../src/backend/time');

describe('backend/time', () => {
    beforeEach(() => {
        date = new Date();
        response = new Response();
    });

    afterEach(() => {
        response.resetMocked();
    });

    test('module exports a function that returns a function', () => {
        expect(typeof time({})).toEqual('function');
    });

    test('calls response.json', () => {
        const routeHandler = time({});
        routeHandler(null, response);
        expect(response.json.mock.calls.length).toEqual(1);
    });
 
    test('defaults to UTC', () => {
        const routeHandler = time({});
        routeHandler(null, response);
        expect(response.json.mock.calls[0][0].zoneName).toEqual('UTC');
    });

    test('returns current timestamp', () => {
        const routeHandler = time({});
        routeHandler(null, response);
        // timestamp should be within last 60 seconds
        expect(parseInt(response.json.mock.calls[0][0].utc)).toBeGreaterThanOrEqual(parseInt(DateTime.utc().minus({seconds: 60}).toFormat('x')));
        expect(parseInt(response.json.mock.calls[0][0].utc)).toBeLessThanOrEqual(parseInt(DateTime.utc().toFormat('x')));
    });

    test('returns timezone offset', () => {
        const routeHandler = time({});
        routeHandler(null, response);
        expect(response.json.mock.calls[0][0].zoneOffset).toEqual(DateTime.utc().offset);
    });
 
    test('can be configured to use another timezone', () => {
        const routeHandler = time({ TIMEZONE: 'Europe/Berlin' });
        routeHandler(null, response);
        expect(response.json.mock.calls[0][0].zoneName).toEqual('Europe/Berlin');
        // timestamp should be within last 60 seconds
        expect(parseInt(response.json.mock.calls[0][0].utc)).toBeGreaterThanOrEqual(parseInt(DateTime.utc().minus({seconds: 60}).toFormat('x')));
        expect(parseInt(response.json.mock.calls[0][0].utc)).toBeLessThanOrEqual(parseInt(DateTime.utc().toFormat('x')));
        
        expect(response.json.mock.calls[0][0].zoneOffset).toEqual(DateTime.utc().setZone('Europe/Berlin').offset);
    });

});
