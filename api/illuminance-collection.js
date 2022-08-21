const axios = require('axios');
const {
    bangkokTimeString
} = require('./disconnect-detection');

// Selected Device
// Light Device: 1.1, 1.6, 1.12, 2.1, 2.13, 2.25, 3.1, 3.15, 3.29, 4.1, 4.8, 5.1, 5.22, 5.44, 5.66, 6.1, 6.14, 6.27
const deviceIDPrefixes = ["B1000026B0", "B100002602", "B10000262A", "B100002609", "B100002619", "B100002613", "B10000268F", "B100004F7F", "B100002614", "B10000D2D6", "B10000D2D3", "B10000D2D2", "B10000C382", "B10000D2E7", "B10000BC45", "B10000BC4A", "B10000BC3E", "B10000D2C8"];
// Interval at 15 minutes
const intervalDuration = 60 * 15; 
const base_url = process.env.CMS_BASE_URL;
let lastSensorValue = null;

async function getToken() {
    try {
        const auth = {
            "username": process.env.CMS_UNAME,
            "password": process.env.CMS_PWD,
            "cms_uid": process.env.CMS_UID
        };
        const response = await axios.post(base_url + "/token", auth);
        return response.data.token;
    } catch (error) {
        console.log(error);
    }
}

async function getDeviceLabel(deviceID) {
    const deviceInfoResponse = await axios.get("https://siit-smart-city.azurewebsites.net/api/getDeviceInfo", {
        params: {
            device_id: deviceID
        }
    });
    return deviceInfoResponse.data.device_label;
}


async function getDeviceGatewayMAC(deviceID) {
    const deviceInfoResponse = await axios.get("https://siit-smart-city.azurewebsites.net/api/getDeviceInfo", {
        params: {
            device_id: deviceID
        }
    });
    return deviceInfoResponse.data.gateway_MAC;
}

async function sendGetSensorCommand(deviceID, gatewayMAC) {
    console.log("Sending get illuminance command to " + deviceID);
    const token = await getToken();
    const head = {
        "Authorization": "Bearer " + token
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
    const token = await getToken();
    const head = {
        "Authorization": "Bearer " + token
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
    }else{
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
    return illuminanceValues;
}


exports.getLastLumianceSensorValue = function (_req, res) {
    res.status(200).send(lastSensorValue);
};

getAllLuminanceSensorValue();
setInterval(getAllLuminanceSensorValue, intervalDuration * 1000);