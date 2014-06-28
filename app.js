var requestRunning = false;

$(document).ready(function () {
    var sendNxtStep = 1, public_key, secretPhrase, tx_to, nm_amount, nm_fee, master_salt, encrypted_wallet, master_password, adr = new NxtAddress();

    /**
     * Refresh Balance
     */
    function refresh_balance() {
        $("#balance").html('<img src="./img/ajax-loader_small.gif">')
        $("#balance_additional").hide()

        $.post("/get_balance.php", { i: $("#own_account_id").text() }, function (data) {
            var data_clean = data
            if (data_clean != 'error') {
                data_arr = data_clean.split(":");
                $('#balance').html(data_arr[0]);
                $('#balance_additional').html(data_arr[1] + ' BTC (USD ' + data_arr[2] + ')').show()
            } else {
                $('#balance').html('-');
                $('#balance_additional').html('Error fetching balance, please try again').show()
            }
        });
    }

    /**
     * Send NXT
     */
    function send_nxt() {
        if (requestRunning) {
            return;
        }


        /**
         * Get wallet
         */
        if (sendNxtStep === 1) {

            tx_to = $("#tx_to").val();
            nm_amount = $("#nm_amount").val();
            nm_fee = $("#nm_fee").val();

            //basic form checking
            var error = '';
            if (tx_to.length < 15)error = 'Please enter a valid recipient account';
            if (nm_amount < 1)error = 'Please enter an amount greater than 0';
            if (error) {
                $(".loading").html('<span style="color:red">' + error + '</span>');
                return;
            }

            if(!adr.set(tx_to)){

                if(tx_to.indexOf('NXT-') == 0) var prependNxt = true;

                if(adr.guess.length === 1) {
                    var guess = prependNxt ? "NXT-" + adr.guess[0] : adr.guess[0];
                    $("#send-error").html('The recipient address is malformed, did you mean: ' +
                        '<span class="guess-address" style="font-weight: bold; cursor: pointer;" data-address="' + guess +'">' + adr.format_guess(guess, tx_to) + '?</span>').show();
                } else {
                    $("#send-error").html('The recipient address is malformed. Please double check').show();
                }

                return;
            }

            requestRunning = true;
            $(".loading").html('<img src="./img/ajax-loader.gif">').show();

            var data = {
                "getEncryptedWallet": 1,
                "tx_to": adr.account_id(),
                "nm_amount": nm_amount,
                "nm_fee": nm_fee
            };

            $.get('api/send.php', data, function (data) {
                var recipient_balance;

                requestRunning = false;

                if (typeof data.error === "undefined") {
                    recipient_balance = data.recipient_balance;
                    master_salt = data.salt;
                    encrypted_wallet = data.encrypted_wallet;

                    var password_div = '<form role="form" action="#" class="form-horizontal"><div class="form-group"><label for="tx_master_password" class="col-sm-4 control-label">Master Password</label><div class="col-sm-7"><input type="password" class="form-control" id="tx_master_password" name="tx_master_password" placeholder="Enter your master password" autocomplete="off"><p class="help-block"><small>This operation requires you to enter your master password so we can decrypt your wallet in your browser. Your master password is never sent to our servers!</small></p></div></div></form>';
                    var message_html = "<div class='message alert alert-success'>The destination account <strong>" + tx_to + "</strong> has a balance of <strong>" + recipient_balance + " NXT</strong>." +
                        " Please confirm that you want to send <strong>" + nm_amount + " NXT.</div>";


                    var footer_message_html = '<div class="col-xs-8 loading"></div>' +
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

                    $(".loading").html('<span style="color:red">' + data.error + '</span>');

                }
            });
        }

        /**
         * Get the unsigned transaction bytes
         */
        if (sendNxtStep === 2) {

            master_password = $("#tx_master_password").val();

            secretPhrase = decryptMyNXTwallet(encrypted_wallet, master_salt, master_password);
            secretPhrase = converters.stringToHexString(secretPhrase);
            secretPhrase = secretPhrase.substr(0, 136);

            public_key = nxtCrypto.getPublicKey(secretPhrase);

            adr.set(tx_to);

            data = {
                "getTransactionBytes": 1,
                "tx_to": adr.account_id(),
                "nm_amount": nm_amount,
                "nm_fee": nm_fee,
                "public_key": public_key
            };

            requestRunning = true;
            $("#footer_message .loading").html('<img src="./img/ajax-loader.gif">');

            $.get('api/send.php', data, function (data) {
                requestRunning = false;

                console.log(data);

                if (typeof data.errorCode !== "undefined") {
                    var error = data.errorDescription;

                    if(data.errorCode == 5 && error == "Unknown account") {
                        error = "Cannot decrypt wallet. Please check your master password";
                    }

                    $(".loading").html('<span style="color:red">' + error + '</span>');
                }


                if (typeof data.unsignedTransactionBytes !== "undefined") {
                    var unsignedTransactionBytes = data.unsignedTransactionBytes, transactionBytes;

                    adr.set(tx_to);

                    // confirm the server returned valid bytes
                    if(!confirmRecipient(unsignedTransactionBytes, adr.account_id())) {
                        return $('#body_message').html("Our server got compromised. Your funds are still here. Please contact us at info@mynxt.info").show();
                    }

                    var signature = nxtCrypto.sign(unsignedTransactionBytes, secretPhrase);

                    transactionBytes = unsignedTransactionBytes.substr(0, 192) + signature + unsignedTransactionBytes.substr(320);

                    requestRunning = true;
                    $.get('api/send.php', { "broadcastTransaction": 1, "transactionBytes": transactionBytes }, function (data) {
                        console.log(data);

                        var message_html;
                        requestRunning = false;
                        console.log(data);

                        if (typeof data.errorCode !== "undefined") {
                            return $(".loading").html('<span style="color:red">' + error + '</span>');
                        }

                        if(typeof data.transaction !== "undefined") {
                            message_html = '<p>NXT has been sent!<br /><br />Transaction ID: ' + data.transaction.transaction + '</p>';
                        } else {
                            message_html = '<p>Something went wrong on our side. Please try again later.</p>'
                        }

                        $("#footer_message .loading").html('');

                        $('#body_message').html(message_html).show();
                        $('#footer_message_button').html('<button type="button" class="btn btn-primary" data-dismiss="modal" id="ok">OK</button>');
                        $('#footer_message').show();
                        refresh_balance();
                        sendNxtStep = 1;



                    });
                }
            });
        }
    }

    var changePwdStep = 1, secret_phrase, salt_generated, new_master_salt;

    /**
     * Change the master password
     */
    function change_master_password() {
        if (requestRunning) {
            return;
        }

        requestRunning = true;
        $(".loading").html('<img src="./img/ajax-loader.gif">').show();

        if(changePwdStep === 1) {
            var data = {
                "getEncryptedWallet": 1
            };

            // get the encrypted wallet from the server
            $.get('api/settings.php', data, function (data) {
                requestRunning = false;
                $(".loading").html('');
                console.log(data);

                if(typeof data.error !== "undefined") {
                    // error handling
                } else if(typeof data.encrypted_wallet !== "undefined" && typeof data.master_salt !== "undefined") {
                    var account_id;

                    secret_phrase = decryptMyNXTwallet(data.encrypted_wallet, data.master_salt, $("#tx_master_password_old").val());
                    account_id = nxtCrypto.getAccountId(secret_phrase.substr(0,68));

                    // compare decrypted secret phrase's account id with the own belonging to this account
                    if(account_id === $("#tx_account_id").val()) {
                        changePwdStep = 2;
                        $("#change_password_body_main").hide();
                        $("#change_password_footer_main").hide();
                        $("#change_password_body_message").show();
                        $("#change_password_footer_message").show();

                        $(".change-master-password").addClass('disabled');

                        sjcl.random = new sjcl.prng(8);
                        sjcl.random.startCollectors();

                        sjcl.random.addEventListener('progress', function(progress) {
                            var progress = (sjcl.random.getProgress(8) * 100);

                            $(".progress-bar").css('width', progress + '%').attr('aria-valuenow', progress).html(progress.toFixed(0) + "%");
                        });

                        sjcl.random.addEventListener('seeded', function() {
                            salt_generated = true;
                            sjcl.random.stopCollectors();

                            var key_message = "<p><strong>We've generated a strong salt for you!</strong></p>";

                            $("#key-generation").find(".help-block").html(key_message);
                            $(".change-master-password").removeClass('disabled');
                        });

                    } else {
                        $(".loading").html('<span style="color:red">Error decrypting your wallet. Please check your master password.</span>');
                    }
                }
            });
        }

        if(changePwdStep === 2) {
            var new_master_password1, new_master_password2;

            new_master_salt = sjcl.random.randomWords(4,8);
            new_master_salt = sjcl.codec.base64.fromBits(new_master_salt);
            new_master_salt = strtr(new_master_salt, '+/=', '-_,');

            new_master_password1 = $("#tx_master_password_new1").val();
            new_master_password2 = $("#tx_master_password_new2").val();

            var error = "";
            if(new_master_password1.length < 8) {
                error += '<li> The master password is too short</li>'
            }
            if(new_master_password1 !== new_master_password2) {
                error += '<li> The master passwords are not the same</li>'
            }

            if (error) {
                $('#msg_initial').hide()
                $('#change_password_body_message').find('.msg-error').html(error).hide().show(300);
                requestRunning = false;
                $(".loading").html('');
            } else {
                var newly_encrypted_wallet = encryptMyNXTwallet(secret_phrase, new_master_salt, new_master_password1);
                console.log(newly_encrypted_wallet);

                var data = {
                    "save_new_wallet": 1,
                    "encrypted_wallet": newly_encrypted_wallet,
                    "master_salt": new_master_salt
                };
                // store the new wallet
                $.post('api/settings.php', data, function (data) {
                    requestRunning = false;
                    $(".loading").html('');

                    if(data.status === "ok") {
                        var footer_html = '<div class="col-xs-7 loading"></div>' +
                            '<div class="col-xs-5"><button type="button" class="btn btn-primary" data-dismiss="modal" id="ok">OK</button></div>';

                        $('#change_password_body_message').html("Successfully changed master password.").show();
                        $('#change_password_footer_message').html(footer_html);
                        changePwdStep = 1;
                    }

                });
            }
        }
    }

    $("#sndModal").on('click', '.send-nxt', function () {
        send_nxt();
    });

    $("#sndModal").on('click', '.guess-address', function () {
        $("#tx_to").val($(this).data('address'));

        $("#send-error").hide();
    });

    $('#sndModal').on('show.bs.modal', function (e) {
        sendNxtStep = 1;
        $(".loading").html('');
        $("#body_main").show();
        $('#frmSend')[0].reset();
        $("#tx_confirmations").val('');
        $("#footer_main").show();
        $('#body_message').hide();
        $('#footer_message').hide();
    });

    $("#changeMasterPasswordModal").on('click', '.change-master-password', function () {
        change_master_password();
    });

    var changeMasterPasswordModalHtml = $("#changeMasterPasswordModal").html();

    $('#changeMasterPasswordModal').on('show.bs.modal', function (e) {
        changePwdStep = 1;
        $(".loading").html('');

        $("#changeMasterPasswordModal").html(changeMasterPasswordModalHtml);

        $("#change_password_body_main").show();
        $("#change_password_footer_main").show();
        $('#change_password_body_message').hide();
        $('#change_password_footer_message').hide();
    });

    $("#refresh").click(function () {
        refresh_balance();
    });

    $('.tooltip_show').tooltip();

    refresh_balance();
});
