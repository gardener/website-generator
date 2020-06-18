$(document).ready(function(){
    // Initialize featured box slider, if any on the page
    var slickSettings = {
        mobileFirst: true,
        dots: false,
        adaptiveHeight: false,
        speed: 800,
        slidesToShow: 1,
        // nextArrow: "<button type=\"button\" class=\"slick-next\"><span class=\"icon-arrow-next\"></span></button>",
        // prevArrow: "<button type=\"button\" class=\"slick-prev \"><span class=\"icon-arrow-prev\"></span></button>",
        responsive: [
            {
                breakpoint: 1000,
                settings: {
                slidesToShow: 3,
                slidesToScroll: 3
                }
            },
            {
                breakpoint: 600,
                settings: {
                slidesToShow: 2,
                slidesToScroll: 2
                }
            }]
      };
    
    $('.featured ul.tiles').slick(slickSettings);
    
    // Reslick only if it's not slick()
    $(window).on('resize', function() {
        if (!$('.featured ul.tiles').hasClass('slick-initialized')) {
        return $('.featured ul.tiles').slick(slickSettings);
        }
    });
})