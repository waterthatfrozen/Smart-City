function datetimeTransform(date) {
    date = new Date(date);
    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var dateString = weekday[date.getDay()] + ", " + date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear();
    var hourString = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var minuteString = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var secondsString = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var timeString = hourString + ":" + minuteString + ":" + secondsString;
    return dateString + " " + timeString;
}

function datetimeUpdate() {
    $("#datetime-display").html(datetimeTransform(new Date()));
}

datetimeUpdate();
setInterval(datetimeUpdate, 1000);