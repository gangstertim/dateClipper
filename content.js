// Code written here will execute in the DOM context

appAPI.ready(function($) {
  /*********************Important Variables*******/
   var isPop = false,
       STARTDATE = "",
       CAL_ID = false;
  
  /*********************Authorization*************/
  
  var docTitle = document.title;

  //The gcal authorization returns a page entitled "Success code=" + AUTH_STRING
  if (!docTitle.indexOf("Success code=")) {
    var AUTH_STRING = $('#code')[0].value;                  
    framework.dispatchMessage("updateAuthString", AUTH_STRING);  // update AUTH_STRING w/ success variable
    //window.close();  //TODO: Try to fix this 
  }

  /*********************Listeners*****************/
  /*
  //The window MUST be opened in this script in order for this script to close it.
  framework.addMessageListener("openWindow", openWindow);
  openWindow = function(e) {
    var oAuthURL = e.data;
    framework.browser.windows.create({url: oAuthURL});
  };
  */
   
  framework.addMessageListener("updateCalId", function() {
    framework.invokeAsync("framework.storage.getItem", "CAL_ID", function(cID) {
      CAL_ID = cID;
    });
  });
  
  framework.addMessageListener("displayConfirmation", displayConfirmation);
  
  /*********************Utilities*****************/
  
    getUTCDate = function(d, withTime) {
      var d = (d || new Date());
      function pad(n) {return n < 10 ? "0" + n : n;}
      /*var hours = (plusOne) ? d.getUTCHours()+1 //adds 1 to hours
                          : d.getUTCHours();*/
    
      var date = d.getUTCFullYear()+"-"
         + pad(d.getUTCMonth()+1)+"-"
         + pad(d.getUTCDate())+'T'
         + pad(d.getUTCHours()-4)+':'  //This is hacky.  The time zone needs to be straightened out
         + pad(d.getUTCMinutes())+':'
         + pad(d.getUTCSeconds())+'Z';
    
      return (withTime) ? date : date.replace(/-/g,"").substring(0,8);
      
    };
    
  /********************Model**********************/
    displayPop = function($el, pText, evt) {
        var concordance = pText.concordance,                    //full text of query
          text          = pText.text,                           //text interpreted as dates
          eventName     = concordance.replace(text, ""),        //just the non-date part of the query
          readStart     = (pText.startDate.toString()    || new Date()),   //human readable start date
          readEnd       = pText.endDate ? pText.endDate.toString() : 
                        new Date(new Date(readStart).setHours(new Date(readStart).getHours()+1)),               //human readable end date
          ENDDATE       = getUTCDate(new Date(readEnd), false);                               //req'd form for input
          STARTDATE     = getUTCDate(new Date(readStart), false);                            //req'd form for input
        
        $("head").append("<style>" + css + "</style>");
        $("head").append("<style>" + cssEdits + "</style>");
      
        $el.css({
          "top": evt.pageY + 25,
          "left": evt.pageX + 25,
          "display": "block"
        });
      
        $el.find(".confirmation").html('<!DOCTYPE html><html lang="en"><head><title>Date Picker</title></head><body><div class="container" syle="width:500"><div class="jumbotron"><div class="row" id="jumborow"><div class="col-md-6"><iframe src="https://www.google.com/calendar/embed?showNav=0&amp;showTitle=0&amp;showPrint=0&amp;showTabs=0&amp;showCalendars=0&amp;showTz=0&amp;mode=AGENDA&amp;dates='+STARTDATE+'/'+ENDDATE+'&amp;height=200&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;src='+ CAL_ID + '&amp;color=%232952A3&amp;output=embed" style=" border:solid 1px #777 " width="200" height="250" frameborder="0" scrolling="no"></iframe></div><div class="col-md-6"><form class="form-horizontal" role="form"><div class="form-group"><label for="inputWhat" class="col-sm-3 control-label">Name</label><div class="col-sm-9"><input type="text" class="form-control" id="eventName" placeholder="TEA PARTY" value="'+eventName+'"></div></div><div class="form-group"><label for="inputWhere" class="col-sm-3 control-label">Where</label><div class="col-sm-9"><input type="text" class="form-control" id="eventLoc" placeholder="TANZANIA"></div></div><div class="form-group" id="fg-inputStart"><label for="inputStart" id="cl-inputStart" class="col-sm-3 control-label">Start</label><div class="col-sm-9"><input type="text" class="form-control" id="eventStart" placeholder="Tuesday, May 7 at 4:00 PM" value="'+readStart+'"></div></div><div class="form-group" id="fg-inputEnd"><label for="inputEnd" class="col-sm-3 control-label">End</label><div class="col-sm-9"><input type="text" class="form-control" id="eventEnd" placeholder="Tuesday, May 7 at 5:00 PM" value="'+readEnd+'"></div></div><div class="form-group"><div class="col-sm-offset-3 col-sm-9"><button type="submit" id="addEventButton" value="send" class="btn btn-primary">Add Event</button></div></div></form></div></div></div></div></body></html>');
              
        
        $('#addEventButton').on("click",function(e) {
          e.preventDefault();
          var start = chrono.parse($('#eventStart').val()),
              end   = chrono.parse($('#eventEnd').val());

          if (start == "") $('#fg-inputStart').addClass('has-error');
          if (end == "")   $('#fg-inputEnd').addClass('has-error');
          if (start == "" || end == "") return;          //Do not continue if either field is invalid.
          
          start = start[0].startDate;
          end   = end[0].startDate;

          STARTDATE = getUTCDate(start, true);
          ENDDATE   = getUTCDate(end, true);

          var eventParams = {
                'summary'  : $('#eventName').val(),
                'location' : $('#eventLoc').val(),
                'start'    : {"dateTime": STARTDATE},
                'end'      : {"dateTime": ENDDATE}
              };
        
          STARTDATE = getUTCDate(start, false);
          framework.console.log(eventParams);
          framework.dispatchMessage("insertEvent", eventParams);
        });
    };
  
    function displayConfirmation() {
      framework.console.log("displayConfirmation received");
      var iframe = 'https://www.google.com/calendar/embed?showTitle=0&amp;showNav=0&amp;showPrint=0&amp;showTabs=0&amp;showCalendars=0&amp;showTz=0&mode=DAY&amp;dates='+STARTDATE+'/'+STARTDATE+'&amp;height=200&amp;wkst=1&amp;bgcolor=%23FFFFFF&amp;src='+CAL_ID+'&amp;color=%232952A3&amp;ctz=Etc%2FGMT&amp;output=embed" style="border-width:0 " width="405" height="250" frameborder="0" scrolling="no"';
      framework.console.log(iframe);
      
      $('#jumborow').html('<div class="col-lg-10"><h3>Your Event Has Been Added!</h3><iframe src='+iframe+'></iframe></div>');
    }

  $(window).mouseup(function(evt) {
    //TODO: would be better to replace a storage call with a message sequence
    framework.invokeAsync("framework.storage.getItem", "APP_ACTIVE", function(APP_ACTIVE) {
        if (!APP_ACTIVE) return;  //Don't do anything if the app is not active   
      
        var $gEventWindow = $("#gEventPreview"),
            $eventButton  = $("#addEventButton");
    
        if (evt.target.tagName == "INPUT") return;      //Do not trigger popups on input fields
        //If there is already a popup shown and the click is not on the popup, close the popup
        if (isPop && !$gEventWindow.is(evt.target) && evt.target.id !== "addEventButton" && $gEventWindow.has(evt.target).length === 0) {
          framework.console.log("a popup is open and mouseup was registered off of the popup; closing popup");
          isPop = false;
          $gEventWindow.find(".confirmation").hide();
          $("#gEventPreview").hide();
        } else if (isPop) return;
    
        var text = "";
        if (typeof window.getSelection != "undefined") {
          text = window.getSelection().toString().trim();
        } else if (typeof document.selection != "undefined" && 
                   document.selection.type == "Text") {
          text = document.selection.createRange().text.trim();
        } 
        if (text === "") return;
    
        var pText = chrono.parse(text)[0];
        framework.console.log(pText);
        if (pText) {      //Only show the window if the user has highlighted a date/time
          $gEventWindow.find(".confirmation").show(); 
          isPop = true;
          
          if (CAL_ID) {
            displayPop($gEventWindow, pText, evt);
          } else {
            framework.invokeAsync("framework.storage.getItem", "CAL_ID", function(cID) {
              CAL_ID = cID;
              if (!CAL_ID) {
                $el.find(".confirmation").html("Your calendar ID is not set.  Please set an ID to use Date Clipper.");
                framework.console.log("Cal ID NOT FOUND!");
                return;
              }
              displayPop($gEventWindow, pText, evt);
            });
          }       
        }
    });  
  });
});

