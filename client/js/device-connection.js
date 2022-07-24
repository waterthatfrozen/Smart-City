var error_flag = false;
var connection_container = $("#gw-connection-container");
var gateway_loading_container = $("#gw-connection-loading-container"),
    sensor_loading_container = $("#sensor-connection-loading-container");
var gatewayNames = [];
var gatewayDisconnectLog = [];
var sensorConnectionResponse = null;
var checkTime = null;

// display error message
function errorDisplay(error) {
    $("#gw-timestamp").text("Error on loading status");
    $("#gw-connection-container").addClass("w-100");
    $("#gw-connection-card").html('<div class="card-body"><p class="card-text" id="gw-connection-text"></p></div>');
    $("#gw-connection-text").html("<strong>Error on loading gateways connection status</strong><br/>Please contact system administrator for further investigation.<br/>Error: " + error);
    $("#gw-connection-card").addClass("alert-danger");
    error_flag = true;
}

// display gateway loading container
function gatewayLoadingContainerHidden(visibility) {
    gateway_loading_container.prop("hidden", visibility);
}

// display sensor loading container
function sensorLoadingContainerHidden(visibility) {
    sensor_loading_container.prop("hidden", visibility);
}

// get all gateway names
async function getAllGatewayNames() {
    await fetch("/api/getZoneDeviceList?zone_id=10", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        data.forEach(element => {
            var gwName = element.device_label.split("_BB")[0];
            if (gatewayNames.indexOf(gwName) === -1) {
                gatewayNames.push(gwName);
            }
        });
        gatewayNames.sort();
    }).catch(function (error) {
        errorDisplay(error);
    });
}

// check gateway disconnect log
async function checkGatewayDisconnectLog() {
    await fetch("/api/checkGatewayConnection", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        gatewayDisconnectLog = data.gatewayDisconnectLog;
        checkTime = data.checkTime.split(/[/ :,]/);
        //remove empty string
        checkTime.forEach(element => {
            if (element === "") {
                checkTime.splice(checkTime.indexOf(element), 1);
            }
        });
        checkTime = new Date(checkTime[2], checkTime[1] - 1, checkTime[0], checkTime[3], checkTime[4], checkTime[5]);
    }).catch(function (error) {
        errorDisplay(error);
    });
}

// check sensor connection status
async function checkEnvSensorConnectionStatus() {
    await fetch("/api/checkSensorConnection", {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        sensorConnectionResponse = data;
    }).catch(function (error) {
        errorDisplay(error);
    });
}

// create a single gateway panel
function timestampPanel(gatewayName, connectionStatus, timestampLabel, timestamp) {
    if (timestamp == null) {
        timestamp = '-';
    }
    var icon = "",
        alertClass = "";
    if (connectionStatus === 'Connected') {
        icon = "<i class='bi bi-cloud-check-fill'></i>";
        alertClass = "alert-success";
    } else {
        icon = "<i class='bi bi-cloud-slash-fill'></i>";
        alertClass = "alert-danger";
    }
    return `<div class="col">
                <div class="card ${alertClass}" id="${gatewayName}">
                    <div class="card-body">
                        <h4 class="card-title">${icon}<br/>${gatewayName}</h4>
                        <p class="card-text">
                        Status: <span class="fw-bold">${connectionStatus.toUpperCase()}</span>
                        <br/>${timestampLabel}: ${timestamp}
                        </p>
                    </div>
                </div>
            </div>`;
}

// create all gateway panels
function createAllGatewayPanels() {
    var gatewayPanels = "";
    gatewayNames.forEach(element => {
        var connectionStatus = "Connected";
        var disconnectTime = null;
        gatewayDisconnectLog.forEach(log => {
            if (log.gateway_name === element) {
                connectionStatus = "Disconnected";
                disconnectTime = log.gateway_timestamp;
            }
        });
        gatewayPanels += timestampPanel(element, connectionStatus, "Disconnected Time", disconnectTime);
    });
    return gatewayPanels;
}

// main display function
function displayConnection() {
    gatewayLoadingContainerHidden(false);
    sensorLoadingContainerHidden(false);
    getAllGatewayNames().then(() => {
        checkGatewayDisconnectLog().then(() => {
            gatewayLoadingContainerHidden(true);
            if (!error_flag) {
                $("#gw-timestamp").text("As of " + datetimeTransform(checkTime));
                $("#gw-connection-container").html(createAllGatewayPanels());
            }
        });
    });
    checkEnvSensorConnectionStatus().then(() => {
        sensorLoadingContainerHidden(true);
        if (!error_flag) {
            var sensorConnect = sensorConnectionResponse.connected ? "Connected" : "Disconnected";
            $("#sensor-connection-container").html(timestampPanel("ENV_SEN_GW_MEASURE", sensorConnect, "Last Known Connection Time", sensorConnectionResponse.lastKnownConnectedTime));
        }
    });
}
// initialize first load
$(document).ready(displayConnection);
// reload data every 10 minutes
setInterval(() => {
    displayConnection();
}, 1000 * 60 * 10);