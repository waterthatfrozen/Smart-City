const axios = require('axios').default;
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const initializeTime = Math.round(new Date().getTime() / 1000);
let intervalDuration = 60 * 10;
let startTime = initializeTime - intervalDuration;
let endTime = initializeTime;
let lastKnownConnectedTime = 0;

let sensorConnected = false;

function bangkokTimeString(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok'
    });
}

// function to insert disconnect log into database
function insertLog(disconnectStartTime, disconnectEndTime) {
    disconnectStartTime = bangkokTimeString(disconnectStartTime);
    disconnectEndTime = bangkokTimeString(disconnectEndTime);
    // check for previous disconnect log
    let selectQuery = "SELECT * FROM dbo.sensor_disconnect_log WHERE disconnectEndTime = '" + disconnectStartTime + "'";
    let logQuery = "";
    sql.query(selectQuery, function (err, result) {
        if (!err) {
            if (result.recordset.length > 0) {
                // update disconnect log
                logQuery = "UPDATE dbo.sensor_disconnect_log SET disconnectEndTime = '" + disconnectEndTime + "' WHERE disconnectEndTime = '" + disconnectStartTime + "'";
            } else {
                // insert disconnect log
                logQuery = "INSERT INTO dbo.sensor_disconnect_log (disconnectStartTime, disconnectEndTime) VALUES ('" + disconnectStartTime + "', '" + disconnectEndTime + "')";
            }
        } else {
            console.log(err);
        }
        sql.query(logQuery, function (err2, _result) {
            if (err2) {
                console.log(err2);
            }
        });
    });
}

// calling the API to get the data every 10 minutes to check if the sensor is connected or not
function checkSensorConnection() {
    axios.get('http://localhost:3000/api/getEnvSensorData', {
        headers: {
            'Content-Type': 'application/json'
        },
        params: {
            start: startTime,
            end: endTime
        }
    }).then(function (response) {
        let data = response.data.values;
        if (data.length > 0) {
            sensorConnected = true;
            lastKnownConnectedTime = new Date(data[1][0]).getTime() / 1000;
        } else {
            sensorConnected = false;
            insertLog(startTime, endTime);
        }
    }).catch(function (error) {
        // check for 400 error
        if (error.response.status === 400) {
            sensorConnected = false;
            insertLog(startTime, endTime);
        }
    }).finally(function () {
        startTime = endTime;
        endTime = startTime + intervalDuration;
    });
}

checkSensorConnection();
setInterval(() => {
    checkSensorConnection();
}, intervalDuration * 1000);

exports.checkSensorConnection = function (_req, res) {
    res.status(200).send({
        connected: sensorConnected,
        lastKnownConnectedTime: bangkokTimeString(lastKnownConnectedTime),
        checkTime: bangkokTimeString(startTime),
        intervalDuration: intervalDuration
    });
};