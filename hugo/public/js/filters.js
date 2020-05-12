(function( $ ) {

    function debounce(fun, mil){
      var timer; 
      return function(){
          clearTimeout(timer); 
          var self = this;
          timer = setTimeout(function(){
              fun.call(self); 
          }, mil); 
      };
    }

    function _filterEl(el, values){
      return $(el).toArray().some(function(_el){
        return values.filter(function(v){
          return  $(_el).text().trim().toLowerCase().indexOf(v) > -1;
        }).length;
      })
    }

    function _filterAttr(attrName, values){
        var hasSome;
        var tags = $(this).attr(attr_ns+"-"+attrName);
        if (tags !== undefined) {
          tags = tags.split(" ").filter(function(el){
            return el && el.trim().length > 0
          });          
          $(tags).each(function(){
            hasSome = tags.some(function(tag){
              return values.filter(function(v){
                return tag.toLowerCase().indexOf(v) > -1;
              }).length;
            })
            if (hasSome)
              return false;
          });
        }
        return hasSome;
    }

    const attr_ns = "data-filter";

    var filterHandler = function() {
      var target = $(this).attr(attr_ns);
      var total = $(target).size();
      var value = $(this).attr(attr_ns+'-value') || $(this).val();
      var visible = 0;
      if (value === undefined || value.trim().length === 0) {
          $(target).show();
          visible = total;
      } else {
        value = value.trim().toLowerCase();
        var values = value.split(" ")
        if (values !== undefined) {
          values = values.filter(function(el){
            return el && el.trim().length > 0;
          })
        };
        var scope = $(this).attr(attr_ns+ "-scope");
        if (scope === undefined || scope.trim().length === 0) {
          scope = "freetext";
        }
        var scope = scope.split(" ").filter(function(el){
          return el && el.trim().length > 0;
        });
        $(target).each(function() {
          var self = this;
          var hasHit;
          for(var i=0; i< scope.length; i++){
            filterType = scope[i];
            var attrName = [attr_ns,filterType].join('-');
            var attrselector = "["+attrName+"]";
            _el = $(attrselector, $(self));
            if (_el.size() < 1 ){
              if ($(self).attr(attrName)){
                _el = $(self);
              } else {
                break;
              }
            } 
            $(_el).each(function() {
                if (filterType === "freetext") {
                  hasHit = _filterEl($(this), values);
                } else {
                  hasHit = _filterAttr.call($(this), filterType, values);
                }
                if (hasHit)
                  return false;
            }); 
            if (hasHit) {
              break;
            }
          }
          if (hasHit) {
            $(self).show(); 
            visible++;
          } else {
            $(self).hide(); 
          }        
        });
      }
      //var visible = $(target).filter(":visible").size();
      var filtered = total - visible;
      $(this).triggerHandler("elements-filter:complete", [total, filtered, visible]);
    };
    
    $.fn.filterControl = function() {

      this.filter = function(){
        filterHandler.call(this);
        return this;
      }

      return this.each(function() {
        $(this).on("input", debounce(filterHandler, 250));
      });
 
    };
 
  }( jQuery ));