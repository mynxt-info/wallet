var MyNXT = (function (MyNXT, $) {
  var month = [];
  month[0] = "Jan";
  month[1] = "Feb";
  month[2] = "Mar";
  month[3] = "Apr";
  month[4] = "May";
  month[5] = "Jun";
  month[6] = "Jul";
  month[7] = "Aug";
  month[8] = "Sep";
  month[9] = "Oct";
  month[10] = "Nov";
  month[11] = "Dec";

  var div = $("#transactionHistory");
  var tbody = div.find('tbody');

  MyNXT.explorerUrl = '//mynxt.info/api/0.1/public/index.php/';

  MyNXT.getUnconfirmedTransactions = function (accountId) {
    if (!accountId) accountId = MyNXT.mainAccount;

    var data = {
      account: accountId
    };

    $.get('nxt?requestType=getUnconfirmedTransactionIds', data, function (result) {
      if(result && result.unconfirmedTransactionIds) {
        var ids = result.unconfirmedTransactionIds;

        for(var i = 0; i < ids.length; i++) {
          var id = ids[i];
          var data = {
            transaction: id
          };
          $.get('nxt?requestType=getTransaction', data, function (transaction) {
            var transactionId = transaction.transaction;
            var from = transaction.senderRS;
            var to = transaction.recipient;
            var amount = BigNumber(transaction.amountNQT).dividedBy(100000000).toNumber();
            var age = transaction.timestamp;
            var date = new Date(age * 1000 + (1385294400 * 1000));

            var ageSpan = '<abbr class="nxtDate tooltip_show" ' +
              'data-toggle="tooltip" data-placement="top" title="' + MyNXT.timeSince(age) + ' ago at ' + date.toLocaleTimeString() + '">' +
              month[date.getMonth()] + ' ' + date.getDate() + '</abbr>';

            var toAdr = new NxtAddress();
            var fromAdr = new NxtAddress();
            toAdr.set(to);
            fromAdr.set(from);

            var sendArrow = (fromAdr.account_id() == MyNXT.mainAccount) ? '<div class="glyphicon glyphicon-arrow-right" style="color:red"></div>' : '<div class="glyphicon glyphicon-arrow-right" style="color:green"></div>';


            var html = '<tr class="danger">' +
              '<td>' + ageSpan + '</td>' +
              '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=ac&ac=' + fromAdr.account_id() + '">' + fromAdr.toString(true) + '</a></td>' +
              '<td>' + sendArrow + '</td>' +
              '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=ac&ac=' + toAdr.account_id() + '">' + toAdr.toString(true) + '</a></td>' +
              '<td>' + Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' NXT</td>' +
              '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=tx&tx=' + transactionId + '"><i class="glyphicon glyphicon-new-window"></i></a></td>' +
              '</tr>';

            tbody.prepend(html);
            $('.tooltip_show').tooltip();
          });
        }
      }
    });
  };

  MyNXT.getTransactionHistory = function (accountId) {
    if (!accountId) accountId = MyNXT.mainAccount;

    var url = MyNXT.explorerUrl + 'transactions';
    var data = {
      skip: 0,
      limit: 10,
      orderBy: 'nm_time DESC',
      accountId: accountId
    };

    $.get(url, data, function (result) {
      if (result.data && result.data.length > 0) {
        tbody.html('');

        var transactions = result.data;

        for (var i = 0; i < transactions.length; i++) {
          var transaction = transactions[i];

          var transactionId = transaction.tx_transaction_id;
          var from = transaction.tx_from;
          var to = transaction.tx_to;
          var amount = transaction.nm_amount;
          var age = transaction.nm_time;
          var date = new Date(age * 1000 + (1385294400 * 1000));
          var sendArrow = (from == MyNXT.mainAccount) ? '<div class="glyphicon glyphicon-arrow-right" style="color:red"></div>' : '<div class="glyphicon glyphicon-arrow-right" style="color:green"></div>';

          var ageSpan = '<abbr class="nxtDate tooltip_show" ' +
            'data-toggle="tooltip" data-placement="top" title="' + MyNXT.timeSince(age) + ' ago at ' + date.toLocaleTimeString() + '">' +
            month[date.getMonth()] + ' ' + date.getDate() + '</abbr>';

          var toAdr = new NxtAddress();
          var fromAdr = new NxtAddress();
          toAdr.set(to);
          fromAdr.set(from);

          var html = '<tr>' +
            '<td>' + ageSpan + '</td>' +
            '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=ac&ac=' + from + '">' + fromAdr.toString(true) + '</a></td>' +
            '<td>' + sendArrow + '</td>' +
            '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=ac&ac=' + to + '">' + toAdr.toString(true) + '</a></td>' +
            '<td>' + Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' NXT</td>' +
            '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=tx&tx=' + transactionId + '"><i class="glyphicon glyphicon-new-window"></i></a></td>' +
            '</tr>';

          tbody.append(html);
        }

        $('.tooltip_show').tooltip();
      } else {
        tbody.html("<p>No transactions found for this account yet.</p>")
      }
      MyNXT.getUnconfirmedTransactions();
    });
  };

  return MyNXT;
}(MyNXT || {}, jQuery));

$(document).ready(function () {
  setInterval(function () {
    MyNXT.refreshBalance();
    MyNXT.getTransactionHistory();
  }, 30000);
});