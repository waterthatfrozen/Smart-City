const axios = require('axios').default;

// Get all devices in the zone by zone id
exports.getZoneDeviceList = function (req, res) {
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
            axios.get(base_url + "/zones/" + req.query.zone_id + "/devices", {
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
};

// Get all LIGHT devices in the zone by zone id
exports.getZoneLightDeviceList = function (req, res) {
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
            axios.get(base_url + "/zones/" + req.query.zone_id + "/1/devices", {
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
};

// Get device information by device id
exports.getDeviceInfo = function (req, res) {
    if (!req.query.device_id) {
        res.status(400).send({
            message: 'Please provide a device id'
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
            axios.get(base_url + "/devices/" + req.query.device_id, {
                headers: head
            }).then(response2 => {
                res.status(200).send(response2.data.devices[0]);
            }).catch(error => {
                res.status(500).send(error);
            });
        }).catch(error => {
            res.status(500).send(error);
        });
    }
};