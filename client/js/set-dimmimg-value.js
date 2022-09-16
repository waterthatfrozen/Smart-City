const PARAMS = ["gw_timestamp", "temperature", "humidity", "wind_velocity"];
const PARAMS_TITLE = ["Timestamp", "Active Power", "Energy Active", "V RMS"];
const PARAMS_UNIT = ["", "W", "Wh", "V"];
const GRAPHS_TITLE = ["Active Power (W)", "Energy Active (Wh)", "Illuminance in the past 2 hours (klx)", "Air Pressure in the past 2 hours (hPa)"];
const GRAPHS_PARAMS = ["temperature", "humidity", "illuminance", "air_pressure"];
var chartConfig = [];
var paramsIndex = [];
var envSensorData = [];
var error_flag = false;

PARAMS.forEach(function (_param, _index) {
    envSensorData.push([]);
});

async function errorDisplay(error) {
    $("#env-sensor-timestamp").text("Error on loading data");
    $("#env-sensor-loading-container").addClass("w-100");
    $("#env-sensor-loading-card").html('<div class="card-body"><p class="card-text" id="env-sensor-loading-text"></p></div>');
    $("#env-sensor-loading-text").html("<strong>Error on loading data to display</strong><br/>Environmental sensor might be disconnect from the system, please contact system administrator immediately.<br/>Error: " + error);
    $("#env-sensor-loading-card").addClass("alert-danger");
    $("#env-sensor-graph-container").html("");
    error_flag = true;
}

async function cleanEnvSensorData() {
    // set new date format
    envSensorData[0].forEach(function (param, index) {
        envSensorData[0][index] = param.map(function (row) {
            var daterow = row.split(/[- :]/);
            return new Date(daterow[0], daterow[1] - 1, daterow[2], daterow[3], daterow[4], daterow[5]);
        });
    });

    // wind direction round to 360
    var wind_direction_idx = PARAMS.indexOf("wind_direction");
    if (wind_direction_idx != -1) {
        envSensorData[wind_direction_idx].forEach(function (row, index) {
            envSensorData[wind_direction_idx][index] = row.map(function (value) {
                return Math.floor(value % 360);
            });
        });
    }
    // illuminance from lux to kilolux
    var illuminance_idx = PARAMS.indexOf("illuminance");
    if (illuminance_idx != -1) {
        envSensorData[illuminance_idx].forEach(function (row, index) {
            envSensorData[illuminance_idx][index] = row.map(function (value) {
                return (value / 1000).toFixed(2);
            });
        });
    }
    // round wind velocity and ultraviolet to 2 decimal
    var wind_velocity_idx = PARAMS.indexOf("wind_velocity");
    var ultravioleta_idx = PARAMS.indexOf("ultra_violet_a");
    var ultravioletb_idx = PARAMS.indexOf("ultra_violet_b");
    if (wind_velocity_idx != -1) {
        envSensorData[wind_velocity_idx].forEach(function (row, index) {
            envSensorData[wind_velocity_idx][index] = row.map(function (value) {
                return value.toFixed(2);
            });
        });
    }
    if (ultravioleta_idx != -1) {
        envSensorData[ultravioleta_idx].forEach(function (row, index) {
            envSensorData[ultravioleta_idx][index] = row.map(function (value) {
                return value.toFixed(2);
            });
        });
    }
    if (ultravioletb_idx != -1) {
        envSensorData[ultravioletb_idx].forEach(function (row, index) {
            envSensorData[ultravioletb_idx][index] = row.map(function (value) {
                return value.toFixed(2);
            });
        });
    }
}

async function fetchEnvSensorData() {
    const currentTime = Math.round(new Date().getTime() / 1000),
        start = currentTime - (60 * 60 * 2),
        end = currentTime;
    await fetch("/API/getEnvSensorData?start=" + start + "&end=" + end).then(response =>
        response.json()
    ).then(data => {
        data = data.values;
        if (data.length == 0) {
            errorDisplay("No data found");
            throw new Error("No data found");
        }
        var dataHeader = data[0];
        var dataBody = data.slice(1);
        PARAMS.forEach(function (param, _index) {
            paramsIndex.push(dataHeader.indexOf(param));
        });
        envSensorData.forEach(function (param, index) {
            param.push(dataBody.map(function (row) {
                return row[paramsIndex[index]];
            }));
        });
        cleanEnvSensorData();
    }).catch(error => {
        errorDisplay(error);
    });
}

function envSensorValuePanel(title, subtitle, value, unit) {
    if (value == null) {
        value = "N/A";
    }
    return `<div class="col">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${title}</h5>
                        <h6 class="card-subtitle mb-2">${subtitle}</h6>
                        <p class="card-text display-5">${value}<small class="h4"> ${unit}</small></p>
                    </div>
                </div>
            </div>`;
}

function envSensorGraphPanel(title, footer, label, xValue, yValue) {
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

function main() {
    var envSensorValueContainer = $("#env-sensor-value-container");
    var envSensorTimestamp = $("#env-sensor-timestamp");
    var envSensorGraphContainer = $("#env-sensor-graph-container");
    var timestampStringMessage = "";
    fetchEnvSensorData().then(() => {
        if (!error_flag) {
            timestampStringMessage = "As of " + datetimeTransform(envSensorData[0][0][envSensorData[0][0].length - 1]);
            envSensorValueContainer.html("");
            for (var i = 1; i < PARAMS.length; i++) {
                var row = envSensorData[i];
                envSensorValueContainer.append(envSensorValuePanel(PARAMS_TITLE[i], "", row[0][row[0].length - 1], PARAMS_UNIT[i]));
            }
            envSensorTimestamp.text(timestampStringMessage);
            // graph panel
            envSensorGraphContainer.html("");
            var timestampValue = envSensorData[0][0];
            // get only the time portion of timestampValue
            timestampValue = timestampValue.map(function (value) {
                var currentValue = new Date(value);
                var hours = currentValue.getHours() < 10 ? "0" + currentValue.getHours() : currentValue.getHours();
                var minutes = currentValue.getMinutes() < 10 ? "0" + currentValue.getMinutes() : currentValue.getMinutes();
                return hours + ":" + minutes;
            });
            for (const param in GRAPHS_PARAMS) {
                var param_idx = PARAMS.indexOf(GRAPHS_PARAMS[param]);
                envSensorGraphContainer.append(envSensorGraphPanel(GRAPHS_TITLE[param], timestampStringMessage, PARAMS_TITLE[param_idx], timestampValue, envSensorData[param_idx][0]));
                var ctx = document.getElementById(PARAMS_TITLE[param_idx] + "-chart").getContext('2d');
                var chart = new Chart(ctx, chartConfig[param]);
            }
        }
    });
}

$(document).ready(main);