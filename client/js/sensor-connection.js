function hideLoadingContainer() {
    $("#loading-container").prop("hidden", true);
}

function errorDisplay(error) {
    $("#error-message").html(`<i class="bi bi-exclamation-circle-fill"></i><strong> Error on checking sensor connection</strong>
    <br/><small>Please contact system administrator.<br/>Error: ` + error + `</small>`);
    $("#error-message").prop("hidden", false);
    hideLoadingContainer();
}

async function checkEnvSensorConnection() {
    await fetch("/API/checkSensorConnection").then(response =>
        response.json()
    ).then(data => {
        hideLoadingContainer();
        console.log(data.conne);
        if (data.connected) {
            $("#loading-container").after("");
            $("#loading-container").after(`
            <div class="alert alert-success" role="alert">
            <i class="bi bi-cloud-check-fill"></i><br/>
            Environmental sensor is <strong>CONNECTED</strong><br/>
            Timestamp: ${data.checkTime}.
            </div>`);
        } else {
            $("#loading-container").after("");
            $("#loading-container").after(`
            <div class="alert alert-danger" role="alert">
            <i class="bi bi-cloud-slash-fill"></i><br/>
            Environmental sensor is <strong>DISCONNECTED</strong><br/>
            Last known connected time is ${data.lastKnownConnectedTime}<br/>
            Please contact system administrator.
            </div>`);
        }
        $("#status-response").text(JSON.stringify(data, null, 2));
        $("#status-container").prop("hidden", false);
    }).catch(err => {
        errorDisplay(err);
    });
}

function main() {
    checkEnvSensorConnection();
}

setInterval(main, 10 * 60 * 1000);

$(document).ready(main);