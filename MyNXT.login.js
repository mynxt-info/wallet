var MyNXT = (function (MyNXT, $) {
  var requestRunning = false;

  $("#login").on('click', function () {
    MyNXT.login();
  });

  $('#frmLogin').find('input').on('keypress', function (e) {
    if (e.which == 13) {
      MyNXT.login();
    }
  });

  $(".google-authenticator").on('click', function () {
    MyNXT.validateGAuth();
  });

  MyNXT.login = function () {
    if (requestRunning) {
      return;
    }
    requestRunning = true;

    var loginButton = Ladda.create(document.querySelector('#login'));
    loginButton.start();

    var frmLogin = "#frmLogin";

    var data = {
      tx_email: $("#tx_email").val(),
      tx_login_password: $("#tx_login_password").val(),
      login: 1
    };

    $.post('api/login.php', data, function (result) {
      requestRunning = false;
      loginButton.stop();

      var errorMessage = $('.errormessage').hide();

      if (result.gauth) {
        return $('#googleAuthenticatorModal').modal({backdrop: 'static'})
      }
      if (result.logged_in === true) {
        loginButton.start();
        MyNXT.logInNewApi(function() {
          location.reload();
        });
      }

      if (result.error) {
        errorMessage.html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;</button>" + result.error).show(300);
      }
    });
  };

  MyNXT.validateGAuth = function () {
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
        MyNXT.logInNewApi(function () {
          location.reload();
        });
      } else {
        modal.find(".loading").html('<span style="color:red">Authentication code invalid</span>');
      }
    });
  };

  // temporary function to also validate the new API
  MyNXT.logInNewApi = function (callback) {
    var data = {
      email: $("#tx_email").val(),
      password: $("#tx_login_password").val()
    };

    $.post('api/0.1/auth', data, function (result) {
      console.log(result);
      if (result.status == "success") {
        callback();
      }
    });
  };

  return MyNXT;
}(MyNXT || {}, jQuery));