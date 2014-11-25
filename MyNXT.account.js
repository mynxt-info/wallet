var MyNXT = (function (MyNXT, $) {
  var requestRunning = false;

  var modal = $("#addAccountModal");
  var modalHtml = modal.html();

  var addAccountOption = 0;

  modal.on('show.bs.modal', function () {
    modal.html(modalHtml);
  });

  modal.on('change click', 'input[name=secretPhraseOptions]:radio', function () {
    var option = $(this).val();

    var generateSecretPhrase = modal.find("#generateSecretPhrase");
    var ownSecretPhrase = modal.find("#ownSecretPhrase");
    var progressBar = modal.find(".progress-bar");
    var confirmButton = modal.find("button.add-account");

    // generate secret phrase
    if (option == "option1") {

      confirmButton.addClass('disabled');
      ownSecretPhrase.hide();
      generateSecretPhrase.show();

      sjcl.random = new sjcl.prng(8);

      try {
        var ab = new Uint32Array(32);
        window.crypto.getRandomValues(ab);
        sjcl.random.addEntropy(ab, 1024, 'crypto.getRandomValues');

        addAccountOption = 1;
        return confirmButton.removeClass('disabled');
      } catch (e) {
        modal.find('#keyGeneration').show();

        sjcl.random.startCollectors();
        sjcl.random.addEventListener('progress', function () {
          var progress = (sjcl.random.getProgress(8) * 100);

          progressBar.css('width', progress + '%').attr('aria-valuenow', progress).html(progress.toFixed(0) + "%");
        });

        sjcl.random.addEventListener('seeded', function () {
          sjcl.random.stopCollectors();

          confirmButton.removeClass('disabled');
        });
      }
    }

    // own secret phrase
    if (option == "option2") {
      generateSecretPhrase.hide();
      ownSecretPhrase.show();
      confirmButton.removeClass('disabled');

      addAccountOption = 2;
    }

    console.log(addAccountOption);
  });


  modal.on('click', '.add-account', function () {
    if (requestRunning) return;
    requestRunning = true;
    var addAccButton = Ladda.create(document.querySelector('#addAccountModal').querySelector('.add-account'));
    addAccButton.start();

    MyNXT.getEncryptedWallet(function () {
      requestRunning = false;
      addAccButton.stop();

      if (addAccountOption === 1) {
        var masterPassword = modal.find('#generateSecretPhrase .master-password').val();
        var label = modal.find('#generateSecretPhrase .account-label').val();
      }
      if (addAccountOption === 2) {
        var masterPassword = modal.find('#ownSecretPhrase .master-password').val();
        var label = modal.find('#ownSecretPhrase .account-label').val();
      }

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

      if (!MyNXT.decryptWallet(masterPassword)) return MyNXT.showError(modal, "Wrong master password");

      MyNXT.hideError(modal);
      addAccButton.start();

      function storeAccount (result) {
        addAccButton.stop();

        if (result.status == "success") {
          var addedAccountId = result.data.tx_account_id;

          MyNXT.encryptWallet(masterPassword);

          MyNXT.storeWallet(function (result) {
            addAccButton.stop();

            if (result.status == "success") {
              var adr = new NxtAddress();
              adr.set(addedAccountId);

              MyNXT.showMessage(modal, "Successfully added account <strong>" + adr.toString(true) + "</strong>.");
            } else {
              MyNXT.showError(modal, "Couldn't store new account.");
            }

          });
        } else {
          MyNXT.showError(modal, "Couldn't store new account.");
        }
      }

      if (addAccountOption === 1) {
        MyNXT.addAccount(storeAccount);
      }

      if (addAccountOption === 2) {
        var secretPhrase = modal.find("#secret-phrase").val();

        if (secretPhrase.length < 1) return MyNXT.showError(modal, "Please enter a secret phrase");

        MyNXT.addAccount(storeAccount, secretPhrase);
      }
    });

  });

  MyNXT.verifyAccountId = function (accountId) {
    return accountId == MyNXT.mainAccount;
  };

  MyNXT.storeAccountId = function (data, callback) {
    $.post('api/0.1/user/account', data, function (result) {
      callback(result);
    });
  };

  MyNXT.addAccount = function (callback, secretPhrase) {
    if (!secretPhrase) {
      secretPhrase = MyNXT.generateSecretPhrase();
    }
    var accountId = nxtCrypto.getAccountId(secretPhrase);
    var account = {
      id: accountId,
      password: secretPhrase
    };

    if (MyNXT.decryptedWallet.accounts.push(account)) {
      var label = '';

      if (addAccountOption === 1) {
        label = modal.find('#generateSecretPhrase .account-label').val();
      }
      if (addAccountOption === 2) {
        label = modal.find('#ownSecretPhrase .account-label').val();
      }

      var secretPhraseHex = converters.stringToHexString(secretPhrase);
      var publicKey = nxtCrypto.getPublicKey(secretPhraseHex);

      MyNXT.accounts.push({ tx_account_id: accountId, tx_label: label, tx_public_key: publicKey });

      MyNXT.updateAccountList();

      var data = {
        accountId: accountId,
        publicKey: publicKey,
        label: label
      };

      MyNXT.storeAccountId(data, function (result) {
        callback(result);
      });
    }
  };

  return MyNXT;
}(MyNXT || {}, jQuery));

$(document).ready(function () {
  var path = window.location.pathname;

  if (path !== '/dashboard.php') return;

  MyNXT.getAccounts(function () {
    MyNXT.updateAccountList();
  });

  if (MyNXT.mainAccount && MyNXT.getTransactionHistory) {
    MyNXT.getTransactionHistory();
  }
});