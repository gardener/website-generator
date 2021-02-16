"use strict";

$(document).ready(function () {
  $(".records-total").text($('.list .tile').size());
  $('.records-shown').text($('.list .tile').size());
  var taxonomies = {
    scope: {
      values: [{
        value: "app-developer",
        label: "Developer"
      }, {
        value: "Operator"
      }]
    },
    level: [],
    category: {
      values: [{
        value: "authenticate",
        label: "Authentication"
      }, {
        value: "devop",
        label: "Devops"
      }, {
        value: "Operation",
        label: "Operations"
      }]
    }
  };
  var Levels = Object.freeze({
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3
  });
  var Scopes = Object.freeze({
    "app-developer": {
      value: 1,
      label: "Developer"
    },
    "operator": {
      value: 2,
      label: "Operator"
    }
  });
  var FiltersConfig = [Levels, Scopes];
  var lists = listcontrol();

  function initTaxonomy(taxonomy, name) {
    $(".tile").each(function () {
      var cat = $(this).attr("data-filter-" + name);

      if (cat) {
        if (taxonomy.some(function (v) {
          return v.value == cat.toLowerCase();
        })) {
          return;
        }

        titleCase = [];
        cat.split(" ").forEach(function (v) {
          v = v.trim();

          if (v.length > 0) {
            titleCase.push(v.charAt(0).toUpperCase() + v.slice(1));
          }
        });
        label = titleCase.join(" ");
        taxonomy.push({
          value: cat.toLowerCase(),
          label: label
        });
      }
    });
  }

  taxonomies.category.values = [];
  initTaxonomy(taxonomies.category.values, "category");
  taxonomies.level.values = [];
  initTaxonomy(taxonomies.level.values, "level");
  filtersConfig = {
    "category": {
      "groupBy": {
        "default": true
      }
    },
    "level": {
      "groupBy": {
        "toIndex": function toIndex(level) {
          return Levels[level.toLowerCase()];
        },
        "fromIndex": function fromIndex(index) {
          return Object.entries(Levels).find(function (v) {
            return index == v[1];
          })[0];
        }
      },
      "groupByClickHandler": {
        "selector": ".sort.by-expertise",
        "toNumeric": function toNumeric(level) {
          return Levels[level.toLowerCase()];
        },
        "fromNumeric": function fromNumeric(index) {
          return Object.entries(Levels).find(function (v) {
            return index == v[1];
          })[0];
        }
      }
    },
    "audience": {
      "groupBy": {
        "toIndex": function toIndex(level) {
          return Levels[level.toLowerCase()];
        },
        "fromIndex": function fromIndex(index) {
          return Object.entries(Levels).find(function (v) {
            return index == v[1];
          })[0];
        }
      },
      "groupByClickHandler": {
        "toNumeric": function toNumeric(scope) {
          return Scopes[scope.toLowerCase()].value;
        },
        "fromNumeric": function fromNumeric(index) {
          return Object.entries(Scopes).find(function (v) {
            return index == v[1].value;
          })[1].label;
        }
      }
    },
    "scope": {
      "groupBy": {
        "toIndex": function toIndex(scope) {
          return Scopes[scope.toLowerCase()].value;
        },
        "fromIndex": function fromIndex(index) {
          return Object.entries(Scopes).find(function (v) {
            return index == v[1].value;
          })[1].label;
        }
      },
      "groupByClickHandler": {
        "selector": ".sort.by-audience",
        "toNumeric": function toNumeric(scope) {
          return Scopes[scope.toLowerCase()].value;
        },
        "fromNumeric": function fromNumeric(index) {
          return Object.entries(Scopes).find(function (v) {
            return index == v[1].value;
          })[1].label;
        },
        "sortOrder": -1,
        "sortFunc": lists.sortedgroups.sortDates
      }
    },
    // "publishdate": {
    //   "groupBy": {
    //     "toIndex": function (date) {
    //       return lists.sortedgroups.parseMoment(date).format("YYYY-MM");
    //     },
    //     "fromIndex": function (index) {
    //       return moment(index, "YYYY-MM").format("MMMM YYYY");
    //     },
    //     "sortOrder": -1,
    //     "sortFunc": lists.sortDates,
    //   },
    //   "groupByClickHandler": {
    //     "toNumeric": function (date) {
    //       return lists.sortedgroups.parseMoment(date).format("YYYY-MM");
    //     },
    //     "fromNumeric": function (index) {
    //       return moment(index, "YYYY-MM").format("MMMM YYYY");
    //     },
    //     "sortOrder": -1,
    //     "sortFunc": lists.sortedgroups.sortDates
    //   }
    // },
    "name": {
      "groupBy": lists.sortedgroups.groupByName,
      "groupByClickHandler": function groupByClickHandler() {
        var queryString = new URLSearchParams(window.location.search);
        queryString.set("sort", "name");

        if (history.pushState) {
          var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
          window.history.pushState({
            path: newurl
          }, '', newurl);
        }

        lists.sortedgroups.groupByName();
        lists.hideSectionIfEmpty($('.docs .list section'));
        $('.sort').removeClass("active");
        $(this).addClass("active");
        $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
        var sortIcon = "sort"; //Getting ready for support for sort order asc/desc. Not there yet.

        var sortOrder = 1;

        if (sortOrder > 0) {
          sortIcon += "-asc";
        } else {
          sortIcon += "-desc";
        }

        $('svg.icon use', this).attr("xlink:href", "../../images/icons/icons.svg#" + sortIcon);
      }
    }
  };
  lists.initTiles(["scope", "level"], FiltersConfig, $(".tile"));
  lists.initComboboxFilter("scope", $(".guides"));
  lists.initGroupSortingControls(filtersConfig);
  lists.initFilterControls(taxonomies); // control .collapsible controls block visibility 
  // depending on the filters toggle button visibility

  function toggleCollapsible() {
    if (!$(".controls-collapse.toggle").is(":visible")) {
      $(".collapsible").show();
    } else {
      $(".collapsible").hide();
    }
  }
});