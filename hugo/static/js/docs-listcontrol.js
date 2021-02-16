function listcontrol(){

    function initComboboxFilter(filterName, contextElement) {
        if (contextElement === undefined) {
            contextElement = document
        }
        $(".combobox[data-filter-" + filterName + "]", contextElement).combobox();
        $(".combobox[data-filter-" + filterName + "]  #toggle", contextElement).on("click", function () {
            $(".combobox").toggle();
        })
    }

    // control .collapsible controls block visibility 
    // depending on the filters toggle button visibility
    function toggleCollapsible() {
        if (!$(".controls-collapse.toggle").is(":visible")) {
            $(".collapsible").show();
        } else {
            $(".collapsible").hide();
        }
    }

    function setupFilterFromUrl(controlElements, searchElement) {
        var queryString = new URLSearchParams(window.location.search);
        var filterName = queryString.get("filter-name");
        var filterValue = queryString.get("filter-value")
        /* Preset filter if it is supplied as URL param */
        if (controlElements === undefined) {
            controlElements = $(".filters .control select")
        }
        controlElements.each(function () {
            if ($(this).attr("data-filter-scope") === filterName) {
                var filterOption = $('option[value^="' + filterValue + '"]', this);
                if (filterOption.length > 0) {
                    var input = $(this).parent('.control').find('input');
                    $(input).val($(filterOption).text());
                    $(input).attr('data-filter-value', filterValue);
                    $(input).filterControl().filter();
                    if (!$(input).hasClass("active")) {
                        $(input).addClass("active");
                    }
                }
            }
        })
        /* Preset search value if supplied as URL param */
        if (searchElement === undefined) {
            searchElement = $(".control.search input")
        }
        searchElement.each(function () {
            var queryString = new URLSearchParams(window.location.search);
            if (!queryString.has("filter-name") && queryString.has("filter-value")) {
                var filterValue = queryString.get("filter-value");
                $(this).val(filterValue);
                $(this).attr('data-filter-value', filterValue);
                $(this).filterControl().filter();
            }
        });
    }

    function initFilterControls(filterTaxonomies, contextElement) {
        $('.filters .control select', contextElement).each(function () {
            var scope = $(this).attr('data-filter-scope');
            var filter = $(this).attr('data-filter');
            if (filter && filter.trim().length > 0) {
                var taxonomy = filterTaxonomies[scope];
                if (taxonomy) {
                    taxonomy.values.forEach(term => {
                        $('<option value="' + term.value + '">' + (term.label || term.value) + '</option>').appendTo($(this));
                    });
                }
            }
            $(this).parent('.control').find('input').each(function () {
                $(this).addClass("filter");
                $(this).attr('data-filter', filter);
                $(this).attr('data-filter-scope', scope);
            });
            $(this).on('comboboxselect', function (evt, ui) {
                $("input[data-filter-scope]", contextElement).not($(this)).val('');
                var input = $(this).parent('.control').find('input');
                $(input).val(ui.item.label || ui.item.value);
                $(input).attr('data-filter-value', ui.item.value);
                $(input).filterControl().filter();
                if (!$(input).hasClass("active")) {
                    $(input).addClass("active");
                }
                return false;
            });
        });
        $("input[data-filter-scope]", contextElement).on('input', function (evt, ui) {
            $(this).attr('data-filter-value', $(this).val());
        });

        // init and adapt filter controls visibility
        $(".controls-collapse.toggle").on("click", function () {
            $(this).toggleClass("active");
            $(".collapsible").toggle();
        });
        //toggleCollapsible();

        $("input[data-filter]").on('elements-filter:complete', function (evt, total, filtered, visible) {
            $('.records-shown').text(visible);
            $('.records-total').text(total);
            $("input[data-filter]").not($(this)).val('');
            $('.list section', contextElement).show();
            hideSectionIfEmpty($('.list section', contextElement));
            var queryString = new URLSearchParams(window.location.search);
            queryString.set("filter-value", $(this).attr("data-filter-value"))
            if ($(this).attr("data-filter-scope").indexOf("freetext") < 0) {
                queryString.set("filter-name", $(this).attr("data-filter-scope"));
            } else {
                queryString.delete("filter-name");
            }
            if (history.pushState) {
                var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
                window.history.pushState({ path: newurl }, '', newurl);
            }
            return false;
        });

        $(".autocomplete[data-filter-scope]", contextElement).on('keyup', function (evt) {
            var val = $(this).val();
            if ($(this).val().length < 1) {
                $(this).attr('data-filter-value') = "";
            }
        });

        // replace filter buttons icons
        $(".ui-button").removeClass("ui-button-icon-only").children().remove();
        $(".ui-button").append('<span class="icon-arrow-down"></span>');

        setupFilterFromUrl($(".filters .control select", contextElement), $(".control.search input", contextElement));

        $("input[data-filter]").filterControl();
    }

    // hide sections that have no child tiles
    function hideSectionIfEmpty(sectionsEl) {
        sectionsEl.each(function () {
            var els = $(".tile", this).filter(function () {
                return $(this).css('display') !== 'none';
            })
            if (els.length < 1) {
                $(this).addClass("hidden");
            } else {
                $(this).removeClass("hidden");
            }
        });
    }

    function parseMoment(date) {
        return moment(date, "YYYY-MM-DD HH-mm-ss +Z");
    }

    function sortDates(sortOrder, a, b) {
        if (parseMoment(a).isBefore(parseMoment(b))) {
            if (sortOrder > 0)
                return 1;
            else
                return -1
        } else if (parseMoment(a).isAfter(parseMoment(b))) {
            if (sortOrder < 0)
                return -1;
            else
                return 1
        }
        return 0;
    }

    /* Preset group sort if it is supplied as URL param */
    function sortFromUrl(filtersConfig, listElement, sortElements) {
        let queryString = new URLSearchParams(window.location.search);
        let sort = queryString.get("sort");
        let filterNames = Object.keys(filtersConfig);
        let filterConfig = filtersConfig[sort];
        if (filterConfig === null || filterConfig === undefined) {
            filterNames.forEach(key=>{
                filterCfg = filtersConfig[key]
                if (filtersConfig[key].groupBy !== undefined && filtersConfig[key].groupBy.default){
                    filterConfig = filtersConfig[key].groupBy
                    sort = key
                }
            })
        } else {
            filterConfig = filterConfig.groupBy
        }
        if (typeof filterConfig === "function") {
            filterConfig()
        } else {
            let argsArr = [
                "data-filter-"+sort,
                filterConfig.toIndex,
                filterConfig.fromIndex,
                filterConfig.sortOrder,
                filterConfig.sortFunc
            ]
            groupByAttribute.apply(this, argsArr)
        }
        let sortControl = $(".sort.by-"+ sort);
        hideSectionIfEmpty(listElement);
        sortElements.removeClass("active");
        sortControl.addClass("active");
        $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
        // getting ready for support for asc/desc sort later on.
        let sortOrder = -1;
        let sortIcon = "sort";
        if (sortOrder > 0) {
            sortIcon += "-asc";
        } else {
            sortIcon += "-desc";
        }
        $('svg.icon use', sortControl).attr("xlink:href", "../../images/icons/icons.svg#" + sortIcon);
    }

    function initGroupByClickHandler(filtersConfig){
        var filterNames = Object.keys(filtersConfig);
        filterNames.forEach(key=>{
            filterCfg = filtersConfig[key]["groupByClickHandler"]
            if (filterCfg !== undefined && typeof filterCfg === "function") {
                $(".sort.by-"+key).on("click", filterCfg)
            } else {
                selector = ".sort.by-"+key;
                if (filterCfg !== undefined && filterCfg.selector !== undefined){
                    selector = filterCfg.selector
                }
                let argsArr = [
                    selector,
                    "data-filter-"+key
                ]
                if (filterCfg !== undefined) {
                    argsArr.push(filterCfg.toNumeric)
                    argsArr.push(filterCfg.fromNumeric)
                    argsArr.push(filterCfg.sortOrder)
                    argsArr.push(filterCfg.sortFunc)
                }
                groupByClickHandler.apply(this, argsArr)
            }            
        })
    }

    // setup group sorting controls
    function initGroupSortingControls(filtersConfig) {
        initGroupByClickHandler(filtersConfig)
        sortFromUrl(filtersConfig, $(".docs .list"), $(".sort"));
    }

    // setup click handler for selector that invokes groupByAttribute
    function groupByClickHandler(selector, tileAttribute, toNumeric, fromNumeric, sortOrder, sortFunc) {
        $(selector).on("click", function () {
            var queryString = new URLSearchParams(window.location.search);
            queryString.set("sort", tileAttribute.split("-")[2]);
            if (history.pushState) {
                var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
                window.history.pushState({ path: newurl }, '', newurl);
            }
            groupByAttribute(tileAttribute, toNumeric, fromNumeric, sortOrder, sortFunc);
            hideSectionIfEmpty($('.docs .list section'));
            $('.sort').removeClass("active");
            $(this).addClass("active");
            $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
            var sortIcon = "sort";
            if (sortOrder === undefined) {
                sortOrder = 1;
            }
            if (sortOrder > 0) {
                sortIcon += "-asc";
            } else {
                sortIcon += "-desc";
            }
            $('svg.icon use', this).attr("xlink:href", "../../images/icons/icons.svg#" + sortIcon);
        });
    }

    // Sort numeric value asc/desc as instructed by sortOrder (> 0  = 'asc', < 0 = 'desc')
    function defaultSortFunc(sortOrder, a, b) {
        return sortOrder > 0 ? a - b : 0 - (a - b);
    }

    /**
     * Sort and group using attribute for indexing (e.g. data-filter-scope)
     * 
     * @param {String} attributeName 
     * @param {Function} toIndex callback function transforming its single argument form value to index key
     * @param {Function} fromIndex callback function transforming its single argument from index key to value
     * @param {Number} sortOrder negative integers for desc, positive for asc
     * @param {Function} sortFunc 
     */
    function groupByAttribute(attributeName, toIndex, fromIndex, sortOrder, sortFunc) {
        var sectionTitles = {};
        var oldSections = [];
        if (sortOrder === undefined || sortOrder >= 0 || sortOrder === 'asc') {
            sortOrder = 1;
        } else {
            sortOrder = -1;
        }
        if (typeof sortFunc !== "function") {
            sortFunc = defaultSortFunc
        }
        var unsortableTiles = []
        var tiles = $('.list .tile').filter(function(idx, el){
            if ($(el).attr(attributeName) === undefined){
                unsortableTiles.push($(el))
                return false
            }
            return true
        }).sort(function (a, b) {
            var _a = $(a).attr(attributeName).toUpperCase();
            var _b = $(b).attr(attributeName).toUpperCase();
            if (_a < _b) {
                return -1;
            }
            if (_a > _b) {
                return 1;
            }
            return 0;
        }).each(function () {
            var oldSection = $(this).parents("section")[0];
            if (oldSections.indexOf(oldSection) < 0) {
                oldSections.push(oldSection);
            }
            var index = $(this).attr(attributeName);
            if (index !== undefined) {
                if (typeof toIndex == 'function') {
                    index = toIndex(index);
                }
                if (sectionTitles[index] === undefined) {
                    sectionTitles[index] = [];
                }
                sectionTitles[index].push($(this));
            }
        });
        var sortedIndex = Object.keys(sectionTitles).sort(sortFunc.bind(this, sortOrder));
        sortedIndex.forEach(function (index) {
            var section = $("<section></section>")
                .append('<h3 class="title"></h3>')
                .append('<ul class="tiles"></ul>')
                .appendTo($(".list"));
            tiles = sectionTitles[index];
            tiles.forEach(function (tile) {
                tile.detach().appendTo($(".tiles", section));
            });
            if (typeof fromIndex == 'function') {
                index = fromIndex(index);
            }
            section.find("h3").text(index);
        });
        oldSections.forEach(s => s.remove());
        if (unsortableTiles.length > 0) {
            var section = $("<section></section>")
            .append('<h3 class="title"></h3>')
            .append('<ul class="tiles"></ul>')
            .appendTo($(".list"));
            section.find("h3").text("Others");
            unsortableTiles.forEach(function (tile) {
                tile.detach().appendTo($(".tiles", section));
            });
            $("section .tiles").each(function(){
                if ($(this).children().length === 0) {
                    parentSection = $(this).parents("section")[0]
                    if (parentSection){
                        parentSection.remove()
                    }
                }
            })
        }
    }

    //by name
    function groupByName(asc) {
        var sectionTitles = {};
        var oldSections = [];
        var tiles = $('.list .tile').sort(function (a, b) {
            var _a = $("h1", a).text().toUpperCase();
            var _b = $("h1", b).text().toUpperCase();
            if (_a < _b) {
                return -1;
            }
            if (_a > _b) {
                return 1;
            }
            return 0;
        }).each(function () {
            var oldSection = $(this).parents("section")[0];
            if (oldSections.indexOf(oldSection) < 0) {
                oldSections.push(oldSection);
            }
            var indexLetter = $("h1", this).text().trim().toUpperCase().charAt(0);
            if (indexLetter !== undefined) {
                if (sectionTitles[indexLetter] === undefined) {
                    sectionTitles[indexLetter] = [];
                }
                sectionTitles[indexLetter].push($(this));
            }
        });
        var sortedIndex = Object.keys(sectionTitles).sort(function (a, b) {
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
        sortedIndex.forEach(function (index) {
            var section = $("<section></section>")
                .append('<h3 class="title"></h3>')
                .append('<ul class="tiles"></ul>')
                .appendTo($(".list"));
            section.find("h3").text(index);
            tiles = sectionTitles[index];
            tiles.forEach(function (tile) {
                tile.detach().appendTo($(".tiles", section));
            });
        });
        oldSections.forEach(s => s.remove());
    }

    // Public interface
    return {
        "setupFilterFromUrl": setupFilterFromUrl,
        "hideSectionIfEmpty": hideSectionIfEmpty,
        "initGroupSortingControls": initGroupSortingControls,
        "initComboboxFilter":initComboboxFilter,
        "initFilterControls": initFilterControls, 
        "sortedgroups": {
            "groupByClickHandler": groupByClickHandler,
            "groupByName": groupByName,
            "groupByAttribute": groupByAttribute,
            "defaultSortFunc": defaultSortFunc,
            "sortFromUrl": sortFromUrl,
            "sortDates": sortDates,
            "parseMoment": parseMoment
        }
    }
}