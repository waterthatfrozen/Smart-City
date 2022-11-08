const zoneSelection = $("#zoneSelection");
const graphContainer = $("#graphContainer");
const dataInitializeContainer = $("#dataInitialize"),
    dataErrorContainer = $("#dataError"),
    dataErrorText = $("#dataErrorText"),
    dataLoadingContainer = $("#dataLoading");
const CURRENT_TIME = Math.floor(new Date().getTime()/1000);
const START_GRAPHTIME = CURRENT_TIME - 7200;
const END_GRAPHTIME = CURRENT_TIME;
let sensorsZone = [];

function disableZoneSelection(disabled){
    zoneSelection.attr('disabled', disabled);
}

function showCard(cardType){
    dataInitializeContainer.attr("hidden", true);    
    dataErrorContainer.attr("hidden", true);
    dataLoadingContainer.attr("hidden", true);
    graphContainer.attr("hidden", true);
    switch(cardType){
        case "initialize": console.log("I"); dataInitializeContainer.attr("hidden", false); break;
        case "error": console.log("E"); dataErrorContainer.attr("hidden", false); break;
        case "nodata": console.log("N"); dataNodataContainer.attr("hidden", false); break;
        case "loading": console.log("L"); dataLoadingContainer.attr("hidden", false); break;
        case "graph": console.log("G"); graphContainer.attr("hidden", false); break;
        default: break;
    }
}

async function setZoneListSelection() {
    try {
        let response = await fetch('/api/getZoneList');
        let data = response.status === 200 ? await response.json() : [];
        let zoneList = [];
        data.map((zone) => { if(zone.parent_oid === 3){ zoneList.push({id: zone.zone_id, name: zone.name}); }});
        zoneList.sort((a, b) => { return a.id - b.id; });
        zoneList = zoneList.slice(0, 6);

        zoneSelection.empty();
        zoneSelection.append(`<option>Select Zone</option>`);
        zoneList.map((zone) => { zoneSelection.append(`<option value="${zone.id}">${zone.name}</option>`); });
        disableZoneSelection(false);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getAllSensors(){
    let response = await fetch("/api/getAllIluminanceSensorDevices");
    let data = await response.json();
    return data.illuminanceDevices;
}

async function getSensorValue(device_id){
    let response = await fetch(`/api/getSensorValueByDeviceIDandRange?device_id=${device_id}&start=${START_GRAPHTIME}&end=${END_GRAPHTIME}`);
    let data = await response.json();
    return data;
}

async function getDeviceLabel(deviceID) {
    try {
        let response = await fetch("/api/getDeviceInfo?device_id="+deviceID);
        let responseData = await response.json();
        return responseData;
    } catch (error) {
        console.log(error);
    }
}

async function addGraphPanel(sensor, xValue, yValue){
    let chartConfig = {
        type: 'line',
        data: {
            labels: xValue,
            datasets: [{
                label: "Illuminance",
                data: yValue,
                backgroundColor: 'rgb(54, 162, 235)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 1
            }]
        },
        options: {
            scales: { y: { beginAtZero: false, grace: '25%' } },
            plugins: { legend: { display: false } }
        }
    };

    let graphPanelHtml = `<div class="col">
        <div class="card">
            <div class="card-body">
                <h6 class="card-title">Illuminance at ${sensor.lightDeviceName} in the past 3 hours</h6>
                    <canvas class="w-100" id="${sensor.sensorDeviceID}-chart" height="150"></canvas>
            </div>
            <div class="card-footer">
                <small class="text-muted">Sensor ID: ${sensor.sensorDeviceID} / Light ID: ${sensor.lightDeviceID}</small>
            </div>
        </div>
    </div>`;

    graphContainer.append(graphPanelHtml);
    let ctx = document.getElementById(`${sensor.sensorDeviceID}-chart`).getContext('2d');
    new Chart(ctx, chartConfig);
}

async function pageMain() {
    try {
        let sensorList = await getAllSensors();
        setZoneListSelection();
        console.log(START_GRAPHTIME, END_GRAPHTIME);
        sensorList.map(async (sensor) => { 
            await getDeviceLabel(sensor.lightDeviceID).then((data) => {sensor["lightDeviceName"] = data.device_label; });
        });
        sensorList.sort((a, b) => a.lightDeviceName.localeCompare(b.lightDeviceName));
        console.log(sensorList);

        zoneSelection.on("change", async function(){
            chartConfig = [];
            showCard("loading"); disableZoneSelection(true);
            let zone_id = zoneSelection.val();
            if(zone_id === "Select Zone"){
                graphContainer.empty();
                showCard("initialize");
            }else{
                sensorsZone = sensorList.filter((sensor) => parseInt(sensor.lightDeviceName.split(".")[0].substr(6)) === parseInt(zone_id) - 3);
                sensorsZone.sort((a,b) => {return a.lightDeviceName.localeCompare(b.lightDeviceName)});
                console.log(sensorsZone);
                graphContainer.empty();
                let count = 0;
                await sensorsZone.map(async (sensor) => {
                    let sensorValue = await getSensorValue(sensor.sensorDeviceID);
                    sensorValue = sensorValue.sensor_values;
                    let xValue = [], yValue = [];
                    sensorValue.map((value) => {
                        xValue.push(value.timestamp.split(", ")[1].substr(0,5));
                        yValue.push(value.sensor_value);
                    });
                    addGraphPanel(sensor, xValue, yValue);
                    count++;
                });
                let interval = setInterval(() => {
                    if(count === sensorsZone.length){
                        showCard("graph");
                        clearInterval(interval);
                        disableZoneSelection(false);
                    }
                }, 500);
            }
        });

    } catch (error) {
        showCard("error");
        dataErrorText.html(`<i class="bi bi-exclamation-circle-fill"></i> <strong>Error on loading data to display</strong><br/>Please check your search range and try again.<br/>Error: ${error}`);
        disableZoneSelection(true);
        console.error(error);
    }
}

$(document).ready(pageMain);