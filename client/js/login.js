function disableButton() {
    var spinner = "<div class='spinner-border spinner-border-sm text-light' role='status'><span class='visually-hidden'>Loading...</span></div>"
    $("#submit-button").prop("disabled", true);
    $("#submit-button").html(spinner + "&nbsp;Logging in...");
}

function enableButton() {
    $("#submit-button").prop("disabled", false);
    $("#submit-button").html("<em class='bi bi-key'></em>&nbsp;<strong>Log In</strong>");
}

async function login(username, password) {
    disableButton();
    var data = {
        username: username,
        password: password
    };
    await fetch("https://siit.pdxeng.ch:8000/cms/api/v1.0/token", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => response.json()).then(response => {
        if (response.response_code == 200) {
            sessionStorage.setItem("username", username);
            sessionStorage.setItem("password", password);
            sessionStorage.setItem("token", response.token);
            sessionStorage.setItem("loggedIn", true);
            window.location = "/dashboard";
        } else {
            var message = "<em class='bi bi-x-circle-fill'></em>&nbsp;<strong>Login failed!</strong><br/>" +
                "<small>Please check your username and password.</small>";
            $("#error-message").prop("hidden", false).html(message);
            enableButton();
        }
    }).catch(function (error) {
        var message = "<em class='bi bi-exclamation-circle-fill'></em>&nbsp;<strong>Login Error!</strong><br/>" +
            "<small>Please contact your system admin.</small>";
        $("#error-message").prop("hidden", false).html(message);
        enableButton();
    });
}

async function main() {
    $("#login-form").submit(function (e) {
        console.log("login form submitted");
        e.preventDefault();
        var username = $("#username").val();
        var password = $("#password").val();
        login(username, password);
    });
}
$(document).ready(main);