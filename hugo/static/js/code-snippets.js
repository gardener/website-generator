(function ($) {

  var apply = function (options) {
    var code = $(this),
      text = code.text();
    if (text.length > options.minTextLength) {
      // chroma does not always do a good job recognizing bash scripts atomatically so let's help it a bit
      if (!code.hasClass("language-bash") && text.trim().startsWith("$")) {
        code.removeClass("language-fallback").addClass("language-bash").attr("data-lang", "bash");
      }

      var toolbox = $('<div class="toolbox"></div>')
        .append('<a class="tool icon download" download="download.txt" href="#" title="Download"></a>')
        .append('<span class="tool icon copy-to-clipboard" title="Copy to clipboard"></span>');
      code.after(toolbox);
      $(".copy-to-clipboard", toolbox).on("mouseleave", function () {
        $(this)
          .attr("aria-label", null)
          .removeClass("tooltipped tooltipped-s tooltipped-w");
      });
      $(".download", toolbox).on("click", function () {
        let code = $(this).parents("pre").children("code")[0];
        let text = $(code).text();
        if ($(code).hasClass("language-bash") && options.lang["bash"].textProcess && (typeof options.lang["bash"].textProcess === "function")) {
          text = options.lang["bash"].textProcess(text);
        }
        let blob = new Blob([text], { type: "text/plain" });
        this.href = URL.createObjectURL(blob);
      });
    }
  };

  function initClipboardTool(options) {
    // init code blocks Clipboard tool {
    new ClipboardJS(".copy-to-clipboard", {
      text: function (trigger) {
        let code = $(trigger).parents("pre").children("code")[0];
        text = $(code).text();
        if ($(code).hasClass("language-bash") && options.lang["bash"].textProcess && (typeof options.lang["bash"].textProcess === "function")) {
          return options.lang["bash"].textProcess(text);
        }
        return text;
      },
    })
      .on("success", function (e) {
        e.clearSelection();
        inPre = $(e.trigger).parents("pre").prop("tagName") == "PRE";
        $(e.trigger)
          .attr("aria-label", "Copied to clipboard!")
          .addClass("tooltipped tooltipped-" + (inPre ? "w" : "s"));
      })
      .on("error", function (e) {
        inPre = $(e.trigger).parents("pre").prop("tagName") == "PRE";
        $(e.trigger)
          .attr("aria-label", fallbackMessage(e.action))
          .addClass("tooltipped tooltipped-" + (inPre ? "w" : "s"));
        $(document).one("copy", function () {
          $(e.trigger)
            .attr("aria-label", "Copied to clipboard!")
            .addClass("tooltipped tooltipped-" + (inPre ? "w" : "s"));
        });
      });
  }

  function fallbackMessage(action) {
    var actionMsg = "";
    var actionKey = action === "cut" ? "X" : "C";

    if (/iPhone|iPad/i.test(navigator.userAgent)) {
      actionMsg = "No support :(";
    } else if (/Mac/i.test(navigator.userAgent)) {
      actionMsg = "Press ⌘-" + actionKey + " to " + action;
    } else {
      actionMsg = "Press Ctrl-" + actionKey + " to " + action;
    }

    return actionMsg;
  }

  $.fn.codeSnippets = function (options ) {
    var settings = $.extend({
        // defaults
        minTextLength: 5,
        lang: {
            bash: {
                textProcess: function (text) {
                return text.replace(/^\$\s/gm, ""); // remove leading $
                },
            },
        },
    }, options );

    return this.each(function () {
      $("pre code", this).each(function () {
        apply.call($(this), settings);
        initClipboardTool.call($(this), settings);
      });
    });
  };
})(jQuery);
