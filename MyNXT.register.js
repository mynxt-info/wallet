var MyNXT = (function (MyNXT, $) {
  var master_password, key_generated = false, wallet_data = {};

  $("#createWallet").click(function () {
    var error = "";

    if ($("#tx_email").val().trim().length === 0) {
      error += '<li> Please enter an email address</li>';
    }
    if ($("#tx_login_password").val() != $("#tx_login_password2").val()) {
      error += '<li> The login passwords are not the same</li>';
    }
    if ($("#tx_login_password").val().length < 6) {
      error += '<li> The login password is too short</li>'
    }

    if (error) {
      $('#main_registration').find('.msg_error').html(error).hide().show(300);
      return;
    }

    $('#rgModal').modal({backdrop: 'static'});


    if (!key_generated) {
      sjcl.random = new sjcl.prng(8);
      sjcl.random.startCollectors();

      try {
        var ab = new Uint32Array(32);
        window.crypto.getRandomValues(ab);
        sjcl.random.addEntropy(ab, 1024, 'crypto.getRandomValues');

        $("#register").removeClass('disabled');
      } catch (e) {
        $("#key-generation").show();
        sjcl.random.addEventListener('progress', function (progress) {
          var progress = (sjcl.random.getProgress(8) * 100);

          $(".progress-bar").css('width', progress + '%').attr('aria-valuenow', progress).html(progress.toFixed(0) + "%");
        });

        sjcl.random.addEventListener('seeded', function (bits) {
          key_generated = true;
          sjcl.random.stopCollectors();

          var key_message = "<p><strong>We've generated a strong key for you!</strong></p>";

          $("#key-generation").find(".help-block").html(key_message);
          $("#register").removeClass('disabled');
        });
      }
    }
  });

  $("#register").click(function () {
    //basic field validations
    var error = "";
    if ($("#tx_master_password").val() != $("#tx_master_password2").val()) {
      error += '<li> The master passwords are not the same</li>';
    }
    if ($("#tx_master_password").val().length < 8) {
      error += '<li> The master password is too short</li>'
    }
    if ($("#tx_master_password").val() === $("#tx_login_password").val()) {
      error += '<li> The master password should be different from the login password</li>';
    }
    if (error) {
      $('#msg_initial').hide();
      $('#main_body').find('.msg_error').html(error).hide().show(300);
    } else {
      $('#main_body').hide();
      $('#main_footer').hide();
      $('#loading_body').show();
      $('#close_button').hide();

      master_password = $("#tx_master_password").val();

      if (typeof wallet_data.encrypted_wallet === "undefined") {
        MyNXT.generateWallet(master_password); // generate a wallet encrypted by the master password
      }

      var secretPhrase = converters.stringToHexString(MyNXT.decryptedWallet.accounts[0].password);

      var walletData = {
        encrypted_wallet: MyNXT.encryptedWallet,
        master_salt: MyNXT.salt,
        account_id: MyNXT.mainAccount,
        public_key: nxtCrypto.getPublicKey(secretPhrase),
        recaptcha_challenge_field: $("#recaptcha_challenge_field").val(),
        recaptcha_response_field: $("#recaptcha_response_field").val(),
        tx_login_password: $("#tx_login_password").val(),
        tx_login_password2: $("#tx_login_password2").val(),
        referral: MyNXT.getCookie("referral"),
        tx_email: $("#tx_email").val()
      };

      $.post('api/register.php', walletData, function (data) {
        var data_clean = data.replace(/\W/g, '');
        if (data_clean == 'ok') {
          $('#loading_body').hide();
          $('#main_body').hide();
          $('#main_footer').hide();
          $('#success_body').show(300);
          $('#close_button').show();
        } else {
          Recaptcha.reload();
          $('#loading_body').hide();
          $('#main_body').show();
          $('#main_footer').show();
          $('#msg_initial').hide();
          $('#main_body').find('.msg_error').html(data).hide().show(300);
          $('#close_button').show();
        }
      });
    }
  });

  $('form:first *:input[type!=hidden]:first').focus();

  return MyNXT;
}(MyNXT || {}, jQuery));

$(document).ready(function () {
  var ua = navigator.userAgent;
  if (/chrome/i.test(ua)) {
    var uaArray = ua.split(' '),
        version = uaArray[uaArray.length - 2].substr(7);
  }
});