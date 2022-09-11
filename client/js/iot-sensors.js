function valueLoadingDisplayHidden(visibility){
    $("#value-loading").prop("hidden", visibility);
}

function valueErrorDisplay(error){
    $("#value-error").prop("hidden", false);
    $("#value-error").html(`
    <i class="bi bi-exclamation-circle-fill"></i> An error occurred.
    <br/>Please contact system administrator for further investigation.
    <br/>Error: ${error}`);   
}


function valueNodataDisplayHidden(visibility){
    $("#value-nodata").prop("hidden", visibility);
}

function valueRow(data){
    // degree symbol: &#176;
    return `
    <tr>
        <td class="col-w100px">${new Date(data.measurementTimestamp).toLocaleString()}</td>
        <td>${data.temperature} &#176;C</td>
        <td>${data.humidity}%</td>
        <td>${data.air_pressure} hPa</td>
        <td>${data.light_intensity} lx</td>
        <td>${data.infrared}</td>
        <td>${data.uv_index}</td>
        <td>${data.microwave_doppler}</td>
        <td>${data.v_mq2}</td>
        <td>${data.v_mq4}</td>
        <td>${data.v_mq7}</td>
        <td>${data.v_mq8}</td>
        <td>${data.pm1_env}</td>
        <td>${data.pm1_stand}</td>
        <td>${data.pm25_env}</td>
        <td>${data.pm25_stand}</td>
        <td>${data.pm100_env}</td>
        <td>${data.pm100_stand}</td>
    </tr>
    `;
}

async function getIoTSensorData(){
    // const end = new Date().getTime() / 1000;
    // const start = end - (60 * 60 * 24);
    const start = 1659510600;
    const end = 1659512500;
    let result = null;
    await fetch('/api/getRecordedData?thing_id=62e93e0a64bebd0001c2bc02&start='+start+'&end='+end, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        result = data;
    }).catch(function (error) {
        valueLoadingDisplayHidden(true);
        valueErrorDisplay(error);
    });
    return result;
}

function sensor_main(){
    getIoTSensorData().then((data) => {
        valueLoadingDisplayHidden(true);
        let sensorData = data.data;
        if (sensorData.length === 0){
            valueNodataDisplayHidden(false);
        } else {
            sensorData.forEach((element) => {
                $("#table-body").append(valueRow(element));
            });
        }
        $("#loading-timestamp").text(`As of ${datetimeTransform(new Date())}`);
        $("#table-caption").text(`${sensorData.length} records Loaded, Last Updated: ${datetimeTransform(new Date())}`);
    }).catch((error) => {
        valueErrorDisplay(error);
        $("#loading-timestamp").text('Error on loading data.');
        $("#table-caption").text('Error on loading data.');
    });
}

$(document).ready(sensor_main);