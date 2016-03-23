$(document).ready(function() {

    $(document).foundation();

    var keywords = {
        '#question-1': ['government', 'contract'],
        '#question-2': ['system', 'school', 'adults?', 'employment', 'community'],
        '#question-3': ['government', 'centrali[sz]ed', 'system', 'community', 'organi[sz]ation'],
        '#question-4': ['12 month', 'year', 'employment', 'young', 'people', '18', '22', 'increase', '40%'],
        '#question-5': ['secondary', 'school', 'teachers?', 'parents?', 'principals?'],
        '#question-6': ['community', 'service', 'providers?', 'initiatives?', 'systems?'],
        '#question-7': ['system', 'enables?', 'community', 'organi[sz]ations?', 'create', 'employment'],
        '#question-8': ['Peter', 'community', 'groups?', 'stakeholders?'],
        '#question-9': ['young', 'people', 'school', 'leavers?', 'secondary', 'teachers?', 'parents?', 'principals?', 'community', 'groups?']
    };

    $('#check').keyup(function(evt) {
        if (evt.keyCode == 13) {
            $(this).click();
        }
    }).on('click', function() {

        $('.question').removeClass('correct');
        $('.question').removeClass('incorrect');

        // Give a visual indicator that checking is being done
        var $check = $(this);
        var origHtml = $check.html();
        $check.html('Checking <i class="fa fa-spinner fa-spin"></i>');
        setTimeout(function() {
            for (var item in keywords) {
                var words = keywords[item];
                var $item = $(item);

                // Remove leading and trailing spaces from the answer given
                var answer = $item.find('.answer textarea').val();
                answer = answer.replace(/(^\s+)|(\s+$)/g, ''); 

                var regex = new RegExp('\\b' + words.join('\\b|') + '\\b', 'gim');
                if (regex.test(answer)) {
                    $item.addClass('correct');
                }
                else {
                    $item.addClass('incorrect');
                }
            }
            $check.html(origHtml);
        }, 1000);
    });

    $('#show').keyup(function(evt) {
        if (evt.keyCode == 13) {
            $(this).click();
        }
    }).on('click', function() {
        var $this = $(this);
        var $answers = $($this.attr('rel'));
        if ($answers.is(':visible')) {
            $answers.hide();
            $this.text('Show Answers');
        }
        else {
            $answers.show();
            $this.text('Hide Answers');
        }
    });
});
