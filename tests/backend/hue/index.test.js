const { Response } = require('jest-express/lib/response');
const HueApi = require('../../../src/backend/hue/HueApi');
const hue = require('../../../src/backend/hue');

const mockSwitchRoom = jest.fn();
mockSwitchRoom.mockReturnValue(Promise.resolve({}));

const mockGetRooms = jest.fn();

jest.mock('../../../src/backend/hue/HueApi', () => {
  return jest.fn().mockImplementation(() => {
    return {
        switchRoom: mockSwitchRoom,
        getRooms: mockGetRooms,
    };
  });
});

describe('backend/hue', () => {

    beforeEach(() => {
        hueConfig = {
            BRIDGE_HOST: '',
            API_USER: '',
        };

        response = new Response();

        HueApi.mockClear();
        mockSwitchRoom.mockClear();
        mockGetRooms.mockClear();
    });

    test('module exports a function that returns an object', () => {
        expect(typeof hue(hueConfig)).toEqual('object');
    });

    test('returned object has a rooms function', () => {
        expect(typeof hue(hueConfig).rooms).toEqual('function');
    });

    test('returned object has a switch function', () => {
        expect(typeof hue(hueConfig).switch).toEqual('function');
    });

    describe('switch', () => {
        test('switch function passes parameters from request to HueApi', () => {
            const req = { body: { roomId: 4711, on: true } };
            return hue(hueConfig).switch(req, response).then(() => {
                expect(mockSwitchRoom).toHaveBeenCalled();
                expect(mockSwitchRoom.mock.calls[0][0]).toEqual(4711);
                expect(mockSwitchRoom.mock.calls[0][1]).toEqual(true);
            })
        });
        test('switch function sends OK as response', () => {
            const req = { body: { roomId: 4711, on: true } };
            return hue(hueConfig).switch(req, response).then(() => {
                expect(response.send.mock.calls[0][0]).toEqual('OK');
            })
        });
    });

    describe('getRooms', () => {
        test('getRooms function fetches Rooms from HueApi', () => {
            mockGetRooms.mockReturnValue(Promise.resolve({}));
            return hue(hueConfig).rooms(null, response).then(() => {
                expect(mockGetRooms).toHaveBeenCalled();
            })
        });
        test('getRooms function sends rooms as response', () => {
            const rooms = {"1": { name: "Dummy", type: "Room" }};
            mockGetRooms.mockReturnValue(Promise.resolve(rooms));
            return hue(hueConfig).rooms(null, response).then(() => {
                expect(response.json.mock.calls[0][0]).toEqual(rooms);
            })
        });
    });

});
