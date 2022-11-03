const zoneSelection = $("#zoneSelection"),
    zoneTimestamp = $("#zoneTimestamp"),
    zonePreselectionTimestamp = $("#zonePreselectionTimestamp"),
    currentAverageActiveEnergyValue = $("#currentAverageActiveEnergyValue"), 
    currentAverageActivePowerValue = $("#currentAverageActivePowerValue"),
    currentAverageVRMSValue = $("#currentAverageVRMSValue"),
    currentAveragePowerValue = $("#currentAveragePowerValue"),
    zoneGraphContainer = $("#zoneGraphContainer"),
    graphPreselectionContainer = $("#graphPreselectionContainer"),
    graphLoadingContainer = $("#graphLoadingContainer"),
    zoneDevicePreselection = $("#zoneDevicePreselection"),
    zoneDeviceLoadingIndicator = $("#zoneDeviceLoadingIndicator"),
    zoneDeviceTable = $("#zoneDeviceTable"),
    zoneDeviceBody = $("#zoneDeviceBody"),
    zoneDeviceCaption = $("#zoneDeviceCaption");
const toastElList = [].slice.call(document.querySelectorAll('.toast'));
const toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl)
});
const noDataMessageTitle = "No recorded data is returned back from CMS Server for this time period";

let currentZoneID = null;
let currentZoneDeviceList = null;
let allZoneList = [];
let allDeviceList = [];
let allGatewayList = [];

function preSelectionHidden(hidden) {
    zonePreselectionTimestamp.attr('hidden', hidden);
    graphPreselectionContainer.attr('hidden', hidden);
    zoneDevicePreselection.attr('hidden', hidden);
    zoneDeviceCaption.text("Please select a zone first");
    if(!hidden){
        currentAverageActiveEnergyValue.text("---");
        currentAverageActivePowerValue.text("---");
        currentAverageVRMSValue.text("---");
        currentAveragePowerValue.text("---");
    }
}

function loadingHidden(hidden) {
    zoneTimestamp.attr('hidden', hidden);
    graphLoadingContainer.attr('hidden', hidden);
    zoneDeviceLoadingIndicator.attr('hidden', hidden);
    zoneDeviceCaption.text("Finished loading device list in this zone");
    if(!hidden){
        currentAverageActiveEnergyValue.text("Loading...");
        currentAverageActivePowerValue.text("Loading...");
        currentAverageVRMSValue.text("Loading...");
        currentAveragePowerValue.text("Loading...");
        zoneDeviceCaption.text("Loading device list...");
    }
}

function displayToast(toastType) {
    if (toastType === "onProgress") {
        toastList[toastList.findIndex(x => x._element.id === "onProgressToast")].show();
    }else if (toastType === "success") {
        toastList[toastList.findIndex(x => x._element.id === "successToast")].show();
    } else if (toastType === "failed") {
        toastList[toastList.findIndex(x => x._element.id === "failedToast")].show();
    }
}

function setValueDisplay(activeEnergy, activePower, vRMS, power){
    currentAverageActiveEnergyValue.text(activeEnergy);
    currentAverageActivePowerValue.text(activePower);
    currentAverageVRMSValue.text(vRMS);
    currentAveragePowerValue.text(power);
}

function insertTableRow(data) {
    let row = "<tr>";
    data.forEach(element => {
        row += "<td>" + element + "</td>";
    });
    row += "</tr>";
    return row;
}

async function setZoneListSelection() {
    try {
        await fetch('/api/getZoneList', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            }
        }).then(data => {
            let zoneList = [];
            data.map((zone) => {
                if (zone.parent_oid === 3) {
                    zoneList.push({
                        zoneID: zone.zone_id,
                        zoneName: zone.name
                    });
                }
            });
            zoneList.sort((a, b) => {
                return a.zoneID - b.zoneID;
            });
            zoneList = zoneList.slice(0, 6);
            allZoneList = zoneList;
            return zoneList;
        }).then((zoneList) => {
            zoneSelection.empty();
            zoneSelection.append(`<option>Select Zone</option>`);
            zoneList.map((zone) => {
                zoneSelection.append(`<option value="${zone.zoneID}">${zone.zoneName}</option>`);
            });
            zoneSelection.attr('disabled', false);
        }).catch(error => {
            console.error(error);
            throw error;
        });
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getGatewayList() {
    try{
        await fetch('/api/getZoneDeviceList?zone_id=10', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).then(async response => {
            if(response.status === 200){
                let data = await response.json();
                return data;
            }
        }).then(async data => {
            data.map((gateway) => {
                if(gateway.name === "PE_GATEWAY_MINI_IOT"){
                    allGatewayList.push({
                        gatewayName: gateway.device_label,
                        gatewayMAC: gateway.MAC
                    });
                }
            });
            allGatewayList.sort((a, b) => {
                return a.gatewayName.localeCompare(b.gatewayName);
            });
        }).catch(error => {
            console.error(error);
            throw error;
        });
    }catch(error){
        console.error(error);
        throw error;
    }
}

async function getAllLightDevices(){
    try{
        await fetch('/api/getAllLightDevices',{
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).then(async response => {
            if(response.status === 200){ let data = await response.json(); return data; }
        }).then(async data => {
            data = data.devices;
            data.map(async (device) => {
                allDeviceList.push({
                    deviceName: device.device_name,
                    deviceID: device.device_id,
                    deviceMAC: device.device_mac,
                    zoneID: device.zone_id,
                    gatewayMAC: device.gateway_mac,
                    gatewayName: allGatewayList.find(gateway => gateway.gatewayMAC === device.gateway_mac).gatewayName,
                });
            });
            allDeviceList.sort((a, b) => { return a.deviceName.localeCompare(b.deviceName); });
        }).catch(error => { console.error(error); throw error; });
    }catch(error){ console.error(error); throw error; }
}

async function sendGetPowerCommand(currentDeviceID, currentGatewayMAC){
    await fetch(`/api/sendGetPowerCommand?deviceID=${currentDeviceID}&gatewayMAC=${currentGatewayMAC}`,{
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).catch(error => { console.error(error); throw error; });
}

async function getDevicePowerInfo(currentDeviceID, currentGatewayMAC){
    let data = null;
    let endTime = parseInt(((new Date().getTime())/1000).toFixed(0));
    let startTime = endTime - 7200;
    await sendGetPowerCommand(currentDeviceID, currentGatewayMAC);
    await fetch(`/api/getLightPowerStatusReportbyDeviceandRange?device_id=${currentDeviceID}&start=${startTime}&end=${endTime}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).then(async response => {
        if(response.status === 200){ data = await response.json(); }
    }).catch(error => { console.error(error); throw error; });
    return data;
}

function connectionString(connected) {
    if (connected) { return "<span class='text-success'><i class='bi bi-cloud-check-fill'></i> Connected</span>"; } 
    else { return "<span class='text-danger fw-bold'><i class='bi bi-cloud-slash-fill'></i> Disconnected</span>"; }
}

let chartConfig = [];

function graphPanel(title, footer, label, xValue, yValue) {
    chartConfig.push({
        type: 'line',
        data: {
            labels: xValue,
            datasets: [{
                label: label,
                data: yValue,
                backgroundColor: 'rgb(54, 162, 235)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            scales: {
                y: {
                    beginAtZero: false,
                    grace: '25%'
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
    return `<div class="col">
        <div class="card">
            <div class="card-body">
                <h6 class="card-title">${title}</h6>
                    <canvas class="w-100" id="${label}-chart" width="300" height="175"></canvas>
            </div>
            <div class="card-footer">
                <small class="text-muted">${footer}</small>
            </div>
        </div>
    </div>`;
}

function calculateAverage(allPowerResults){
    let average = { active_energy: 0, active_power: 0, v_rms: 0, light_dimming_value: 0 };
    let zeroCount = { active_energy: 0, active_power: 0, v_rms: 0, light_dimming_value: 0 };
    allPowerResults.map((powerResult) => {
        average.active_energy += powerResult.active_energy;
        average.active_power += powerResult.active_power;
        average.v_rms += powerResult.v_rms;
        average.light_dimming_value += powerResult.light_dimming_value;
        if(powerResult.active_energy === 0) zeroCount.active_energy++;
        if(powerResult.active_power === 0) zeroCount.active_power++;
        if(powerResult.v_rms === 0) zeroCount.v_rms++;
        if(powerResult.light_dimming_value === 0) zeroCount.light_dimming_value++;
    });
    let total = allPowerResults.length;
    average.active_energy = zeroCount.v_rms !== total ? parseFloat((average.active_energy / (total - zeroCount.active_energy)).toFixed(2)) : 0;
    average.active_power = zeroCount.v_rms !== total ?  parseFloat((average.active_power / (total - zeroCount.active_power)).toFixed(2)) : 0;
    average.v_rms = zeroCount.v_rms !== total ? parseFloat((average.v_rms / (total - zeroCount.v_rms)).toFixed(2)) : 0;
    average.light_dimming_value = zeroCount.light_dimming_value !== total ? parseInt((average.light_dimming_value / (total - zeroCount.light_dimming_value)).toFixed(2)) : 0;
    return average;
}

async function main() {
    try{
    await getGatewayList();
    await getAllLightDevices();
    await setZoneListSelection();
    zoneSelection.on('change', async function () {
        currentZoneID = $(this).val();
        zoneSelection.attr('disabled', true);
        if (currentZoneID !== "Select Zone" && currentZoneID !== null) {
            currentZoneID = parseInt(currentZoneID);
            preSelectionHidden(true);
            loadingHidden(false);
            displayToast("onProgress");
            currentZoneDeviceList = allDeviceList.filter(device => device.zoneID === currentZoneID);
            zoneDeviceBody.empty();
            zoneGraphContainer.empty();

            let allTableRows = [];
            let allLatestPowerResults = [];
            let allPowerReportPast2Hours = [];
            let powerUnit = null;

            currentZoneDeviceList.map(async (device,index) => {
                await getDevicePowerInfo(device.deviceID, device.gatewayMAC).then(async (powerInfo) => {
                    let powerReport, latestPowerReport, noData = await powerInfo.report.length === 0;
                    if(noData){
                        console.log("No power report found for device: " + device.deviceID);
                        latestPowerReport = { active_energy: 0, active_power: 0, v_rms: 0, light_dimming_value: 0 };
                        powerUnit = { active_energy: "kWh", active_power: "W", v_rms: "V", light_dimming_value: "%" };
                    }else{
                        powerReport = powerInfo.report;
                        allPowerReportPast2Hours.push(powerReport);
                        latestPowerReport = powerReport[powerReport.length - 1];
                        powerUnit = powerInfo.units;
                    }
                    // handle latest power report to display in table
                    allLatestPowerResults.push(latestPowerReport);

                    await setTimeout(() => {}, 1000);
                    let activeEnergyDisplay = noData ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : latestPowerReport.active_energy+" "+powerUnit.active_energy;
                    let activePowerDisplay = noData ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : latestPowerReport.active_power+" "+powerUnit.active_power;
                    let vRMSDisplay = noData ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : latestPowerReport.v_rms+" "+powerUnit.v_rms;
                    let lightDimmingValueDisplay = noData ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : latestPowerReport.light_dimming_value+" "+powerUnit.light_dimming_value;
                    allTableRows.push([index+1, device.deviceName, device.deviceID, device.gatewayName, activeEnergyDisplay, activePowerDisplay, vRMSDisplay, lightDimmingValueDisplay]);
                });
            });

            let checkInterval = setInterval(async () => {
                if(allTableRows.length === currentZoneDeviceList.length){
                    clearInterval(checkInterval);
                    allTableRows.sort((a, b) => { return a[0] - b[0] });
                    allTableRows.map((row) => { zoneDeviceBody.append(insertTableRow(row)); });
                    // calculate average for the last entry
                    let average = calculateAverage(allLatestPowerResults);
                    // set display
                    setValueDisplay(average.active_energy+" "+powerUnit.active_energy, average.active_power+" "+powerUnit.active_power, average.v_rms+" "+powerUnit.v_rms, average.light_dimming_value+powerUnit.light_dimming_value);

                    // calculate average for the last 2 hours
                    let uniqueTime = [];
                    allPowerReportPast2Hours = allPowerReportPast2Hours.flat();
                    allPowerReportPast2Hours.map((powerReport) => {
                        powerReport.timestamp = Math.floor(powerReport.timestamp / 600) * 600;
                        if (!uniqueTime.includes(powerReport.timestamp)){ 
                            console.log("New unique time: " + powerReport.timestamp);
                            uniqueTime.push(powerReport.timestamp); 
                        }
                    });

                    allPowerReportPast2Hours.sort((a, b) => { return a.timestamp - b.timestamp });
                    uniqueTime.sort((a, b) => { return a - b });

                    console.log("Unique time: ",uniqueTime);
                    console.log(allPowerReportPast2Hours);
                    let xValue = [];
                    let averageActiveEnergyPast2Hours = [];
                    let averageActivePowerPast2Hours = [];
                    uniqueTime.forEach((time) => {
                        let powerReport = allPowerReportPast2Hours.filter(powerReport => powerReport.timestamp === time);
                        let avg = calculateAverage(powerReport);
                        averageActiveEnergyPast2Hours.push(avg.active_energy);
                        averageActivePowerPast2Hours.push(avg.active_power);
                        xValue.push(new Date(time * 1000).toLocaleTimeString( 'th-TH', { hour: '2-digit', minute: '2-digit'}));
                    });
                    console.log("xValue: ",xValue);
                    console.log("averageActiveEnergyPast2Hours: ",averageActiveEnergyPast2Hours);
                    console.log("averageActivePowerPast2Hours: ",averageActivePowerPast2Hours);

                    // set chart
                    chartConfig = [];
                    let timestampStringMessage = "As of " + datetimeTransform(new Date().toISOString());
                    zoneGraphContainer.append(graphPanel("Average active energy in the past 2 hours", timestampStringMessage, "AVG_ACTIVE_ENERGY", xValue, averageActiveEnergyPast2Hours));
                    let ctx1 = document.getElementById("AVG_ACTIVE_ENERGY-chart").getContext('2d');
                    let _chart1 = new Chart(ctx1, chartConfig[0]);

                    zoneGraphContainer.append(graphPanel("Average active power in the past 2 hours", timestampStringMessage, "AVG_ACTIVE_POWER", xValue, averageActivePowerPast2Hours));
                    let ctx2 = document.getElementById("AVG_ACTIVE_POWER-chart").getContext('2d');
                    let _chart2 = new Chart(ctx2, chartConfig[1]);

                    loadingHidden(true);
                    displayToast("success");
                    zoneSelection.attr('disabled', false);
                }
            }, 2000);
        }else{
            preSelectionHidden(false);
            loadingHidden(true);
            zoneSelection.attr('disabled', false);
        }
    });
    }catch(err){
        console.error(err);
        displayToast("failed");
        zoneSelection.attr('disabled', false);
    }
}

$(document).ready(main);