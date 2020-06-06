$(document).ready(function(){

  $(".records-total").text($('.list .tile').size());
    $('.records-shown').text($('.list .tile').size());

    var taxonomies = {
      level: {
        values: [{
          value: "Beginner"
        },
        {
          value: "Intermediate"
        },
        {
          value: "Advanced"
        }]
      },
      scope: {
        values: [{
          value: "app-developer",
          label: "Developer"
        },
        {
          value: "Operator"
        }]
      },
      category: {
        values: [
        {
          value: "authenticate",
          label: "Authentication",
        },
        {
          value: "Autoscaling",
        },
        {
          value: "CI/CD",
        },
        {
          value: "Database",
        },
        {
          value: "Debugging",
        },
        {
          value: "devop",
          label: "Devops",
        },
        {
          value: "Docker Registry",
        },
        {
          value: "Fails",
        },
        {
          value: "Getting Started",
        },
        {
          value: "Helm",
        },
        {
          value: "High Avalability",
        },
        {
          value: "kubectl",
        },
        {
          value: "Load Test",
        },
        {
          value: "Networking",
        },
        {
          value: "Operation",
          label: "Operations",
        },
        {
          value: "Security",
        },
        {
          value: "Services",
        },
        {
          value: "Setup",
        },
        {
          value: "Storage",
        }]
      }
    };

    const Levels = Object.freeze({"beginner": 1, "intermediate": 2, "advanced": 3});
    const Scopes = Object.freeze({"app-developer": {value: 1, label: "Developer"}, "operator": {value: 2, label: "Operator"}})

    var initTiles = function(){
      $(".tile").each(function(){
        var audience = Scopes[$(this).attr("data-filter-scope")];
        if(audience !== undefined){
          audience = audience.label || $(this).attr("data-filter-scope");
        }
        $(".audience", this).text(audience);
        var expertise = Scopes[$(this).attr("data-filter-level")];
        if(expertise !== undefined){
          expertise = expertise.label || $(this).attr("data-filter-level");
        }
        $(".level", this).text(expertise);
      })
    }
    initTiles();

    $(".combobox[data-filter-scope]", ".tutorials").combobox();
    $(".combobox[data-filter-scope]  #toggle", ".tutorials").on( "click", function() {
      $( ".combobox" ).toggle();
    });

    // control .collapsible controls block visiblity 
    // depending on the filters toggle button visibility
    function toggleCollapsible() {
      if (!$(".controls-collapse.toggle").is(":visible")) {
        $(".collapsible").show();
      } else {
        $(".collapsible").hide();
      }
    }

    function setupFilterFromUrl(){
      /* Preset filter if it is supplied as URL param */
      $('.docs .filters .control select').each(function(){ 
        var queryString = new URLSearchParams(window.location.search);
        var filter = queryString.get("filter-name");
        if($(this).attr("data-filter-scope") === filter) {
          var filterValue = queryString.get("filter-value");
          if(filterValue!==null && filterValue.length > 0){
            var filterOption = $("option[value^="+filterValue+"]", this);
            if (filterOption.length > 0) {
              var input = $(this).parent('.control').find('input');
              $(input).val($(filterOption).text());
              $(input).attr('data-filter-value', filterValue);
              $(input).filterControl().filter();
              if(!$(input).hasClass("active")){
                $(input).addClass("active");
              }
            }
          }
        }
      });
      /* Preset search value if supplied as URL param */
      $('.docs .control.search input').each(function(){ 
        var queryString = new URLSearchParams(window.location.search);
        if(!queryString.has("filter-name") && queryString.has("filter-value")){
          var filterValue = queryString.get("filter-value");
            $(this).val(filterValue);
            $(this).attr('data-filter-value', filterValue);
            $(this).filterControl().filter();
        }
      });
    }

    initFilterControls = function(){
      $('.docs .filters .control select').each(function(){  
        var scope = $(this).attr('data-filter-scope');
        var filter = $(this).attr('data-filter');
        if (filter && filter.trim().length > 0) {
          var taxonomy = taxonomies[scope];
          if (taxonomy){
            taxonomy.values.forEach(term => {
              $('<option value="'+term.value+'">'+(term.label || term.value)+'</option>').appendTo($(this));
            });
          }
        }
        $(this).parent('.control').find('input').each(function() {
          $(this).addClass("filter");
          $(this).attr('data-filter', filter);
          $(this).attr('data-filter-scope', scope);
        });
        $(this).on('comboboxselect', function(evt, ui){
          $("input[data-filter-scope]", ".tutorials").not($(this)).val('');
          var input = $(this).parent('.control').find('input');
          $(input).val(ui.item.label || ui.item.value);
          $(input).attr('data-filter-value', ui.item.value);
          $(input).filterControl().filter();
          if(!$(input).hasClass("active")){
            $(input).addClass("active");
          }
          return false;
        });
      });
      $("input[data-filter-scope]", ".tutorials").on('input', function(evt, ui){
        $(this).attr('data-filter-value', $(this).val());
      });

      // init and adapt filter controls visibility
      $(".controls-collapse.toggle").on("click", function(){
        $(this).toggleClass("active");
        $(".collapsible").toggle();
      });
      //toggleCollapsible();

      $("input[data-filter]").on('elements-filter:complete', function(evt, total, filtered, visible){
        $('.records-shown').text(visible);
        $('.records-total').text(total);
        $("input[data-filter]").not($(this)).val('');
        $('.docs .list section').show();
        hideSectionIfEmpty();
        var queryString = new URLSearchParams(window.location.search);
        queryString.set("filter-value",$(this).attr("data-filter-value"))
        if($(this).attr("data-filter-scope").indexOf("freetext") < 0) {
          queryString.set("filter-name",$(this).attr("data-filter-scope"));
        }
        if (history.pushState) {
          var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
          window.history.pushState({path:newurl},'',newurl);
        }
        return false;
      });
      
      $(".autocomplete[data-filter-scope]", ".tutorials").on('keyup', function(evt){
        var val = $(this).val();
        if ($(this).val().length < 1){
          $(this).attr('data-filter-value') = "";
        }
      });

      // relace filter buttons icons
      $(".ui-button").removeClass("ui-button-icon-only").children().remove();
      $(".ui-button").append('<span class="icon-arrow-down"></span>');

      setupFilterFromUrl();
      
      $("input[data-filter]").filterControl();
    }
    initFilterControls($(this));

    // hide sections that have no child tiles
    function hideSectionIfEmpty(){
      $('.docs .list section').each(function(){
        var els = $(".tile", this).filter(function(){
          return $(this).css('display') !== 'none';
        })
        if (els.length < 1) {
          $(this).addClass("hidden");
        } else {
          $(this).removeClass("hidden");
        }
      });
    }

    function parseMoment(date){
      return moment(date, "YYYY-MM-DD HH-mm-ss +Z");
    }

    function sortDates(sortOrder, a, b){
      if(parseMoment(a).isBefore(parseMoment(b))){
        if (sortOrder > 0)
          return 1;
        else 
          return -1
      } else if(parseMoment(a).isAfter(parseMoment(b))){
        if (sortOrder < 0)
          return -1;
        else 
          return 1
      }
      return 0;
    }

    /* Preset group sort if it is supplied as URL param */
    function sortFromUrl(){ 
      var queryString = new URLSearchParams(window.location.search);
      var sort = queryString.get("sort");
      var sortControl = $(".sort.by-category");;
      switch (sort) {
        case "category": {
          groupByAttribute("data-filter-category"); 
          sortControl = $(".sort.by-category");
          break;
        }
        case "level": {
          groupByAttribute("data-filter-level", function(level){
            return Levels[level.toLowerCase()]
          }, function(index){
            return Object.entries(Levels).find(v => (index == v[1]))[0]
          });
          sortControl = $(".sort.by-expertise");
          break;
        }
        case "scope": {
          groupByAttribute("data-filter-scope", function(scope){
            return Scopes[scope.toLowerCase()].value
          }, function(index){
            return Object.entries(Scopes).find(v => (index == v[1].value))[1].label
          });
          sortControl = $(".sort.by-audience");
          break;
        }
        case "publishdate": {
          groupByAttribute("data-filter-publishdate", function(date){
            return parseMoment(date).format("YYYY-MM");
          }, function(index){
            return moment(index, "YYYY-MM").format("MMMM YYYY");
          }, -1, sortDates);
          sortControl = $(".sort.by-publishdate");
          break;
        }
        case "name": {
          groupByName();
          sortControl = $(".sort.by-name");
          break;
        }
        default: {
          groupByAttribute("data-filter-category");
        }
      }
      hideSectionIfEmpty();
      $('.sort').removeClass("active");
      sortControl.addClass("active");
      $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
      // getting ready for support for asc/desc sort later on.
      var sortOrder=-1;
      var sortIcon = "sort";
        if (sortOrder > 0){
          sortIcon+="-asc";
        } else {
          sortIcon+="-desc"; 
        }
        $('svg.icon use', sortControl).attr("xlink:href", "../../images/icons/icons.svg#"+sortIcon);
    }

    // setup group sorting controls
    function initGorupSortingControls(){
      groupByClickHandler(".sort.by-category", "data-filter-category");
      groupByClickHandler(".sort.by-expertise", "data-filter-level", function(level){
        return Levels[level.toLowerCase()]
      }, function(index){
        return Object.entries(Levels).find(v => (index == v[1]))[0]
      });
      groupByClickHandler(".sort.by-audience", "data-filter-scope", function(scope){
        return Scopes[scope.toLowerCase()].value
      }, function(index){
        return Object.entries(Scopes).find(v => (index == v[1].value))[1].label
      });
      groupByClickHandler(".sort.by-publishdate", "data-filter-publishdate", function(date){
        return parseMoment(date).format("YYYY-MM");
      }, function(index){
        return moment(index, "YYYY-MM").format("MMMM YYYY");
      }, -1, sortDates);
      $(".sort.by-name").on("click", function(){
        var queryString = new URLSearchParams(window.location.search);
        queryString.set("sort","name")
        if (history.pushState) {
          var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
          window.history.pushState({path:newurl},'',newurl);
        }
        groupByName();
        hideSectionIfEmpty();
        $('.sort').removeClass("active");
        $(this).addClass("active");
        $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
        var sortIcon = "sort";
        //Getting ready for support for sort order asc/desc. Not there yet.
        var sortOrder=1;
        if (sortOrder > 0){
          sortIcon+="-asc";
        } else {
          sortIcon+="-desc"; 
        }
        $('svg.icon use', this).attr("xlink:href", "../../images/icons/icons.svg#"+sortIcon);
      });
      sortFromUrl();
    }
    initGorupSortingControls();

    // setup click handler for selector that invokes groupByAttribute
    function groupByClickHandler(selector, tileAttribute, toNumeric, fromNumeric, sortOrder, sortFunc){
      $(selector).on("click", function(){
        var queryString = new URLSearchParams(window.location.search);
        queryString.set("sort", tileAttribute.split("-")[2]);
        if (history.pushState) {
          var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
          window.history.pushState({path:newurl},'',newurl);
        }
        groupByAttribute(tileAttribute, toNumeric, fromNumeric, sortOrder, sortFunc);
        hideSectionIfEmpty();
        $('.sort').removeClass("active");
        $(this).addClass("active");
        $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
        var sortIcon = "sort";
        if (sortOrder===undefined){
          sortOrder = 1;
        }
        if (sortOrder > 0){
          sortIcon+="-asc";
        } else {
          sortIcon+="-desc"; 
        }
        $('svg.icon use', this).attr("xlink:href", "../../images/icons/icons.svg#"+sortIcon);
      });
    }
    
    // Sort numeric value asc/desc as instructed by sortOrder (> 0  = 'asc', < 0 = 'desc')
    function defaultSortFunc(sortOrder, a, b){
      return sortOrder > 0 ? a - b : 0 - (a - b);
    }

    // Sort and group using attribute for indexing (e.g. data-filter-scope)
    function groupByAttribute(attributeName, toIndex, fromIndex, sortOrder, sortFunc){
      var sectionTitles = {};
      var oldSections = [];
      if (sortOrder === undefined || sortOrder >= 0 || sortOrder === 'asc'){
        sortOrder = 1;
      } else {
        sortOrder = -1;
      }
      if (typeof sortFunc !== "function"){
        sortFunc = defaultSortFunc
      }
      var tiles = $('.list .tile').sort(function(a, b) {
        var _a = $(a).attr(attributeName).toUpperCase();
        var _b = $(b).attr(attributeName).toUpperCase();
        if (_a < _b) {
          return -1;
        }
        if (_a > _b) {
          return 1;
        }    
        return 0;
      }).each(function(){
        var oldSection = $(this).parents("section")[0];
        if(oldSections.indexOf(oldSection) < 0) {
          oldSections.push(oldSection);
        }
        var index = $(this).attr(attributeName);
        if (index !== undefined) {
          if (typeof toIndex == 'function'){
            index = toIndex(index);
          }
          if (sectionTitles[index] === undefined) {
            sectionTitles[index] = [];
          }
          sectionTitles[index].push($(this));
        }
      });
      var sortedIndex = Object.keys(sectionTitles).sort(sortFunc.bind(this, sortOrder));
      sortedIndex.forEach(function(index){
        var section = $("<section></section>")
          .append('<h3 class="title"></h3>')
          .append('<ul class="tiles"></ul>')
          .appendTo($(".list"));
        tiles = sectionTitles[index];
        tiles.forEach(function(tile){
          tile.detach().appendTo($(".tiles", section));
        });
        if (typeof fromIndex == 'function'){
          index = fromIndex(index);
        }
        section.find("h3").text(index);
      });
      oldSections.forEach(s => s.remove());      
    } 

    //by name
    function groupByName(asc){
      var sectionTitles = {};
      var oldSections = [];
      var tiles = $('.list .tile').sort(function(a, b) {
        var _a = $("h1", a).text().toUpperCase();
        var _b = $("h1", b).text().toUpperCase();
        if (_a < _b) {
          return -1;
        }
        if (_a > _b) {
          return 1;
        }    
        return 0;
      }).each(function(){
        var oldSection = $(this).parents("section")[0];
        if(oldSections.indexOf(oldSection)<0){
          oldSections.push(oldSection);
        }
        var indexLetter = $("h1", this).text().trim().toUpperCase().charAt(0);
        if (indexLetter !== undefined){
          if (sectionTitles[indexLetter] === undefined){
            sectionTitles[indexLetter] = [];
          }
          sectionTitles[indexLetter].push($(this));
        }
      });
      var sortedIndex = Object.keys(sectionTitles).sort(function(a, b){
        var a = a.toUpperCase();
        var b = b.toUpperCase();
        if (a < b) {
          return -1;
        }
        if (a > b) {
          return 1;
        }
        return 0;
      });
      sortedIndex.forEach(function(index){
        var section = $("<section></section>")
          .append('<h3 class="title"></h3>')
          .append('<ul class="tiles"></ul>')
          .appendTo($(".list"));
        section.find("h3").text(index);
        tiles = sectionTitles[index];
        tiles.forEach(function(tile){
          tile.detach().appendTo($(".tiles", section));
        });
      });
      oldSections.forEach(s => s.remove());
    }
});