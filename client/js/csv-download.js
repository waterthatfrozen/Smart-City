const dataErrorContainer = $("#dataError"),
    dataErrorText = $("#dataErrorText"),
    dataLoadingContainer = $("#dataLoading"),
    downloadContainer = $("#downloadContainer"),
    downloadContainerCaption = $("#downloadContainerCaption");

let BEGIN_OF_DATA = new Date("2022-01-31T17:00:00.000Z");
let CURRENT_TIME = new Date();

function showCard(cardType) {
    dataErrorContainer.attr("hidden", true);
    dataLoadingContainer.attr("hidden", true);
    downloadContainer.attr("hidden", true);
    switch (cardType) {
        case "error": dataErrorContainer.attr("hidden", false); break;
        case "loading": dataLoadingContainer.attr("hidden", false); break;
        case "container": downloadContainer.attr("hidden", false); break;
        default: break;
    }
}

async function insertDownloadPanel(month) {
    try {
        downloadContainer.append(`<div class="col">
            <div class="card rounded-3 bg-transparent">
                <div class="card-body" id="${month.monthName.replaceAll(" ", "-")}-container">
                    <p class="card-title">${month.monthName}</p>
                    <a class="btn btn-primary btn-sm" id="download-${month.monthName.replaceAll(" ", "-")}" 
                        href="/download-selection?start=${Math.round(month.firstDay.getTime() / 1000)}&end=${Math.round(month.lastDay.getTime() / 1000)}">
                        <i class="bi bi-file-earmark-arrow-down"></i> Download CSV
                    </a>
                </div>
            </div>
        </div>`);
    } catch (error) {
        console.error(error);
        showCard("error");
        dataErrorText.html(`<i class="bi bi-exclamation-circle-fill"></i> <strong>Error on generating download panel</strong><br/>Please check your search range and try again.<br/>Error: ${error}`);
    }
}

async function pageMain() {
    try {
        // generate month list from begin of data to current time
        let firstDayOfTheMonthList = [];
        let lastDayOfTheMonthList = [];
        let monthList = [];
        for (let i = BEGIN_OF_DATA; i < CURRENT_TIME; i.setMonth(i.getMonth() + 1)) {
            monthList.push({
                monthName: i.toLocaleString('default', { month: 'long' }) + " " + i.getFullYear(),
                firstDay: new Date(i.getFullYear(), i.getMonth(), 1),
                lastDay: new Date(i.getFullYear(), i.getMonth() + 1, 0, 23, 59, 59)
            });
        }
        // display month full name
        monthList.map((month) => { insertDownloadPanel(month); });
        showCard("container");
        console.log(monthList);
        downloadContainerCaption.text("Ready to download at " + new Date().toLocaleString('en-GB', { timeZone: 'Asia/Bangkok' }));
    } catch (error) {
        console.error(error);
        showCard("error");
        dataErrorText.html(`<i class="bi bi-exclamation-circle-fill"></i> <strong>Error on loading data to display</strong><br/>Please check your search range and try again.<br/>Error: ${error}`);
    }
}

$(document).ready(pageMain);