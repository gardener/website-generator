"use strict";

function listpage(contextElement, tilesElement) {
  // control .collapsible controls block visibility 
  // depending on the filters toggle button visibility
  function toggleCollapsible() {
    if (!$(".controls-collapse.toggle").is(":visible")) {
      $(".collapsible").show();
    } else {
      $(".collapsible").hide();
    }
  }

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

  if (tilesElement === undefined) {
    tilesElement = $(".tile", contextElement);
  }

  $(".records-total").text(tilesElement.size());
  $('.records-shown').text(tilesElement.size());
  var taxonomies = {
    scope: {
      values: [{
        value: "app-developer",
        label: "Developer"
      }, {
        value: "Operator"
      }]
    },
    level: {},
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
  }; // init a taxonomy from tiles

  function initTaxonomy(taxonomy, name) {
    $(".tile").each(function () {
      var cat = $(this).attr("data-filter-" + name);

      if (cat) {
        if (taxonomy.some(function (v) {
          return v.value == cat.toLowerCase();
        })) {
          return;
        }

        var label = toTitleCase(cat);
        var entry = {
          value: cat.toLowerCase(),
          label: label
        };
        var existingEntry;

        if (!(existingEntry = taxonomy.find(function (v) {
          return v.value.toLowerCase() === cat.toLowerCase();
        }))) {
          taxonomy.push(entry);
        } else {
          Object.assign(existingEntry, entry);
        }
      }
    });
    return taxonomy;
  }

  initTaxonomy(taxonomies.category.values, "category");
  initTaxonomy(taxonomies.scope.values, "scope");
  taxonomies.level.values = []; // initialize and sort the level taxonomy in the right order (alphabetically is incorrect)

  taxonomies.level.values = initTaxonomy(taxonomies.level.values, "level").map(function (level) {
    switch (level.value.toLowerCase()) {
      case "beginner":
        level.index = 0;
        break;

      case "intermediate":
        level.index = 1;
        break;

      case "advanced":
        level.index = 2;
        break;
    }

    return level;
  }).sort(function (a, b) {
    return a.index - b.index;
  });
  var lists = listcontrol();

  function toIndexValue(taxonomyName, value) {
    return taxonomies[taxonomyName].values.find(function (v) {
      return value.toLowerCase() == v.value.toLowerCase();
    }).value;
  }

  function toIndexIndex(taxonomyName, value) {
    return taxonomies[taxonomyName].values.find(function (v) {
      return value.toLowerCase() == v.value.toLowerCase();
    }).index;
  }

  function fromIndexIndex(taxonomyName, index) {
    return taxonomies[taxonomyName].values.find(function (v) {
      return index == v.index;
    }).label;
  }

  function fromIndexValue(taxonomyName, index) {
    return taxonomies[taxonomyName].values.find(function (v) {
      return index == v.value;
    }).label;
  }

  function applyFilterConfigDefaults(filtersConfig) {
    var _this = this;

    Object.keys(filtersConfig).forEach(function (key) {
      fConfig = filtersConfig[key];

      if (!fConfig.groupBy) {
        fConfig.groupBy = {};
      }

      if (!fConfig.groupBy.fromIndex) {
        if (!fConfig.indexType) {
          fConfig.indexType = "string";
        }

        if (fConfig.indexType == "string") {
          fConfig.groupBy.fromIndex = fromIndexValue.bind(_this, key);
        } else if (fConfig.indexType == "numeric") {
          fConfig.groupBy.fromIndex = fromIndexIndex.bind(_this, key);
        } else if (fConfig.indexType == "date") {
          fConfig.groupBy.fromIndex = function (index) {
            return moment(index, "YYYY-MM").format("MMMM YYYY");
          };
        }
      }

      if (!fConfig.groupBy.toIndex) {
        if (!fConfig.indexType) {
          fConfig.indexType = "string";
        }

        if (fConfig.indexType == "string") {
          fConfig.groupBy.toIndex = toIndexValue.bind(_this, key);
        } else if (fConfig.indexType == "numeric") {
          fConfig.groupBy.toIndex = toIndexIndex.bind(_this, key);
        } else if (fConfig.indexType == "date") {
          fConfig.groupBy.toIndex = function (date) {
            return lists.sortedgroups.parseMoment(date).format("YYYY-MM");
          };
        }
      }

      if (!fConfig.groupByClickHandler) {
        fConfig.groupByClickHandler = {};
      }

      if (!fConfig.groupByClickHandler.fromNumeric) {
        if (!fConfig.indexType) {
          fConfig.indexType = "string";
        }

        if (fConfig.indexType == "string") {
          fConfig.groupByClickHandler.fromNumeric = fromIndexValue.bind(_this, key);
        } else if (fConfig.indexType == "numeric") {
          fConfig.groupByClickHandler.fromNumeric = fromIndexIndex.bind(_this, key);
        } else if (fConfig.indexType == "date") {
          fConfig.groupByClickHandler.fromNumeric = function (index) {
            return moment(index, "YYYY-MM").format("MMMM YYYY");
          };
        }
      }

      if (!fConfig.groupByClickHandler.toNumeric) {
        if (!fConfig.indexType) {
          fConfig.indexType = "string";
        }

        if (fConfig.indexType == "string") {
          fConfig.groupByClickHandler.toNumeric = toIndexValue.bind(_this, key);
        } else if (fConfig.indexType == "numeric") {
          fConfig.groupByClickHandler.toNumeric = toIndexIndex.bind(_this, key);
        } else if (fConfig.indexType == "date") {
          fConfig.groupByClickHandler.toNumeric = function (date) {
            return lists.sortedgroups.parseMoment(date).format("YYYY-MM");
          };
        }
      }
    });
    return filtersConfig;
  }

  filtersConfig = {
    "category": {
      "groupBy": {
        "default": true
      }
    },
    "level": {
      indexType: "numeric",
      "groupByClickHandler": {
        "selector": ".sort.by-expertise"
      }
    },
    "scope": {
      "groupByClickHandler": {
        "selector": ".sort.by-audience",
        "sortOrder": -1,
        "sortFunc": lists.sortedgroups.sortDates
      }
    },
    "publishdate": {
      indexType: "date",
      "groupBy": {
        "sortOrder": -1,
        "sortFunc": lists.sortDates
      },
      "groupByClickHandler": {
        "sortOrder": -1,
        "sortFunc": lists.sortedgroups.sortDates
      }
    },
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
  applyFilterConfigDefaults(filtersConfig);

  function setFilterAttribute($tile, filterName, filterTaxonomies) {
    filterVal = $tile.attr("data-filter-" + filterName);
    el = $("." + filterName, $tile);

    if (filterVal === undefined || el === undefined) {
      return;
    }

    var filterCfg;

    if (filterTaxonomies) {
      var taxonomy = filterTaxonomies[filterName];

      if (taxonomy) {
        taxonomy.values.forEach(function (cfg) {
          if (cfg.value.toLowerCase() === filterVal.toLowerCase()) {
            filterCfg = cfg;
            return;
          }
        });
      }
    }

    if (filterCfg !== undefined) {
      filterVal = filterCfg["label"] || filterCfg["value"] || filterVal;
    }

    el.text(filterVal);
  }
  /**
   * initTiles does data cleansing on the key attributes for
   * filtering grouping and sorting in the tiles.
   * 
   * @param {Array} filterNames
   * an array of strings matching the suffix in the 
   * data-filter-suffix attribute of the tiles. Each tile
   * will be inspected for presence of an attribute matching
   * each of the entries in the filters array
   * @param {Array} filtersConfig
   * an array of filter attribute replacement objects in the form
   * { key: value }, where , each featuring a
   * 'label' setting for the taxonomy elements, which will be applied
   * as text to the tiles if found 
   * @param {any} tilesElement
   * A jquery element for the tiles which will be initialized by
   * this function. Defaults to `$(".tile")`
   * @param {Function} setFilterAttributeFunc 
   * callback func($tile, filterName) where $tile is the tile 
   * element and filterName is the suffix in the data-filter-suffix 
   * attribute name pattern. Defaults to setFilterAttribute
   */


  var initTiles = function initTiles(filterNames, filterTaxonomies, tilesElement, setFilterAttributeFunc) {
    if (!tilesElement) {
      tilesElement = $(".tile");
    }

    if (setFilterAttributeFunc == undefined) {
      setFilterAttributeFunc = setFilterAttribute;
    }

    tilesElement.each(function () {
      tile = $(this);
      filterNames.forEach(function (filterName) {
        setFilterAttributeFunc(tile, filterName, filterTaxonomies);
      });
    });
  };

  initTiles(["scope", "level"], taxonomies, $(".tile"));
  lists.initComboboxFilter("scope", contextElement);
  lists.initGroupSortingControls(filtersConfig);
  lists.initFilterControls(taxonomies, contextElement);
}