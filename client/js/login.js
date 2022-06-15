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

function disableButton(){
    var spinner = "<div class='spinner-border spinner-border-sm text-light' role='status'><span class='visually-hidden'>Loading...</span></div>"
    $("#submit-button").prop("disabled", true);
    $("#submit-button").html(spinner+"&nbsp;Logging in...");
}

function enableButton(){
    $("#submit-button").prop("disabled", false);
    $("#submit-button").html("<em class='bi bi-key'></em>&nbsp;<strong>Log In</strong>");
}

async function login(username, password){
    disableButton();
    var data = {
        username: username,
        password: password
    };
    await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
            },
        body: JSON.stringify(data)
    }).then(function(response){
        if(response.status == 200){
            // console.log(response);
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("password", password);
            // sessionStorage.setItem("token", response.token);
            sessionStorage.setItem("loggedIn", true);
            window.location = "/dashboard";
        }else{
            var message = "<em class='bi bi-x-circle-fill'></em>&nbsp;<strong>Login failed!</strong><br/>"+
            "<small>Please check your username and password.</small>";
            $("#error-message").prop("hidden", false).html(message);
            enableButton();
        }
    }).catch(function(_error){
        var message = "<em class='bi bi-exclamation-circle-fill'></em>&nbsp;<strong>Login Error!</strong><br/>"+
        "<small>Please contact your system admin.</small>";
        $("#error-message").prop("hidden", false).html(message);
        console.log(_error);
        enableButton();
    });
}

async function main(){
    datetimeUpdate();
    setInterval(datetimeUpdate, 1000);

    $("#login-form").submit(function(e){
        console.log("login form submitted");
        e.preventDefault();
        var username = $("#username").val();
        var password = $("#password").val();
        login(username, password);
    });
}

$(document).ready(main);