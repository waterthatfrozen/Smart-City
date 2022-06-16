const {
    exit
} = require('process');
const http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    dotenv = require('dotenv'),
    app = express();
const getDataAPI = require('./api/get-data'),
    getSupportDataAPI = require('./api/get-support-data'),
    getDeviceAPI = require('./api/get-device');

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

const PATH = __dirname + '/client';
const PORT = process.env.PORT;

app.use(express.static(PATH));
http.createServer(app).listen(PORT, () => {
    console.log('Server listening on http://localhost:' + PORT);
});

//Routing
app.get('/', (_req, res) => {
    res.status(200).sendFile(PATH + '/index.html');
});

app.get('/dashboard', (_req, res) => {
    res.status(200).sendFile(PATH + '/dashboard.html');
});

app.get('/maps-view', (_req, res) => {
    res.status(200).sendFile(PATH + '/maps-view.html');
});

// Test API
app.get('/hello-world', (_req, res) => {
    getSupportDataAPI.helloWorld(_req, res);
});

// GET REQUEST
// GET DATA REQUEST (api/get-data)
app.get('/get-nasa-data', (req, res) => {
    getDataAPI.getNasaData(req, res);
});

app.get('/get-env-sensor-data', (req, res) => {
    getDataAPI.getEnvSensorData(req, res);
});

app.get('/get-env-sensor-hourly-data', (req, res) => {
    getDataAPI.getEnvSensorHourlyData(req, res);
});

app.get('/get-zone-light-data', (req, res) => {
    getDataAPI.getZoneLightData(req, res);
});

// GET SUPPORT DATA REQUEST (api/get-support-data)
app.get('/get-service-status', (req, res) => {
    getSupportDataAPI.getServiceStatus(req, res);
});

app.get('/get-zone-list', (req, res) => {
    getSupportDataAPI.getZoneList(req, res);
});

app.get('/get-zone-event', (req, res) => {
    getSupportDataAPI.getZoneEventList(req, res);
});

// GET DEVICE REQUEST (api/get-device)
app.get('/get-zone-device-list', (req, res) => {
    getDeviceAPI.getZoneDeviceList(req, res);
});

app.get('/get-zone-light-device-list', (req, res) => {
    getDeviceAPI.getZoneLightDeviceList(req, res);
});

app.get('/get-device-info', (req, res) => {
    getDeviceAPI.getDeviceInfo(req, res);
});

// POST REQUEST
app.post('/login', (req, res) => {
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": req.body.username,
        "password": req.body.password,
        "cms_uid": process.env.CMS_UID
    };
    axios.post(base_url + "/token", auth).then(response => {
        res.status(200).send(response);
    }).catch(error => {
        res.status(400).send(error);
    });
});

const setDevice = require('./api/set-device');
app.post('/set-light-dimming', (req, res) => {
    setDevice.setLightDimming(req, res);
});

// Response 401
app.get('/401', (_req, res) => {
    res.status(401).sendFile(PATH + '/401.html');
});

// Response a 404 with 404.html
app.use((req, res, _next) => {
    res.status(404);
    if (req.accepts('html')) {
        res.sendFile(PATH + '/404.html');
    } else {
        res.send({
            error: 'Not found'
        });
    }
});