var MyNXT = (function (MyNXT, $) {
  var requestRunning = false;

  var modal = $("#getPublicKeyModal");

  modal.on('click', ".generate-public-keys", function () {
    if (requestRunning) return;
    requestRunning = true;

    MyNXT.showBigLoadingBar(modal);

    MyNXT.getEncryptedWallet(function (result) {
      requestRunning = false;

      var masterPassword = modal.find('.master-password').val();

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

          MyNXT.createPublicKeys(function () {
            MyNXT.hideLoadingBar(modal);

            var message = "<p>Public keys created. Click OK to reload the page.</p>";

            modal.find('.modal-main').hide();

            modal.find('.modal-message').first().html(message);
            modal.find('.modal-message').show();

          });
        } catch(e) {
          MyNXT.showError(modal, "Wrong master password");
        }
      }
    });
  });

  modal.on('click', '.ok', function () {
    window.location.reload();
  });

  MyNXT.createPublicKeys = function (callback) {
    var accounts = MyNXT.decryptedWallet.accounts;

    var count = 0;
    for (var i = 0; i < accounts.length; i++) {
      var account = accounts[i];

      var secretPhrase = account.password;

      var secretPhraseHex = converters.stringToHexString(secretPhrase);

      if(nxtCrypto.getAccountId(secretPhrase) != account.id) continue;

      var data = {
        accountId: account.id,
        publicKey: nxtCrypto.getPublicKey(secretPhraseHex)
      };

      MyNXT.storeAccountId(data, function () {
        count++;

        console.log(count);
        console.log(accounts.length);

        if(count >= accounts.length) {
          callback();
        }
      });
    }
  };

  return MyNXT;
}(MyNXT || {}, jQuery));

$(document).ready(function () {
});