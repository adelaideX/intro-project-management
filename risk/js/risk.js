$(document).ready(function() {

    $(document).foundation({
        reveal : {
            animation : 'fade'
        }
    });

    $('#check').keyup(function(evt) {
        if (evt.keyCode == 13) {
            $(this).click();
        }
    }).on('click', function() {

        var $feedback = $('#feedback').hide();

        // Give a visual indicator that checking is being done
        var $check = $(this);
        var origHtml = $check.html();
        $check.html('Checking <i class="fa fa-spinner fa-spin"></i>');
        setTimeout(function() {
            $check.html(origHtml);
            $feedback.show();
        }, 1000);

        $feedback.find('.feedback').hide();

        // Sum up the text boxes into a total score
        var total = 0, min_val = 1, max_val = 5;
        var $input = $('#questions tbody input[type=text]');
        $input.each(function(idx, item) {

            var $item = $(item);
            var val = parseInt($item.val(), 10);

            if (val) {
                if ((val >= min_val) && (val <= max_val )) {
                    total += val;
                    $item.removeClass('error');
                } else {
                    $item.addClass('error');
                }
            } else {
                $item.attr('placeholder', 'NA')
                     .addClass('error');
            }
        });

        if (total < ($input.size() * min_val)) {
            $('#risk-total').val('NA');
            $feedback.find('.feedback').hide();
            $feedback.find('.na').show();
        } else {
            $('#risk-total').val(total);

            $feedback.find('.feedback').hide()
                                       .each(function(idx, fb) {
                var $fb = $(fb);
                if (total <= parseInt($fb.attr('max-score'), 10)) {
                    $fb.show();
                    return false;
                }
            });
        }
    });
});
