var MyNXT = (function (MyNXT, $) {

  MyNXT.getTransactionTypeTooltip = function (type, subtype) {

    type = Number(type);
    subtype = Number(subtype);

    switch (type) {
      // simple send
      case 0:
        return '<span class="glyphicon glyphicon-cloud-upload tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Simple send"></span>';
        break;

      case 1:
        switch (subtype) {
          // arbitrary message
          case 0:
            return '<span class="glyphicon glyphicon-comment tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Arbitrary message: "></span>';
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

        }
        break;
      // assets
      case 2:
        return '<span class="glyphicon glyphicon-retweet tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Asset exchange operation"></span>';
        break;
      // goods store
      case 3:
        return '<span class="glyphicon glyphicon-gift tooltip_show" style="color:#CCCCCC" data-toggle="tooltip"  data-placement="top" title="Goods store operation"></span>';
        break;

      case 4:
        switch (subtype) {
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

  return MyNXT;
}(MyNXT || {}, jQuery));