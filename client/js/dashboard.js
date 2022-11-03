const PARAMS = ["gw_timestamp", "temperature", "humidity", "wind_velocity", "wind_direction", "illuminance", "rain_level", "ultra_violet_a", "ultra_violet_b"];
const PARAMS_TITLE = ["Timestamp", "Temperature", "Humidity", "Wind Velocity", " Wind Direction", "Illuminance", "Rain Level", "Ultra Violet A", "Ultra Violet B"];
const PARAMS_UNIT = ["", "°C", "%", "m/s", "°", "klx", "", "W/m<sup>2</sup>", "W/m<sup>2</sup>"];
const GRAPHS_TITLE = ["Temperature in the past 2 hours (°C)", "Humidity in the past 2 hours (%)", "Illuminance in the past 2 hours (klx)", "Rain Level in the past 2 hours"];
const GRAPHS_PARAMS = ["temperature", "humidity", "illuminance", "rain_level"];
const PARAMS_ICON = [`<i class="bi bi-thermometer-half"></i>`, `<i class="bi bi-droplet-half"></i>`, `<i class="bi bi-wind"></i>`, `<i class="bi bi-compass"></i>`, `<i class="bi bi-lightbulb"></i>`, `<i class="bi bi-cloud-rain"></i>`, `<i class="bi bi-brightness-high"></i>`, `<i class="bi bi-brightness-high"></i>`];
const EXCLUDE_PARAMS_COMPARISON = ["wind_direction"];
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
        console.log(data);
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

function envSensorValuePanel(titleIcon ,title, trend, value, unit, trendColor) {
    if (value == null) {
        value = "N/A";
    }
    let trendIcon = "";
    switch (trend) {
        case "up": trendIcon = '<i class="bi bi-arrow-up"></i> Increasing'; break;
        case "down": trendIcon = '<i class="bi bi-arrow-down"></i> Decreasing'; break;
        case "equal": trendIcon = '<i class="bi bi-dash"></i> No change'; break;
        default: trendIcon = '<i class="bi bi-dash"></i>'; break;
    }
    let trendColorClass = "";
    switch (trendColor) {
        case "green": trendColorClass = "text-success"; break;
        case "red": trendColorClass = "text-danger"; break;
        case "yellow": trendColorClass = "text-warning"; break;
        case "gray": trendColorClass = "text-secondary"; break;
        case "blue": trendColorClass = "text-primary"; break;
        default: trendColorClass = "text-secondary"; break;
    }
    return `<div class="col">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title"><span class="fs-6 pe-1">${titleIcon}</span>${title}</h5>
                        <h6 class="card-subtitle mb-2"><span class="${trendColorClass}">${trendIcon}</span></h6>
                        <p class="card-text display-5">
                            ${value}<small class="h4"> ${unit}</small>
                        </p>
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
                var trend = "";
                var trendColor = "gray";
                if (row[0].length > 1 && EXCLUDE_PARAMS_COMPARISON.indexOf(PARAMS[i]) == -1) {
                    var lastValue = row[0][row[0].length - 1];
                    var secondLastValue = row[0][row[0].length - 2];
                    if (lastValue > secondLastValue) {
                        trend = "up";
                        trendColor = "green";
                    } else if (lastValue < secondLastValue) {
                        trend = "down";
                        trendColor = "red";
                    } else {
                        trend = "equal";
                    }
                }
                envSensorValueContainer.append(envSensorValuePanel(PARAMS_ICON[i-1], PARAMS_TITLE[i], trend, row[0][row[0].length - 1], PARAMS_UNIT[i], trendColor));
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
            chartConfig = [];
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