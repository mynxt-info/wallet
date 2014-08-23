var MyNXT = (function (MyNXT, $) {
  base64.settings.char62 = "+";
  base64.settings.char63 = "/";
  base64.settings.pad = "=";
  base64.settings.ascii = true;

  MyNXT.generateIV = function () {
    var iv = sjcl.random.randomWords(3, 8);
    iv = sjcl.codec.base64.fromBits(iv);
    iv = MyNXT.strtr(iv, '+/=', '-_,');

    return iv;
  };

  MyNXT.generateSalt = function () {
    var salt = sjcl.random.randomWords(4, 8);
    salt = sjcl.codec.base64.fromBits(salt);
    salt = MyNXT.strtr(salt, '+/=', '-_,');

    return salt;
  };

  MyNXT.generateSecretPhrase = function () {
    var secretPhrase = sjcl.random.randomWords(14, 8);
    secretPhrase = sjcl.bitArray.clamp(secretPhrase, 400);
    secretPhrase = sjcl.codec.base64.fromBits(secretPhrase);
    secretPhrase = MyNXT.strtr(secretPhrase, '+/=', '-_,');

    return secretPhrase;
  };

  MyNXT.decryptOldWallet = function (masterPassword) {
    var user_key = asmCrypto.PBKDF2_HMAC_SHA256.hex(masterPassword, MyNXT.salt, 1499, 32);
    user_key = MyNXT.pack("H*", user_key);

    var secretPhrase = MyNXT.strtr(MyNXT.encryptedWallet, '-_,', '+/=');
    secretPhrase = base64.decode(secretPhrase);
    secretPhrase = mcrypt.Decrypt(secretPhrase, null, user_key, "rijndael-128", 'ecb');

    MyNXT.decryptedWallet = MyNXT.unpad(secretPhrase);
    return MyNXT.decryptedWallet;
  };

  MyNXT.decryptWallet = function (masterPassword) {
    try {
      var key = asmCrypto.PBKDF2_HMAC_SHA256.hex(masterPassword, MyNXT.salt, 1499, 32);
      key = MyNXT.pack("H*", key);

      var iv = MyNXT.encryptedWallet.substr(0, 16);

      var decryptedWallet = MyNXT.encryptedWallet.substr(16);
      decryptedWallet = MyNXT.strtr(decryptedWallet, '-_,', '+/=');
      decryptedWallet = base64.decode(decryptedWallet);
      decryptedWallet = mcrypt.Decrypt(decryptedWallet, iv, key, "rijndael-128", 'cbc');
      decryptedWallet = MyNXT.unpad(decryptedWallet);
      decryptedWallet = JSON.parse(decryptedWallet);

      MyNXT.decryptedWallet = decryptedWallet;

      console.log(decryptedWallet);

      return MyNXT.decryptedWallet;
    } catch (e) {
      return false;
    }
  };

  MyNXT.convertOldWalletToNew = function (masterPassword) {
    if (!MyNXT.decryptedWallet) return;

    MyNXT.decryptedWallet = {
      "user_id": "1",
      "version": "2",
      "accounts": [
        {
          "id": nxtCrypto.getAccountId(MyNXT.decryptedWallet),
          "password": MyNXT.decryptedWallet
        }
      ]
    };

    MyNXT.walletVersion = 2;

    return MyNXT.encryptWallet(masterPassword);
  };

  MyNXT.encryptWallet = function (masterPassword) {
    var wallet = MyNXT.decryptedWallet;

    for (var i = 0; i < wallet.accounts.length; i++) {
      var account = wallet.accounts[i];

      if (account.password == "") return;
    }

    wallet = JSON.stringify(wallet);


    var key = asmCrypto.PBKDF2_HMAC_SHA256.hex(masterPassword, MyNXT.salt, 1499, 32);
    key = MyNXT.pack("H*", key);

    var iv = MyNXT.generateIV();

    var encryptedWallet = mcrypt.Encrypt(wallet, iv, key, "rijndael-128", 'cbc');

    MyNXT.encryptedWallet = iv + MyNXT.strtr(base64.encode(encryptedWallet), '+/=', '-_,');

    MyNXT.decryptWallet(masterPassword);

    return MyNXT.encryptedWallet;
  };

  MyNXT.generateWallet = function (masterPassword) {
    var secretPhrase = sjcl.random.randomWords(14, 8);
    secretPhrase = sjcl.bitArray.clamp(secretPhrase, 400);
    secretPhrase = sjcl.codec.base64.fromBits(secretPhrase);

    var salt = sjcl.random.randomWords(4, 8);
    salt = sjcl.codec.base64.fromBits(salt);

    secretPhrase = MyNXT.strtr(secretPhrase, '+/=', '-_,');
    salt = MyNXT.strtr(salt, '+/=', '-_,');

    var accountId = nxtCrypto.getAccountId(secretPhrase);

    var wallet = {
      "user_id": "1",
      "version": "2",
      "accounts": [
        {
          "id": accountId,
          "password": secretPhrase
        }
      ]
    };

    MyNXT.decryptedWallet = wallet;
    MyNXT.salt = salt;
    MyNXT.mainAccount = accountId;

    return MyNXT.encryptWallet(masterPassword);
  };

  MyNXT.unpad = function (data) {
    data = CryptoJS.enc.Utf8.parse(data);
    // Shortcut
    var dataWords = data.words;

    // Unpad
    var i = data.sigBytes - 1;
    while (!((dataWords[i >>> 2] >>> (24 - (i % 4) * 8)) & 0xff)) {
      i--;
    }
    data.sigBytes = i + 1;

    return CryptoJS.enc.Utf8.stringify(data);
  };

  return MyNXT;
}(MyNXT || {}, jQuery));