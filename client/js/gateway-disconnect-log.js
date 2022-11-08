const queryTimestampText = $('#queryTimestampText'),
    logLoadingContainer = $('#logLoadingContainer'),
    gatewayDisconnectLogContainer = $('#gatewayDisconnectLogContainer');

function hideLogLoadingContainer(hidden){
    if(hidden){ logLoadingContainer.hide(); }
    else{ logLoadingContainer.show(); }
}

function staticLogRow(type){
    switch (type) {
        case "noData": return `<tr class="bg-info"><td colspan="2" class="text-white p-3" id="disconnectGW1NoData"><i class="bi bi-exclamation-circle-fill"></i> No data recorded.</td></tr>`;
        case "error": return `<tr class="bg-danger"><td colspan="2" class="text-white p-3" id="disconnectGW1Error"><i class="bi bi-x-circle"></i> An error occurred.</td></tr>`;
        case "withData": return "";
        default: return "";
    }
}

function connectionString(connected) {
    if (connected) { return "<span class='text-success'><i class='bi bi-cloud-check-fill'></i> Connected</span>"; }
    else { return "<span class='text-danger fw-bold'><i class='bi bi-cloud-slash-fill'></i> Disconnected</span>"; }
}

function gatewayInformationCard(gatewayName, deviceID, connected, gatewayMAC){
    return `<div id="${gatewayName}InfoCard">
        <h4>${gatewayName}</h4>
        <p>
            Device ID: ${deviceID}<br/>
            Current Status: ${connectionString(connected)}<br/>
            MAC Address: ${gatewayMAC}<br/>
        </p>
    </div>`;
}

function gatewayLogTable(gatewayName, logType, disconnectLog, timestamp){
    return `<div class="table-responsive rounded-3" id="${gatewayName}Container">
        <table class="table table-striped table-hover" id="${gatewayName}Table">
            <thead class="table-dark" id="${gatewayName}TableHeader">
                <tr>
                    <th>#</th>
                    <th>Log ID</th>
                    <th><span>Time Disconnected</span></th>
                </tr>
            </thead>
            <tbody id="${gatewayName}TableBody">
                ${logType === "withData" ? disconnectLog.map((item,index) => { 
                        return index===0 ? `<tr class="fw-bold bg-warning"><td>${index+1}</td><td>${item.logID}</td><td>${item.disconnectTime}</td></tr>` : `<tr><td>${index+1}</td><td>${item.logID}</td><td>${item.disconnectTime}</td></tr>`; 
                    }).join("") : staticLogRow(logType)}
            </tbody>
            <caption id="${gatewayName}Timestamp">As of ${timestamp}</caption>
        </table>
    </div>`;
}

function gatewayDisconnectColumn(gatewayName, deviceID, connected, gatewayMAC, logType, disconnectLog, timestamp){
    return `<div class="col">
        ${gatewayInformationCard(gatewayName, deviceID, connected, gatewayMAC)}
        ${gatewayLogTable(gatewayName, logType, disconnectLog, timestamp)}
    </div>`;
}

async function getGatewayDisconnectLog(){
    let data = await fetch('/api/queryGatewayDisconnectLog');
    let json = await data.json();
    return json;
}

async function getGatewayStatus() {
    const BASEAPI_URL = '/api/checkGatewayConnection';
    const response = await fetch(BASEAPI_URL);
    const data = await response.json();
    return data.gatewayDisconnectLog;
}

async function getGatewayList() {
    const gatewayDisconnect = await getGatewayStatus();
    const BASEAPI_URL = '/api/getZoneDeviceList?zone_id=10';
    const response = await fetch(BASEAPI_URL);
    const data = await response.json();
    hideLogLoadingContainer(true);
    let gatewayList = [];
    data.forEach(element => {
        if (element.name === "PE_GATEWAY_MINI_IOT") {
            let gwconnect = true;
            gatewayDisconnect.forEach(disconnectGateway => { if (disconnectGateway.gateway_name === element.device_label) { gwconnect = false; } });
            gatewayList.push({
                "device_id": element.device_uid,
                "device_label": element.device_label,
                "device_mac_address": element.MAC,
                "gateway_mac_address": element.gateway_MAC,
                "latitude": element.assigned_lat,
                "longitude": element.assigned_lon,
                "connected": gwconnect
            });

        }
    });
    gatewayList.sort((a, b) => { return a.device_label.localeCompare(b.device_label); });
    return gatewayList;
}

async function pageMain() {
    let queryLogResult = await getGatewayDisconnectLog();
    let gatewayList = await getGatewayList();
    console.log(gatewayList);
    console.log(queryLogResult);
    let gatewayDisconnectLog = queryLogResult.gatewayDisconnectLog;
    gatewayDisconnectLog.sort((a,b) => { return a.logID - b.logID; });

    // display query timestamp
    let queryTimestamp = queryLogResult.queryTime;
    queryTimestamp = datetimeTransform(parseInt(queryTimestamp*1000));
    queryTimestampText.text("As of "+ queryTimestamp);

    console.log(gatewayDisconnectLog);
    console.log(queryTimestamp);

    gatewayDisconnectLogContainer.append(
        gatewayList.map((gateway) => {
            let gatewayLog = [];
            let logType = "error";
            gatewayDisconnectLog.forEach((log) => {
                if (log.gatewayName === gateway.device_label) {
                    gatewayLog.push(log);
                    logType = "withData";
                }
            });
            gatewayLog.reverse();
            if (gatewayLog.length === 0) { logType = "noData"; }
            gatewayDisconnectLogContainer.append(gatewayDisconnectColumn(gateway.device_label, gateway.device_id, gateway.connected, gateway.gateway_mac_address, logType, gatewayLog, queryTimestamp));
        })
    );

    gatewayDisconnectLog.map((item,index) => {
        console.log(index, item);
    });
}

$(document).ready(pageMain);