$(document).ready(function() {

    $(document).foundation({
        reveal : {
            animation : 'fade'
        }
    });

    // Populate the tasks list, starting from midnight tomorrow.
    var MS_IN_A_DAY = 1000*60*60*24;
    // TC - Fix for time change bug
    var dateObj = new Date();
    var month = dateObj.getUTCMonth() + 1; //months from 1-12
    var day = dateObj.getUTCDate();
    var year = dateObj.getUTCFullYear();
    
    var START_DATE = new Date(Date.UTC(year,month,day));
    // TC - Fix for time change bug
    START_DATE.setHours(00,00,00);
    var START_TIME = START_DATE.getTime();
    var TARGET_DAYS = 39;
    var MIN_X = 0; 

    var tasks = [];
    var time = START_TIME;
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
        }
    ]).each(function(idx, task) {
        var from = time;
        var to = new Date(from + (task.days-1) * MS_IN_A_DAY).getTime();
        var name = idx+1 + '.';
        if (name.length < 3) {
            name = '&nbsp; ' + name;
        }
        var newTask = {
            'name': name,
            'desc': task.desc,
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
        tasks.push(newTask);
        time = new Date(to).getTime() + MS_IN_A_DAY;
    });

    // Render GANTT chart with above tasks list, and show total days
    function render_gantt() {
        $(".gantt").gantt({
            source: tasks,
            navigate: "scroll",
            maxScale: "hours",
            itemsPerPage: tasks.length,
            onRender: function() {
                $('.bar').on('mousedown touchstart', start_move_task)
                         .on('keydown', key_move_task)
                         .attr('tabindex', 0);

                // min_x is the left coord of the first task
                MIN_X = get_pixels($('.gantt .bar').css('left'));
            }
        });
        render_duration();
    }

    function render_duration() {
        $('#feedback').hide();
        var endTime = START_TIME;
        $(tasks).each(function(idx, task) {
            endTime = Math.max(endTime, task.values[0].to);
        });
        var totalDays = Math.round((endTime - START_TIME + MS_IN_A_DAY) / MS_IN_A_DAY);
        $('#duration').text("Total days: " + totalDays);

        return totalDays;
    }

    function render_dependencies() {
        $('.dependencies').html('<ol>');

        $(tasks).each(function(idx, task) {
            var $depul = $('<ul>');
            $(task.values[0].dependencies).each(function(idx, depId) {
                $depul.append($('<li>', {'text': tasks[depId-1].desc}));
            });
            var depLabel = '';
            if ($depul.children().size()) {
                depLabel += ' depends on';
            } else {
                depLabel += ' has no dependencies.';
            }
            $('.dependencies ol').append(
                $('<li>')
                    .append($('<span>', {'class': 'task-label', 'text': task.desc}))
                    .append($('<span>', {'class': 'text', 'text': depLabel}))
                    .append($depul)
            );
        });
    }

    // Adjust each task start/end dates to reflect the moved task
    function adjust_tasks(evt) {
        var deltaDays = evt.data.delta_days;
        if (!deltaDays) return;

        // Move the current task
        var curTask = evt.data.element.data("dataObj").values[0];
        curTask.from = new Date(curTask.from + MS_IN_A_DAY * deltaDays).getTime();
        curTask.to = new Date(curTask.to + MS_IN_A_DAY * deltaDays).getTime();

        // re-render the duration.
        render_duration();
    }


    // Get the page_x value from the given event,
    // whether it's a single finger touch or a mouse event.
    function get_page_x(evt) {
        if (window.TouchEvent && evt.originalEvent instanceof TouchEvent) {
            var touches = evt.originalEvent.touches;
            if (touches.length == 1) {
                return evt.originalEvent.touches[0].pageX;
            } else {
                return null;
            }
        } else {
            return evt.pageX;
        }
    }

    // Return the floating point number from the given (px) string
    function get_pixels(str) {
        return parseFloat(str.replace(/px$/, ''));
    }


    // Return the minimum from time for the given task
    function get_min_from(curTask) {
        var min_from = START_TIME;
        $.each(curTask.dependencies, function(idx, taskId) {
            var task = tasks[taskId-1].values[0];
            min_from = Math.max(min_from, task.to + MS_IN_A_DAY);
        });
        return min_from;
    }


    // Handle click-and-drag events
    function move_task(evt) {
        var page_x = get_page_x(evt);
        if (page_x !== null) {
       
            // Enforce the min_x calculated from dependencies
            var data = evt.data;
            var x_final = Math.max(data.orig_x + page_x - data.clicked_x, data.min_x);

            // Snap to the start of a day
            var day_width = get_pixels($('.day').css('width'))
            var x_snap = Math.round(x_final / day_width) * day_width;
            var delta_days = Math.round((x_snap - data.orig_x) / day_width);

            $(data.element).css('left', x_snap + 'px');
            data.delta_days = delta_days;
            return false;
        }
    }
    function end_move_task(evt) {
        $(document).off('mousemove touchmove', move_task);
        $(document).off('mouseup touchend', end_move_task);
        move_task(evt);
        adjust_tasks(evt);
    }
    function start_move_task(evt) {
        // Ignore gestures
        var clicked_x = get_page_x(evt);
        if (clicked_x !== null) {
            var $element = $(this);
            var orig_x = get_pixels($element.css('left'));

            var data = {
                'orig_x': orig_x,
                'clicked_x': clicked_x,
                'min_x': MIN_X,
                'element': $element,
                'delta_days': 0
            };
            $(document).on('mousemove touchmove', data, move_task);
            $(document).on('mouseup touchend', data, end_move_task);
        }
    }
    function key_move_task(evt) {
        var $element = $(this);
        var day_width = get_pixels($('.day').css('width'));
        var data = {
            'element': $element,
            'delta_days': 0
        };
        switch (evt.which) {
            case 40: // down
            case 37: // left
                data.delta_days = -1;
                break;

            case 38: // up
            case 39: // right
                data.delta_days = 1;
                break;

            case 34: // page down: -10 days
                data.delta_days = -10;
                break;

            case 33: // page up: 10 days
                data.delta_days = 10;
                break;

            default:
                return;
        }

        // Move task by delta_day
        var orig_x = get_pixels($element.css('left'));
        var x_snap = Math.max(MIN_X, orig_x + day_width * data.delta_days);
        $(data.element).css('left', x_snap + 'px');

        evt.data = data;
        adjust_tasks(evt);
    }

    // Render the GANTT chart
    render_gantt();
    render_dependencies();

    $('#check').keyup(function(evt) {
        if (evt.keyCode == 13) {
            $(this).click();
        }
    }).on('click', function() {
        var $feedback = $('#feedback').html('').hide();

        // Give a visual indicator that checking is being done
        var $check = $(this);
        var origHtml = $check.html();
        $check.html('Checking <i class="fa fa-spinner fa-spin"></i>');
        setTimeout(function() {
            $check.html(origHtml);
            $feedback.show();
        }, 1000);

        var daysOk = render_duration() <= TARGET_DAYS;
        var depOk = true;
        $(tasks).each(function(idx, task) {
            task = task.values[0];
            var min_from = get_min_from(task);

            if (task.from < min_from) {
                depOk = false;
                return false;
            }
        });

        if (depOk && daysOk) {
            $feedback.text('Correct!');
            $feedback.removeClass('warning');
            $feedback.addClass('success');
        } else {

            if (!daysOk) {
                $feedback.append($('<div>', { 'text': 'Almost, but you can still squeeze out a few more days.'}));
            }

            if (!depOk) {
                $feedback.append($('<div>', {'text':'Review the task dependencies below to help find the right sequence.'}));
            }

            $feedback.addClass('warning');
            $feedback.removeClass('success');
        }
    });
});

