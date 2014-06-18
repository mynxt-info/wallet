var requestRunning = false;

$(document).ready(function () {
    var step = 1, public_key, secretPhrase, tx_to, nm_amount, nm_fee, master_salt, encrypted_wallet, master_password;

    /**
     * Refresh Balance
     */
    function refresh_balance() {
        $("#balance").html('<img src="./../img/ajax-loader_small.gif">')
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
        if (step === 1) {

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

            requestRunning = true;
            $(".loading").html('Please wait <img src="./../img/ajax-loader.gif">').show();

            var data = {
                "getEncryptedWallet": 1,
                "tx_to": tx_to,
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
                    var message_html = "<p class='message'>The destination account <strong>" + tx_to + "</strong> has a balance of <strong>" + recipient_balance + " NXT</strong>." +
                        " Please confirm that you want to send <strong>" + nm_amount + " NXT.</p>";

                    var footer_message_html = '<div class="col-xs-8 loading"></div>' +
                        '<div class="col-xs-4" id="footer_message_button">' +
                        '<button type="button" class="btn btn-default" data-dismiss="modal">Cancel</button>' +
                        '<button type="button" class="btn btn-primary send-nxt" rel="' + message_html + '">Yes!</button>' +
                        '</div>';

                    $("#body_main").hide();
                    $("#footer_main").hide();
                    $("#body_message").html(message_html + password_div).show();
                    $("#footer_message").html(footer_message_html).show();

                    step = 2;
                } else {

                    $(".loading").html('<span style="color:red">' + data.error + '</span>');

                }
            });
        }

        /**
         * Get the unsigned transaction bytes
         */
        if (step === 2) {

            master_password = $("#tx_master_password").val();

            secretPhrase = decryptMyNXTwallet(encrypted_wallet, master_salt, master_password);
            secretPhrase = converters.stringToHexString(secretPhrase);
            secretPhrase = secretPhrase.substr(0, 136);

            public_key = nxtCrypto.getPublicKey(secretPhrase);


            data = {
                "getTransactionBytes": 1,
                "tx_to": tx_to,
                "nm_amount": nm_amount,
                "nm_fee": nm_fee,
                "public_key": public_key
            };

            requestRunning = true;
            $("#footer_message .loading").html('Please wait <img src="./../img/ajax-loader.gif">');

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

                    // confirm the server returned valid bytes
                    if(!confirmRecipient(unsignedTransactionBytes, tx_to)) {
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
                        step = 1;



                    });
                }
            });
        }
    }

    $("#sndModal").on('click', '.send-nxt', function () {
        send_nxt();
    });

    $('#sndModal').on('show.bs.modal', function (e) {
        step = 1;
        $(".loading").html('');
        $("#body_main").show();
        $('#frmSend')[0].reset();
        $("#tx_confirmations").val('');
        $("#footer_main").show();
        $('#body_message').hide();
        $('#footer_message').hide();
    });

    $("#refresh").click(function () {
        refresh_balance();
    });

    $('.tooltip_show').tooltip();

    refresh_balance();
});