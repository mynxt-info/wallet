var MyNXT = (function (MyNXT, $) {
  var requestRunning = false;

  $(".google-authenticator").on('click', function () {
    MyNXT.googleAuthenticator();
  });

  MyNXT.googleAuthenticator = function () {
    if (requestRunning) return;

    var div = $("#google-authenticator");
    var modal = $("#googleAuthenticatorModal");

    var gauth_enabled = div.data('enabled');
    var gauth_init_code = div.data('init-code');
    var gauth_user_code = $("#gauth_user_code").val();

    var data = {
      save_google_auth: 1,
      gauth_init_code: gauth_init_code,
      gauth_user_code: gauth_user_code,
      gauth_enable: gauth_enabled
    };

    requestRunning = true;

    MyNXT.showBigLoadingBar(modal);

    $.post('api/settings.php', data, function (result) {
      requestRunning = false;
      modal.find(".loading").html('');

      if (result.error) {
        modal.find(".loading").html('<span style="color:red">' + result.error + '</span>');
      }

      var buttonText = '';
      var statusText = '';

      if (result.enabled == 0) {
        buttonText = 'Enable 2FA';
        statusText = '<strong style=color:red>Disabled</strong>';
      } else {
        buttonText = 'Disable 2FA';
        statusText = '<strong style=color:green>Enabled</strong>';
      }

      $(div.find('span')[0]).html(statusText);
      $(div.find('span')[1]).html(buttonText);
      div.data('enabled', result.enabled);

      if (result.verified == true) {
        modal.modal('hide');
      } else {
        modal.find(".loading").html('<span style="color:red">Authentication code invalid</span>');
      }

    });
  };

  return MyNXT;
}(MyNXT || {}, jQuery));