const { json } = require('express/lib/response');

const http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
    axios = require('axios').default,
    app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PATH = __dirname + '/client';
const PORT = process.env.PORT || 3000;
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