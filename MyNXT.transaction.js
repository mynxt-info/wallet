var MyNXT = (function (MyNXT, $) {
  var requestRunning = false;
  var adr = new NxtAddress();

  var modal = $("#sndModal");
  var modalHtml = modal.html();

  var sendNxtStep = 1;

  modal.on('show.bs.modal', function () {
    sendNxtStep = 1;
    modal.html(modalHtml);
  });

  var recipient;
  var recipientPublicKey;
  var amount;
  var fee;

  modal.on('click', '.send-nxt', function () {
    if (requestRunning) return;

    if (sendNxtStep === 1) {

      recipient = $("#tx_to").val();
      amount = $("#nm_amount").val();
      fee = $("#nm_fee").val();

      var error = '';
      if (recipient.length < 15) error = 'Please enter a valid recipient account';
      if (amount <= 0) error = 'Please enter an amount greater than 0';
      if (error) {
        return MyNXT.showError(modal, error);
      }

      MyNXT.hideError(modal);

      if (!adr.set(recipient)) {

        if (recipient.indexOf('NXT-') == 0) var prependNxt = true;

        if (adr.guess.length === 1) {
          var guess = prependNxt ? "NXT-" + adr.guess[0] : adr.guess[0];
          $("#send-error").html('The recipient address is malformed, did you mean: ' +
            '<span class="guess-address" style="font-weight: bold; cursor: pointer;" data-address="' + guess + '">' + adr.format_guess(guess, recipient) + '?</span>').show();
        } else {
          $("#send-error").html('The recipient address is malformed. Please double check').show();
        }

        return;
      }

      requestRunning = true;
      MyNXT.showBigLoadingBar(modal);

      var data = {
        "account": adr.account_id()
      };

      $.get('nxt?requestType=getAccount', data, function (data) {
        requestRunning = false;

        if (typeof data.errorCode === "undefined" || data.errorCode == 5) {
          var balance = 0;

          if (data.balanceNQT) {
            balance = BigNumber(data.balanceNQT).dividedBy(100000000).toNumber();
          }

          var password_div = '<form role="form" action="#" class="form-horizontal"><div class="form-group"><label for="tx_master_password" class="col-sm-4 control-label">Master Password</label><div class="col-sm-7"><input type="password" class="form-control master-password" id="tx_master_password" name="tx_master_password" placeholder="Enter your master password" autocomplete="off"><p class="help-block"><small>This operation requires you to enter your master password so we can decrypt your wallet in your browser. Your master password is never sent to our servers!</small></p></div></div>';

          var displayDiv = 'block';
          if(data.publicKey) displayDiv = 'none';

          password_div += '<div style="display: ' + displayDiv +'"><div class="form-group"><label for="publicKey" class="col-sm-4 control-label">Public Key</label><div class="col-sm-7"><input type="text" class="form-control" id="publicKey" name="publicKey" placeholder="Enter public key" autocomplete="off"><p class="help-block">Since the destination account is brand new, you need to provide its public key. Please ask the owner of the destination account to provide his public key number so you can complete this transaction</p></div></div>';
          password_div += '</form>';

          var message_html = "<div class='message alert alert-success'>The destination account <strong>" + recipient + "</strong> has a balance of <strong>" + balance + " NXT</strong>." +
            " Please confirm that you want to send <strong>" + amount + " NXT." + "</strong>" +
            "<br/>" +
            "The account used for sending is <strong><span class='nxt-address'>" + MyNXT.mainAccount + "</span></strong></div>";


          var footer_message_html = '<div class="col-xs-8 loading error"></div>' +
            '<div class="col-xs-4" id="footer_message_button">' +
            '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
            '<button type="button" class="btn btn-primary send-nxt" rel="' + message_html + '">Yes!</button>' +
            '</div>';

          $("#body_main").hide();
          $("#footer_main").hide();
          $("#body_message").html(message_html + password_div).show();
          $("#footer_message").html(footer_message_html).show();

          sendNxtStep = 2;
        } else {
          MyNXT.showError(modal, data.errorDescription);
        }
      });
    }

    if (sendNxtStep === 2) {
      if (requestRunning) return;
      requestRunning = true;
      MyNXT.showBigLoadingBar(modal);


      MyNXT.getEncryptedWallet(function () {
        requestRunning = false;

        var masterPassword = modal.find('.master-password').val();
        var recipientPublicKey = modal.find('#publicKey').val();

        // old wallet, need to convert
        if (MyNXT.walletVersion == 1) {
          var secretPhrase = MyNXT.decryptOldWallet(masterPassword);
          var accountId = nxtCrypto.getAccountId(secretPhrase);

          if (MyNXT.verifyAccountId(accountId)) {
            MyNXT.convertOldWalletToNew(masterPassword);

            MyNXT.walletVersion = 2;
          } else {
            return MyNXT.showError(modal, "Wrong master password");
          }
        }

        // new format
        if (MyNXT.walletVersion == 2) {

          try {
            MyNXT.decryptWallet(masterPassword);

            MyNXT.getMainAccountSecretPhrase();

            var secretPhrase = MyNXT.mainSecretPhrase;

            secretPhrase = converters.stringToHexString(secretPhrase);

            var publicKey = nxtCrypto.getPublicKey(secretPhrase);

            var data = {
              "publicKey": publicKey,
              "recipient": adr.account_id(),
              "amountNQT": BigNumber(amount).times(100000000).toNumber(),
              "feeNQT": BigNumber(fee).times(100000000).toNumber(),
              "deadline": 1440
            };

            if(recipientPublicKey) {
              data.recipientPublicKey = recipientPublicKey;
            }

            console.log(data);

            $.get('nxt?requestType=sendMoney', data, function (result) {
              console.log(result);
              if (typeof result.error === 'undefined' && typeof result.errorCode === 'undefined') {

                var unsignedTransactionBytes = result.unsignedTransactionBytes;

                // confirm the server returned valid bytes
                if (!MyNXT.confirmRecipient(unsignedTransactionBytes, adr.account_id())) {
                  return $('#body_message').html("Something went wrong. Your funds are still here. Please contact us at info@mynxt.info").show();
                }

                var signature = nxtCrypto.sign(unsignedTransactionBytes, secretPhrase);

                var transactionBytes = unsignedTransactionBytes.substr(0, 192) + signature + unsignedTransactionBytes.substr(320);

                var data = {
                  transactionBytes: transactionBytes
                };

                $.get('nxt?requestType=broadcastTransaction', data, function (result) {
                  requestRunning = false;

                  console.log(result);

                  if (typeof result.errorCode !== "undefined") {
                    MyNXT.showError(modal, result.errorDescription);
                  }

                  if (typeof result.transaction !== "undefined") {
                    var message_html = '<p>NXT has been sent!<br /><br />Transaction ID: ' + result.transaction + '</p>';
                  } else {
                    var message_html = '<p>Something went wrong on our side. Please try again later.</p>'
                  }

                  MyNXT.hideLoadingBar(modal);

                  $('#body_message').html(message_html).show();
                  $('#footer_message_button').html('<button type="button" class="btn btn-primary" data-dismiss="modal" id="ok">OK</button>');
                  $('#footer_message').show();
                  MyNXT.refreshBalance();
                });

              } else {
                if(result.errorDescription) {
                  MyNXT.showError(modal, result.errorDescription);
                } else {
                  MyNXT.showError(modal, result.error);
                }
              }
            });
          } catch (e) {
            MyNXT.showError(modal, "Wrong master password");
          }
        }
      });
    }
  });

  modal.on('click', '.guess-address', function () {
    $("#tx_to").val($(this).data('address'));

    $("#send-error").hide();
  });

  return MyNXT;
}(MyNXT || {}, jQuery));