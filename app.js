var Util = {
    isUndef: function(val) {
        return typeof val === "undefined";
    }
};

var CONST = {
    leftPanel: {
        w: 15,
        h: 12,
        x: 83,
        startingY: 25
    },
    topPanel: {
        w: 14,
        h: 8,
        startingX: 15,
        y: 13
    },
    rightPanel1: {
        w: 15,
        h: 9.6,
        x: 2,
        startingY: 25
    },
    rightPanel2: {
        w: 7.5,
        h: 13,
        x: 22,
        startingY: 30.7
    },
    openAreaPanel: {
        w: 25,
        h: 30,
        x: 44,
        y: 40
    },
    frontDeskPanel: {
        w: 25,
        h: 14,
        x: 44,
        y: 78
    }
};

CONST.rightPanel3 = { //right panel 3 is just to the right of right panel 2
    w: CONST.rightPanel2.w,
    h: CONST.rightPanel2.h,
    x: CONST.rightPanel2.x + CONST.rightPanel2.w,
    startingY: CONST.rightPanel2.startingY
};

var sectionName2Id = function(sectionName) { //form section DOM id from section name
    return sectionName.replace(/[^A-Z0-9]/ig, "");
};

var isTextInput = function(node) {
    return ['input'].indexOf(node.nodeName) > -1;
};

var dismissKeyboardListener = function(e) { //dismiss keyboard on mobile 
    if (!isTextInput(e.target)) {
        document.activeElement.blur();
    }
};

var toolSortF = function(a, b) { //sort tools by name (case insensitive) 
    if(a.name.toLowerCase() < b.name.toLowerCase()) {
        return -1;
    } else if(a.name.toLowerCase() > b.name.toLowerCase()) {
        return 1;
    } else {
        return 0;
    }
}

var timeText = function() {
	var openDays = [2,5,6];
	var openHours = [17,18,19];
	var lastOpenHour = openHours.slice(-1)[0];

	var closeDate = new Date();
	closeDate.setMinutes(0);
	closeDate.setHours(lastOpenHour);
	
	var date = new Date();
	var dow = date.getDay();
	var hour = date.getHours();
	var min = date.getMinutes();

	var min2Close = Math.round(((date - closeDate % 86400000) % 3600000) / 60000);
	
	var closedText = "Library Hours are Tues/Thurs/Sat 5PM to 7PM"; 
	var openText = "Library Closes in {{X}} Minutes"; 
	
	if(openDays.indexOf(dow) > -1) {
		if(openHours.slice(0, -1).indexOf(hour) > -1) {
			return openText.replace("{{X}}", min2Close); 
		} else {
			if(hour==lastOpenHour && min==0) {
				return openText.replace("{{X}}", 0); 
			} else {
				return closedText; 
			}
		}
	} else {
		return closedText; 
	}
}

var setTimeText = function() {
	$("#timeText").text(timeText());
}

var makeOpenF = function(divModal) {
	return function(event, ui) { 
        $('.ui-widget-overlay').bind('click', function() { 
            divModal.dialog('close'); 
        }); 
    }
}

var helpContent = 
	"<div class='helpContent'>" + 
		"Welcome to the Tool Finder!<p/>Start typing in the search box located in the upper-left corner " + 
		"to find tools. As you type, sections will highlight green, indicating a tool's location. Also, click " +
		"any section to view a full list of its tools.<p/>Enjoy!" + 
	"</div>";

var modalOptions = {
	modal: true,
    show: "fade",
    hide: "drop",
    positon: {my: "center", at: "center", of: "window"}
};

$(document).ready(function() {
    var body = $(document.body);
    var tool2SectionIdHash = {};
    var toolSearch =  $("#toolSearch");

	$(".help").click(function() {
        var divModal = $(helpContent);
        divModal.dialog($.extend({}, modalOptions, {title: "Help", open: makeOpenF(divModal)}));
    });

    document.addEventListener("touchstart", dismissKeyboardListener); //dismiss keyboard on click/tap outside of it
    document.addEventListener("mousedown", dismissKeyboardListener); //dismiss keyboard on click/tap outside of it

    $("#toolSearch").bind("mousedown", function(e) { //prevent tapping search input zoom-in on mobile
        $("meta[name=viewport]").remove();
        $("head").append("<meta name='viewport' content='width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=0'>");
    });

    $("#toolSearch").bind("blur", function(e) { //allow zooming in general when search input is not focused 
        $("meta[name=viewport]").remove();
        $("head").append("<meta name='viewport' content='width=device-width, initial-scale=1'>");
    });

    toolSearch.focus(); //auto-focus search input

    toolSearch.keypress(function(e) { //if keypress is not the enter key, remove all match classes
        if(e.which!=13) {
            body.find(".section").removeClass("search-match");
        } else { //on enter, hide the auto-complete suggestions
            $(".autocomplete-suggestion").hide();
            document.activeElement.blur();
        }
    });

    toolSearch.keydown(function(e) { //if tool search is empty, remove all match classes
        setTimeout(function() {
            if(toolSearch.val()=="") {
                body.find(".section").removeClass("search-match");
            }
        }, 250);
    });

    //load panels
    $.ajax({ //get data 
        url: "https://raw.githubusercontent.com/dsills22/map/master/data.json", // !-- SWITCH BACK TO JUST data.json 
        dataType: "json",
        success: function(data) {
            var toolList = [];
            var toolHash = {};

            data.map(function(obj) { //loop through sections
                var sectionId = sectionName2Id(obj.sectionName); //form section id
                var toolListHtml = "";
                if(obj.tools) {
                    obj.tools.sort(toolSortF);
                    obj.tools.map(function(tool) { //loop through section tools
                        if(!toolHash[tool.name]) {
                            toolHash[tool.name] = true;
                            tool2SectionIdHash[tool.name] = sectionId; //save tool to section id map
                            toolList.push(tool.name); //save unique list of tool names
                            toolListHtml += "<li class='toolListItem'>" + tool.name + "</li>";
                        }
                    });
                }
                if(obj && (!Util.isUndef(obj.panelNum) || !Util.isUndef(obj.x))) {
                    var div = $("<div></div>");
                    var x, y, w, h;
                    if(obj.leftPanel) { //position each section
                        x = CONST.leftPanel.x;
                        y = CONST.leftPanel.startingY + (CONST.leftPanel.h * obj.panelNum); //push each section down by its height
                        h = CONST.leftPanel.h;
                        w = CONST.leftPanel.w;
                    } else if(obj.topPanel) {
                        x = CONST.topPanel.startingX + (CONST.topPanel.w * obj.panelNum); //push each obj right by its width
                        y = CONST.topPanel.y;
                        h = CONST.topPanel.h;
                        w = CONST.topPanel.w;
                    } else if(obj.rightPanel1) {
                        x = CONST.rightPanel1.x;
                        y = CONST.rightPanel1.startingY + (CONST.rightPanel1.h * obj.panelNum); //push each section down by its height
                        h = CONST.rightPanel1.h;
                        w = CONST.rightPanel1.w;
                    } else if(obj.rightPanel2) {
                        x = CONST.rightPanel2.x;
                        y = CONST.rightPanel2.startingY + (CONST.rightPanel2.h * obj.panelNum); //push each section down by its height
                        h = CONST.rightPanel2.h;
                        w = CONST.rightPanel2.w;
                    } else if(obj.rightPanel3) {
                        x = CONST.rightPanel3.x;
                        y = CONST.rightPanel3.startingY + (CONST.rightPanel3.h * obj.panelNum); //push each section down by its height
                        h = CONST.rightPanel3.h;
                        w = CONST.rightPanel3.w;
                    } else if(obj.openAreaPanel) { //only one section, just set its coordinates
                        x = CONST.openAreaPanel.x;
                        y = CONST.openAreaPanel.y;
                        h = CONST.openAreaPanel.h;
                        w = CONST.openAreaPanel.w;
                    } else if(obj.frontDeskPanel) { //only one section, just set its coordinates
                        x = CONST.frontDeskPanel.x;
                        y = CONST.frontDeskPanel.y;
                        h = CONST.frontDeskPanel.h;
                        w = CONST.frontDeskPanel.w;
                    } else { //fall back to obj values, if set
                        w = obj.w;
                        h = obj.h;
                        x = obj.x;
                        y = obj.y;
                    }

                    div.css("width", w + "%");
                    div.css("height", h + "%");
                    div.css("left", x + "%");
                    div.css("top", y + "%");
                    div.addClass("section");
                    div.attr("id", sectionId);
                    
                    if(obj.tools) { //if there are tools in this section, register a modal tool list when a section is tapped 
                        div.click(function() {
                            var divModal = $(
                                "<div class='toolList'>" + 
                                    "<ul>" + toolListHtml + "</ul>" + 
                                "</div>");
                            divModal.dialog($.extend({}, modalOptions, {title: obj.sectionName + " Tool List", open: makeOpenF(divModal)}));
                        });
                    } else if(obj.frontDeskPanel) { //register help content on Help Desk section 
                    	div.click(function() {
                            var divModal = $(helpContent);
                            divModal.dialog($.extend({}, modalOptions, {title: "Help", open: makeOpenF(divModal)}));
                        });
                    }

                    //set section text
                    var span = $("<span></span>");
                    !obj.openAreaPanel && span.text(obj.sectionName); //open area displays its name differently (as an item in a summary list)
                    span.addClass("section-name");
                    if(obj.openAreaPanel) {
                        span.addClass("open-area");
                    }
                    div.append(span);

                    if(obj.summary) { //if section has a list / summary of tool categories (Open Area has this)
                        var summary = $("<ul class='summary'></ul>"); //create list of summary items to display along with the section name 
                        obj.summary.map(function(summaryItem) {
                            var li = $("<li class='summaryItem'></li>");
                            li.text(summaryItem);
                            summary.append(li);
                        });
                        div.append(summary);
                    }

                    body.append(div); //add section to body 
                }
            });
			
			body.append($("<img src='screw-pin.png' alt='you are here' class='youAreHere'></img>")); //you are here 
			body.append($("<span class='libraryCloseTime'><img src='time.png' alt='library close time' class='libraryCloseTimeImg'></img>&nbsp;<span id='timeText'></span></span>")); //library close time
			setTimeText();

            //setup auto-complete
            var autocomplete = new autoComplete({
                selector: '#toolSearch',
                cache: true,
                minChars: 2,
                source: function(term, suggest){
                    term = term.toLowerCase(); //support case insensitive search
                    var choices = toolList;
                    var suggestions = [];
                    for (i=0; i < choices.length; i++) {
                        if ((choices[i]).toLowerCase().indexOf(term) > -1) {
                            suggestions.push(choices[i]);
                        }
                    }
                    suggest(suggestions);
                },
                renderItem: function (item, search){
                    tool2SectionIdHash[item] && body.find("#" + tool2SectionIdHash[item]).addClass("search-match"); //highlight all matches (keypress removes matches before this runs)
                    search = search.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'); //logic here and below simply highlights the text that matched the search in the auto-complete
                    var re = new RegExp("(" + search.split(' ').join('|') + ")", "gi");
                    return "<div class='autocomplete-suggestion' data-val='" + item + "'>" + item.replace(re, "<b>$1</b>") + "</div>";
                },
                onSelect: function(e, term, item){
                    toolSearch.val(term); //set input to term selected
                    body.find(".section").removeClass("search-match"); //remove all match classes
                    tool2SectionIdHash[term] && body.find("#" + tool2SectionIdHash[term]).addClass("search-match"); //add specific match class
                }
            });
        }
    }); 

	setInterval(setTimeText, 5000);
});