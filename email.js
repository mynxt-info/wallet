var requestRunning = false;

$(document).ready(function () {

    function login_email() {
        if(requestRunning) return;

        requestRunning = true;

        var div = $("#login-email");

        div.find('.loading').html('<img src="./img/ajax-loader_small.gif">').show();
        div.find('.login-email').addClass('disabled');

        // reverse the current setting
        var enable = div.data('enabled') ? 0 : 1;

        var data = {
            change_login_email: 1,
            enable: enable
        };

        $.post('api/settings.php', data, function (result) {
            requestRunning = false;
            div.find('.loading').hide();
            div.find('.login-email').removeClass('disabled');

            if(result.status == "ok") {
                var status = enable ? "Enabled" : "Disabled";
                var color = enable ? "green" : "red";
                var button = enable ? "Disable" : "Enable";

                div.find('.status').first().html("<strong>" + status +"</strong>").css('color', color);
                div.find('.status:nth-child(2)').html(button);
                div.data('enabled', enable);
            }
        });

    }

    $(".login-email").on('click', function () {
        login_email();
    });


});