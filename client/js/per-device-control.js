const zoneSelection = $("#zoneSelection");
const deviceSelection = $("#deviceSelection");
const currentDeviceReportContainer = $("#currentDeviceReportContainer");
const toastElList = [].slice.call(document.querySelectorAll('.toast'));
const toastList = toastElList.map(function (toastEl) {
    return new bootstrap.Toast(toastEl)
});
console.log(toastList);

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
            console.log(zoneList);
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
}

function loadingDeviceInfoDisplay() {
    $("#currentDimmingValue").text("Loading...");
    $("#currentActivePowerValue").text("Loading...");
    $("#currentActiveEnergyValue").text("Loading...");
    $("#currentVRMSValue").text("Loading...");
    $("#currentSelectedDevice").text("Loading...");
    $("#currentReportTimestamp").text("Loading...");
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
                        device_name: device.device_label
                    });
                }
            });
            console.log(deviceList);
            deviceList.sort((a, b) => {
                return a.device_name.localeCompare(b.device_name);
            });
            return deviceList;
        }).then((deviceList) => {
            console.log(deviceList);
            deviceSelection.empty();
            deviceSelection.append(`<option value="">Select Device</option>`);
            deviceList.map((device) => {
                deviceSelection.append(`<option value="${device.device_id}">${device.device_name}</option>`);
            });
            deviceSelection.attr('disabled', false);
        });
    } catch (error) {
        console.log(error);
    }
}

async function setDeviceInfo(currentDeviceID, currentDeviceLabel) {
    try {
        loadingDeviceInfoDisplay();
        disableAllButtons();
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
            console.log(data);
            $("#currentSelectedDevice").text(`${currentDeviceLabel} (Device ID: ${currentDeviceID})`);
            $("#currentReportTimestamp").text(`${datetimeTransform(data.report.timestamp)}`);
            $("#currentDimmingValue").text(data.report.light_dimming_value + data.units.light_dimming_value);
            $("#currentActiveEnergyValue").text(data.report.active_energy + " " + data.units.active_energy);
            $("#currentActivePowerValue").text(data.report.active_power + " " + data.units.active_power);
            $("#currentVRMSValue").text(data.report.v_rms + " " + data.units.v_rms);
            enableAllButtons();
        });
    } catch (error) {
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

async function setNewDimmingValue(currentDeviceID, newDimmingValue) {
    try {
        disableAllButtons();
        resetDeviceInfoDisplay();
        displayToast("onProgress");
        newDimmingValue = parseInt(newDimmingValue);
        console.log(newDimmingValue,typeof newDimmingValue, currentDeviceID);
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
        }).then(data => {
            displayToast("success");
            console.log(data);
        }).catch(error => {
            displayToast("failed");
            console.log(error);
        }).finally(() => {
            setTimeout(() => {
                setDeviceInfo(currentDeviceID);
            }, 2000);
        });
    }
    catch (error) {
        console.log(error);
    }
}

function dimming_main() {
    let currentZoneID = null;
    let currentDeviceID = null;
    let currentDeviceLabel = null;
    setZoneListSelection();
    zoneSelection.on('change', function () {
        currentZoneID = $(this).val();
        setDeviceListSelection(currentZoneID);
    });
    deviceSelection.on('change', function () {
        currentDeviceID = $(this).val();
        currentDeviceLabel = $(this).find(':selected').text();
        setDeviceInfo(currentDeviceID, currentDeviceLabel);
    });
    $("#setDimming0").on('click', () => { setNewDimmingValue(currentDeviceID, 0); });
    $("#setDimming25").on('click', () => { setNewDimmingValue(currentDeviceID, 25); });
    $("#setDimming50").on('click', () => { setNewDimmingValue(currentDeviceID, 50); });
    $("#setDimming75").on('click', () => { setNewDimmingValue(currentDeviceID, 75); });
    $("#setDimming100").on('click', () => { setNewDimmingValue(currentDeviceID, 100); });
    $("#setDimmingCustom").on('click', () => {
        let newDimmingValue = $("#newDimmingValue").val();
        if (newDimmingValue >= 0 && newDimmingValue <= 100) {
            setNewDimmingValue(currentDeviceID, newDimmingValue);
        }
    });
}

$(document).ready(dimming_main);