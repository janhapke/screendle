const stream = require('stream');

jest.mock('request');

const darksky = require('../../src/backend/darksky');

describe('backend/darksky', () => {
    beforeEach(() => {
        darkskyConfig = {
            API_KEY: 'api-key',
            LAT: 50.0,
            LON: 10.0,
        };

        mockWritable = new stream.Writable({
            write(chunk, enc, next) {
                next();
            }
        });

        mockReadable = new stream.Readable({
            read(size) {
                this.push(null);
            }
        });

        mockRequest = require('request');
        mockRequest.mockReturnValue(mockReadable);
    });

    afterEach(() => {
        mockRequest.mockClear();
    });

    test('module exports a function that returns a function', () => {
        expect(typeof darksky(darkskyConfig)).toEqual('function');
    });

    test('throws error if API_KEY is missing from config', () => {
        expect(() => darksky({LAT: 50.0, LON: 10.0})).toThrow();
    });

    test('throws error if LAT is missing from config', () => {
        expect(() => darksky({API_KEY: '000000', LON: 10.0})).toThrow();
    });

    test('throws error if LON is missing from config', () => {
        expect(() => darksky({API_KEY: '000000', LAT: 50.0})).toThrow();
    });

    test('makes request', () => {
        const routeHandler = darksky(darkskyConfig);
        
        routeHandler(null, mockWritable);

        expect(mockRequest).toHaveBeenCalled();
        expect(mockRequest).toHaveBeenCalledWith('https://api.darksky.net/forecast/api-key/50,10', {'qs': {'lang': 'en', 'units': 'si'}});
    });

    test('makes request with API_KEY from config', () => {
        const routeHandler = darksky({...darkskyConfig, API_KEY: '0000000000000000' });
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][0]).toEqual('https://api.darksky.net/forecast/0000000000000000/50,10');
    });

    test('makes request with LAT from config', () => {
        const routeHandler = darksky({...darkskyConfig, LAT: '99.999' });
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][0]).toEqual('https://api.darksky.net/forecast/api-key/99.999,10');
    });

    test('makes request with LON from config', () => {
        const routeHandler = darksky({...darkskyConfig, LON: '9.999' });
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][0]).toEqual('https://api.darksky.net/forecast/api-key/50,9.999');
    });

    test('makes request with LANGUAGE from config', () => {
        const routeHandler = darksky({...darkskyConfig, LANGUAGE: 'de' });
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][1].qs.lang).toEqual('de');
    });

    test('makes request with UNITS from config', () => {
        const routeHandler = darksky({...darkskyConfig, UNITS: 'us' });
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][1].qs.units).toEqual('us');
    });

});
