const PARAMS = ["gw_timestamp", "temperature", "humidity", "wind_velocity", "wind_direction", "illuminance", "rain_level", "ultra_violet_a", "ultra_violet_b"];
const PARAMS_TITLE = ["Timestamp", "Temperature", "Humidity", "Wind Velocity", " Wind Direction", "Illuminance", "Rain Level", "Ultra Violet A", "Ultra Violet B"];
const PARAMS_UNIT = ["", "°C", "%", "m/s", "°", "klx", "mm", "", ""];
var paramsIndex = [];
var envSensorData = [];

PARAMS.forEach(function (_param, _index) {
    envSensorData.push([]);
});
console.log(envSensorData);

async function cleanEnvSensorData() {
    // wind direction round to 360
    var wind_direction_idx = PARAMS.indexOf("wind_direction");
    if (wind_direction_idx != -1) {
        envSensorData[wind_direction_idx].forEach(function (row, index) {
            envSensorData[wind_direction_idx][index] = row.map(function (value) {
                return value % 360;
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
    await fetch("/API/getEnvSensorData?start=" + start + "&end=" + end).then(response => response.json()).then(data => {
        data = data.values;
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
        $("#env-sensor-value-container").text(error);
    });
}

function envSensorValuePanel(title, subtitle, value, unit, comment) {
    if (value == null) {
        value = "N/A";
    }
    return `<div class="col">
                <div class="card">
                    <div class="card-body">
                        <h5 class="card-title">${title}</h5>
                        <h6 class="card-subtitle mb-2">${subtitle}</h6>
                        <p class="card-text display-5">${value}<small class="h4">${unit}</small></p>
                        <span class="text-muted">${comment}</span>
                    </div>
                </div>
            </div>`;
}

function main() {
    var envSensorValueContainer = $("#env-sensor-value-container");
    fetchEnvSensorData().then(() => {
        envSensorValueContainer.html("");
        for (var i = 1; i < PARAMS.length; i++) {
            var row = envSensorData[i];
            envSensorValueContainer.append(envSensorValuePanel(PARAMS_TITLE[i], "", row[0][row.length - 1], PARAMS_UNIT[i], ""));
        }
    });
    // fetchEnvSensorData();
}

const ctx1 = document.getElementById('myChart1');
const ctx2 = document.getElementById('myChart2');
const ctx3 = document.getElementById('myChart3');
const ctx4 = document.getElementById('myChart4');

const chart = {
    type: 'bar',
    data: {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [{
            label: '# of Votes',
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
                'rgba(255, 99, 132, 0.2)',
                'rgba(54, 162, 235, 0.2)',
                'rgba(255, 206, 86, 0.2)',
                'rgba(75, 192, 192, 0.2)',
                'rgba(153, 102, 255, 0.2)',
                'rgba(255, 159, 64, 0.2)'
            ],
            borderColor: [
                'rgba(255, 99, 132, 1)',
                'rgba(54, 162, 235, 1)',
                'rgba(255, 206, 86, 1)',
                'rgba(75, 192, 192, 1)',
                'rgba(153, 102, 255, 1)',
                'rgba(255, 159, 64, 1)'
            ],
            borderWidth: 1
        }]
    },
    options: {
        scales: {
            y: {
                beginAtZero: true
            }
        }
    }
};
const myChart1 = new Chart(ctx1, chart);
const myChart2 = new Chart(ctx2, chart);
const myChart3 = new Chart(ctx3, chart);
const myChart4 = new Chart(ctx4, chart);

$(document).ready(main);