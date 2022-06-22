const axios = require('axios').default;

exports.helloWorld = function (_req, res) {
    res.status(200).send({
        message: "Hello World!",
        timestamp: new Date().toISOString()
    });
};

exports.getServiceStatus = function (_req, res) {
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
        axios.get(base_url + "/monitoring/status", {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.status);
        }).catch(error => {
            res.status(500).send(error);
        });
    }).catch(error => {
        res.status(500).send(error);
    });
};

exports.getZoneList = function (_req, res) {
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
        axios.get(base_url + "/zones", {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.zones);
        }).catch(error => {
            res.status(500).send(error);
        });
    }).catch(error => {
        res.status(500).send(error);
    });
};

exports.getZoneEventList = function (req, res) {
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
            axios.get(base_url + "/events/active/zones/" + req.query.zone_id, {
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
};