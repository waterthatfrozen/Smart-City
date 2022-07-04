const PARAMS = ["gw_timestamp", "temperature", "humidity", "wind_velocity", "wind_direction", "illuminance", "rain_level", "ultra_violet_a"];
var paramsIndex = [];
var envSensorData = [];
PARAMS.forEach(function (_param, _index) {
    envSensorData.push([]);
});
console.log(envSensorData);

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
    }).catch(error => {
        $("#env-sensor-value-container").text(error);
    });
}

function main() {
    var envSensorValueContainer = $("#env-sensor-value-container");
    // want temperature, humidity, wind velocity and direction, illuminance, rain level, ultraviolet A
    fetchEnvSensorData();
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