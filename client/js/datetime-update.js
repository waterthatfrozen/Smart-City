function datetimeUpdate() {
    var weekday = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    var month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    var date = new Date();
    var dateString = weekday[date.getDay()] + ", " + date.getDate() + " " + month[date.getMonth()] + " " + date.getFullYear();
    var hourString = date.getHours() < 10 ? "0" + date.getHours() : date.getHours();
    var minuteString = date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes();
    var secondsString = date.getSeconds() < 10 ? "0" + date.getSeconds() : date.getSeconds();
    var timeString = hourString + ":" + minuteString + ":" + secondsString;
    var datetimeString = dateString + " " + timeString;
    $("#datetime-display").html(datetimeString);
}

datetimeUpdate();
setInterval(datetimeUpdate, 1000);