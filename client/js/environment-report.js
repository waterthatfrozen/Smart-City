const searchStartTime = $("#searchStartTime"),
    searchEndTime = $("#searchEndTime"),
    searchButton = $("#searchButton");
const dataInitializeContainer = $("#dataInitialize"),
    dataErrorContainer = $("#dataError"),
    dataErrorText = $("#dataErrorText"),
    dataNodataContainer = $("#dataNodata"),
    dataLoadingContainer = $("#dataLoading");
const reportTableContainer = $("#reportTableContainer"),
    reportTable = $("#reportTable"),
    reportTableBody = $("#reportTableBody"),
    reportTableCaption = $("#reportTableCaption");
const SELECTED_PARAMS = ['gw_timestamp', 'temperature', 'humidity', 'wind_velocity', 'wind_direction', 'illuminance', 'rain_level', 'air_pressure', 'ultra_violet_a', 'ultra_violet_b'];
const SELECTED_UNITS = ['', ' °C', '%', ' m/s', '°', ' lux', '', ' hPa', ' W/m²', ' W/m²'];

let END_DATETIME = new Date(), START_DATETIME = new Date();
START_DATETIME.setUTCHours(START_DATETIME.getHours() - 24); START_DATETIME.setUTCMinutes(START_DATETIME.getMinutes() - 1);
END_DATETIME.setUTCHours(END_DATETIME.getHours());
START_DATETIME = START_DATETIME.toISOString().slice(0, 16); END_DATETIME = END_DATETIME.toISOString().slice(0, 16);

async function getEnvData(startTime,endTime){
    try{
        let result = await fetch(`/api/getEnvSensorData?start=${startTime}&end=${endTime}`);
        result = await result.json();
        if(result.error === "No data found for this time period"){ return {values: []};}
        else{ return result; }
    }catch(err){
        console.error(err);
    }
}

function showCard(cardType){
    dataInitializeContainer.attr("hidden", true);    
    dataErrorContainer.attr("hidden", true);
    dataNodataContainer.attr("hidden", true);
    dataLoadingContainer.attr("hidden", true);
    reportTableContainer.attr("hidden", true);
    switch(cardType){
        case "initialize": dataInitializeContainer.attr("hidden", false); break;
        case "error": dataErrorContainer.attr("hidden", false); break;
        case "nodata": dataNodataContainer.attr("hidden", false); break;
        case "loading": dataLoadingContainer.attr("hidden", false); break;
        case "datatable": reportTableContainer.attr("hidden", false); break;
        default: break;
    }
}

function reportRow(data){
    let row = `<tr>`;
    data.map((value) => {row += `<td>${value}</td>`;});
    row += `</tr>`;
    return row;
}

function insertToTable(reportHeader, reportValue, startTime, endTime){
    let selectedParamIndex = [];
    SELECTED_PARAMS.forEach((param) => {
        selectedParamIndex.push(reportHeader.indexOf(param));
    });
    console.log(SELECTED_PARAMS);
    console.log(selectedParamIndex);
    reportValue.map((value) => {
        let row = [];
        selectedParamIndex.map((selectedIdx, index) => {
            switch(selectedIdx){
                case 0: row.push((value[selectedIdx]).split("+07")[0]); break;
                case 3: row.push(value[selectedIdx].toFixed(2) + SELECTED_UNITS[index]); break;
                case 4: row.push(value[selectedIdx].toFixed(0) + SELECTED_UNITS[index]); break;
                case 10: row.push(value[selectedIdx].toFixed(2) + SELECTED_UNITS[index]); break;
                case 11: row.push(value[selectedIdx].toFixed(2) + SELECTED_UNITS[index]); break;
                default: row.push(value[selectedIdx] + SELECTED_UNITS[index]); break;
            }
        });
        reportTableBody.append(reportRow(row));
    });

    reportTableCaption.html(`All data from ${datetimeTransform(startTime)} to ${datetimeTransform(endTime)}`);
}

async function pageMain(){
    // set default date range
    searchStartTime.val(START_DATETIME); searchEndTime.val(END_DATETIME);
    searchStartTime.attr("max", END_DATETIME); searchEndTime.attr("max", END_DATETIME); searchEndTime.attr("min", START_DATETIME);

    searchStartTime.on("change", function(){
        let inputStartTime = new Date(searchStartTime.val());
        inputStartTime.setUTCHours(inputStartTime.getHours());
        inputStartTime = inputStartTime.toISOString().slice(0, 16);
        searchEndTime.attr("min", inputStartTime);
    });

    searchButton.on("click", async function(){
        let startTime = new Date(searchStartTime.val());
        let endTime = new Date(searchEndTime.val());
        if(startTime > endTime){
            alert("Start time must be before end time.");
        }else{
            showCard("loading");
            try{
                let result = await getEnvData(Math.floor(startTime.getTime()/1000),Math.floor(endTime.getTime()/1000));
                let resultValues = result.values;
                console.log(result);
                if(resultValues.length > 0){
                    let resultHeader = resultValues.splice(0,1)[0];
                    console.log(resultHeader);
                    console.log(resultValues.map((value) => reportRow(value)));
                    reportTableBody.empty();
                    insertToTable(resultHeader, resultValues, startTime, endTime);
                    showCard("datatable");
                }else{
                    showCard("nodata");
                }
            }catch(err){
                showCard("error");
                dataErrorText.html(`<i class="bi bi-exclamation-circle-fill"></i> <strong>Error on loading data to display</strong><br/>Please check your search range and try again.<br/>Error: ${err}`);
            }
        }
    });
}

$(document).ready(pageMain);