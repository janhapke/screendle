const request = require('request-promise-native');

class HueApi {
    constructor(bridgeHost, apiUser) {
        this.bridgeHost = bridgeHost;
        this.apiUser = apiUser;
    }

    getRooms() {
        return request(
            this._getBaseUrl() + '/groups',
            { json: true }
        ).then(body => this._filterRooms(body));
    }

    switchRoom(roomId, on) {
        return request(
            this._getBaseUrl() + '/groups/' + roomId + '/action',
            {
                method: 'PUT',
                json: true,
                body: {on: on},
            }
        );
    }

    _getBaseUrl() {
        return 'http://' + this.bridgeHost + '/api/' + this.apiUser;
    }

    _filterRooms(groups) {
        const result = {};
        for (const groupId in groups) {
            if (groups[groupId].type !== "Room") {
                continue;
            }
            result[groupId] = groups[groupId];
        }
        return result;
    }
}

module.exports = HueApi;
