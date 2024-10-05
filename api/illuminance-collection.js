const axios = require('axios');
const {
    bangkokTimeString
} = require('./disconnect-detection');
const { cmsToken } = require('../utils/token');

// Selected Device
// Light Device:          1.2,          1.6,          1.12,         2.1,          2.13,         2.25,         3.1,          3.15,         3.29,         4.1,          4.8,          5.1,          5.22,         5.44,         5.66,         6.1,          6.14,         6.27
const deviceIDPrefixes = ["B100002630", "B100002602", "B10000262A", "B100002609", "B100002619", "B100002357", "B10000268F", "B100004F7F", "B100002614", "B10001703E", "B100017043", "B10001705C", "B100017072", "B10001708B", "B100017050", "B100017039", "B10001705B", "B10001703D"];
// Interval at 15 minutes
const intervalDuration = 60 * 15;
const base_url = process.env.CMS_BASE_URL;
let lastSensorValue = [];
let currentTimestamp = 0;

async function getDeviceLabel(deviceID) {
    try {
        const deviceInfoResponse = await axios.get("https://siit-smart-city.azurewebsites.net/api/getDeviceInfo?device_id="+deviceID);
        return deviceInfoResponse.data.device_label;
    } catch (error) {
        console.log(error);
    }
}


async function getDeviceGatewayMAC(deviceID) {
    try {
        const deviceInfoResponse = await axios.get("https://siit-smart-city.azurewebsites.net/api/getDeviceInfo?device_id="+deviceID);
        return deviceInfoResponse.data.gateway_MAC;
    } catch (error) {
        console.log(error);
    }
}

async function getDeviceZoneID(deviceID) {
    try {
        const deviceInfoResponse = await axios.get("https://siit-smart-city.azurewebsites.net/api/getDeviceInfo?device_id="+deviceID);
        return deviceInfoResponse.data.zone_id;
    } catch (error) {
        console.log(error);
    }
}

async function sendGetSensorCommand(deviceID, gatewayMAC) {
    const head = {
        "Authorization": "Bearer " + cmsToken.token
    };
    const url = base_url + "/devices/commands/id/" + deviceID;
    await axios.put(url, {
        "command_name": "get_ipso_object",
        "gateway_mac": gatewayMAC,
        "objects": [],
        "instance_id": 0,
        "object_id": 3301
    }, {
        headers: head
    }).then(response => {
        if (response.status === 200) {
            console.log("Successfully sent get illuminance command to " + deviceID);
        } else {
            console.log("Failed to send get illuminance command to " + deviceID);
        }
    }).catch(_error => {
        console.log("Failed to send get illuminance command to " + deviceID);
    });
}

async function getLuminanceSensorValue(deviceID) {
    console.log("Getting illuminance value from " + deviceID);
    const currentTime = Math.round(new Date().getTime() / 1000);
    const head = {
        "Authorization": "Bearer " + cmsToken.token
    };
    const url = base_url + "/data/last/devices/" + deviceID + "/objects";
    let valueResponse = await axios.get(url, {
        headers: head
    });
    let status = valueResponse.status;
    valueResponse = valueResponse.data.objects[0];
    // If the timestamp is less than 1 hour ago, return the value
    // Otherwise, return null
    let illuminanceValue = null;
    let illuminanceTimestamp = valueResponse.time_stamp;
    if (status === 200 && Math.abs(illuminanceTimestamp - currentTime) <= 3600) {
        illuminanceValue = parseInt(valueResponse.resources[0].value);
        illuminanceTimestamp = valueResponse.time_stamp;
    } else {
        illuminanceTimestamp = currentTime;
    }
    illuminanceTimestamp = bangkokTimeString(illuminanceTimestamp);
    return {
        sensor_value: illuminanceValue,
        unit: "lx",
        timestamp: illuminanceTimestamp,
        sensor_device_id: deviceID,
    };
}

async function getAllLuminanceSensorValue() {
    console.log("Calling new set of data");
    let illuminanceValues = [];
    // Send command to read value from illuminance Sensor
    for (const deviceID of deviceIDPrefixes) {
        let currentDeviceID = deviceID + "0CE500";
        const gatewayMAC = await getDeviceGatewayMAC(currentDeviceID);
        await sendGetSensorCommand(currentDeviceID, gatewayMAC);
    }
    // Obtain value from illuminance Sensor
    for (const deviceID of deviceIDPrefixes) {
        let currentDeviceID = deviceID + "0CE500";
        let currentValue = await getLuminanceSensorValue(currentDeviceID);
        let currentLightDeviceID = deviceID + "0CEF00";
        currentValue["light_device_id"] = currentLightDeviceID;
        currentValue["light_device_name"] = await getDeviceLabel(currentLightDeviceID);
        illuminanceValues.push(currentValue);
    }
    lastSensorValue = illuminanceValues;
    currentTimestamp = Math.round(new Date().getTime() / 1000);
    return illuminanceValues;
}

async function getLuminanceSensorValueByDeviceIDandRange(device_id, start, end){
    const url = base_url + `/reports/devices/${device_id}/objects/illuminance?from=${start}&to=${end}`;
    const head = {
        "Authorization": "Bearer " + cmsToken.token
    };
    let valueResponse = await axios.get(url, {
        headers: head
    });
    let status = await valueResponse.status;
    valueResponse = await valueResponse.data.values;
    let illuminanceValues = [];
    if (status === 200) {
        valueResponse = valueResponse.slice(1);
        for (const value of valueResponse) {
            illuminanceValues.push({
                timestamp: bangkokTimeString(new Date(value[0]).getTime() / 1000),
                sensor_value: parseInt(value[1])
            });
        }
    }
    let response = {
        sensor_device_id: device_id,
        sensor_values: illuminanceValues,
        unit: "lx"
    };
    return response;
}

async function getSensorValueByDeviceIDandRange(req,res){
    if (req.query.device_id === undefined || req.query.start === undefined || req.query.end === undefined) {
        res.status(400).send({message: "Missing device ID, start, or end query parameter"});
    } else {
        let response = await getLuminanceSensorValueByDeviceIDandRange(req.query.device_id, req.query.start, req.query.end);
        res.status(200).send(response);
    }
}

async function getSensorValuebyRange(req, res){
    if (req.query.start === undefined || req.query.end === undefined) {
        res.status(400).send({message: "Missing start or end query parameter"});
    }else{
        let start = req.query.start;
        let end = req.query.end;
        let illuminanceValues = [];
        for (const deviceID of deviceIDPrefixes) {
            let currentDeviceID = deviceID + "0CE500";
            let currentValue = await getLuminanceSensorValueByDeviceIDandRange(currentDeviceID, start, end);
            let currentLightDeviceID = deviceID + "0CEF00";
            currentValue["light_device_id"] = currentLightDeviceID;
            currentValue["light_device_name"] = await getDeviceLabel(currentLightDeviceID);
            illuminanceValues.push(currentValue);
        }
        res.status(200).send(illuminanceValues);
    }
}

async function getAllIluminanceSensorDevices(_req,res){
    let devices = [];
    deviceIDPrefixes.map(async (deviceID) => {
        let currentDeviceID = deviceID + "0CE500";
        let currentLightDeviceID = deviceID + "0CEF00";
        let currentLightDeviceName = await getDeviceLabel(currentLightDeviceID);
        devices.push({
            sensorDeviceID: currentDeviceID,
            lightDeviceID: currentLightDeviceID,
            lightDeviceName: currentLightDeviceName,
        });
    });
    let interval = setInterval(async () => {
        if (devices.length === deviceIDPrefixes.length) {
            clearInterval(interval);
            res.status(200).send({illuminanceDevices: devices, totalDevices: devices.length});
        }
    }, 1000);
}

exports.getSensorValuebyRange = getSensorValuebyRange;
exports.getSensorValueByDeviceIDandRange = getSensorValueByDeviceIDandRange;
exports.getAllIluminanceSensorDevices = getAllIluminanceSensorDevices;

exports.getLastLumianceSensorValue = function (_req, res) {
    res.status(200).send({
        data: lastSensorValue,
        timestamp: currentTimestamp
    });
};

getAllLuminanceSensorValue();
setInterval(getAllLuminanceSensorValue, intervalDuration * 1000);