const zoneSelection = $("#zoneSelection");
const deviceSelection = $("#deviceSelection");
const currentDeviceReportContainer = $("#currentDeviceReportContainer");
const toastElList = [].slice.call(document.querySelectorAll('.toast'));
const toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl)
});
let currentZoneID = null;

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
                        zone_id: zone.zone_id,
                        zone_name: zone.name
                    });
                }
            });
            zoneList.sort((a, b) => {
                return a.zone_id - b.zone_id;
            });
            zoneList = zoneList.slice(0, 6);
            return zoneList;
        }).then((zoneList) => {
            zoneSelection.empty();
            zoneSelection.append(`<option>Select Zone</option>`);
            zoneList.map((zone) => {
                zoneSelection.append(`<option value="${zone.zone_id}">${zone.zone_name}</option>`);
            });
            zoneSelection.attr('disabled', false);
        });
    } catch (error) {
        console.log(error);
    }
}

function resetDeviceInfoDisplay() {
    $("#currentDimmingValue").text("---");
    $("#currentActivePowerValue").text("---");
    $("#currentActiveEnergyValue").text("---");
    $("#currentVRMSValue").text("---");
    $("#currentSelectedDevice").text("---");
    $("#currentReportTimestamp").text("---");
    $("#currentConnectionStatus").text("---");
}

function loadingDeviceInfoDisplay() {
    $("#currentDimmingValue").text("Loading...");
    $("#currentActivePowerValue").text("Loading...");
    $("#currentActiveEnergyValue").text("Loading...");
    $("#currentVRMSValue").text("Loading...");
    $("#currentSelectedDevice").text("Loading...");
    $("#currentReportTimestamp").text("Loading...");
    $("#currentConnectionStatus").text("Loading...");
}

function disableAllSelections() {
    console.log("disableAllSelections");
    zoneSelection.attr('disabled', true);
    deviceSelection.attr('disabled', true);
}

function enableAllSelections() {
    console.log("enableAllSelections");
    zoneSelection.attr('disabled', false);
    deviceSelection.attr('disabled', false);
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

function resetDeviceListSelection() {
    deviceSelection.attr('disabled', true);
    deviceSelection.empty();
    deviceSelection.append(`<option>Loading Device...</option>`);
}

function deselectDevice() {
    deviceSelection.val("");
    resetDeviceInfoDisplay();
    disableAllButtons();
}

async function setDeviceListSelection(currentZoneID) {
    try {
        resetDeviceListSelection();
        resetDeviceInfoDisplay();
        disableAllButtons();
        if(currentZoneID === "Select Zone") {deviceSelection.append(`<option selected disabled>- Select Zone First -</option>`); return;}
        await fetch(`/api/getZoneLightDeviceList?zone_id=${currentZoneID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            }
        }).then(data => {
            let deviceList = [];
            data.map((device) => {
                if (device.device_type_id === 27036) {
                    deviceList.push({
                        device_id: device.device_uid,
                        device_name: device.device_label,
                        device_mac: device.MAC,
                        gateway_mac: device.gateway_MAC
                    });
                }
            });
            deviceList.sort((a, b) => {
                return a.device_name.localeCompare(b.device_name);
            });
            return deviceList;
        }).then((deviceList) => {
            deviceSelection.empty();
            deviceSelection.append(`<option value="">Select Device</option>`);
            deviceList.map((device) => {
                deviceSelection.append(`<option value='${JSON.stringify(device)}'>${device.device_name}</option>`);
            });
            deviceSelection.attr('disabled', false);
        });
    } catch (error) {
        console.log(error);
    }
}

async function sendGetPowerCommand(currentDeviceID, currentGatewayMAC){
    await fetch(`/api/sendGetPowerCommand?deviceID=${currentDeviceID}&gatewayMAC=${currentGatewayMAC}`,{
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(response => {
        console.log(response.json());
    });
}

async function setDeviceInfo(currentDeviceID, currentDeviceLabel, currentGatewayMAC, isNewValue) {
    try {
        console.log(isNewValue);
        loadingDeviceInfoDisplay();
        disableAllButtons();
        await sendGetPowerCommand(currentDeviceID, currentGatewayMAC);
        await fetch(`/api/getLastLightPowerReportbyDevice?device_id=${currentDeviceID}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            }
        }).then(data => {
            $("#currentSelectedDevice").text(`${currentDeviceLabel} (Device ID: ${currentDeviceID})`);
            $("#currentReportTimestamp").text(`${datetimeTransform(new Date(data.report.timestamp*1000))}`);
            if(isNewValue.isNew){ $("#currentDimmingValue").text(isNewValue.newValue + data.units.light_dimming_value);}
            else{ $("#currentDimmingValue").text(data.report.light_dimming_value + data.units.light_dimming_value);}
            $("#currentDimmingValue").text(data.report.light_dimming_value + data.units.light_dimming_value);
            $("#currentActiveEnergyValue").text(data.report.active_energy + " " + data.units.active_energy);
            $("#currentActivePowerValue").text(data.report.active_power + " " + data.units.active_power);
            $("#currentVRMSValue").text(data.report.v_rms + " " + data.units.v_rms);
        });
    } catch (error) {
        console.log(error);
    }
}

async function setConnectionStatusDisplay(currentDeviceMAC, currentGatewayMAC){
    try{
        await fetch(`/api/getCurrentDeviceConnection?deviceMAC=${currentDeviceMAC}&gatewayMAC=${currentGatewayMAC}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            }
        }).then(data => {
            console.log(data.status);
            $("#currentConnectionStatus").html(connectionString(data.status));
            if(data.status === "connected"){enableAllButtons();} else{disableAllButtons();}
            return data.status;
        });
    }catch(error){
        console.log(error);
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

function connectionString(connected) {
    if (connected === "connected") { return "<span class='text-success'><i class='bi bi-cloud-check-fill'></i> Connected</span>";} 
    else if (connected === "disconnected"){ return "<span class='text-danger fw-bold'><i class='bi bi-cloud-slash-fill'></i> Disconnected</span>"; }
    else { return "<span class='text-primary fw-bold'><i class='bi bi-cloud-fill'></i> Unknown... </span>"; }
}

async function setNewDimmingValue(currentDeviceID, currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, newDimmingValue) {
    try {
        disableAllButtons();
        resetDeviceInfoDisplay();
        displayToast("onProgress");
        newDimmingValue = parseInt(newDimmingValue);
        await fetch(`/api/setLightDimming`,{
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                device_id: currentDeviceID,
                dimming_value: newDimmingValue
            })
        }).then(response => {
            if (response.status === 200) {
                return response.json();
            }
        }).then(_data => {
            sendGetPowerCommand(currentDeviceID, currentGatewayMAC);
            resetDeviceListSelection();
            setDeviceListSelection(currentZoneID);
        }).then(_data => {
            displayToast("success");
        }).catch(_error => {
            displayToast("failed");
        });
    }
    catch (error) {
        console.log(error);
    }
}

function dimming_main() {
    let currentDeviceID = null;
    let currentDeviceLabel = null;
    let currentDeviceMAC = null;
    let currentGatewayMAC = null;
    let currentSelection = null;
    setZoneListSelection();
    zoneSelection.on('change', function () {
        currentZoneID = $(this).val();
        setDeviceListSelection(currentZoneID);
    });
    deviceSelection.on('change', function () {
        disableAllSelections();
        currentSelection = $(this).val();
        if(currentSelection === ""){resetDeviceInfoDisplay(); return;}
        currentSelection = JSON.parse(currentSelection);
        currentDeviceID = currentSelection.device_id;
        currentDeviceMAC = currentSelection.device_mac;
        currentGatewayMAC = currentSelection.gateway_mac;
        currentDeviceLabel = $(this).find(':selected').text();
        setDeviceInfo(currentDeviceID, currentDeviceLabel, currentGatewayMAC, {isNew: false, newValue: null});
        setConnectionStatusDisplay(currentDeviceMAC, currentGatewayMAC);
        enableAllSelections();
    });
    $("#setDimming0").on('click', () => { setNewDimmingValue(currentDeviceID, currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, 0); });
    $("#setDimming25").on('click', () => { setNewDimmingValue(currentDeviceID,currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, 25); });
    $("#setDimming50").on('click', () => { setNewDimmingValue(currentDeviceID, currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, 50); });
    $("#setDimming75").on('click', () => { setNewDimmingValue(currentDeviceID, currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, 75); });
    $("#setDimming100").on('click', () => { setNewDimmingValue(currentDeviceID, currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, 100); });
    $("#setDimmingCustom").on('click', () => {
        let newDimmingValue = $("#newDimmingValue").val();
        if (newDimmingValue >= 0 && newDimmingValue <= 100) {
            setNewDimmingValue(currentDeviceID, currentDeviceLabel, currentDeviceMAC, currentGatewayMAC, newDimmingValue);
        }
    });
}

$(document).ready(dimming_main);