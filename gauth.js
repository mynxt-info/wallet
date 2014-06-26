var requestRunning = false;

$(document).ready(function () {

    function google_authenticator() {
        if (requestRunning) {
            return;
        }

        $(".loading").html('<img src="./img/ajax-loader.gif">').show();

        var google_authenticator = $("#google-authenticator");

        var gauth_enabled = google_authenticator.data('enabled');
        var gauth_init_code = google_authenticator.data('init-code');
        var gauth_user_code = $("#gauth_user_code").val();

        var data = {
            save_google_auth: 1,
            gauth_init_code: gauth_init_code,
            gauth_user_code: gauth_user_code,
            gauth_enable: gauth_enabled
        };

        requestRunning = true;

        $.post('api/settings.php', data, function (result) {
            requestRunning = false;
            $(".loading").html('');

            if (result.error) {
                $(".loading").html('<span style="color:red">' + result.error + '</span>');
            }

            var googleAuthenticator = $("#google-authenticator");

            var buttonText = '';
            var statusText = '';

            if (result.enabled == 0) {
                buttonText = 'Enable 2FA';
                statusText = '<strong style=color:red>Disabled</strong>';
            } else {
                buttonText = 'Disable 2FA';
                statusText = '<strong style=color:green>Enabled</strong>';
            }

            $(googleAuthenticator.find('span')[0]).html(statusText);
            $(googleAuthenticator.find('span')[1]).html(buttonText);
            googleAuthenticator.data('enabled', result.enabled);

            if (result.verified == true) {
                $('#googleAuthenticatorModal').modal('hide');
            } else {
                $(".loading").html('<span style="color:red">Authentication code invalid</span>');
            }

        });

    }

    $(".google-authenticator").on('click', function () {
        google_authenticator();
    });

    $('#googleAuthenticatorModal').on('show.bs.modal', function () {
        $("#gauth_user_code").val('');
    });


    $("#login").click(function () {

        var data = {
            tx_email: $("#tx_email").val(),
            tx_login_password: $("#tx_login_password").val(),
            login: 1
        }

        $.post('api/login.php', data, function (result) {
            console.log(result);
        });
    });


});