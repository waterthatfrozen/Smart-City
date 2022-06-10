const { exit } = require('process');
const http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    axios = require('axios').default,
    firebaseApp = require('firebase/app'),
    firebaseAnalytics = require('firebase/analytics'),
    firebaseFunctions = require('firebase/functions'),
    dotenv = require('dotenv'),
    app = express();

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Firebase Configurations
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MSGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID,
    measurementId: process.env.FIREBASE_MEASUREMENT_ID
};

const firebase = firebaseApp.initializeApp(firebaseConfig);
if (firebase) {
    console.log('Firebase app initialized');
}else{
    console.log('Firebase app not initialized');
    exit(1);
}

const PATH = __dirname + '/client';
const PORT = process.env.PORT;

app.use(express.static(PATH));
http.createServer(app).listen(PORT, () => {
    console.log('Server listening on http://localhost:' + PORT);
});

//Routing
app.get('/hello_world', (_req, res) => {
    res.status(200).send({message: 'Hello World!'});
});

app.get('/', (_req, res) => {
    res.status(200).sendFile(PATH + '/index.html');
});

app.get('/dashboard', (_req, res) => {
    res.status(200).sendFile(PATH + '/dashboard.html');
});

// Get data from NASA POWER API
app.get('/get-nasa-data', (req, res) => {
    //if query is empty return error
    if(!req.query.start || !req.query.end) {
        res.status(400).send({message: 'Please provide a start and end date'});
        }else{
        const START = req.query.start, END = req.query.end;
        const FORMAT = "JSON",
            LATITUDE = 14.067453,
            LONGITUDE = 100.605089,
            PARAMETERS = "T2M,T2MDEW,T2MWET,TS,QV2M,RH2M,PRECTOTCORR,T2M_RANGE,T2M_MAX,T2M_MIN",
            COMMUNITY = "RE";
        const url = "https://power.larc.nasa.gov/api/temporal/daily/point";
        axios.get(url, {
            params: {
                start: START,
                end: END,
                format: FORMAT,
                latitude: LATITUDE,
                longitude: LONGITUDE,
                parameters: PARAMETERS,
                community: COMMUNITY
            }
        }).then(response => {
            res.status(200).send(response.data);
        }).catch(error => {
            res.status(500).send(error);
        });
    }
});

// Get data from CMS API
app.get('/get-env-sensor-data', (req, res) => {
    // CMS API constants
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": process.env.CMS_UNAME, 
        "password": process.env.CMS_PWD, 
        "cms_uid": process.env.CMS_UID
    };
    //if query is empty return error
    //note that start and end is the UNIX timestamp
    if(!req.query.start || !req.query.end) {
        res.status(400).send({message: 'Please provide a start and end date'});
    }else{
        //get token
        axios.post(base_url + "/token", auth).then(response => {
            const token = response.data.token,
                  head = { "Authorization": "Bearer " + token},
                  url = base_url+"/reports/devices/"+process.env.CMS_ENVSNR_DEVICE_UID+"/objects/"+process.env.CMS_ENVSNR_OBJECT_NAME;
            //get data
            axios.get(url, {
                headers: head,
                params: {
                    from: req.query.start,
                    to: req.query.end
                }
            }).then(response2 => {
                res.status(200).send(response2.data.values);
            }).catch(error => {
                res.status(500).send(error);
            });
        }).catch(error => {
            res.status(500).send(error);
        });
    }
});

app.get('/get-service-status', (_req,res) => {
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": process.env.CMS_UNAME, 
        "password": process.env.CMS_PWD, 
        "cms_uid": process.env.CMS_UID
    };
    axios.post(base_url+"/token", auth).then(response => {
        const token = response.data.token,
              head = { "Authorization": "Bearer " + token};
        axios.get(base_url+"/monitoring/status", {
            headers: head
        }).then(response2 => {
                res.status(200).send(response2.data.status);
        }).catch(error => {
                res.status(500).send(error);
        });
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/get-zone-list', (_req,res) => {
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": process.env.CMS_UNAME, 
        "password": process.env.CMS_PWD, 
        "cms_uid": process.env.CMS_UID
    };
    axios.post(base_url+"/token", auth).then(response => {
        const token = response.data.token,
              head = { "Authorization": "Bearer " + token};
        axios.get(base_url+"/zones", {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.zones);
        }).catch(error => {
            res.status(500).send(error);
        });
    }).catch(error => {
        res.status(500).send(error);
    });
});

app.get('/get-zone-event', (req,res) => {
    if(!req.query.zone_id) {
        res.status(400).send({message: 'Please provide a zone id'});
    }else{
        const base_url = process.env.CMS_BASE_URL;
        const auth = {
            "username": process.env.CMS_UNAME, 
            "password": process.env.CMS_PWD, 
            "cms_uid": process.env.CMS_UID
        };
        axios.post(base_url+"/token", auth).then(response => {
            const token = response.data.token,
                head = { "Authorization": "Bearer " + token};
            axios.get(base_url+"/events/active/zones/"+req.query.zone_id, {
                headers: head
            }).then(response2 => {
                res.status(200).send(response2.data.active_events);
            }).catch(error => {
                res.status(500).send(error);
            });
        }).catch(error => {
            res.status(500).send(error);
        });
    }
});

app.get('/get-zone-device-list', (req,res) => {
    if(!req.query.zone_id) {
        res.status(400).send({message: 'Please provide a zone id'});
    }else{
        const base_url = process.env.CMS_BASE_URL;
        const auth = {
            "username": process.env.CMS_UNAME, 
            "password": process.env.CMS_PWD, 
            "cms_uid": process.env.CMS_UID
        };
        axios.post(base_url+"/token", auth).then(response => {
            const token = response.data.token,
                head = { "Authorization": "Bearer " + token};
            axios.get(base_url+"/zones/"+req.query.zone_id+"/devices", {
                headers: head
            }).then(response2 => {
                res.status(200).send(response2.data.devices);
            }).catch(error => {
                res.status(500).send(error);
        }).catch(error => {
            res.status(500).send(error);
        });
    });
    }
});

app.get('/get-zone-light-device-list', (req,res) => {
    if(!req.query.zone_id) {
        res.status(400).send({message: 'Please provide a zone id'});
    }else{
        const base_url = process.env.CMS_BASE_URL;
        const auth = {
            "username": process.env.CMS_UNAME, 
            "password": process.env.CMS_PWD, 
            "cms_uid": process.env.CMS_UID
        };
        axios.post(base_url+"/token", auth).then(response => {
            const token = response.data.token,
                head = { "Authorization": "Bearer " + token};
            axios.get(base_url+"/zones/"+req.query.zone_id+"/1/devices", {
                headers: head
            }).then(response2 => {
                res.status(200).send(response2.data.devices);
            }).catch(error => {
                res.status(500).send(error);
            });
        }).catch(error => {
            res.status(500).send(error);
        });
    }
});

app.get('/get-zone-light-data', (req,res) => {
    if(!req.query.zone_id) {
        res.status(400).send({message: 'Please provide a zone id'});
    }else{
        const base_url = process.env.CMS_BASE_URL;
        const auth = {
            "username": process.env.CMS_UNAME, 
            "password": process.env.CMS_PWD, 
            "cms_uid": process.env.CMS_UID
        };
        axios.post(base_url+"/token", auth).then(response => {
            const token = response.data.token,
                head = { "Authorization": "Bearer " + token};
            axios.get(base_url+"/zones/"+req.query.zone_id+"/1/devices_and_measures", {
                headers: head
            }).then(response2 => {
                res.status(200).send(response2.data.devices);
            }).catch(error => {
                res.status(500).send(error);
            })
        }).catch(error => {
            res.status(500).send(error);
        });
    }
});

app.get('/get-light-device-object', (_req,res) => {
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": process.env.CMS_UNAME,
        "password": process.env.CMS_PWD,
        "cms_uid": process.env.CMS_UID
    };
    axios.post(base_url+"/token", auth).then(response => {
        const token = response.data.token,
            head = { "Authorization": "Bearer " + token};
        axios.get(base_url+"/deviceTypes/3311/objects", {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.objects);
        }).catch(error => {
            res.status(500).send(error);
        })
    }).catch(error => {
            res.status(500).send(error);
    });
});


// Response a 404 with 404.html
app.use((req, res, _next) => {
    res.status(404);
    if(req.accepts('html')) {
        res.sendFile(PATH + '/404.html');
    }else{
        res.send({error: 'Not found'});
    }
});