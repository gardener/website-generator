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
        label: "DevOps"
      }, {
        value: "Operation",
        label: "Operations"
      }]
    }
  };
  /* Maps level strings to (numeric) sortable index keys used in grouping by level  */

  var Levels = Object.freeze({
    "beginner": 1,
    "intermediate": 2,
    "advanced": 3
  });
  /* Maps scope strings to composite index keys used in grouping by level. 
   * The composite's value property is the (numeric) sortable group index property 
   * and the label property the group display property
   */

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

        label = toTitleCase(cat);
        taxonomy.push({
          value: cat.toLowerCase(),
          label: label
        });
      }
    });
  }

  initTaxonomy(taxonomies.category.values, "category");
  taxonomies.level.values = [];
  initTaxonomy(taxonomies.level.values, "level");
  filtersConfig = {
    "category": {
      "groupBy": {
        "default": true,
        "toIndex": function toIndex(cat) {
          cat = cat.toLowerCase();
          return cat;
        },
        "fromIndex": function fromIndex(index) {
          return taxonomies.category.values.find(function (v) {
            return index == v.value;
          }).label;
        }
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
  lists.initTiles(["scope", "level"], [Levels, Scopes, taxonomies.category.values], $(".tile"));
  lists.initComboboxFilter("scope", $(".tutorials"));
  lists.initGroupSortingControls(filtersConfig);
  lists.initFilterControls(taxonomies, $(".docs .tutorials")); // control .collapsible controls block visibility 
  // depending on the filters toggle button visibility

  function toggleCollapsible() {
    if (!$(".controls-collapse.toggle").is(":visible")) {
      $(".collapsible").show();
    } else {
      $(".collapsible").hide();
    }
  }
});

function toTitleCase(str) {
  tokens = [];
  str.split(" ").forEach(function (v) {
    v = v.trim();

    if (v.length > 0) {
      tokens.push(v.charAt(0).toUpperCase() + v.slice(1));
    }
  });
  return tokens.join(" ");
}