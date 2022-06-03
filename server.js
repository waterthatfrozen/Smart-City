const http = require('http'),
    express = require('express'),
    bodyParser = require('body-parser'),
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
    res.sendFile(PATH + '/index.html');
});