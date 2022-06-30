const http = require('http'),
    express = require('express'),
    sessions = require('express-session'),
    cookieParser = require('cookie-parser'),
    bodyParser = require('body-parser'),
    dotenv = require('dotenv'),
    axios = require('axios'),
    app = express();
const getDataAPI = require('./api/get-data'),
    getSupportDataAPI = require('./api/get-support-data'),
    getDeviceAPI = require('./api/get-device'),
    playgroundAPI = require('./api/playground');

const tokenMaxAge = 6 * 60 * 60 * 1000;

function checkTokenValid(req, res, next) {
    // check for session is expired or not
    if (req.session.token) {
        var now = new Date().getTime();
        var tokenExpiry = new Date(req.session.cookie._expires).getTime();
        if (now < tokenExpiry) {
            next();
        } else {
            req.session = null;
            res.status(401).redirect('/401');
        }
    } else {
        res.status(401).redirect('/401');
    }
}

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cookieParser());

// session settings
app.use(sessions({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        maxAge: tokenMaxAge
    }
}));

// remove the session cookie on the server when it expires
app.use(function (req, _res, next) {
    if (req.session.token) {
        var now = new Date().getTime();
        var tokenExpiry = new Date(req.session.cookie._expires).getTime();
        if (now > tokenExpiry) {
            req.session = null;
        }
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

app.get('/dashboard', (req, res) => {
    checkTokenValid(req, res, () => {
        res.status(200).sendFile(PATH + '/dashboard.html');
    });
});

app.get('/maps-view', (req, res) => {
    checkTokenValid(req, res, () => {
        res.status(200).sendFile(PATH + '/maps-view.html');
    });
});

// Test API
app.get('/hello-world', (req, res) => {
    playgroundAPI.helloWorld(req, res);
});

app.get('/test-select-data', (req, res) => {
    playgroundAPI.testSelectData(req, res);
});

app.post('/test-insert-data', (req, res) => {
    playgroundAPI.testInsertData(req, res);
});

app.put('/test-update-data', (req, res) => {
    playgroundAPI.testUpdateData(req, res);
});

app.delete('/test-delete-data', (req, res) => {
    playgroundAPI.testDeleteData(req, res);
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

// LOGIN REQUEST
app.post('/login', (req, res) => {
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": req.body.username,
        "password": req.body.password,
        "cms_uid": process.env.CMS_UID
    };
    axios.post(base_url + "/token", auth).then(response => {
        if (response.status === 200) {
            req.session.token = response.data.token;
            req.session.save(() => {
                res.status(200).redirect('/dashboard');
            });
        } else {
            res.status(400).send({
                "status": "fail"
            });
        }
    }).catch(error => {
        res.status(400).send(error);
    });
});

// LOGOUT REQUEST
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.status(200).redirect('/');
    });
});

//for testing send data endpoint
app.post('/test-send-data', (req, res) => {
    playgroundAPI.testSendData(req, res);
});

const setDevice = require('./api/set-device');
app.post('/set-light-dimming', (req, res) => {
    setDevice.setLightDimming(req, res);
});

// Response 401
app.get('/401', (req, res) => {
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