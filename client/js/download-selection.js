const selectedMonthText = $("#selectedMonthText");
dataErrorContainer = $("#dataError"),
    dataErrorText = $("#dataErrorText"),
    dataLoadingContainer = $("#dataLoading"),
    downloadContainer = $("#downloadContainer"),
    dataNodataContainer = $("#dataNodata");
const BEGIN_OF_DATA = new Date("2022-01-31T17:00:00.000Z");

function showCard(cardType){
    dataErrorContainer.attr("hidden", true);
    dataLoadingContainer.attr("hidden", true);
    dataNodataContainer.attr("hidden", true);
    downloadContainer.attr("hidden", true);
    switch(cardType){
        case "error": dataErrorContainer.attr("hidden", false); break;
        case "loading": dataLoadingContainer.attr("hidden", false); break;
        case "container": downloadContainer.attr("hidden", false); break;
        case "nodata": dataNodataContainer.attr("hidden", false); break;
        default: break;
    }
}

function setSelectedMonthText(start, end){
    let startTime = new Date(start*1000);
    let endTime = new Date(end*1000);

    let monthString = startTime.toLocaleString('default', { month: 'long' }) + " " + startTime.getFullYear();
    if(startTime.getMonth() != endTime.getMonth() || startTime.getFullYear() != endTime.getFullYear()){
        monthString += " - " + endTime.toLocaleString('default', { month: 'long' }) + " " + endTime.getFullYear();
    }
    selectedMonthText.html(`Selected Month: ${monthString} (Time range from ${startTime.toLocaleString('en-GB', {timeZone: 'Asia/Bangkok'})} to ${endTime.toLocaleString('en-GB', {timeZone: 'Asia/Bangkok'})})`);
}

async function getEnvData(start, end){
    let response = await fetch(`/api/getEnvSensorData?start=${start}&end=${end}`);
    response = await response.json();
    if (response.values === undefined) { return []; }
    else{ return response.values; }
}

async function pageMain(){
    try{
        let queryParam = window.location.search.substring(1);
        let queryParamArray = queryParam.split("&");
        let queryParamObject = {};
        queryParamArray.map((param) => {
            let paramArray = param.split("=");
            queryParamObject[paramArray[0]] = parseInt(paramArray[1]);
        });
        // input validation
        if(queryParamObject.start == null || queryParamObject.end == null){
            window.location.href = "/csv-download";
        }else{
            // input cleanup
            // if start is more than end, swap them
            if(queryParamObject.start > queryParamObject.end){ let temp = queryParamObject.start; queryParamObject.start = queryParamObject.end; queryParamObject.end = temp; }
            // if start is before the beginning of data, set it to the beginning of data
            if(queryParamObject.start < Math.round(BEGIN_OF_DATA.getTime()/1000)){ queryParamObject.start = Math.round(BEGIN_OF_DATA.getTime()/1000); }
            // if end is after the current time, set it to the current time
            if(queryParamObject.end > Math.round(new Date().getTime()/1000)){ queryParamObject.end = Math.round(new Date().getTime()/1000); }
            // if start is not the first day of the month, set it to the first day of the month
            let start = new Date(queryParamObject.start*1000);
            start.setDate(1); start.setHours(0); start.setMinutes(0); start.setSeconds(0);
            queryParamObject.start = Math.round(start.getTime()/1000);
            // if end is not the last day of the month, set it to the last day of the month of the same year
            let end = new Date(queryParamObject.end*1000);
            end.setMonth(end.getMonth()+1); end.setFullYear(start.getFullYear()); end.setDate(0); end.setHours(23); end.setMinutes(59); end.setSeconds(59);
            queryParamObject.end = Math.round(end.getTime()/1000);
            // if start and end are not the same month, set end to the last day of the month of start
            let startMonth = new Date(queryParamObject.start*1000).getMonth();
            let endMonth = new Date(queryParamObject.end*1000).getMonth();
            if(startMonth != endMonth){
                let end = new Date(queryParamObject.start*1000);
                end.setMonth(end.getMonth()+1);
                end.setDate(0); end.setHours(23); end.setMinutes(59); end.setSeconds(59);
                queryParamObject.end = Math.round(end.getTime()/1000);
            }

            setSelectedMonthText(queryParamObject.start, queryParamObject.end);
            console.log(queryParamObject);
            
            let envData = await getEnvData(queryParamObject.start, queryParamObject.end);
            console.log(envData);
            if(envData.length == 0 || envData == undefined){
                showCard("nodata");
            }else{
                // generate to CSV file
                let csvContent = "data:text/csv;charset=utf-8,";
                envData.map((value) => {
                    let row = value.join(",");
                    csvContent += row + "\r";
                });
                let encodedUri = encodeURI(csvContent);
                let link = document.createElement("a");
                link.setAttribute("href", encodedUri);
                link.setAttribute("download", `TU-EnvData-${queryParamObject.start}-${queryParamObject.end}.csv`);
                link.innerHTML = "<i class='bi bi-file-earmark-arrow-down'></i> Download CSV";
                link.classList.add("btn", "btn-primary", "w-25");
                $("#downloadContainer").append(link);

                showCard("container");
                link.click();
            }
        }
    }catch(err){
        console.error(err);
        showCard("error");
        dataErrorText.html(`<i class="bi bi-exclamation-circle-fill"></i> <strong>Error on loading data to display</strong><br/>Please check your search range and try again.<br/>Error: ${error}`);
    }
}

$(document).ready(pageMain);