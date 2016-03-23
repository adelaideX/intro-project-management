$(document).ready(function() {

    $(document).foundation({
        reveal : {
            animation : 'fade'
        }
    });

    $('.next, .prev').on('click', function() {

        var $this = $(this);
        var $pages = $('.page');
        var pageNum = $this.closest('.page').index();
        $pages.removeClass('active');

        if ($this.hasClass('prev')) {
            pageNum--;
        } else {
            pageNum++;
        }

        $($pages.get(pageNum)).addClass('active');
    });

    // Draw the chart based on the current scores
    var radarChart = null;
    function showChart(canvas, labels, scores) {

        var data = {
            'labels': labels,
            'datasets': [
                {
                    'label': "Typical Project Manager",
                    'fillColor':   "rgba(0, 159, 230, 0.2)",
                    'strokeColor': "rgba(0, 159, 230, 1)",
                    'pointColor':  "rgba(0, 159, 230, 1)",
                    'pointStrokeColor': "#fff",
                    'pointHighlightFill': "#fff",
                    'pointHighlightStroke': "rgba(220,220,220,1)",
                    'data': [86, 83, 67, 72, 93]
                },
                {
                    'label': "Your Results",
                    'fillColor':   "rgba(186, 46, 0, 0.2)",
                    'strokeColor': "rgba(186, 46, 0, 1)",
                    'pointColor':  "rgba(186, 46, 0, 1)",
                    'pointStrokeColor': "#fff",
                    'pointHighlightFill': "#fff",
                    'pointHighlightStroke': "rgba(151,187,205,1)",
                    'data': scores
                }
            ],
        };

        var config = {
            'scaleShowLabels': true,
            'scaleLabel' : "<%= value %>%",
            'scaleFontSize': 10,
            'scaleOverride': true,
            'scaleSteps': 5,
            'scaleStepWidth': 20,
            'scaleStartValue': 0,
            'multiTooltipTemplate': "<%= value %>%",
            'legendTemplate' : "<ul class=\"<%=name.toLowerCase()%>-legend\"><% for (var i=0; i<datasets.length; i++){%><li><span style=\"border-color:<%=datasets[i].strokeColor%>;background-color:<%=datasets[i].fillColor%>\"></span><%if(datasets[i].label){%><%=datasets[i].label%><%}%></li><%}%></ul>",
            'pointLabelFontSize': 16,
            'pointLabelLineHeight': 18,
            'pointLabelDelimiter': "\n"
        };

        // (Re)Create the radar chart
        if (radarChart) radarChart.destroy();
        var ctx = $(canvas).get(0).getContext("2d");
        radarChart = new Chart(ctx).Radar(data, config);

        $('#legend').html(radarChart.generateLegend());
    }

    function showFeedback(dimensions, feedback, scores) {
        var threshold = 75;
        var $dimensions = $(dimensions);
        var $feedback = $(feedback);

        $feedback.hide();
        $dimensions.hide();

        $(scores).each(function(idx, score) {
            if (score < threshold) {
                $($dimensions.get(idx)).show();
                $feedback.show();
            }
        });
    }

    $('#knowledgeable .next').on('click', function() {
        var labels = [];
        var scores = [];
        $('.page').each(function(idx, page) {

            var $page = $(page);
            var label = $page.find('h2').text();

            // split multiword labels with newlines every other word
            label = label.replace(/([^\s]*)\s([^\s]*)\s/, "$1 $2\n");

            var score = 0;
            var hasAnswers = false;
            $(page).find('.answer').each(function(idx, answer) {
                hasAnswers = true;
                score += parseFloat($(answer).val());
            });

            if (hasAnswers) {
                scores.push(score);
                labels.push(label);
            }
        });
        
        showChart('canvas', labels, scores);
        showFeedback('.feedback .detail', '.feedback', scores);
    });

    var min = 4;
    var max = 20;
    var slider_labels = [
        'Never',
        'Rarely',
        'Sometimes',
        'Often',
        'Always',
    ];
    var density = slider_labels.length;

    $('.answer').each(function(idx, slider) {
        $(slider).noUiSliderA11y({
            'step': 1,
            'animate': true,
            'start': min,
            'range': {
                'min': min,
                'max': max
            }
        });
        $(slider).noUiSlider_pips({
            'mode': 'steps',
            'density': density,
            'format': {to: function(value) {
                var numSteps = (max - min) / (density - 1);
                var idx = (value / numSteps) - 1;

                if (idx in slider_labels) {
                    return slider_labels[idx];
                }
                return '';
            }},
            'filter': function(value) {
                // labeled steps are large
                if (value % 4 == 0) {
                    return 1;
                }
                // remaining steps are small
                else {
                    return 0;
                }
            }
        });
    });
});
