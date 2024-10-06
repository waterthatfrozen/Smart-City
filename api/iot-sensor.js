/**
 * THIS FILE IS DEPRECATED
 */

const axios = require('axios').default;
const sql = require('mssql');
const dotenv = require('dotenv');
dotenv.config();

let lastRecordedData = {};
let lastRecordedDataTimestamp = null;

// function to transform datetime to YYYY-MM-DD HH:MM:SS.mmm format
function transformDatetime(datetime) {
    var date = new Date(datetime);
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var day = date.getDate();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var second = date.getSeconds();
    var millisecond = date.getMilliseconds();
    var datetimeString = year + "-" + month + "-" + day + " " + hour + ":" + minute + ":" + second + "." + millisecond;
    return datetimeString;
}

// function to insert data into database
function insertSensorData(sensorData) {
    let dataTimestamp = sensorData.Timestamp;
    let thingInfoPortion = sensorData.ThingInfo;
    let sensorsPortion = sensorData.Sensors;
    let insertQuery = `
        INSERT INTO dbo.sensor_measurement
        (measurementTimestamp,thingID,light_intensity,temperature,humidity,air_pressure,uv_index,v_mq2,v_mq4,v_mq7,v_mq8,infrared,microwave_doppler,pm1_env,pm25_env,pm100_env,pm1_stand,pm25_stand,pm100_stand)
        VALUES ('${transformDatetime(dataTimestamp)}', N'${thingInfoPortion.ThingId}',${sensorsPortion.Light},${sensorsPortion.Temperature},${sensorsPortion.Humidity},${sensorsPortion.Pressure},${sensorsPortion.UV},${sensorsPortion.V_MQ2},${sensorsPortion.V_MQ4},${sensorsPortion.V_MQ7},${sensorsPortion.V_MQ8},${sensorsPortion.Infrared},${sensorsPortion.Microwave_Doppler},${sensorsPortion.PM1_Env},${sensorsPortion.PM25_Env},${sensorsPortion.PM100_Env},${sensorsPortion.PM1_Stand},${sensorsPortion.PM25_Stand},${sensorsPortion.PM100_Stand});`;
    sql.query(insertQuery, (err, result) => {
        if (err) {
            throw new Error(err);
        } else {
            return result;
        }
    });
}

// function to check if data is new
function isNewData(sensorData) {
    let dataTimestamp = sensorData.Timestamp;
    if (lastRecordedDataTimestamp == null) {
        lastRecordedDataTimestamp = dataTimestamp;
        lastRecordedData = sensorData;
        return true;
    } else {
        if (lastRecordedDataTimestamp == dataTimestamp) {
            return false;
        } else {
            lastRecordedDataTimestamp = dataTimestamp;
            lastRecordedData = sensorData;
            return true;
        }
    }
}

// function to send data to database
function sendDataToDatabase(sensorData) {
    if (isNewData(sensorData)) {
        insertSensorData(sensorData);
    }
}

function recordIoTSensorValue(req,res){
    try {
        let sensorData = req.body;
        sendDataToDatabase(sensorData);
        res.status(200).send({
            status: 200,
            message: "received data successfully",
        });
    } catch (error) {
        res.status(500).send({
            status: 500,
            message: "error on receiving data",
            error: error
        });
    }
}

function getLastRecordedData(_req,res){
    try {
        res.status(200).send({
            status: 200,
            message: "last recorded data",
            data: lastRecordedData
        });
    } catch (error) {
        res.status(500).send({
            status: 500,
            message: "error on getting last recorded data",
            error: error
        });
    }
}

function getRecordedData(req,res){
    if(req.query.start == null || req.query.end == null || req.query.thing_id == null){
        res.status(400).send({
            status: 400,
            message: "start, end, and thing_id query parameters are required"
        });
    }else{
        let start = req.query.start;
        // transform UNIX start to YYYY-MM-DD HH:MM:SS.mmm format
        let startDatetimeString = transformDatetime(new Date(start * 1000));
        let end = req.query.end;
        // transform UNIX end to YYYY-MM-DD HH:MM:SS.mmm format
        let endDatetimeString = transformDatetime(new Date(end * 1000));
        let query = `SELECT * FROM dbo.sensor_measurement WHERE measurementTimestamp BETWEEN '${startDatetimeString}' AND '${endDatetimeString}' AND thingID = N'${req.query.thing_id}' ORDER BY measurementTimestamp DESC`;
        sql.query(query, (err, result) => {
            if (err) {
                throw new Error(err);
            } else {
                res.status(200).send({
                    status: 200,
                    data: result.recordset
                });
            }
        });
    }
}

exports.recordIoTSensorValue = recordIoTSensorValue;
exports.getLastRecordedData = getLastRecordedData;
exports.getRecordedData = getRecordedData;