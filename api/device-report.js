/*
    api/device-report.js
    This file contains all the functions that are used to get the device report from the CMS
    getToken() - get the token from the CMS
    getAllLightDevices() - get all the light devices from the CMS
    getLightingControlReportbyDeviceandRange() - get the lighting control report from the CMS by device ID and time range

*/

const axios = require('axios');
const {
    bangkokTimeString
} = require('./disconnect-detection');
const ZONE_ID = [4, 5, 6, 7, 8, 9];
const ZONE_NAME = ["Prachasanti", "Sanya-Thammasak", "Talad Wicha", "Yung Thong - Outside", "Yung Thong - Inside", "Pitaktham"];
const base_url = process.env.CMS_BASE_URL;
const { cmsToken } = require('../utils/token');

async function getAllLightDevices(_req,res){   
    console.log("Getting all light devices");
    let allLightDevices = [];
    let finished = 0;
    try {
        ZONE_ID.forEach(async (zone_id) => {
            await axios.get(`http://siit-smart-city.azurewebsites.net/api/getZoneLightDeviceList?zone_id=${zone_id}`).then((result) => {
                return result.data;
            }).then(async (devices) => {
                await devices.map(async (device) => {
                    if(await device.device_type_id === 27036){
                        allLightDevices.push({
                            zone_id: zone_id,
                            zone_name: ZONE_NAME[ZONE_ID.indexOf(zone_id - 4)],
                            device_id: device.device_uid, 
                            device_name: device.device_label,
                            device_mac: device.MAC,
                            base_device_id: device.base_device_uid,
                            gateway_mac: device.gateway_MAC,
                            gateway_device_id: device.gateway_device_uid,
                            bb_gateway_device_id: device.bb_gateway_device_uid,
                            latitude: device.assigned_lat,
                            longitude: device.assigned_lon,
                        });
                    }
                });
            }).then(() =>{ finished++; }).catch((error) => { console.log(error); throw error; });
        }, this);
        let interval = setInterval(async () => {
            if(finished === ZONE_ID.length){
                clearInterval(interval);
                allLightDevices = allLightDevices.sort((a, b) => {
                    if (a.zone_id < b.zone_id) { return -1; }
                    else if (a.zone_id > b.zone_id) { return 1; } 
                    else { return a.device_name.localeCompare(b.device_name); }
                });
                res.status(200).send({devices: allLightDevices, totalDevices: allLightDevices.length});
                console.log("Finished getting all light devices");
            }else{
                console.log("Waiting for all light devices");
            }
        }, 1000);
    } catch (error) {
        res.status(500).send(error);
    }
}

// Lighting control report
async function getLightControlReportbyDeviceandRange(req,res) {
    let device_id = req.query.device_id;
    let start_time = req.query.start;
    let end_time = req.query.end;
    if (!device_id || !start_time || !end_time) {
        res.status(400).send("Please provide device ID, start and end time");
    } else {
        try {        
            const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
            const url = `${base_url}/reports/devices/${device_id}/objects/light_control?from=${start_time}&to=${end_time}`;
            await axios.get(url, {
                headers: head
            }).then(response => {
                if (response.status === 200) {
                    let data = response.data.values;
                    if(data.length > 0){
                        data = data.splice(1);
                        let report_result = [];
                        data.map((row) => {
                            let report_row = {
                                timestamp: bangkokTimeString(new Date(row[0]).getTime()/ 1000),
                                light_dimming_value: row[3],
                            };
                            report_result.push(report_row);
                        });
                        res.status(200).send({device_id: device_id,report: report_result});
                    }else{
                        res.status(200).send({report: []});
                    }
                }
            }).catch(error => {
                res.status(500).send({error: error});
            });
        } catch (error) {
            res.status(500).send({error: error});
        }
    }
}

// Lighting power status report
async function getLightPowerStatusReportbyDeviceandRange(req,res) {
    let device_id = req.query.device_id;
    let start_time = req.query.start;
    let end_time = req.query.end;
    if (!device_id || !start_time || !end_time) {
        res.status(400).send("Please provide device ID, start and end time");
    } else {
        try {
            const units = {light_dimming_value: "%", active_power: "W", active_energy: "kWh", v_rms: "V"};
            const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
            const url = `${base_url}/reports/devices/${device_id}/objects/lamp_monitor?from=${start_time}&to=${end_time}`;
            let response = await axios.get(url, { headers: head });
            if (response.status === 200) {
                let data = response.data.values;
                if(data.length > 0){
                    data = data.splice(1);
                    let report_result = [];
                    data.map((row) => {
                        let report_row = {
                            timestamp: (new Date(row[0]).getTime()/ 1000),
                            light_dimming_value: parseInt(row[2]),
                            active_power: parseFloat(row[3].toFixed(2)),
                            active_energy: parseFloat((row[5]/1000).toFixed(2)),
                            v_rms: parseFloat(row[7].toFixed(2))
                        };
                        report_result.push(report_row);
                    });
                    res.status(200).send({device_id: device_id,report: report_result, units: units});
                }else{
                    res.status(200).send({device_id: device_id,report: []});
                }
            }
        } catch (error) {
            res.status(500).send({error: error});
        }
    }
}

// Lighting device get last power report
async function getLastLightPowerReportbyDevice(req,res){
    let device_id = req.query.device_id;
    if (!device_id) {
        res.status(400).send("Please provide device ID");
    } else {
        try {
            const units = {light_dimming_value: "%", active_power: "W", active_energy: "kWh", v_rms: "V"};
            const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
            const url = `${base_url}/data/last/devices/${device_id}/objects`;
            await axios.get(url, {
                headers: head
            }).then(response => {
                if (response.status === 200) {
                    let data = response.data.objects;
                    let object_idx = data.findIndex(obj => obj.object_id === 27036);
                    if(object_idx !== -1){
                        let report_row = data[object_idx].resources;
                        let report_timestamp = data[object_idx].time_stamp;
                        let report_result = {
                            device_id: device_id,
                            timestamp: report_timestamp,  
                            light_dimming_value: parseInt(report_row[report_row.findIndex(rsc => rsc.resource_id === 5851)].value),
                            active_power: parseFloat(report_row[report_row.findIndex(rsc => rsc.resource_id === 5800)].value.toFixed(2)),
                            active_energy: parseFloat((report_row[report_row.findIndex(rsc => rsc.resource_id === 27004)].value/1000).toFixed(2)),
                            v_rms: parseFloat(report_row[report_row.findIndex(rsc => rsc.resource_id === 27002)].value.toFixed(2))
                        };
                        res.status(200).send({report: report_result,units: units});
                    }else{
                        res.status(200).send({report: null});
                    }
                }
            }).catch(error => {
                res.status(500).send({error: error});
            });
        } catch (error) {
            res.status(500).send({error: error});
        }
    }
}

async function getCurrentDeviceConnection(req,res){
    let deviceMAC = req.query.deviceMAC;
    let gatewayMAC = req.query.gatewayMAC;
    if (!deviceMAC || !gatewayMAC) {
        res.status(400).send("Please provide device MAC and gateway MAC");
    }else{
        try{
            const head = {
                "Authorization": "Bearer " + cmsToken.token
            };
            const url = `${base_url}/network/gateways/${gatewayMAC}/nodes/${deviceMAC}`;
            await axios.get(url, {
                headers: head
            }).then(response => {
                if (response.status === 200) {
                    let data = response.data.nodes;
                    res.status(200).send(data[0]);
                }
            }).catch(error => {
                res.status(500).send({error: error});
            });
        }catch(error){
            res.status(500).send({error: error});
        }
    }
}

async function sendGetPowerCommand(req,res) {
    let deviceID = req.query.deviceID;
    let gatewayMAC = req.query.gatewayMAC;
    if (!deviceID || !gatewayMAC) {
        res.status(400).send("Please provide device ID and gateway MAC");
    }else{
        const head = {
            "Authorization": "Bearer " + cmsToken.token
        };
        const url = base_url + "/devices/commands/id/" + deviceID;
        await axios.put(url, {
            "command_name": "get_power",
            "gateway_mac": gatewayMAC,
            "objects": [],
            "instance_id": 0,
            "object_id": null
        }, {
            headers: head
        }).then(response => {
            if (response.status === 200) {
                res.status(200).send({status: "success"});
            } else {
                res.status(500).send({status: "failed"});
            }
        }).catch(_error => {
            res.status(500).send({status: "failed"});
        });
    }
}

// Function exports
module.exports = {
    getLightControlReportbyDeviceandRange,
    getAllLightDevices,
    getLightPowerStatusReportbyDeviceandRange,
    getLastLightPowerReportbyDevice,
    getCurrentDeviceConnection,
    sendGetPowerCommand
};