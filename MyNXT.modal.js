var MyNXT = (function(MyNXT, $) {

    MyNXT.showMessage = function (modal, message) {
        modal = $(modal);

        modal.find('.modal-main').hide();
        modal.find('.modal-body.modal-message').html(message).show();
        modal.find('.modal-footer.modal-message').show();
    };

    return MyNXT;
}(MyNXT || {}, jQuery));