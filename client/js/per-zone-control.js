const zoneSelection = $("#zoneSelection"),
    zoneTimestamp = $("#zoneTimestamp"),
    zonePreselectionTimestamp = $("#zonePreselectionTimestamp"),
    zoneDevicePreselection = $("#zoneDevicePreselection"),
    zoneDeviceLoadingIndicator = $("#zoneDeviceLoadingIndicator"),
    zoneDeviceTable = $("#zoneDeviceTable"),
    zoneDeviceBody = $("#zoneDeviceBody"),
    zoneDeviceCaption = $("#zoneDeviceCaption");
const toastElList = [].slice.call(document.querySelectorAll('.toast'));
const toastList = toastElList.map(function (toastEl) { return new bootstrap.Toast(toastEl) });
const noDataMessageTitle = "No recorded data is returned back from CMS Server for this time period";

let currentZoneID = null;
let currentZoneDeviceList = null;
let allZoneList = [];
let allDeviceList = [];
let allGatewayList = [];

function resetDisplay() {
    zoneDeviceBody.empty();
}

function enableAllButtons() {
    $("#setDimming0").attr('disabled', false);
    $("#setDimming25").attr('disabled', false);
    $("#setDimming50").attr('disabled', false);
    $("#setDimming75").attr('disabled', false);
    $("#setDimming100").attr('disabled', false);
    $("#setDimmingCustom").attr('disabled', false);
    $("#newDimmingValue").attr('disabled', false);
}

function disableAllButtons() {
    $("#setDimming0").attr('disabled', true);
    $("#setDimming25").attr('disabled', true);
    $("#setDimming50").attr('disabled', true);
    $("#setDimming75").attr('disabled', true);
    $("#setDimming100").attr('disabled', true);
    $("#setDimmingCustom").attr('disabled', true);
    $("#newDimmingValue").attr('disabled', true);
}

function preSelectionHidden(hidden) {
    zonePreselectionTimestamp.attr('hidden', hidden);
    zoneDevicePreselection.attr('hidden', hidden);
    zoneDeviceCaption.text("Please select a zone first");
    if(!hidden){ zoneDeviceBody.empty(); }
}

function loadingHidden(hidden) {
    zoneTimestamp.attr('hidden', hidden);
    zoneDeviceLoadingIndicator.attr('hidden', hidden);
    zoneDeviceCaption.text("Finished loading device list in this zone");
    if(!hidden){ zoneDeviceCaption.text("Loading device list..."); }
}

function displayToast(toastType) {
    if (toastType === "dataOnProgress") { toastList[toastList.findIndex(x => x._element.id === "dataOnProgressToast")].show(); }
    else if (toastType === "dataSuccess") { toastList[toastList.findIndex(x => x._element.id === "dataSuccessToast")].show(); } 
    else if (toastType === "dataFailed") { toastList[toastList.findIndex(x => x._element.id === "dataFailedToast")].show(); }
    else if (toastType === "lightOnProgress") { toastList[toastList.findIndex(x => x._element.id === "lightOnProgressToast")].show(); }
    else if (toastType === "lightSuccess") { toastList[toastList.findIndex(x => x._element.id === "lightSuccessToast")].show(); }
    else if (toastType === "lightFailed") { toastList[toastList.findIndex(x => x._element.id === "lightFailedToast")].show(); }
}

function setToastMessage(toastType, message){
    let target = $("#"+toastType+"ToastText");
    target.text(message);
}

function insertTableRow(data) {
    let row = "<tr>";
    data.forEach(element => { row += "<td>" + element + "</td>"; });
    row += "</tr>";
    return row;
}

async function setZoneListSelection() {
    try {
        await fetch('/api/getZoneList', {
            method: 'GET', headers: { 'Content-Type': 'application/json' }
        }).then(response => {
            if (response.status === 200) { return response.json(); }
        }).then(data => {
            let zoneList = [];
            data.map((zone) => { if (zone.parent_oid === 3) { zoneList.push({ zoneID: zone.zone_id, zoneName: zone.name }); } });
            zoneList.sort((a, b) => { return a.zoneID - b.zoneID; });
            zoneList = zoneList.slice(0, 6);
            allZoneList = zoneList;
            return zoneList;
        }).then((zoneList) => {
            zoneSelection.empty();
            zoneSelection.append(`<option>Select Zone</option>`);
            zoneList.map((zone) => { zoneSelection.append(`<option value="${zone.zoneID}">${zone.zoneName}</option>`); });
            zoneSelection.attr('disabled', false);
        }).catch(error => { console.error(error); });
    } catch (error) { console.error(error); }
}

async function getGatewayList() {
    try{
        await fetch('/api/getZoneDeviceList?zone_id=10', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).then(async response => {
            if(response.status === 200){ let data = await response.json(); return data; }
        }).then(async data => {
            data.map((gateway) => {
                if(gateway.name === "PE_GATEWAY_MINI_IOT"){ 
                    allGatewayList.push({ gatewayName: gateway.device_label, gatewayMAC: gateway.MAC }); 
                }
            });
            allGatewayList.sort((a, b) => { return a.gatewayName.localeCompare(b.gatewayName); });
        }).catch(error => { console.error(error); });
    }catch(error){ console.error(error); }
}

async function getAllLightDevices(){
    try{
        await fetch('/api/getAllLightDevices',{ method: 'GET', headers: { 'Content-Type': 'application/json' }
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
        }).catch(error => { console.error(error); });
    }catch(error){ console.error(error); }
}

async function sendGetPowerCommand(currentDeviceID, currentGatewayMAC){
    await fetch(`/api/sendGetPowerCommand?deviceID=${currentDeviceID}&gatewayMAC=${currentGatewayMAC}`,{
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    }).catch(error => { console.error(error); });
}

async function getDevicePowerInfo(currentDeviceID, currentGatewayMAC){
    let data = null;
    await sendGetPowerCommand(currentDeviceID, currentGatewayMAC).then(async () => {
        await fetch(`/api/getLastLightPowerReportbyDevice?device_id=${currentDeviceID}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        }).then(async response => {
            if(response.status === 200){ data = await response.json(); }
        }).catch(error => { console.error(error); });
        return data.report;
    }).catch(error => { console.error(error); });
    return data;
}

function connectionString(connected) {
    if (connected) { return "<span class='text-success'><i class='bi bi-cloud-check-fill'></i> Connected</span>"; } 
    else { return "<span class='text-danger fw-bold'><i class='bi bi-cloud-slash-fill'></i> Disconnected</span>"; }
}

async function setNewDimmingValue(currentDeviceID, newDimmingValue) {
    try {
        newDimmingValue = parseInt(newDimmingValue);
        if (newDimmingValue < 0 || newDimmingValue > 100) { throw new Error("Invalid Dimming Value"); }
        let response = await fetch(`/api/setLightDimming`,{
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ device_id: currentDeviceID, dimming_value: newDimmingValue })
        });
        let data = await response.json();
        return data;
    }
    catch (error) {
        console.log(error);
    }
}

async function setZoneDevicesNewDimmingValue(deviceList, newDimmingValue) {
    if(deviceList.length !== 0){
        try {            
            setToastMessage("lightOnProgress", "Sending light command to devices in the selected zone...");
            displayToast("lightOnProgress");
            disableAllButtons();
            zoneSelection.attr('disabled', true);
            resetDisplay();
            let finishedCount = 0, failedCount = 0;
            deviceList.map(async (device) => {
                console.log("Send to device: ", device.deviceID, "Gateway: ", device.gatewayMAC);
                await setNewDimmingValue(device.deviceID, newDimmingValue).then(async response => {
                    console.log(response);
                    if(response.response_code === 200){ finishedCount++; }
                    else{ failedCount++; }
                }).catch(error => { failedCount++; console.error(error); });
                console.log("Finished: ", finishedCount, "Failed: ", failedCount, "Total: ", deviceList.length);
            });
            let interval = setInterval(() => {
                if((finishedCount === deviceList.length) || (failedCount === deviceList.length) || (finishedCount + failedCount === deviceList.length)){
                    clearInterval(interval);
                    zoneSelection.attr('disabled', false);
                    preSelectionHidden(false);
                    if(failedCount === 0){ 
                        setToastMessage("lightSuccess", "All devices in the selected zone have been successfully updated.");
                        displayToast("lightSuccess"); 
                    }else{ 
                        setToastMessage("lightFailed", `Sent command to ${finishedCount} devices successfully, ${failedCount} devices failed.`);
                        displayToast("lightFailed"); 
                    }
                }else{
                    console.log("Waiting for all devices to finish");
                    setToastMessage("lightOnProgress", `Sending command to remaining ${deviceList.length - finishedCount} from ${deviceList.length} devices (Current progress: ${(finishedCount/deviceList.length*100).toFixed(2)}%).`);
                    displayToast("lightOnProgress");
                }
            }, 6000);
        }catch(error){
            console.error(error);
            setToastMessage("lightFailed", "An error has occurred while turning on lights. Please try again. Error: " + error);
            displayToast("lightFailed");
        }
    }else{
        console.log("No Devices in the Zone");
    }
}

async function pageMain() {
    try{
    setToastMessage("dataOnProgress", "Initializing data...");
    displayToast("dataOnProgress");
    await getGatewayList();
    await getAllLightDevices();
    await setZoneListSelection();
    }catch(err){
        console.error(err);
        setToastMessage("dataFailed", "An error has occurred while loading data. Please try again. Error: " + err);
        displayToast("dataFailed");
        zoneSelection.attr('disabled', false);
    }
    
    zoneSelection.on('change', async function () {
        currentZoneID = $(this).val();
        zoneSelection.attr('disabled', true);
        if (currentZoneID !== "Select Zone" && currentZoneID !== null) {
            currentZoneID = parseInt(currentZoneID);
            preSelectionHidden(true);
            loadingHidden(false);
            disableAllButtons();
            setToastMessage("dataOnProgress", "Filtering devices in the selected zone...");
            displayToast("dataOnProgress");
            currentZoneDeviceList = allDeviceList.filter(device => device.zoneID === currentZoneID);
            zoneDeviceBody.empty();

            let allTableRows = [];

            currentZoneDeviceList.map(async (device,index) => {
                await getDevicePowerInfo(device.deviceID, device.gatewayMAC).then(async (powerInfo) => {
                    let latestPowerResult = await powerInfo.report;
                    let latestPowerUnit = await powerInfo.units;
                    let activeEnergy = latestPowerResult.active_energy;
                    let activePower = latestPowerResult.active_power;
                    let vRMS = latestPowerResult.v_rms;
                    let lightDimmingValue = latestPowerResult.light_dimming_value;
                    let activeEnergyDisplay = (activeEnergy === null || activeEnergy === undefined) ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : activeEnergy+" "+latestPowerUnit.active_energy;
                    let activePowerDisplay = (activePower === null || activePower === undefined) ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : activePower+" "+latestPowerUnit.active_power;
                    let vRMSDisplay = (vRMS === null || vRMS === undefined) ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : vRMS+" "+latestPowerUnit.v_rms;
                    let lightDimmingValueDisplay = (lightDimmingValue === null || lightDimmingValue === undefined) ? `<span class='text-decoration-style-dotted' title='${noDataMessageTitle}'><i class='bi bi-exclamation-circle-fill text-warning'></i> N/A</span>` : lightDimmingValue+" %";
                    allTableRows.push([index+1, device.deviceName, device.deviceID, device.gatewayName, activeEnergyDisplay, activePowerDisplay, vRMSDisplay, lightDimmingValueDisplay]);
                });
            });

            let checkInterval = setInterval(async () => {
                if(allTableRows.length === currentZoneDeviceList.length){
                    clearInterval(checkInterval);
                    allTableRows.sort((a, b) => { return a[0] - b[0] });
                    allTableRows.map((row) => { zoneDeviceBody.append(insertTableRow(row)); });
                    loadingHidden(true);
                    setToastMessage("dataSuccess", "Data has been loaded successfully.");
                    displayToast("dataSuccess");
                    enableAllButtons();
                    zoneSelection.attr('disabled', false);
                }
            }, 2000);
        }else{
            preSelectionHidden(false);
            loadingHidden(true);
            zoneSelection.attr('disabled', false);
            disableAllButtons();
        }
    });

    try{
        $("#setDimming0").on('click', () => { setZoneDevicesNewDimmingValue(currentZoneDeviceList, 0); });
        $("#setDimming25").on('click', () => { setZoneDevicesNewDimmingValue(currentZoneDeviceList, 25); });
        $("#setDimming50").on('click', () => { setZoneDevicesNewDimmingValue(currentZoneDeviceList, 50); });
        $("#setDimming75").on('click', () => { setZoneDevicesNewDimmingValue(currentZoneDeviceList, 75); });
        $("#setDimming100").on('click', () => { setZoneDevicesNewDimmingValue(currentZoneDeviceList, 100); });
        $("#setDimmingCustom").on('click', () => {
            let newDimmingValue = $("#newDimmingValue").val();
            if (newDimmingValue >= 0 && newDimmingValue <= 100) {
                setZoneDevicesNewDimmingValue(currentZoneDeviceList, newDimmingValue);
        }});
    }catch(err){
        console.error(err);
        setToastMessage("lightFailed", "An error has occurred while setting dimming value. Please try again. Error: " + err);
        displayToast("lightFailed");
        zoneSelection.attr('disabled', false);
    }

}

$(document).ready(pageMain);