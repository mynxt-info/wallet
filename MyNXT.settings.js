var MyNXT = (function (MyNXT, $) {
  var requestRunning = false;

  $(".login-email").on('click', function () {
    MyNXT.changeLoginEmailSettings();
  });

  MyNXT.changeLoginEmailSettings = function () {
    if (requestRunning) return;

    requestRunning = true;

    var div = $("#login-email");

    MyNXT.showSmallLoadingBar(div);
    div.find('.login-email').addClass('disabled');

    // reverse the current setting
    var enable = div.data('enabled') ? 0 : 1;

    var data = {
      change_login_email: 1,
      enable: enable
    };

    $.post('api/settings.php', data, function (result) {
      requestRunning = false;
      MyNXT.hideLoadingBar(div);
      div.find('.login-email').removeClass('disabled');

      if (result.status == "ok") {
        var status = enable ? "Enabled" : "Disabled";
        var color = enable ? "green" : "red";
        var button = enable ? "Disable" : "Enable";

        div.find('.status').first().html("<strong>" + status + "</strong>").css('color', color);
        div.find('.status:nth-child(2)').html(button);
        div.data('enabled', enable);
      }
    });
  };

  return MyNXT;
}(MyNXT || {}, jQuery));

$(document).ready(function () {
  if (location.pathname == '/settings.php') {
    MyNXT.getAccounts(function (result) {
      for (var i = 0; i < result.length; i++) {
        var account = result[i];
        if (account.bl_selected == 1) {
          MyNXT.mainAccount = account.tx_account_id;
        }

        if(account.tx_public_key == "") {
          $("#noPublicKeys").show()
        }
      }
    });
  }
});