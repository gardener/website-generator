$(document).ready(function(){
	// Variables
	var $window = $(window);
	$window.sr = ScrollReveal({ reset: false});
	$window.sr.reveal('.reveal-fast', { duration: 2000 });
	$window.sr.reveal('.reveal-slow', { duration: 2500 });
	$window.sr.reveal('.reveal-right', { duration: 2000, origin:'right', distance:'30px' });
	$window.sr.reveal('.reveal-left', { duration: 2000, origin:'left', distance:'30px' });

})



$(window).load(function() {
	try {
		var $el, leftPos, newWidth;
		var $magicLine = $(".menu .menu-line");

		var calcMenuLine = function () {
			$magicLine
				.width($(".current_page_item").width())
				.css("left", $(".current_page_item a").position().left)
				.data("origLeft", $magicLine.position().left)
				.data("origWidth", $magicLine.width());
		}
		calcMenuLine();
		$(window).resize(calcMenuLine);
	}
	catch (exc){}


	$(".menu ul li a").hover(function() {
		$el = $(this);
		leftPos = $el.position().left;
		newWidth = $el.parent().width();
		$magicLine.stop().animate({
			left: leftPos,
			width: newWidth
		});
	}, function() {
		$magicLine.stop().animate({
			left: $magicLine.data("origLeft"),
			width: $magicLine.data("origWidth")
		});
	});

	// response menu at the top right menu bar starting 
	// on page-2
	$('.toggle-nav').click(function(e) {
		$(this).toggleClass('active');
		$('.menu ul').toggleClass('active');
		e.preventDefault();
	});

	$(document).scroll(function(e) {
		$('.menu .toggle-nav').addClass('active');
	   	$('.menu ul').addClass('active');
   });
   $(".page").click(function(e) {
		$('.menu .toggle-nav').addClass('active');
		$('.menu ul').addClass('active');
	});


	// reverse the z-index of all "page" elements to ensure that
	// the stacked page effect works well
	//
	var item_count = 1000;
	for( i = 0; i < item_count; i++ ){
		$('.page').eq( i ).css( 'z-index', item_count - (i*100) );
	}


	var height = 0;
	$(".page").each(function(){
		$this = $(this);
		height +=$this.outerHeight();
	})
	$("html").css({height:height});

	var controller = new ScrollMagic.Controller();	


	new ScrollMagic.Scene({
		triggerElement: "#page-1",
		triggerHook: 0,
		offset:10,
		duration:"200%"
	})
	.addTo(controller); // assign the scene to the controller


	// create a scene
	new ScrollMagic.Scene({
		triggerElement:  ".projectMembers",
		triggerHook: 0,
		offset:100,
		duration:"200%"
		})
	.addTo(controller); // assign the scene to the controller
	
	$(".page").each(function(){

		// create a scene
		new ScrollMagic.Scene({
			triggerElement: this,
			triggerHook: 0,
			offset:100,
			duration:"200%"
			})
		.addTo(controller); // assign the scene to the controller

		// create a scene
		new ScrollMagic.Scene({
			triggerElement: this,
			triggerHook: 0,
			offset: $(this).outerHeight()
		})
		.setClassToggle(this.nextElementSibling,"not-fixed")
		.addTo(controller); // assign the scene to the controller


		if(this.nextElementSibling.firstElementChild!==null){
			new ScrollMagic.Scene({
				triggerElement: this,
				triggerHook: 0.3,
				duration: "40%",
				offset: $(this).outerHeight()/2
			})
			.addTo(controller);
		}
	})

	$(document).on("click", "a[href^='#']", function (e) {
		var id = $(this).attr("href");
		if ($(id).length > 0) {
			e.preventDefault();

			// trigger scroll
			controller.scrollTo(id);

				// if supported by the browser we can even update the URL.
			if (window.history && window.history.pushState) {
				history.pushState("", document.title, id);
			}
		}
	});
});

