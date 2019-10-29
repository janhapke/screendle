'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const config = require('../config');

const time = require('./backend/time');
const darksky = require('./backend/darksky');
const hvv = require('./backend/hvv');
const hue = require('./backend/hue');

const PORT = process.env.NODE_PORT || 80;
const HOST = '0.0.0.0';

const app = express();
app.disable('x-powered-by');
app.use(bodyParser.json());
app.use('/', express.static(__dirname + '/frontend'));

app.get('/time', time(config.TIME));
app.get('/weather', darksky(config.DARKSKY));
app.get('/busses', hvv(config.HVV_BUSSES));
app.get('/trains', hvv(config.HVV_TRAINS));
app.get('/rooms', hue(config.HUE).rooms);
app.post('/switch', hue(config.HUE).switch);

app.listen(PORT, HOST, () => {
    console.log(`Listening on ${HOST}:${PORT}`);
});
