const axios = require('axios').default;
// const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

const initializeTime = Math.round(new Date().getTime() / 1000);
const CMSInitializeTime = Math.round(new Date("2022-02-04 17:00:00 +07").getTime() / 1000);
let intervalDuration = 60 * 10;
let startTime = initializeTime - intervalDuration;
let endTime = initializeTime;
let lastKnownSensorConnectedTime = 0;
let gatewayDisconnectLog = [];
let sensorCheckError = false;
let sensorErrorMessage = "";
let gatewayErrorMessage = "";
let sensorConnected = false;

function bangkokTimeString(timestamp) {
    return new Date(timestamp * 1000).toLocaleString('en-GB', {
        timeZone: 'Asia/Bangkok'
    });
}

// function to insert disconnect log into database
// function insertSensorDisconnectLog(disconnectStartTime, disconnectEndTime) {
//     disconnectStartTime = bangkokTimeString(disconnectStartTime);
//     disconnectEndTime = bangkokTimeString(disconnectEndTime);
//     // check for previous disconnect log
//     let selectQuery = "SELECT * FROM dbo.sensor_disconnect_log WHERE disconnectEndTime = '" + disconnectStartTime + "'";
//     let logQuery = "";
//     sql.query(selectQuery, function (err, result) {
//         if (err) {
//             throw err;
//         }
//         if (result.recordset.length > 0) {
//             // update disconnect log
//             logQuery = "UPDATE dbo.sensor_disconnect_log SET disconnectEndTime = '" + disconnectEndTime + "' WHERE disconnectEndTime = '" + disconnectStartTime + "'";
//         } else {
//             // insert disconnect log
//             logQuery = "INSERT INTO dbo.sensor_disconnect_log (disconnectStartTime, disconnectEndTime) VALUES ('" + disconnectStartTime + "', '" + disconnectEndTime + "')";
//         }
//         sql.query(logQuery, function (err2, _result) {
//             if (err2) {
//                 throw err2;
//             }
//         });
//     });
// }

// function insertGatewayDisconnectLog(gatewayName, disconnectTime) {
//     disconnectTime = bangkokTimeString(disconnectTime);
//     // check for previous disconnect log
//     // if exists, no need to insert
//     let selectQuery = "SELECT * FROM dbo.gateway_disconnect_log WHERE gatewayName = '" + gatewayName + "' AND disconnectTime = '" + disconnectTime + "'";
//     sql.query(selectQuery, function (err, result) {
//         if (err) {
//             throw err;
//         }
//         if (result.recordset.length === 0) {
//             let logQuery = "INSERT INTO dbo.gateway_disconnect_log (gatewayName, disconnectTime) VALUES ('" + gatewayName + "', '" + disconnectTime + "')";
//             sql.query(logQuery, (err2, _result) => {
//                 if (err2) {
//                     throw err2;
//                 }
//             });
//         }
//     });
// }

// calling the API to get the data every 10 minutes to check if the sensor is connected or not
function checkSensorConnection() {
    sensorCheckError = false;
    axios.get('http://siit-smart-city.azurewebsites.net/api/getEnvSensorData', {
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
            lastKnownSensorConnectedTime = new Date(data[1][0]).getTime() / 1000;
        } else {
            sensorConnected = false;
            // insertSensorDisconnectLog(startTime, endTime);
        }
    }).catch(function (error) {
        if (error.response !== undefined) {
            if (error.response.status === 400) {
                sensorConnected = false;
                // insertSensorDisconnectLog(startTime, endTime);
            }
        } else {
            sensorCheckError = true;
            sensorErrorMessage = error.message;
        }
    }).finally(function () {
        startTime = endTime;
        endTime = startTime + intervalDuration;
    });
}

async function checkGatewayConnection() {
    axios.get('https://siit-smart-city.azurewebsites.net/api/getZoneEvent', {
        headers: {
            'Content-Type': 'application/json'
        },
        params: {
            zone_id: 10
        }
    }).then(function (response) {
        gatewayDisconnectLog = [];
        let gatewayLogData = response.data;
        if (gatewayLogData.length > 0) {
            gatewayLogData.forEach(function (log) {
                let gatewayLogTimestamp = new Date(log.timestamp).getTime() / 1000;
                let gatewayLogName = log.device_label.split('_BB')[0];
                if (log.name.toLowerCase() === 'gateway_disconnect' && gatewayLogTimestamp > CMSInitializeTime) {
                    let gatewayLog = {
                        device_id: log.device_uid,
                        gateway_name: gatewayLogName,
                        gateway_timestamp: bangkokTimeString(gatewayLogTimestamp),
                        gateway_event: log.name
                    }
                    // insertGatewayDisconnectLog(gatewayLogName, gatewayLogTimestamp);
                    gatewayDisconnectLog.push(gatewayLog);
                }
            });
        }
    }).catch(function (error) {
        gatewayDisconnectLog = null;
        gatewayErrorMessage = error.message;
    });
}

// async function querySQL(query) {
//     return new Promise((resolve, reject) => {
//         sql.query(query, (err, result) => {
//             if (err) {
//                 reject(err);
//             }
//             resolve(result.recordset);
//         });
//     });
// }

// async function queryGatewayDisconnectLog(queryStartTime = 0, queryEndTime = 0) {
//     let logQuery = "SELECT * FROM dbo.gateway_disconnect_log"
//     if (queryStartTime > 0 && endTime > 0) {
//         logQuery += " WHERE disconnectTime BETWEEN '" + bangkokTimeString(queryStartTime) + "' AND '" + bangkokTimeString(queryEndTime) + "'";
//     }
//     logQuery += " ORDER BY disconnectTime DESC";
//     return querySQL(logQuery);
// }

// async function getSensorDisconnectLog(queryStartTime = 0, queryEndTime = 0) {
//     let logQuery = "SELECT * FROM dbo.sensor_disconnect_log"
//     if (queryStartTime > 0 && endTime > 0) {
//         logQuery += " WHERE disconnectEndTime BETWEEN '" + bangkokTimeString(queryStartTime) + "' AND '" + bangkokTimeString(queryEndTime) + "'";
//     }
//     logQuery += " ORDER BY disconnectEndTime DESC";
//     return querySQL(logQuery);
// }

function checkAllConnection() {
    checkSensorConnection();
    checkGatewayConnection();
}

checkAllConnection();
setInterval(() => {
    checkAllConnection();
}, intervalDuration * 1000);

exports.checkSensorConnection = function (_req, res) {
    if (sensorCheckError) {
        res.status(500).send({
            error: "Error while checking sensor connection",
            message: sensorErrorMessage
        });
    } else {
        res.status(200).send({
            connected: sensorConnected,
            lastKnownConnectedTime: bangkokTimeString(lastKnownSensorConnectedTime),
            checkTime: bangkokTimeString(startTime),
            intervalDuration: intervalDuration
        });
    }
};

exports.checkGatewayConnection = function (_req, res) {
    if (gatewayDisconnectLog !== null) {
        res.status(200).send({
            gatewayDisconnectLog: gatewayDisconnectLog,
            checkTime: bangkokTimeString(startTime),
            intervalDuration: intervalDuration
        });
    } else {
        res.status(500).send({
            error: "Error while getting gateway disconnect log",
            message: gatewayErrorMessage
        });
    }
};

// exports.queryGatewayDisconnectLog = function (req, res) {
//     let queryStartTime = req.query.start;
//     let queryEndTime = req.query.end;
//     if (queryStartTime === undefined || queryEndTime === undefined) {
//         queryStartTime = 0;
//         queryEndTime = 0;
//     }
//     queryGatewayDisconnectLog(queryStartTime, queryEndTime).then(function (result) {
//         res.status(200).send({
//             gatewayDisconnectLog: result,
//             queryTime: parseInt(((new Date().getTime()) / 1000).toFixed(0))
//         });
//     }).catch(function (error) {
//         res.status(500).send({
//             error: "Error while getting gateway disconnect log",
//             message: error.message
//         });
//     });
// }

// exports.querySensorDisconnectLog = function (req, res) {
//     let queryStartTime = req.query.start;
//     let queryEndTime = req.query.end;
//     if (queryStartTime === undefined || queryEndTime === undefined) {
//         queryStartTime = 0;
//         queryEndTime = 0;
//     }
//     getSensorDisconnectLog(queryStartTime, queryEndTime).then(function (result) {
//         res.status(200).send({
//             sensorDisconnectLog: result,
//             queryTime: parseInt(((new Date().getTime()) / 1000).toFixed(0))
//         });
//     }).catch(function (error) {
//         res.status(500).send({
//             error: "Error while getting sensor disconnect log",
//             message: error.message
//         });
//     });
// }

exports.bangkokTimeString = bangkokTimeString;