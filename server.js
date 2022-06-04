const { json, header } = require('express/lib/response');

const http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    axios = require('axios').default,
    dotenv = require('dotenv'),
    app = express();

dotenv.config();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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

// Get data from NASA POWER API
app.get('/get-nasa-data', (req, res) => {
    //if query is empty return error
    if(!req.query.start || !req.query.end) {
        res.status(400).send({message: 'Please provide a start and end date'});
        }else{
        var START = req.query.start, END = req.query.end;
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
app.get('/get-cms-data', (req, res) => {
    //if query is empty return error
    //note that start and end is the UNIX timestamp
    if(!req.query.start || !req.query.end) {
        res.status(400).send({message: 'Please provide a start and end date'});
    }else{
        const base_url = "https://siit.pdxeng.ch:8000/cms/api/v1.0";
        const auth = {"username": process.env.CMS_UNAME, 
                    "password": process.env.CMS_PWD, 
                    "cms_uid": process.env.CMS_UID};
        //get token
        axios.post(base_url + "/token", auth).then(response => {
            const token = response.data.token,
                  head = { "Authorization": "Bearer " + token},
                  url = base_url+"/reports/devices/"+process.env.CMS_DEVICE_UID+"/objects/"+process.env.CMS_OBJECT_NAME;
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