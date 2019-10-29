const HueApi = require('./HueApi');

module.exports = cfg => {
    const config = {
        BRIDGE_HOST: cfg.BRIDGE_HOST,
        API_USER: cfg.API_USER,
    };
    const hueApi = new HueApi(config.BRIDGE_HOST, config. API_USER);

    return {
        rooms: (req, res) => hueApi.getRooms().then(rooms => res.json(rooms)),
        switch: (req, res) => hueApi.switchRoom(req.body.roomId, req.body.on).then(result => res.send('OK'))
    }
};
