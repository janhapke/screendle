const stream = require('stream');

jest.mock('request');

const hvv = require('../../src/backend/hvv');

describe('backend/hvv', () => {
    beforeEach(() => {
        hvvConfig = {
            MONITOR_URL: 'https://abfahrten.hvv.de/a31213c3-7b00-4bef-8bd2-b5e4a28c067f',
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
        expect(typeof hvv(hvvConfig)).toEqual('function');
    });

    test('throws error if MONITOR_URL is missing from config', () => {
        expect(() => hvv({})).toThrow();
    });

    test('throws error if MONITOR_URL has bad format', () => {
        expect(() => hvv({MONITOR_URL: 'http://example.com/'})).toThrow();
    });

    test('makes request', () => {
        const routeHandler = hvv(hvvConfig);
        
        routeHandler(null, mockWritable);

        expect(mockRequest).toHaveBeenCalled();
    });

    test('makes api request with monitor id extracted from config', () => {
        const routeHandler = hvv(hvvConfig);
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][0]).toEqual('https://abfahrten.hvv.de/api/monitors/a31213c3-7b00-4bef-8bd2-b5e4a28c067f');
    });

    test('makes api request with preview monitor id extracted from config', () => {
        const routeHandler = hvv({ MONITOR_URL: 'https://abfahrten.hvv.de/vorschau/0-1-2-3-4'});
        
        routeHandler(null, mockWritable);

        expect(mockRequest.mock.calls[0][0]).toEqual('https://abfahrten.hvv.de/api/monitors/0-1-2-3-4');
    });

    test('sends header object', () => {
        const routeHandler = hvv(hvvConfig);
        
        routeHandler(null, mockWritable);

        expect(typeof mockRequest.mock.calls[0][1].headers).toEqual('object');
        expect(mockRequest.mock.calls[0][1].headers['Accept']).toEqual('*/*');
        expect(mockRequest.mock.calls[0][1].headers['Accept-Encoding']).toEqual('gzip, deflate');
        expect(mockRequest.mock.calls[0][1].headers['Content-Type']).toEqual('application/vnd.api+json');
        expect(mockRequest.mock.calls[0][1].headers['Referrer']).toEqual(hvvConfig.MONITOR_URL);
        expect(mockRequest.mock.calls[0][1].headers['User-Agent']).toEqual('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:67.0) Gecko/20100101 Firefox/67.0');
        expect(mockRequest.mock.calls[0][1].headers['X-Requested-With']).toEqual('XMLHttpRequest');
    });

});
