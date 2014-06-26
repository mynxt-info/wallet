var requestRunning = false;

$(document).ready(function () {

    var backupWalletStep = 1, secret_phrase, master_salt;

    function backup_wallet() {
        if (requestRunning) {
            return;
        }

        requestRunning = true;
        $(".loading").html('<img src="./img/ajax-loader.gif">').show();
        if (backupWalletStep === 1) {
            var data = {
                "getEncryptedWallet": 1,
                "backup": 1
            };

            // get the encrypted wallet from the server
            $.get('api/settings.php', data, function (data) {
                requestRunning = false;
                $(".loading").html('');

                if (typeof data.error !== "undefined") {
                    $(".loading").html('<span style="color:red">Error retrieving wallet from the server.</span>');
                } else if (typeof data.encrypted_wallet !== "undefined" && typeof data.master_salt !== "undefined") {
                    var account_id;

                    master_salt = data.master_salt;

                    secret_phrase = decryptMyNXTwallet(data.encrypted_wallet, master_salt, $("#tx_master_password").val());
                    account_id = nxtCrypto.getAccountId(secret_phrase.substr(0, 68));

                    // compare decrypted secret phrase's account id with the own belonging to this account
                    if (account_id === $("body").data('account-id')) {
                        backupWalletStep = 2;

                        var backup_wallet_body_message = $("#backup_wallet_body_message");

                        $("#backup_wallet_body_main").hide();
                        $("#backup_wallet_footer_main").hide();
                        backup_wallet_body_message.show();
                        $("#backup_wallet_footer_message").show();

                        var backupWalletButton = $(".backup-wallet");
                        backupWalletButton.addClass('disabled');


                        backup_wallet_body_message.on('change', '#backup-wallet', function () {
                            var backupWalletCheckbox = $("#backup-wallet");

                            if (backupWalletCheckbox.prop('checked')) {
                                backupWalletButton.removeClass('disabled');
                            } else {
                                backupWalletButton.addClass('disabled');
                            }
                        });

                    } else {
                        $(".loading").html('<span style="color:red">Error decrypting your wallet. Please check your master password.</span>');
                    }
                }
            });
        }

        if (backupWalletStep === 2) {
            var backup;

            requestRunning = false;
            $(".loading").html('');

            backup = generateBackup(secret_phrase, master_salt, $("#tx_master_password").val());

            try {
                var isFileSaverSupported = !!new Blob();
            } catch (e) {
            }

            if (isFileSaverSupported) {
                var blob = new Blob([backup], {type: "text/plain;charset=utf-8"});

                saveAs(blob, "wallet.json.aes");
            } else {
                var popup = window.open(null, null, "width=700,height=800,toolbar=0");

                popup.document.write('<!DOCTYPE html><html><head></head><body><p>Please save the following as wallet.json.aes:</p><br/><br/><div style="word-wrap:break-word;" >' + backup + '</div></body></html>');
            }

        }
    }


    $("#backupWalletModal").on('click', '.backup-wallet', function () {
        backup_wallet();
    });

    var backupWalletModal = $("#backupWalletModal").html();

    $('#backupWalletModal').on('show.bs.modal', function (e) {
        backupWalletStep = 1;
        $(".loading").html('');

        $("#backupWalletModal").html(backupWalletModal);

        $("#backup_wallet_body_main").show();
        $("#backup_wallet_footer_main").show();
        $('#backup_wallet_body_message').hide();
        $('#backup_wallet_footer_message').hide();
    });


});