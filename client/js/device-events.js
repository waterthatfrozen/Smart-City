const EVENT_SEVERITY_ORDER = ["ERROR", "ALARM", "WARNING", "INFORMATION"];
const CMSInitializeTime = new Date("2022-02-04 17:00:00 +07");
const zoneSelection = $("#zoneSelection");
const dataInitializeContainer = $("#dataInitialize"),
    dataErrorContainer = $("#dataError"),
    dataErrorText = $("#dataErrorText"),
    dataNodataContainer = $("#dataNodata"),
    dataLoadingContainer = $("#dataLoading");
const reportTableContainer = $("#reportTableContainer"),
    reportTable = $("#reportTable"),
    reportTableBody = $("#reportTableBody"),
    reportTableCaption = $("#reportTableCaption");

function disableZoneSelection(disabled){
    zoneSelection.attr('disabled', disabled);
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

async function setZoneListSelection() {
    try {
        let response = await fetch('/api/getZoneList');
        let data = response.status === 200 ? await response.json() : [];
        let zoneList = [];
        data.map((zone) => { if(zone.parent_oid === 3){ zoneList.push({id: zone.zone_id, name: zone.name}); }});
        zoneList.sort((a, b) => { return a.id - b.id; });
        zoneList = zoneList.slice(0, 7);
        console.log(zoneList);

        zoneSelection.empty();
        zoneSelection.append(`<option>Select Zone</option>`);
        zoneList.map((zone) => { zoneSelection.append(`<option value="${zone.id}">${zone.name}</option>`); });
        disableZoneSelection(false);
    } catch (error) {
        console.error(error);
        throw error;
    }
}

async function getDeviceEvents(zone_id){
    let response = await fetch('/api/getZoneEvent?zone_id='+zone_id);
    let data = await response.json();
    return data;
}

function severityString(severity){
    severity = severity.toUpperCase();
    switch(severity){
        case "INFORMATION": return `<span class="badge bg-info"><i class="bi bi-info-circle"></i> Information</span>`;
        case "WARNING": return `<span class="badge bg-warning"><i class="bi bi-exclamation-triangle"></i> Warning</span>`;
        case "ALARM": return `<h5><span class="badge bg-light text-danger"><i class="bi bi-exclamation-circle"></i> Alarm</span></h5>`;
        case "ERROR": return `<h5><span class="badge bg-light text-danger"><i class="bi bi-exclamation-circle"></i> Error</span></h5>`;
        default: return `<span class="badge bg-secondary"><i class="bi bi-question-circle"></i> Unknown</span>`;
    }
}

function insertRow(row, index){
    let bgRow = row.severity === "ERROR" || row.severity === "ALARM" ? `class="bg-danger"` : "";
    let textRow = row.severity === "ERROR" || row.severity === "ALARM" ? `class="text-white"` : "";
    reportTableBody.append(`<tr ${bgRow}>
        <td ${textRow}>${index+1}</td>
        <td ${textRow}>${row.timestamp.toLocaleString('en-GB', {timeZone: 'Asia/Bangkok'})}</td>
        <td ${textRow}>${row.event_id}</td>
        <td ${textRow}>${row.device_label}<br/>(Device ID: ${row.device_uid})</td>
        <td ${textRow}>${row.name.replaceAll("_"," ")} <br/>Same Event Counter: ${row.same_event_counter}</td>
        <td ${textRow}>${severityString(row.severity)}</td>
        <td ${textRow}>${row.code}</td>
    </tr>`);
}

function insertToTable(eventList){
    reportTableBody.empty();
    eventList.map((row, index) => { insertRow(row, index); });
}

async function pageMain(){
    await setZoneListSelection();

    zoneSelection.on('change', async () => {
        let currentZoneSelection = zoneSelection.val();
        console.log(currentZoneSelection);
        if(currentZoneSelection === "Select Zone"){
            showCard("initialize");
        }else{
            disableZoneSelection(true);
            showCard("loading");
            try {
                console.log("Loading...");
                let deviceEvents = await getDeviceEvents(currentZoneSelection);
                console.log(deviceEvents);
                if(deviceEvents.length === 0){ showCard("nodata"); }
                else{ 
                    await deviceEvents.map((row) => { row.timestamp = new Date(row.timestamp.split(" +07")[0]); row.severity = row.severity.toUpperCase(); });
                    deviceEvents = deviceEvents.filter((row) => { return row.timestamp >= CMSInitializeTime; });
                    deviceEvents.sort((a, b) => { return EVENT_SEVERITY_ORDER.indexOf(a.severity) - EVENT_SEVERITY_ORDER.indexOf(b.severity); });
                    insertToTable(deviceEvents); 
                    showCard("datatable"); 
                }   
            } catch (error) {
                console.error(error);
                dataErrorText.html(`<i class="bi bi-exclamation-circle-fill"></i> <strong>Error on loading data to display</strong><br/>Please check your search range and try again.<br/>Error: ${err}`);
                showCard("error");
            }
            disableZoneSelection(false);
        }
    });
}

$(document).ready(pageMain);