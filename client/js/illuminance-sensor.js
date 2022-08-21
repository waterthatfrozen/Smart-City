let loadingContainer = $('#illuminance-loading-container');

function errorDisplay(error) {
    console.log(error);
}

function loadingContainerHidden(visibility) {
    loadingContainer.prop("hidden", visibility);
}

function sensorValuePanel(values){
    let sensorValue = (values.sensor_value === null) ? "N/A" : values.sensor_value + " " + values.unit;
    let icon = "<i class='bi bi-cloud-check-fill'></i>",
        colorClass = "success";
    if (values.sensor_value === null) {
        icon = "<i class='bi bi-cloud-slash-fill'></i>";
        colorClass = "danger";
    }
    return `<div class="col">
                <div class="card ${"border-"+colorClass}" id="${values.light_device_name}">
                    <div class="card-body">
                    <h6 class="card-title ${"text-"+colorClass}">${icon} ${values.light_device_name}</h6>
                    <h4 class="fw-bold">${sensorValue}</h4>
                        <p class="card-text">
                            Light ID: ${values.light_device_id}<br/>
                            Sensor ID: ${values.sensor_device_id}<br/>
                            <small class="text-muted">As of ${values.timestamp}</small>
                        </p>
                    </div>
                </div>
            </div>`;
}

async function getSensorValue(){
    await fetch('/api/getLastLumianceSensorValue', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        loadingContainerHidden(true);
        if(data.data.length === 0){
            $("#illuminance-timestamp").text("Too early to get data");
            $('#illuminance-value-container').append(
                `<div class="w-100">
                <div class="card border-warning id="early-call">
                    <div class="card-body">
                    <h4 class="card-title fw-bold text-warning">Service is initializing</h4>
                    <p class="card-text">
                        Please wait until the server is finished initialization.
                    </p>
                    </div>
                </div>
            </div>`
            );
        }else{
        let sensorData = data.data;
        $("#illuminance-timestamp").text("Data loaded successfully");
        sensorData.forEach(element => {
            $('#illuminance-value-container').append(sensorValuePanel(element));
        });
    }
    }).catch(function (error) {
        errorDisplay(error);
    });
}

function illuminanceMain(){
    getSensorValue();
}

$(document).ready(illuminanceMain);
setInterval(illuminanceMain, 10 * 60 * 1000); // 10 minutes