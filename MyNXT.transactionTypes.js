  var MyNXT = (function(MyNXT, $) {

    MyNXT.getTransactionTypeTooltip = function (type, subtype, message) {

      type = Number(type);
      subtype = Number(subtype);

      switch(type) {
        // simple send
        case 0:
          return '<span class="glyphicon glyphicon-cloud-upload tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Simple send"></span>';
          break;

        case 1:
          switch(subtype) {
            // arbitrary message
            case 0:
              return '<span class="glyphicon glyphicon-comment tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" data-html="true" title="Arbitrary message:<br/> ' + message + '"></span>';
              break;
            // alias
            case 1:
              return '<span class="glyphicon glyphicon-tag tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Alias operation"></span>';
              break;
            // poll creation
            case 2:
              return '<span class="glyphicon glyphicon-thumbs-up tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Poll creation"></span>';
              break;
            // vote casting
            case 3:
              return '<span class="glyphicon glyphicon-thumbs-up tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Vote casting"></span>';
              break;
            // account info
            case 5:
              return '<span class="glyphicon glyphicon-info-sign tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Account info"></span>';
              break;
            case 6:
              return '<span class="glyphicon glyphicon-tag tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Alias operation"></span>';
            break;
            case 7:
              return '<span class="glyphicon glyphicon-tag tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Alias operation"></span>';
            break;

          }
          break;
        // assets
        case 2:
          return '<span class="glyphicon glyphicon-retweet tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Asset exchange operation"></span>';
          break;
        // goods store
        case 3:
          return '<span class="glyphicon glyphicon-shopping-cart tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Goods store operation"></span>';
          break;x

        case 4:
          switch(subtype) {
            case 0:
              return '<span class="glyphicon glyphicon-time tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Leased forging power"></span>';
              break;
          }
          break;

        default:
          return '';
          break;
      }
    };

    MyNXT.getTransactionDetails = function (data) {
      console.log(data);
      var type = parseInt(data.nm_type, 10);
      var subtype = parseInt(data.nm_subtype, 10);

      switch(type) {
        // simple send
        case 0:
          return '<span class="nxt-amount">' + data.nm_amount + '</span><span class="amount-currency"></span>';
          break;

        case 1:
          switch(subtype) {
            // arbitrary message
            case 0:
              return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
              break;
            // alias
            case 1:
              return '<a href="http://' + data.tx_alias +'.mynxt.info">' + data.tx_alias + '</a>';
              break;
            // poll creation
            case 2:
              return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
              break;
            // vote casting
            case 3:
              return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
              break;
            // account info
            case 5:
              return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
              break;
            default:
              return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
            break;
          }
          break;
        // assets
        case 2:
          return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
          break;
        // goods store
        case 3:
          return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
          break;

        case 4:
          switch(subtype) {
            case 0:
              return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
              break;
          }
          break;

        default:
          return '<a href="details.php?action=tx&tx=' + data.tx_transaction_id + '">more...</a>';
        break;
      }
    };

    return MyNXT;
  }(MyNXT || {}, jQuery));