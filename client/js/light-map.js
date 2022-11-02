const ZONE_NAME = ["Prachasanti", "Sanya-Thammasak", "Talad Wicha", "Yung Thong - Outside", "Yung Thong - Inside", "Pitaktham"];

function gatewayCompletionDisplay() {
    $("#gatewayDeviceLoadingIndicator").prop("hidden", true);
    $("#gatewayDeviceCaption").html(`All gateway devices loaded, last updated at ${datetimeTransform(new Date())}`);
}

function envSensorCompletionDisplay() {
    $("#envSensorDeviceLoadingIndicator").prop("hidden", true);
    $("#envSensorDeviceCaption").html(`All environment sensors loaded, last updated at ${datetimeTransform(new Date())}`);
}

function lightCompletionDisplay() {
    $("#lightDeviceLoadingIndicator").prop("hidden", true);
    $("#lightDeviceCaption").html(`All light devices loaded, last updated at ${datetimeTransform(new Date())}`);
}

function mapCompletionDisplay() {
    $("#mapLoadingIndicator").html(`Map Loaded Successfully`);
}

function connectionString(connected) {
    if (connected) {
        return "<span class='text-success'><i class='bi bi-cloud-check-fill'></i> Connected</span>";
    } else {
        return "<span class='text-danger fw-bold'><i class='bi bi-cloud-slash-fill'></i> Disconnected</span>";
    }
}

function errorDisplay() {
    const MESSAGE = "Error occuring while getting data";
    // Gateway
    $("#gatewayDeviceLoadingIndicator").html(MESSAGE);
    $("#gatewayDeviceCaption").html(MESSAGE);
    // Environment Sensor
    $("#envSensorDeviceLoadingIndicator").html(MESSAGE);
    $("#envSensorDeviceCaption").html(MESSAGE);
    // Light
    $("#lightDeviceLoadingIndicator").html(MESSAGE);
    $("#lightDeviceCaption").html(MESSAGE);
    // Map
    $("#mapLoadingIndicator").html(MESSAGE);
}

function mapIconColor(color) {
    color = color.toLowerCase();
    const AVAILABLE_COLOR = ["blue", "gold", "red", "green", "orange", "yellow", "violet", "grey", "black"];
    if (AVAILABLE_COLOR.includes(color)) {
        return L.icon({
            iconUrl: "https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-" + color + ".png",
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
            iconSize: [18, 30],
            iconAnchor: [9, 30],
            popupAnchor: [1, -27],
            shadowSize: [30, 30]
        });
    } else {
        throw new Error("Invalid color");
    }
}

function insertTableRow(data) {
    let row = "<tr>";
    data.forEach(element => {
        row += "<td>" + element + "</td>";
    });
    row += "</tr>";
    return row;
}

async function getGatewayStatus() {
    const BASEAPI_URL = '/api/checkGatewayConnection';
    const response = await fetch(BASEAPI_URL);
    const data = await response.json();
    return data.gatewayDisconnectLog;
}

async function getLightDeviceList() {
    const gatewayDisconnect = await getGatewayStatus();
    const ZONE_ID = ["4", "5", "6", "7", "8", "9"];
    const EXCLUDED_DEVICE_LABEL = ["LIGHT_DALI1_26:C6-01"];
    const BASEAPI_URL = '/api/getZoneLightDeviceList?zone_id=';
    let lightDeviceList = [];
    let finishedZone = 0;
    ZONE_ID.map( async (zone_id, index) => {
        const url = BASEAPI_URL + zone_id;
        const response = await fetch(url);
        const data = await response.json();
        data.map(element => {
            let gwconnect = true;
            gatewayDisconnect.forEach(disconnectGateway => {
                if (disconnectGateway.device_id === element.gateway_device_uid || disconnectGateway.device_id === element.bb_gateway_device_uid) { gwconnect = false; }
            });
            if (element.name === "LIGHT_DALI" && !EXCLUDED_DEVICE_LABEL.includes(element.device_label)) {
                lightDeviceList.push({
                    "zone_id": zone_id - 3,
                    "zone_name": ZONE_NAME[zone_id - 4],
                    "device_id": element.device_uid,
                    "device_label": element.device_label,
                    "device_mac_address": element.MAC,
                    "gateway_mac_address": element.gateway_MAC,
                    "latitude": element.assigned_lat,
                    "longitude": element.assigned_lon,
                    "connected": gwconnect
                });
            }
        });
        finishedZone++;
    });
    while (finishedZone < ZONE_ID.length) {
        console.log("Waiting for all zone to be finished");
        await new Promise(r => setTimeout(r, 1000));
    }
    return lightDeviceList;
}

async function getGatewayList() {
    const gatewayDisconnect = await getGatewayStatus();
    const BASEAPI_URL = '/api/getZoneDeviceList?zone_id=10';
    const response = await fetch(BASEAPI_URL);
    const data = await response.json();
    let gatewayList = [];
    data.forEach(element => {
        if (element.name === "PE_GATEWAY_MINI_IOT") {
            let gwconnect = true;
            gatewayDisconnect.forEach(disconnectGateway => {
                if (disconnectGateway.gateway_name === element.device_label) {
                    gwconnect = false;
                }
            });
            gatewayList.push({
                "device_id": element.device_uid,
                "device_label": element.device_label,
                "device_mac_address": element.MAC,
                "gateway_mac_address": element.gateway_MAC,
                "latitude": element.assigned_lat,
                "longitude": element.assigned_lon,
                "connected": gwconnect
            });

        }
    });
    gatewayList.sort((a, b) => {
        return a.device_label.localeCompare(b.device_label);
    });
    return gatewayList;
}

async function getEnvSensorList() {
    const gatewayDisconnect = await getGatewayStatus();
    const BASEAPI_URL = '/api/getZoneDeviceList?zone_id=5';
    const response = await fetch(BASEAPI_URL);
    const data = await response.json();
    let envSensorList = [];
    data.forEach(element => {
        if (element.name === "ENV_SENSOR") {
            let gwconnect = true;
            gatewayDisconnect.forEach(disconnectGateway => {
                if (disconnectGateway.gateway_name === element.device_label) {
                    gwconnect = false;
                }
            });
            envSensorList.push({
                "device_id": element.device_uid,
                "device_label": element.device_label,
                "device_mac_address": element.MAC,
                "gateway_mac_address": element.gateway_MAC,
                "latitude": element.assigned_lat,
                "longitude": element.assigned_lon,
                "connected": gwconnect
            });
        }
    });
    return envSensorList;
}

async function mapsMain() {
    let allEnvSensorList = [];
    let allLightDeviceList = [];
    let allGatewayList = [];
    let gatewayMarker = L.layerGroup();
    let envSensorMarker = L.layerGroup();
    let zoneLightMarker = [L.layerGroup(), L.layerGroup(), L.layerGroup(), L.layerGroup(), L.layerGroup(), L.layerGroup()];
    let map = L.map('map').setView([14.070453, 100.606089], 16, { minZoom: 15, maxZoom: 18 });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    L.control.scale({ position: 'bottomleft', imperial: false, metric: true }).addTo(map);
    try {
        getEnvSensorList().then(envSensorList => {
            allEnvSensorList = envSensorList;
            envSensorList.forEach(element => {
                let markerColor = element.connected ? "green" : "black";
                let gatewayName = allGatewayList.find(gateway => gateway.device_mac_address === element.gateway_mac_address).device_label;
                L.marker([element.latitude, element.longitude], {
                    icon: mapIconColor(markerColor)
                }).bindPopup(`<b>${element.device_label.toUpperCase()}</b><br/>
                Device ID: ${element.device_id}<br/>
                Gateway Used: ${gatewayName}<br/>` +
                    connectionString(element.connected)).addTo(envSensorMarker);
            });
            allEnvSensorList.map((envSensor,index) => {
                let gatewayName = allGatewayList.find(gateway => gateway.device_mac_address === envSensor.gateway_mac_address).device_label;
                let data = [index+1, envSensor.device_label.toUpperCase(), envSensor.device_id, gatewayName, connectionString(envSensor.connected)];
                $("#envSensorDeviceTable").append(insertTableRow(data));
            });
            envSensorMarker.addTo(map);
            envSensorCompletionDisplay();
        });
        getGatewayList().then(gatewayList => {
            allGatewayList = gatewayList;
            gatewayList.forEach(element => {
                let markerColor = element.connected ? "blue" : "red";
                L.marker([element.latitude, element.longitude], {
                    icon: mapIconColor(markerColor)
                }).bindPopup(`<b>${element.device_label.toUpperCase()}</b><br/>
                Device ID: ${element.device_id}<br/>
                Device MAC Address: ${element.device_mac_address}<br/>` +
                    connectionString(element.connected)).addTo(gatewayMarker);
            });
            allGatewayList.map((gateway, index) => {
                let data = [index+1, gateway.device_label.toUpperCase(), gateway.device_id, gateway.device_mac_address, connectionString(gateway.connected)];
                $("#gatewayDeviceTable").append(insertTableRow(data));
            });
            gatewayMarker.addTo(map);
            gatewayCompletionDisplay();
        });
        getLightDeviceList().then(function (lightDeviceList) {
            lightDeviceList.sort((a, b) => {
                if (a.zone_id < b.zone_id) { return -1; }
                else if (a.zone_id > b.zone_id) { return 1; }
                else { return a.device_label.localeCompare(b.device_label); }
            });
            allLightDeviceList = lightDeviceList;
            lightDeviceList.forEach(function (lightDevice) {
                let markerColor = lightDevice.connected ? "yellow" : "grey";
                let gatewayName = allGatewayList.find(gateway => gateway.device_mac_address === lightDevice.gateway_mac_address).device_label;
                L.marker([lightDevice.latitude, lightDevice.longitude], {
                    icon: mapIconColor(markerColor)
                }).bindPopup(`<b>${lightDevice.device_label.toUpperCase()}</b><br/>
                Device ID: ${lightDevice.device_id}<br/>
                Zone Name: ${lightDevice.zone_name}<br/>
                Gateway Used: ${gatewayName}<br/>` +
                    connectionString(lightDevice.connected)).addTo(zoneLightMarker[lightDevice.zone_id - 1]);
            });
            allLightDeviceList.map((lightDevice,index) => {
                let gatewayName = allGatewayList.find(gateway => gateway.device_mac_address === lightDevice.gateway_mac_address).device_label;
                let data = [index+1, lightDevice.device_label.toUpperCase(), lightDevice.device_id, lightDevice.zone_name, gatewayName, connectionString(lightDevice.connected)];
                $("#lightDeviceTable").append(insertTableRow(data));
            });
            zoneLightMarker.map( (zone) => { zone.addTo(map); });
            lightCompletionDisplay();let overlayMaps = {
                "Gateways": gatewayMarker,
                "Environmental Sensor": envSensorMarker,
                "Light Device: Prachasanti": zoneLightMarker[0],
                "Light Device: Sanya-Thammasak": zoneLightMarker[1],
                "Light Device: Talad Wicha": zoneLightMarker[2],
                "Light Device: Yung Thong - Outside": zoneLightMarker[3],
                "Light Device: Yung Thong - Inside": zoneLightMarker[4],
                "Light Device: Pitaktham": zoneLightMarker[5]
            };
            L.control.layers(null, overlayMaps).addTo(map);
            mapCompletionDisplay();
        });
    } catch (err) {
        errorDisplay();
        console.log(err);
    }
}

$(document).ready(mapsMain);

// Hide the map when navbar toggle is clicked
$("button.navbar-toggler").click(function () {
    $("#map").prop("hidden", !$("#map").prop("hidden"));
});