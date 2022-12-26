function disableButton() {
    var spinner = "<div class='spinner-grow spinner-grow-sm text-light' role='status'><span class='visually-hidden'>Loading...</span></div>"
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
    await fetch("/login", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(data)
    }).then(response => {
        if (response.ok) {
            window.location.href = "/dashboard";
        } else {
            console.log("login failed");
            var message = "<em class='bi bi-x-circle-fill'></em>&nbsp;<strong>Login failed!</strong><br/>" +
                "<small>Please check your username and password.</small>";
            $("#error-message").prop("hidden", false).html(message);
            enableButton();
        }
    }).catch(function (error) {
        $("#error-message").prop("hidden", false).html(error);
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