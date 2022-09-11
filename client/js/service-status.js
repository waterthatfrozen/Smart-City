function serviceLoadingHidden(visibility){
    $("#services-loading-container").prop("hidden", visibility);
}

function errorCardHidden(visibility,error){
    $("#error-card").prop("hidden", visibility);
    $("#error-text").html(`
    <p class="card-text" id="error-text">
        <span class="fw-bold"><i class="bi bi-exclamation-circle-fill"></i> Error on checking CMS Services Status. </span><br/>
        Please contact your administrator for further assistance.<br/>
        Error: ${error}
    </p>`);
}

async function getServiceStatus(){
    let serviceStatus = null;
    await fetch('/api/getServiceStatus', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    }).then(function (response) {
        return response.json();
    }).then(function (data) {
        serviceStatus = data.services;
    }).catch(function (error) {
        errorCardHidden(false,error);
    });
    return serviceStatus;
}

function servicePanel(service){
    let bgColor = (service.status === "up") ? "bg-success" : "bg-danger";
    let icon = (service.status === "up") ? "bi bi-check-circle-fill" : "bi bi-x-circle-fill";
    let critical = (service.critical) ? `<span class="badge rounded-pill bg-info float-start me-1" id="service-status"><i class="bi bi-exclamation-circle-fill me-1"></i>Critical</span>` : "";
    return `<div class="col">
        <div class="card">
            <div class="card-body">
                <span class="badge rounded-pill ${bgColor} float-start me-1" id="service-status"><i class="bi ${icon} me-1"></i>${service.status.toUpperCase()}</span> ${critical}
                <span class="fw-bold">${service.name.toUpperCase().replaceAll("_"," ")}</span> Version ${service.version}
            </div>
        </div>
    </div>`;
}

function displayAllServices(){
    getServiceStatus().then(function (data) {
        serviceLoadingHidden(true);
        //sort data by critical
        data.sort(function(a, b) {
            return b.critical - a.critical;
        });
        data.forEach(service => {
            if(service.status !== "unknown"){
                $("#services-container").append(servicePanel(service));
            }
        });
    }).catch(function (error) {
        errorCardHidden(false,error);
    });
}

function display_main(){
    displayAllServices();
}

$(document).ready(display_main);