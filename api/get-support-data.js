const { cmsToken } = require('../utils/token');
const axios = require('axios').default;

exports.getServiceStatus = function (_req, res) {
    const base_url = process.env.CMS_BASE_URL;
    const head = {
            "Authorization": "Bearer " + cmsToken.token
        };
    axios.get(base_url + "/monitoring/status", {
        headers: head
    }).then(response2 => {
        res.status(200).send(response2.data.status);
    }).catch(error => {
        res.status(500).send(error);
    });
};

exports.getZoneList = function (_req, res) {
    const base_url = process.env.CMS_BASE_URL;
    const head = {
            "Authorization": "Bearer " + cmsToken.token
        };
    axios.get(base_url + "/zones", {
        headers: head
    }).then(response2 => {
        res.status(200).send(response2.data.zones);
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
        const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
        axios.get(base_url + "/events/active/zones/" + req.query.zone_id, {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.active_events);
        }).catch(error => {
            res.status(500).send(error);
        });
    }
};