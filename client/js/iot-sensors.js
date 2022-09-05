const data = [
    {
        deviceID: "AAAA",
        temperature: 20,
        humidity: 50,
        pressure: 1000,
        timestamp: "2020-01-01 00:00:00"
    },
    {
        deviceID: "BBBB",
        temperature: 30,
        humidity: 60,
        pressure: 2000,
        timestamp: "2020-01-01 00:00:00"
    },
    {
        deviceID: "CCCC",
        temperature: 40,
        humidity: 70,
        pressure: 3000,
        timestamp: "2020-01-01 00:00:00"
    }
];
const dummyTimestamp = "2020-01-01 00:00:00";

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

function valueRow(rowNo,data){
    return `
    <tr>
        <td>${rowNo}</td>
        <td>${data.deviceID}</td>
        <td>${data.temperature}</td>
        <td>${data.humidity}</td>
        <td>${data.pressure}</td>
        <td>${data.timestamp}</td>
    </tr>
    `;
}

async function getDummyData(){
    setTimeout(() => {}, 2000);
    return data;
}

function sensor_main(){
    console.log("Hello World");
    valueLoadingDisplayHidden(true);
    getDummyData().then((data) => {
        if (data.length === 0){
            valueNodataDisplayHidden(false);
        } else {
            data.forEach((element, index) => {
                $("#table-body").append(valueRow(index+1,element));
            });
        }
    }).catch((error) => {
        valueErrorDisplay(error);
    });
}

$(document).ready(sensor_main);