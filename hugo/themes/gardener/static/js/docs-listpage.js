// listpage can be applied to DOM with certain structure as far as the filter and listed elements are concerned.
// An example can be found here: https://github.com/gardener/website-generator/blob/e6e29775569ca454123ac140df820a8f26f3c637/hugo/layouts/docs/guides-home.html
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
        tokens = []
        str.split(" ").forEach(function (v) {
            v = v.trim()
            if (v.length > 0) {
                tokens.push(v.charAt(0).toUpperCase() + v.slice(1))
            }
        })
        return tokens.join(" ")
    }

    if (tilesElement === undefined) {
        tilesElement = $(".tile", contextElement)
    }
    $(".records-total").text(tilesElement.size());
    $('.records-shown').text(tilesElement.size());

    var taxonomies = {
        scope: {
            values: [{
                value: "app-developer",
                label: "Developer",
            },
            {
                value: "Operator"
            }]
        },
        level: {},
        category: {
            values: [
                {
                    value: "authenticate",
                    label: "Authentication",
                },
                {
                    value: "devop",
                    label: "DevOps",
                },
                {
                    value: "Operation",
                    label: "Operations",
                },
            ]
        }
    };

    // init a taxonomy from tiles
    function initTaxonomy(taxonomy, name) {
        $(".tile").each(function () {
            let cat = $(this).attr("data-filter-" + name)
            if (cat) {
                if (taxonomy.some(v => v.value == cat.toLowerCase())) {
                    return
                }
                let label = toTitleCase(cat)
                let entry = {
                    value: cat.toLowerCase(),
                    label: label
                }
                let existingEntry;
                if (!(existingEntry=taxonomy.find(v=>{ return v.value.toLowerCase() === cat.toLowerCase()}))){
                    taxonomy.push(entry)
                } else {
                    Object.assign(existingEntry, entry);
                }
            }
        })
        return taxonomy
    }

    initTaxonomy(taxonomies.category.values, "category")
    initTaxonomy(taxonomies.scope.values, "scope")
    taxonomies.level.values = []
    // initialize and sort the level taxonomy in the right order (alphabetically is incorrect)
    taxonomies.level.values = initTaxonomy(taxonomies.level.values, "level").map(function(level){
        switch (level.value.toLowerCase()){
            case "beginner": level.index = 0; break;
            case "intermediate": level.index = 1; break;
            case "advanced": level.index = 2; break;
        }
        return level
    }).sort(function(a, b){
        return a.index - b.index
    })

    let lists = listcontrol()

    function toIndexValue(taxonomyName, value){
        return taxonomies[taxonomyName].values.find(v => (value.toLowerCase() == v.value.toLowerCase())).value;
    }
    function toIndexIndex(taxonomyName, value){
        return taxonomies[taxonomyName].values.find(v => (value.toLowerCase() == v.value.toLowerCase())).index
    }
    function fromIndexIndex(taxonomyName, index){
        return taxonomies[taxonomyName].values.find(v => (index == v.index)).label
    }
    function fromIndexValue(taxonomyName, index){
        return taxonomies[taxonomyName].values.find(v => (index == v.value)).label
    }
    function applyFilterConfigDefaults(filtersConfig){
        Object.keys(filtersConfig).forEach(key=>{
            fConfig = filtersConfig[key]
            if (!fConfig.groupBy){
                fConfig.groupBy = {}
            }
            if (!fConfig.groupBy.fromIndex){
                if (!fConfig.indexType){
                    fConfig.indexType = "string"
                }
                if (fConfig.indexType == "string"){
                    fConfig.groupBy.fromIndex = fromIndexValue.bind(this, key)                
                } else if (fConfig.indexType == "numeric"){
                    fConfig.groupBy.fromIndex = fromIndexIndex.bind(this, key)                
                } else if (fConfig.indexType == "date"){
                    fConfig.groupBy.fromIndex = function (index) {
                        return moment(index, "YYYY-MM").format("MMMM YYYY");
                    }
                }
            }
            if (!fConfig.groupBy.toIndex){
                if (!fConfig.indexType){
                    fConfig.indexType = "string"
                }
                if (fConfig.indexType == "string"){
                    fConfig.groupBy.toIndex = toIndexValue.bind(this, key)                
                } else if (fConfig.indexType == "numeric"){
                    fConfig.groupBy.toIndex = toIndexIndex.bind(this, key)                
                } else if (fConfig.indexType == "date"){
                    fConfig.groupBy.toIndex = function (date) {
                        return lists.sortedgroups.parseMoment(date).format("YYYY-MM");
                    }
                }
            }
            if (!fConfig.groupByClickHandler){
                fConfig.groupByClickHandler = {}
            }
            if (!fConfig.groupByClickHandler.fromNumeric){
                if (!fConfig.indexType){
                    fConfig.indexType = "string"
                }
                if (fConfig.indexType == "string"){
                    fConfig.groupByClickHandler.fromNumeric = fromIndexValue.bind(this, key)                
                } else if (fConfig.indexType == "numeric"){
                    fConfig.groupByClickHandler.fromNumeric = fromIndexIndex.bind(this, key)                
                } else if (fConfig.indexType == "date"){
                    fConfig.groupByClickHandler.fromNumeric = function(index) {
                        return moment(index, "YYYY-MM").format("MMMM YYYY");
                    }
                }
            }
            if (!fConfig.groupByClickHandler.toNumeric){
                if (!fConfig.indexType){
                    fConfig.indexType = "string"
                }
                if (fConfig.indexType == "string"){
                    fConfig.groupByClickHandler.toNumeric = toIndexValue.bind(this, key)                
                } else if (fConfig.indexType == "numeric"){
                    fConfig.groupByClickHandler.toNumeric = toIndexIndex.bind(this, key)                
                } else if (fConfig.indexType == "date"){
                    fConfig.groupByClickHandler.toNumeric = function(date) {
                        return lists.sortedgroups.parseMoment(date).format("YYYY-MM");
                    }
                }
            }
        });
        return filtersConfig
    }

    filtersConfig = {
        "category": {
            "groupBy": {
                default: true,
            },
        },
        "level": {
            indexType: "numeric",
            "groupByClickHandler": {
                "selector": ".sort.by-expertise",
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
                "sortFunc": lists.sortDates,
            },
            "groupByClickHandler": {
                "sortOrder": -1,
                "sortFunc": lists.sortedgroups.sortDates
            }
        },
        "name": {
            "groupBy": lists.sortedgroups.groupByName,
            "groupByClickHandler": function () {
                var queryString = new URLSearchParams(window.location.search);
                queryString.set("sort", "name")
                if (history.pushState) {
                    var newurl = window.location.protocol + "//" + window.location.host + window.location.pathname + "?" + queryString.toString();
                    window.history.pushState({ path: newurl }, '', newurl);
                }
                lists.sortedgroups.groupByName();
                lists.hideSectionIfEmpty($('.docs .list section'));
                $('.sort').removeClass("active");
                $(this).addClass("active");
                $('.sort svg.icon use').attr("xlink:href", "../../images/icons/icons.svg#sort");
                var sortIcon = "sort";
                //Getting ready for support for sort order asc/desc. Not there yet.
                var sortOrder = 1;
                if (sortOrder > 0) {
                    sortIcon += "-asc";
                } else {
                    sortIcon += "-desc";
                }
                $('svg.icon use', this).attr("xlink:href", "../../images/icons/icons.svg#" + sortIcon);
            }
        }
    }

    applyFilterConfigDefaults(filtersConfig)

    function setFilterAttribute($tile, filterName, filterTaxonomies) {
        filterVal = $tile.attr("data-filter-" + filterName)
        el = $("." + filterName, $tile)
        if (filterVal === undefined || el === undefined) {
            return
        }
        let filterCfg;
        if (filterTaxonomies){
            let taxonomy = filterTaxonomies[filterName]
            if (taxonomy) {
                taxonomy.values.forEach(function (cfg) {
                    if (cfg.value.toLowerCase() === filterVal.toLowerCase()) {
                        filterCfg = cfg
                        return;
                    }
                })
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
    var initTiles = function (filterNames, filterTaxonomies, tilesElement, setFilterAttributeFunc) {
        if (!tilesElement) {
            tilesElement = $(".tile")
        }
        if (setFilterAttributeFunc == undefined) {
            setFilterAttributeFunc = setFilterAttribute
        }
        tilesElement.each(function () {
            tile = $(this)
            filterNames.forEach(filterName => {
                setFilterAttributeFunc(tile, filterName, filterTaxonomies)
            })
        })
    }

    initTiles(["scope", "level"], taxonomies, $(".tile"));
    lists.initComboboxFilter("scope", contextElement)
    lists.initGroupSortingControls(filtersConfig)
    lists.initFilterControls(taxonomies, contextElement);
}