(function ($) {
    $.fn.counter = function (options) {
        options = options || {};

        return $(this).each(function () {
            // set options for current element
            var settings = $.extend({}, $.fn.counter.defaults, {
                to:$(this).data('to')
            }, options);

            var loops= 20;
            var increment = settings.to / loops;

            var self = this,
                $self = $(this),
                loopCount = 0,
                value = 0,
                data = {};

            $self.data('counter', data);

            data.interval = setInterval(updateTimer, 100);
            render(value);

            function updateTimer() {
                value += increment;
                loopCount++;
                render(value);
                if (loopCount >= loops) {
                    $self.removeData('counter');
                    clearInterval(data.interval);
                    value = settings.to;
                }
            }

            function render(value) {
                var formattedValue = settings.formatter.call(self, value, settings);
                $self.html(formattedValue);
            }
        });
    };

    $.fn.counter.defaults = {
        to: 0,
        formatter: formatter
    };

    function formatter(value, settings) {
        return value.toFixed(0);
    }
}(jQuery));

jQuery(function ($) {
    $('.counter').data('counter', {
        formatter: function (value, options) {
            return value.toFixed(0).replace(/\B(?=(?:\d{3})+(?!\d))/g, ',');
        }
    });
});