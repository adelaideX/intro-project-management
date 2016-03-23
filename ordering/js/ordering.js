$(document).ready(function() {

    $(document).foundation({
        reveal : {
            animation : 'fade'
        }
    });

    // Populate the tasks list, starting from midnight tomorrow.
    var MS_IN_A_DAY = 1000*60*60*24;
    var START_DATE = new Date();
    START_DATE.setHours(0,0,0,0);
    var START_TIME = START_DATE.getTime() + MS_IN_A_DAY;

    var correct_tasks = [];
    $([
        {
            'desc': 'Prepare lot',
            'days': 3,
            'dependencies': [],
            'customClass': 'ganttGreen'
        },
        {
            'desc': 'Lay foundation',
            'days': 4,
            'dependencies': [1],
            'customClass': 'ganttGreen'
        },
        {
            'desc': 'Wall frames',
            'days': 10,
            'dependencies': [2],
            'customClass': 'ganttGreen'
        },
        {
            'desc': 'Roof frames',
            'days': 3,
            'dependencies': [3],
            'customClass': 'ganttOrange'
        },
        {
            'desc': 'Install plumbing',
            'days': 9,
            'dependencies': [3],
            'customClass': 'ganttOrange'
        },
        {
            'desc': 'Install wiring',
            'days': 7,
            'dependencies': [3],
            'customClass': 'ganttOrange'
        },
        {
            'desc': 'Exterior walls',
            'days': 7,
            'dependencies': [3],
            'customClass': 'ganttOrange'
        },
        {
            'desc': 'Cover roof',
            'days': 2,
            'dependencies': [4],
            'customClass': 'ganttRed'
        },
        {
            'desc': 'Interior walls',
            'days': 5,
            'dependencies': [5,6,7,8],
            'customClass': 'ganttRed'
        },
        {
            'desc': 'Finish interior',
            'days': 8,
            'dependencies': [8,9],
            'customClass': 'ganttRed'
        },
        {
            'desc': 'Finish exterior',
            'days': 5,
            'dependencies': [6,7,8],
            'customClass': 'ganttRed'
        },
        {
            'desc': 'Swimming pool',
            'days': 15,
            'dependencies': [11],
            'customClass': 'ganttGrey'
        },
        {
            'desc': 'Double garage',
            'days': 5,
            'dependencies': [11],
            'customClass': 'ganttGrey'
        },
        {
            'desc': 'Back pergola',
            'days': 3,
            'dependencies': [11],
            'customClass': 'ganttGrey'
        }
    ]).each(function(idx, task) {
        var from = START_TIME;
        var to = new Date(from + (task.days-1)*MS_IN_A_DAY).getTime();
        var newTask = {
            'name': '',
            'desc': task.desc,
            'idx': idx,
            'values': [{
                'from': from,
                'to': to,
                'label': task.days + ' days',
                'customClass': task.customClass,
                'dependencies': task.dependencies,
                'dataObj': null
            }]
        };

        newTask.values[0].dataObj = newTask;
        correct_tasks.push(newTask);
    });
    var shuffled_tasks = correct_tasks.slice();
    shuffle(shuffled_tasks);

    // http://stackoverflow.com/a/2450976/4302112
    function shuffle(array) {
        var currentIndex = array.length, temporaryValue, randomIndex ;

        // While there remain elements to shuffle...
        while (0 !== currentIndex) {
            // Pick a remaining element...
            randomIndex = Math.floor(Math.random() * currentIndex);
            currentIndex -= 1;

            // And swap it with the current element.
            temporaryValue = array[currentIndex];
            array[currentIndex] = array[randomIndex];
            array[randomIndex] = temporaryValue;
        }
        return array;
    }

    function move(array, old_index, new_index) {
        if (new_index < array.length) {
            array.splice(new_index, 0, array.splice(old_index, 1)[0]);
        }
        return array; // for testing purposes
    };

    // Render GANTT chart with above tasks list, and show total days
    function render_gantt(tasks, focus) {
        var $out_of_scope = $('#out-of-scope').hide();
        $(".gantt").gantt({
            source: tasks,
            navigate: "scroll",
            maxScale: "hours",
            itemsPerPage: tasks.length,
            onRender: function() {
                $('.gantt .bar').on('mousedown', start_move_task_y)
                                .on('touchstart', start_move_task_y)
                                .on('keydown', key_move_task)
                                .attr('tabindex', 0);
                $out_of_scope.show();

                if (!focus) focus = 0;
                $('.gantt .bar').get(focus).focus();
            }
        });
    }

    // Adjust each task's order to reflect the moved task
    function adjust_tasks(evt) {
        var deltaIdx = evt.data.delta_idx;
        if (!deltaIdx) return;

        // Move the current task
        var curIdx = evt.data.orig_idx;
        var newIdx = Math.min(Math.max(0, curIdx + deltaIdx), shuffled_tasks.length-1);
        move(shuffled_tasks, curIdx, newIdx);
        render_gantt(shuffled_tasks, newIdx);
    }

    // Get the page_y value from the given event,
    // whether it's a single finger touch or a mouse event.
    function get_page_y(evt) {
        if (evt.originalEvent instanceof TouchEvent) {
            var touches = evt.originalEvent.touches;
            if (touches.length == 1) {
                return evt.originalEvent.touches[0].pageY;
            } else {
                return null;
            }
        } else {
            return evt.pageY;
        }
    }

    // Return the floating point number from the given (px) string
    function get_pixels(str) {
        return parseFloat(str.replace(/px$/, ''));
    }

    // Handle click-and-drag events
    function move_task_y(evt) {
        var page_y = get_page_y(evt);
        if (page_y !== null) {

            // Enforce the min_y calculated from dependencies
            var data = evt.data;
            var y_final = Math.min(
                Math.max(data.orig_y + page_y - data.clicked_y, data.min_y),
                data.max_y);

            // Snap to the start of a task
            var day_height = get_pixels($('.day').css('width'));
            var y_snap = Math.round(y_final / day_height) * day_height;
            var delta_idx = Math.round((y_snap - data.orig_y) / day_height);

            $(data.element).css('top', y_snap + 'px');
            data.delta_idx = delta_idx;
            return false;
        }
    }
    function end_move_task_y(evt) {
        $(document).off('mousemove touchmove', move_task_y);
        $(document).off('mouseup touchend', end_move_task_y);
        move_task_y(evt);
        adjust_tasks(evt);
    }
    function start_move_task_y(evt) {
        // Ignore gestures
        var clicked_y = get_page_y(evt);
        if (clicked_y !== null) {
            var $element = $(this);
            var orig_y = get_pixels($element.css('top'));
            var day_height = get_pixels($('.day').css('height'));

            // Calculate the minimum and maximum y values
            var $bars = $('.gantt .bar');
            var min_y = get_pixels($bars.first().css('top'));
            var max_y = get_pixels($bars.last().css('top'))
                + $bars.last().height();
            var orig_idx = Math.floor((orig_y - min_y) / day_height);

            var data = {
                'orig_y': orig_y,
                'clicked_y': clicked_y,
                'min_y': min_y,
                'max_y': max_y,
                'element': $element,
                'orig_idx': orig_idx,
                'delta_idx': 0
            };
            $(document).on('mousemove touchmove', data, move_task_y);
            $(document).on('mouseup touchend', data, end_move_task_y);
        }
    }
    function key_move_task(evt) {
        var $element = $(this);
        var orig_y = get_pixels($element.css('top'));
        var day_height = get_pixels($('.day').css('height'));

        // Calculate the minimum and maximum y values
        var $bars = $('.gantt .bar');
        var min_y = get_pixels($bars.first().css('top'));
        var max_y = get_pixels($bars.last().css('top'))
            + $bars.last().height();
        var orig_idx = Math.floor((orig_y - min_y) / day_height);

        var data = {
            'orig_idx': orig_idx,
            'delta_idx': 0
        };
        switch (evt.which) {
            case 40: // down
            case 37: // left
                data.delta_idx = 1;
                break;

            case 38: // up
            case 39: // right
                data.delta_idx = -1;
                break;

            case 34: // page down: 10 days
                data.delta_idx = 10;
                break;

            case 33: // page up: -10 days
                data.delta_idx = -10;
                break;

            default:
                return;
        }

        // Move task by delta_idx
        evt.data = data;
        adjust_tasks(evt);
    }

    function check_dependencies(given_order, correct_order, grouping_only) {
        var correct = true;
        $(given_order).each(function(idx, gtask) {
            var ctask = correct_order[idx];

            // If only the grouping needs to be correct, then just check that
            var gclass = gtask.values[0].customClass;
            if (grouping_only.indexOf(gclass) >= 0) {
                var cclass = ctask.values[0].customClass;
                if (gclass !== cclass) {
                    correct = false;
                    return false;
                }
            }
            // Otherwise, check the task description
            else {
                var gdesc = gtask.desc;
                var cdesc = ctask.desc;
                if (gdesc !== cdesc) {
                    correct = false;
                    return false;
                }
            }
        });

        return correct;
    }

    // Render the GANTT chart with a randomised list of tasks
    render_gantt(shuffled_tasks);

    $('#check').keyup(function(evt) {
        if (evt.keyCode == 13) {
            $(this).click();
        }
    }).on('click', function() {
        var $feedbackWrapper = $('#feedback');

        // Give a visual indicator that checking is being done
        var $check = $(this);
        var origHtml = $check.html();
        $check.html('Checking <i class="fa fa-spinner fa-spin"></i>');
        setTimeout(function() {
            $check.html(origHtml);
            $feedbackWrapper.show();
        }, 1000);

        $feedbackWrapper.hide();
        var $feedback = $feedbackWrapper.find('.callout');
        var ok = check_dependencies(shuffled_tasks, correct_tasks, ['ganttOrange', 'ganttGrey']);
        if (!ok) {
            $feedback.html('Review the task dependencies below to help find the right sequence.');
            $feedback.addClass('warning');
            $feedback.removeClass('success');
        } else {
            $feedback.text('Well done!');
            $feedback.removeClass('warning');
            $feedback.addClass('success');
        }
    });

    $('#legend li').keyup(function(evt) {
        if (evt.keyCode == 13) {
            $(this).click();
        }
    }).on('click', function() {
        $(this).find('.fa,.tasks').toggle();
    });
});

