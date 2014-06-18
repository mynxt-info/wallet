// TODO: Remove PHPJS dependency for all functions

// base64 settings
base64.settings.char62 = "+";
base64.settings.char63 = "/";
base64.settings.pad = "=";
base64.settings.ascii = true;

function decryptMyNXTwallet(encrypted_wallet, master_salt, master_password) {
    var user_key, secretPhrase;
    user_key = asmCrypto.PBKDF2_HMAC_SHA256.hex(master_password, master_salt, 1499, 32);
    user_key = pack("H*", user_key);

    secretPhrase = strtr(encrypted_wallet, '-_,', '+/=');
    secretPhrase = base64.decode(secretPhrase);
    secretPhrase = mcrypt.Decrypt(secretPhrase, null, user_key, "rijndael-128", 'ecb');

    return secretPhrase;
}

function encryptMyNXTwallet(secretPhrase, master_salt, master_password) {
    var user_key, encrypted_wallet;
    user_key = asmCrypto.PBKDF2_HMAC_SHA256.hex(master_password, master_salt, 1499, 32);
    user_key = pack('H*', user_key);

    encrypted_wallet = mcrypt.Encrypt(secretPhrase, null, user_key, "rijndael-128", 'ecb');
    encrypted_wallet = base64.encode(encrypted_wallet);
    encrypted_wallet = strtr(encrypted_wallet, '+/=', '-_,');

    return encrypted_wallet;
}

function generateWallet(master_password) {

    var wallet_generated, encrypted_wallet, decrypted_wallet, secretPhrase, master_salt, account_id;

    // because an old bug when decrypting wallets we need to make sure we have no problem decrypting this new wallet
    wallet_generated = false;
    while(!wallet_generated) {
        secretPhrase = sjcl.random.randomWords(14,8);
        secretPhrase = sjcl.bitArray.clamp(secretPhrase, 400);
        secretPhrase = sjcl.codec.base64.fromBits(secretPhrase);

        master_salt = sjcl.random.randomWords(4,8);
        master_salt = sjcl.codec.base64.fromBits(master_salt);

        secretPhrase = strtr(secretPhrase, '+/=', '-_,');
        account_id = nxtCrypto.getAccountId(secretPhrase);

        master_salt = strtr(master_salt, '+/=', '-_,');

        encrypted_wallet = encryptMyNXTwallet(secretPhrase, master_salt, master_password);

        decrypted_wallet = decryptMyNXTwallet(encrypted_wallet, master_salt, master_password);

        wallet_generated = (decrypted_wallet.substr(0,68) == secretPhrase);
    }

    return {
        encrypted_wallet: encrypted_wallet,
        master_salt: master_salt,
        account_id: account_id
    }
}

function confirmRecipient(unsignedTransactionBytes, recipient) {
    return nxtCrypto.byteArrayToBigInteger(converters.hexStringToByteArray(unsignedTransactionBytes.substr(80,16))).toString() == recipient;
}