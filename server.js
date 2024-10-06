const http = require('http'),
    express = require('express'),
    sessions = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    dotenv = require('dotenv'),
    axios = require('axios'),
    // sql = require('mssql'),
    fs = require('fs'),
    app = express();
dotenv.config();

// Initialize CMS token
const { cmsToken } = require('./utils/token');

// Delay App Start
console.info("Delaying app start for token");
const sleep = new Promise(resolve => setTimeout(resolve, 5 * 1000));
console.info('Starting Application');

// // connect to SQL server
// const sqlConfig = { user: process.env.SQL_UNAME, password: process.env.SQL_PWD, server: process.env.SQL_SERVER, database: process.env.SQL_DB };

// sql.connect(sqlConfig, function (err) {
//     if (err) { console.log("Error while connecting to database :- \n" + err); }
//     else { console.log('Connected to SQL Server'); }
// });

// require API
const getDataAPI = require('./api/get-data');
const getSupportDataAPI = require('./api/get-support-data');
const getDeviceAPI = require('./api/get-device');
const playgroundAPI = require('./api/playground');

// Environmental Sensor Disconnect Detection
const disconnectDetection = require('./api/disconnect-detection');
const illuminanceCollection = require('./api/illuminance-collection');

// IoT Sensor Measurement Collection
// const iotSensorAPI = require('./api/iot-sensor');

// Lighting Device Report
const lightingDeviceReport = require('./api/device-report');

const tokenMaxAge = 6 * 60 * 60 * 1000;

function checkTokenValid(req, res, next) {
    // check for session is expired or not
    if (req.session.token) {
        let now = new Date().getTime();
        let tokenExpiry = new Date(req.session.cookie._expires).getTime();
        if (now < tokenExpiry) { next(); } 
        else { req.session = null; res.status(401).redirect('/401'); }
    } else { res.status(401).redirect('/401'); }
}

// Express configuration
const PATH = __dirname + '/client';
const PORT = process.env.PORT;
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
// session settings
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    resave: false, saveUninitialized: true,
    cookie: { maxAge: tokenMaxAge }
}));
// remove the session cookie on the server when it expires
app.use(function (req, _res, next) {
    if (req.session.token) {
        let now = new Date().getTime();
        let tokenExpiry = new Date(req.session.cookie._expires).getTime();
        if (now > tokenExpiry) { req.session = null; }
    }
    next();
});
// remove the back button from the browser
app.use(function (_req, res, next) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', 0);
    next();
});
// prevent browser for calling static files
app.use(function (req, res, next) {
    if (req.url.indexOf('.html') > -1) { res.status(404).redirect('/404'); } 
    else { next(); }
});

app.use(express.static(PATH));
http.createServer(app).listen(PORT, () => {
    console.info('Server listening on http://localhost:' + PORT);
});

//Routing
app.get('/', (_req, res) => { res.status(200).sendFile(PATH + '/index.html');});
app.get('/sensor-connection', (_req, res) => { res.status(200).sendFile(PATH + '/sensor-connection.html');});
app.get('/csv-download', (_req, res) => {res.status(200).sendFile(PATH + '/csv-download.html');})
app.get('/download-selection', (_req, res) => { res.status(200).sendFile(PATH + '/download-selection.html');})
app.get('/401', (_req, res) => { res.status(401).sendFile(PATH + '/401.html'); });
app.get('/404', (_req, res) => { res.status(404).sendFile(PATH + '/404.html'); });

// get image from img folder
app.get('/img/:img', (req, res) => { res.status(200).sendFile(PATH + '/img/' + req.params.img); });

// Test API
app.get('/api/helloWorld', (req, res) => { playgroundAPI.helloWorld(req, res); });
// app.get('/api/testSelectData', (req, res) => { playgroundAPI.testSelectData(req, res); });
// app.post('/api/testInsertData', (req, res) => { playgroundAPI.testInsertData(req, res); });
// app.put('/api/testUpdateData', (req, res) => { playgroundAPI.testUpdateData(req, res); });
// app.delete('/api/testDeleteData', (req, res) => { playgroundAPI.testDeleteData(req, res); });
app.post('/api/testSendData', (req, res) => { playgroundAPI.testSendData(req, res); });

// GET REQUEST
// GET DATA REQUEST (api/get-data)
app.get('/api/getNasaData', (req, res) => { getDataAPI.getNasaData(req, res); });
app.get('/api/getEnvSensorData', (req, res) => { getDataAPI.getEnvSensorData(req, res); });
app.get('/api/getEnvSensorHourlyData', (req, res) => { getDataAPI.getEnvSensorHourlyData(req, res); });
app.get('/api/getZoneLightData', (req, res) => { getDataAPI.getZoneLightData(req, res); });
// app.get('/api/getIlluminanceSensorDatabyDevice', (req, res) => { getDataAPI.getIlluminanceSensorDatabyDevice(req, res); });

// GET SUPPORT DATA REQUEST (api/get-support-data)
app.get('/api/getServiceStatus', (req, res) => { getSupportDataAPI.getServiceStatus(req, res); });
app.get('/api/getZoneList', (req, res) => { getSupportDataAPI.getZoneList(req, res); });
app.get('/api/getZoneEvent', (req, res) => { getSupportDataAPI.getZoneEventList(req, res); });

// GET DEVICE REQUEST (api/get-device)
app.get('/api/getZoneDeviceList', (req, res) => { getDeviceAPI.getZoneDeviceList(req, res); });
app.get('/api/getZoneLightDeviceList', (req, res) => { getDeviceAPI.getZoneLightDeviceList(req, res); });
app.get('/api/getDeviceInfo', (req, res) => { getDeviceAPI.getDeviceInfo(req, res); });
app.get('/api/getZoneIlluminanceSensorDeviceList', (req, res) => { getDeviceAPI.getZoneIlluminanceSensorDeviceList(req, res); });

// GET ILLUMINANCE SENSOR DATA REQUEST (api/illumiance-collection)
app.get('/api/getLastLumianceSensorValue', (req, res) => { illuminanceCollection.getLastLumianceSensorValue(req, res); });
app.get('/api/getSensorValuebyRange', (req, res) => { illuminanceCollection.getSensorValuebyRange(req, res); });
app.get('/api/getSensorValueByDeviceIDandRange', (req, res) => { illuminanceCollection.getSensorValueByDeviceIDandRange(req, res); });
app.get('/api/getAllIluminanceSensorDevices', (req, res) => { illuminanceCollection.getAllIluminanceSensorDevices(req, res); });

// GET CONNECTION STATUS (api/disconnect-detection)
app.get('/api/checkSensorConnection', (req, res) => { disconnectDetection.checkSensorConnection(req, res); });
app.get('/api/checkGatewayConnection', (req, res) => { disconnectDetection.checkGatewayConnection(req, res); });
// app.get('/api/querySensorDisconnectLog', (req, res) => { disconnectDetection.querySensorDisconnectLog(req, res); });
// app.get('/api/queryGatewayDisconnectLog', (req, res) => { disconnectDetection.queryGatewayDisconnectLog(req, res); });

// // RECORD IoT SENSOR VALUE (api/iot-sensors)
// app.post('/api/recordIoTSensorValue', (req, res) => { iotSensorAPI.recordIoTSensorValue(req, res); });
// app.get('/api/getLastRecordedData', (req, res) => { iotSensorAPI.getLastRecordedData(req, res); });
// app.get('/api/getRecordedData', (req, res) => { iotSensorAPI.getRecordedData(req, res); });

// LIGHTING DEVICE REPORT (api/device-report)
app.get('/api/getAllLightDevices', (req, res) => { lightingDeviceReport.getAllLightDevices(req, res); });
app.get('/api/getLightControlReportbyDeviceandRange', (req, res) => { lightingDeviceReport.getLightControlReportbyDeviceandRange(req, res); });
app.get('/api/getLightPowerStatusReportbyDeviceandRange', (req, res) => { lightingDeviceReport.getLightPowerStatusReportbyDeviceandRange(req, res); });
app.get('/api/getLastLightPowerReportbyDevice', (req, res) => { lightingDeviceReport.getLastLightPowerReportbyDevice(req, res); });
app.get('/api/getCurrentDeviceConnection', (req, res) => { lightingDeviceReport.getCurrentDeviceConnection(req, res); });
app.get('/api/sendGetPowerCommand', (req, res) => { lightingDeviceReport.sendGetPowerCommand(req, res); });

// LOGIN REQUEST
app.post('/login', (req, res) => {
    const base_url = process.env.CMS_BASE_URL;
    const auth = { "username": req.body.username, "password": req.body.password, "cms_uid": process.env.CMS_UID };
    axios.post(base_url + "/token", auth).then(response => {
        if (response.status === 200) {
            req.session.token = response.data.token;
            console.info("login success");
            req.session.save(() => { 
                res.status(200).send({ "status": "success" });
            });
        } else { res.status(400).send({ "status": "fail" }); }
    }).catch(error => { res.status(400).send(error); });
});

// LOGOUT REQUEST
app.get('/logout', (req, res) => { 
    req.session.cookie.expires = new Date(Date.now() - 1000);
    if(req.headers['user-agent'].includes('Mozilla')) { 
        req.session.destroy(() => { 
            res.status(200).redirect('/'); 
        });
    }else{ res.status(200).send({message: "Logged out."}); }
});

const setDevice = require('./api/set-device');
app.post('/api/setLightDimming', (req, res) => { setDevice.setLightDimming(req, res); });

// AUTOMATIC LIGHTING PART
const autoLighting = require('./api/auto-lighting');
app.get('/api/getAutoLightingStatus', (req, res) => { autoLighting.getAutoLightingStatus(req, res); });
app.post('/api/setEnableAutoLighting', (req, res) => { autoLighting.setEnableAutoLighting(req, res); });

app.get('/:htmlfile', (req, res) => {
    checkTokenValid(req, res, () => {
        if (fs.access(PATH + '/' + req.params.htmlfile + '.html', fs.constants.F_OK, (err) => {
            console.error(err);
            if (err) { res.status(404).redirect('/404'); }
            else { res.status(200).sendFile(PATH + '/' + req.params.htmlfile + '.html'); }
        }));
    });
});

// Response a 404 with 404.html
app.use((req, res, _next) => {
    res.status(404);
    if (req.accepts('html')) { res.sendFile(PATH + '/404.html'); } 
    else { res.send({error: 'Not found'}); }
});