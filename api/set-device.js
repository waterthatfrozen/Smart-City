const axios = require('axios').default;

exports.setLightDimming = function (req, res) {
    if (!req.body.device_id || !(req.body.dimming_value >= 0 && req.body.dimming_value <= 100)) {
        res.status(400).send({
            message: 'Please provide a device id, and valid dimming value'
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
            axios.get(base_url + "/devices/" + req.body.device_id, {
                headers: head
            }).then(response2 => {
                const gateway_mac = response2.data.devices[0].gateway_MAC;
                axios.put(base_url + "/devices/commands/id/" + req.body.device_id, {
                    "gateway_mac": gateway_mac,
                    "command_name": "set_light_control",
                    "objects": [{
                        "object_id": 3311,
                        "instance_id": 0,
                        "resource_id": 5851,
                        "resource_value": req.body.dimming_value
                    }],
                    "instance_id": 0,
                    "object_id": 3311
                }, {
                    headers: head
                }).then(response3 => {
                    res.status(200).send(response3.data);
                }).catch(error => {
                    res.status(500).send(error);
                });
            }).catch(error => {
                res.status(500).send({
                    location: "Getting Device Information",
                    error: error
                });
            });
        }).catch(error => {
            res.status(500).send({
                location: "Getting Token",
                error: error
            });
        });
    }
};