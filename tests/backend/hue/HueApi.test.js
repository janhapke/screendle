const { Response } = require('jest-express/lib/response');

jest.mock('request-promise-native');

const HueApi = require('../../../src/backend/hue/HueApi');

describe('backend/hue/Hue', () => {

    beforeEach(() => {
        hueConfig = {
            BRIDGE_HOST: '127.0.0.1',
            API_USER: 'api-user',
        };

        groups = {
            1: { name: 'Dummy', type: 'Room' },
            2: { name: 'Other', type: 'Other' }
        };

        response = new Response();

        mockRequest = require('request-promise-native');
        mockRequest.mockReturnValue(Promise.resolve(groups));
    });

    afterEach(() => {
        response.resetMocked();
        mockRequest.mockClear();
    });

    test('constructor', () => {
        const hueApi = new HueApi(null, null);
    });

    test('_getBaseUrl', () => {
        const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
        expect(hueApi._getBaseUrl()).toEqual('http://' + hueConfig.BRIDGE_HOST + '/api/' + hueConfig.API_USER);
    });

    describe('getRooms', () => {
        test('makes request', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.getRooms().then(rooms => {
                expect(mockRequest).toHaveBeenCalled();
            });
        });
    
        test('makes request to groups endpoint', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.getRooms().then(rooms => {
                expect(mockRequest.mock.calls[0][0]).toEqual(hueApi._getBaseUrl() + '/groups');
            });
        });
    
        test('makes json request', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.getRooms().then(rooms => {
                expect(mockRequest.mock.calls[0][1].json).toEqual(true);
            });
        });
    
        test('returns only rooms and not groups', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.getRooms().then(rooms => {
                expect(rooms).toEqual({1: groups[1]});
            });
        });
    });

    describe('switchRoom', () => {
        
        beforeEach(() => {
            req = {
                body: {
                    roomId: 4711,
                    on: true,
                }
            }
        })
        test('makes request', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.switchRoom(4711, true).then(() => {
                expect(mockRequest).toHaveBeenCalled();
            });
        });
    
        test('makes request to brige with api user and room id', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.switchRoom(4711, true).then(() => {
                expect(mockRequest.mock.calls[0][0]).toEqual('http://127.0.0.1/api/api-user/groups/4711/action');
            });
        });
    
        test('makes PUT request', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.switchRoom(4711, true).then(() => {
                expect(mockRequest.mock.calls[0][1].method).toEqual('PUT');
            });
        });
    
        test('makes json request', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.switchRoom(4711, true).then(() => {
                expect(mockRequest.mock.calls[0][1].json).toEqual(true);
            });
        });
    
        test('sends PUT body', () => {
            const hueApi = new HueApi(hueConfig.BRIDGE_HOST, hueConfig.API_USER);
            return hueApi.switchRoom(4711, true).then(() => {
                expect(mockRequest.mock.calls[0][1].body).toEqual({on: true});
            });
        });
    });

    test('_filterRooms removes groups that are not of type Room', () => {
        const hueApi = new HueApi({});

        expect(hueApi._filterRooms(groups)).toEqual({1: groups[1]});
    });

});
