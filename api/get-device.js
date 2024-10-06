const { cmsToken } = require('../utils/token');
const axios = require('axios').default;

// Get all devices in the zone by zone id
exports.getZoneDeviceList = function (req, res) {
    if (!req.query.zone_id) {
        res.status(400).send({
            message: 'Please provide a zone id'
        });
    } else {
        const base_url = process.env.CMS_BASE_URL;
        const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
        axios.get(base_url + "/zones/" + req.query.zone_id + "/devices", {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.devices);
        }).catch(error => {
            res.status(500).send(error);
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
        const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
        axios.get(base_url + "/zones/" + req.query.zone_id + "/1/devices", {
            headers: head
        }).then(response2 => {
            let result = [];
            response2.data.devices.forEach(device => {
                if(device.device_type_id === 27036){
                    result.push(device);
                }
            });
            res.status(200).send(result);
        }).catch(error => {
            res.status(500).send(error);
        });
    }
};

exports.getZoneIlluminanceSensorDeviceList = function (req, res) {
    if (!req.query.zone_id) {
        res.status(400).send({
            message: 'Please provide a zone id'
        });
    } else {
        const base_url = process.env.CMS_BASE_URL;
        const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
        axios.get(base_url + "/zones/" + req.query.zone_id + "/3/devices", {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.devices);
        }).catch(error => {
            res.status(500).send(error);
        });
    }
}

// Get device information by device id
exports.getDeviceInfo = function (req, res) {
    if (!req.query.device_id) {
        res.status(400).send({
            message: 'Please provide a device id'
        });
    } else {
        const base_url = process.env.CMS_BASE_URL;
        const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
        axios.get(base_url + "/devices/" + req.query.device_id, {
            headers: head
        }).then(response2 => {
            res.status(200).send(response2.data.devices[0]);
        }).catch(error => {
            res.status(500).send(error);
        });
    }
};