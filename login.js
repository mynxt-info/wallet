var requestRunning = false;

$(document).ready(function () {

    function google_authenticator() {
        if (requestRunning) {
            return;
        }
        var modal = $("#googleAuthenticatorModal");

        modal.find(".loading").html('<img src="./img/ajax-loader.gif">').show();

        var gauth_user_code = $("#gauth_user_code").val();

        var data = {
            tx_email: $("#tx_email").val(),
            tx_login_password: $("#tx_login_password").val(),
            remember_me: $("#remember-me").prop('checked'),
            gauth_user_code: gauth_user_code,
            verify_gauth: 1,
            login: 1
        };

        requestRunning = true;

        $.post('api/login.php', data, function (result) {
            requestRunning = false;

            if (result.logged_in === true) {
                location.reload();
            } else {
                modal.find(".loading").html('<span style="color:red">Authentication code invalid</span>');
            }
        });
    }

    function post_login() {
        if (requestRunning) {
            return;
        }

        requestRunning = true;

        var data = {
            tx_email: $("#tx_email").val(),
            tx_login_password: $("#tx_login_password").val(),
            login: 1
        };

        var frmLogin = $("#frmLogin");

        frmLogin.find(".loading").html('<img src="./img/ajax-loader_small.gif">').show();


        $.post('api/login.php', data, function (result) {
            requestRunning = false;

            var errormessage = $('.errormessage');
            errormessage.hide();

            frmLogin.find(".loading").hide();

            if (result.gauth) {
                return $('#googleAuthenticatorModal').modal({backdrop: 'static'})
            }
            if (result.logged_in === true) {
                location.reload();
            }

            if (result.error) {
                errormessage.html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button>" + result.error).show(300);
            }
        });
    }

    $(".google-authenticator").on('click', function () {
        google_authenticator();
    });


    $('#frmLogin').find('input').keypress(function (e) {
        if (e.which == 13) {
            post_login();
        }
    });

    $("#login").click(function () {
        post_login();
    });


});