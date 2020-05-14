

$(document).ready(function () {
    
    // var iewarning = $('#IEWarning')
    // var ua = window.navigator.userAgent
    // var edge = ua.indexOf('Edge/')
    // var msie = ua.indexOf('MSIE ')
    // var trident = ua.indexOf('Trident/')

    // if (edge > 0 || msie > 0 || trident > 0) {
    //     iewarning.show()
    // }

    $(".toggle").click(function () {
        $(this).hide();
        $(this).parent().find(".pane").slideToggle("slow")
    })

    var newsSlickSettings = {
        mobileFirst: true,
        dots: false,
        adaptiveHeight: false,
        speed: 800,
        slidesToShow: 1,
        nextArrow: "<button type=\"button\" class=\"slick-next\"><span class=\"icon-arrow-next\"></span></button>",
        prevArrow: "<button type=\"button\" class=\"slick-prev \"><span class=\"icon-arrow-prev\"></span></button>",
        responsive: [
          {
            breakpoint: 1200,
            settings: {
              slidesToShow: 4,
              slidesToScroll: 4
            }
          },
            {
              breakpoint: 900,
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
    }

    var newsBoxes = $(".news-feed .news-box");
    newsSlickSettings.responsive.forEach(breakpoint => {
      if (newsBoxes.length <= breakpoint.settings.slidesToShow){
        breakpoint.settings = "unslick";
      }
    });

    $('#hero .news .news-feed').slick(newsSlickSettings);

    // Reslick only if it's not slick()
    $(window).on('resize', function() {
      if (!$('#hero .news ul').hasClass('slick-initialized')) {
        return $('#hero .news ul').slick(newsSlickSettings);
      }
    });

    // function initStickyNav() {
    //     // apply only to landing page second level navigation
    //     var mainNavLinks = document.querySelectorAll(".landingpage .main-navigation .navbar-list li a");
    //     if (!mainNavLinks.length) {
    //         return;
    //     }
    //     var bodySelector = document.getElementsByTagName("body")[0];
    //     var navbar = document.getElementById("sln-navbar");
    //     var navbarHeight = navbar.clientHeight;
    //     var headerHeight = document.getElementsByTagName("header")[0].clientHeight;
    //     var sticky = navbar.offsetTop;
        
    //     var stickyNavigation = function() {
    //         if (window.pageYOffset + headerHeight >= sticky) {
    //             bodySelector.classList.add("has-sticky-navigation");
    //         } else {
    //             bodySelector.classList.remove("has-sticky-navigation");
    //         }
    //     }

    //     window.onscroll = function() {
    //         stickyNavigation();
    //     };
    // }
    // initStickyNav();

    // setup search toggle
    // $(".search-box .nav-button.search")
    //     .click(function(evt){
    //         $(".navigation,body").toggleClass("search-active");
    //         $(".navigation .links").hide();
    //     });
    // $(".search-box .nav-button.close")
    //     .click(function(){
    //         $(".navigation,body").toggleClass("search-active");
    //         $(".navigation .links").fadeToggle("fast", "linear");
    //     });

    //collapsed TLN button
    // $(".navigation .navbar-toggler").click(function(evt){
    //     $(".navigation .navbar-collapse").toggle();
    //     $(".navigation").toggleClass("collapsed");
    //     $(".navigation .search-box").toggle();
    // })

})

