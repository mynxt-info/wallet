var MyNXT = (function (MyNXT, $) {
  MyNXT.explorerUrl = '//mynxt.info/api/0.1/public/index.php/';

  MyNXT.getTransactionHistory = function (accountId) {
    if (!accountId) accountId = MyNXT.mainAccount;

    var div = $("#transactionHistory");
    var body = div.find('tbody');

    MyNXT.showSmallLoadingBar(div);

    var url = MyNXT.explorerUrl + 'transactions';
    var data = {
      skip: 0,
      limit: 7,
      orderBy: 'nm_time DESC',
      accountId: accountId
    };

    $.get(url, data, function (result) {
      MyNXT.hideLoadingBar(div);

      console.log(result);

      if (result.data) {
        body.html('');

        var transactions = result.data;

        for (var i = 0; i < transactions.length; i++) {
          var transaction = transactions[i];

          var transactionId = transaction.tx_transaction_id;
          var from = transaction.tx_from;
          var to = transaction.tx_to;
          var amount = transaction.nm_amount;
          var age = transaction.nm_time;
          var sendArrow = (from == MyNXT.mainAccount) ? '<div class="glyphicon glyphicon-arrow-right" style="color:red"></div>' : '<div class="glyphicon glyphicon-arrow-right" style="color:green"></div>';

          var html = '<tr>' +
            '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=tx&tx=' + transactionId + '">' + transactionId + '</a></td>' +
            '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=ac&ac=' + from + '">' + from + '</a></td>' +
            '<td>' + sendArrow + '</td>' +
            '<td><a target="_blank" href="http://www.mynxt.info/blockexplorer/details.php?action=ac&ac=' + to + '">' + to + '</a></td>' +
            '<td>' + Number(amount).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + ' NXT</td>' +
            '<td>' + MyNXT.timeSince(age) + '</td>' +
            '</tr>';

          body.append(html);
        }

        return $('.tooltip_show').tooltip();

      }

      return body.html("<p>No transactions found for this account yet.</p>")
    });
  };

  return MyNXT;
}(MyNXT || {}, jQuery));