const axios = require('axios').default;

exports.getNasaData = function (req, res) {
    //if query is empty return error
    if (!req.query.start || !req.query.end) {
        res.status(400).send({
            message: 'Please provide a start and end date'
        });
    } else {
        const START = req.query.start,
            END = req.query.end;
        const FORMAT = "JSON",
            LATITUDE = 14.067453,
            LONGITUDE = 100.605089,
            PARAMETERS = "T2M,T2MDEW,T2MWET,QV2M,RH2M,PRECTOTCORR,PS,WS10M,WD10M,WS50M,WD50M,ALLSKY_SFC_SW_DWN,CLRSKY_SFC_SW_DWN,ALLSKY_SFC_UVA,ALLSKY_SFC_UVB,ALLSKY_SFC_UV_INDEX",
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
};

exports.getEnvSensorData = function (req, res) {
    // CMS API constants
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": process.env.CMS_UNAME,
        "password": process.env.CMS_PWD,
        "cms_uid": process.env.CMS_UID
    };
    //if query is empty return error
    //note that start and end is the UNIX timestamp
    if (!req.query.start || !req.query.end) {
        res.status(400).send({
            message: 'Please provide a start and end date'
        });
    } else {
        //get token
        axios.post(base_url + "/token", auth).then(response => {
            const token = response.data.token,
                head = {
                    "Authorization": "Bearer " + token
                },
                url = base_url + "/reports/devices/" + process.env.CMS_ENVSNR_DEVICE_UID + "/objects/" + process.env.CMS_ENVSNR_OBJECT_NAME;
            //get data
            axios.get(url, {
                headers: head,
                params: {
                    from: req.query.start,
                    to: req.query.end
                }
            }).then(response2 => {
                res.status(200).send({
                    values: response2.data.values
                });
            }).catch(error => {
                res.status(500).send(error);
            });
        }).catch(error => {
            res.status(500).send(error);
        });
    }
};

exports.getEnvSensorHourlyData = function (req, res) {
    // CMS API constants
    const base_url = process.env.CMS_BASE_URL;
    const auth = {
        "username": process.env.CMS_UNAME,
        "password": process.env.CMS_PWD,
        "cms_uid": process.env.CMS_UID
    };
    //if query is empty return error
    //note that start and end is the UNIX timestamp
    if (!req.query.start || !req.query.end) {
        res.status(400).send({
            message: 'Please provide a start and end date'
        });
    } else {
        //get token
        axios.post(base_url + "/token", auth).then(response => {
            const token = response.data.token,
                head = {
                    "Authorization": "Bearer " + token
                },
                url = base_url + "/reports/devices/" + process.env.CMS_ENVSNR_DEVICE_UID + "/objects/" + process.env.CMS_ENVSNR_OBJECT_NAME;
            //round start and end to the nearest hour
            const start = Math.floor(req.query.start / 3600) * 3600,
                end = (Math.floor(req.query.end / 3600) * 3600) + 600;
            //get data
            axios.get(url, {
                headers: head,
                params: {
                    from: start,
                    to: end
                }
            }).then(response2 => {
                var receivedValue = response2.data.values;
                var sendValue = [receivedValue[0], receivedValue[1]];
                var prevHour = (new Date(receivedValue[1][0])).getHours();
                for (var i = 2; i < receivedValue.length; i++) {
                    var currHour = (new Date(receivedValue[i][0])).getHours();
                    if (currHour != prevHour) {
                        sendValue.push(receivedValue[i]);
                        prevHour = currHour;
                    }
                }
                res.status(200).send({
                    values: sendValue
                });
            }).catch(error => {
                res.status(500).send(error);
            });
        }).catch(error => {
            res.status(500).send(error);
        });
    }
};

exports.getZoneLightData = function (req, res) {
    if (!req.query.zone_id) {
        res.status(400).send({
            message: 'Please provide a zone id'
        });
    } else {
        const base_url = process.env.CMS_BASE_URL;
        const auth = {
            "username": process.env.CMS_UNAME,
            "password": process.env.CMS_PWD,
            "cms_uid": process.env.CMS_UID
        };
        axios.post(base_url + "/token", auth).then(response => {
            const token = response.data.token,
                head = {
                    "Authorization": "Bearer " + token
                };
            axios.get(base_url + "/zones/" + req.query.zone_id + "/1/devices_and_measures", {
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
};