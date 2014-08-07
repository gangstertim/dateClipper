/*****************************************************/

var CLIENT_ID     =  "831101123055-874tukfvuvkma6s0l7m70iqlc3lirnkc.apps.googleusercontent.com",
    CLIENT_SECRET =  "tSYcpkZhoANl2C_-gqXhWUUs",
    REDIRECT_URI  =  "urn:ietf:wg:oauth:2.0:oob",
    SCOPE         =  "https://www.googleapis.com/auth/calendar",
    TOKEN         =  "",
    REFRESH_TOKEN =  "",
    TOKEN_TYPE    =  "",
    CAL_ID        =  (framework.storage.getItem("CAL_ID") || false);
    COUNT         =  0;

var APP_ACTIVE     = false;


/*******************set Popup*************************/


framework.addMessageListener("setCalId", setCalId);
framework.ui.browserButton.setPopup({
  url: 'assets/popup1.html',
  width: 700,
  height: 300
});

 

/*******************Listeners*************************/


function setCalId(e) {
    CAL_ID = e.data;
    framework.storage.setItem("CAL_ID", e.data);
    framework.dispatchMessage("updateCalId");
}


function submitOAuthRequest() {
  framework.console.log("SubmitOAuthRequest received");
    
  var response_type = 'code',
      oAuthURL = 'https://accounts.google.com/o/oauth2/auth?scope='+SCOPE+'&redirect_uri='+REDIRECT_URI+'&response_type='+response_type+'&client_id='+CLIENT_ID;
  
  framework.browser.windows.create({url: oAuthURL});
  //framework.dispatchMessage("openWindow", oAuthURL);   //TODO: try to get this sequence to work
}


function updateAuthString(e) {
  framework.console.log("updateAuthString received"); 
  
  var AUTH_STRING = e.data;
  var tokenRequestDetails = {
        "method" : "POST",      
        "url"    : "https://accounts.google.com/o/oauth2/token",    // oauth2/token endpoint
        "async"  : true,               
        "params": {     
          "code"         : AUTH_STRING,
          "client_id"    : CLIENT_ID,
          "client_secret": CLIENT_SECRET,
          "redirect_uri" : REDIRECT_URI,
          "grant_type"   : "authorization_code"
         },
       };
  
  framework.xhr.send(tokenRequestDetails, function(cb) {    //TO-DO:  handle errors here
    var response = JSON.parse(cb.response);
    framework.console.log(response);
    TOKEN = response.access_token;
    TOKEN_TYPE = response.token_type;
    framework.xhr.send( {'url': 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + TOKEN }, function (r) {
          framework.console.log("token info:");
          framework.console.log(r);
        });
    REFRESH_TOKEN = response.refresh_token;
    framework.storage.setItem("AUTH_STATUS", true);
    framework.storage.setItem("REFRESH_TOKEN", REFRESH_TOKEN);
    framework.console.log("the token & refresh token are:");
    framework.console.log(TOKEN);
    framework.console.log(REFRESH_TOKEN);
  });  
  //close the window; must be done w/ window.close() in content script
}

function insertEvent(e) {
  var eventParams = e.data,
      request = {
        'method' : 'POST',
        'async'  : true,
        'url':   'https://www.googleapis.com/calendar/v3/calendars/' + CAL_ID + '/events',
        'headers': {
          'Authorization' : TOKEN_TYPE+' '+ TOKEN,
          'Content-Type': 'application/json'
        },
        'contentType': 'json',
        'params': JSON.stringify(eventParams)
      };
  
  framework.xhr.send(request, function(cb) {
    var response = cb.response;
    var status = cb.status;
    framework.console.log(response);
    framework.console.log("the insertEvent response is: " + status);
    
    if (status == 200) {
      framework.browser.tabs.getCurrent(function(tab) {
        tab.dispatchMessage("displayConfirmation");
        framework.console.log("dispatching displayConfirmation");
      });
      return;
    }
    
    if (status == 401) {      //Expired access token, request new one
      if (++COUNT > 5) {      //prevents infinite looping
        framework.console.log("Too many token requests!"); 
        return;      
      }
      
      framework.console.log("Requesting access token from refresh token:");
      
      if (!REFRESH_TOKEN) {
        REFRESH_TOKEN = framework.storage.getItem("REFRESH_TOKEN");
        if (!REFRESH_TOKEN) {
          framework.console.log("Please re-authorize application");
          return;
        }
      }
      
      var requestNewAccessToken = {
        "method" : "POST",      
        "url"    : "https://accounts.google.com/o/oauth2/token",    // oauth2/refresh token endpoint
        "async"  : true,               
        "params": {     
          "refresh_token": REFRESH_TOKEN,
          "client_id"    : CLIENT_ID,
          "client_secret": CLIENT_SECRET,
          "grant_type"   : "refresh_token"
        },
      };
      
      framework.xhr.send(requestNewAccessToken, function(cb) {    //TO-DO:  handle errors here
        var response = JSON.parse(cb.response);
        framework.console.log(response);
        TOKEN = response.access_token;
        framework.xhr.send( {'url': 'https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + TOKEN }, function (r) {
          framework.console.log("token info:");
          framework.console.log(r);
        });
        framework.storage.setItem("AUTH_STATUS", true);
        insertEvent(e);
      }); 
      
    }
  });
}


function syncBrowserButton() {
  if (!APP_ACTIVE) toggleAppActive();
}

function toggleAppActive() {
  APP_ACTIVE = !APP_ACTIVE;
  /*framework.browser.tabs.getCurrent(function(tab) {
    // Update the content script
    tab.dispatchMessage("updateAppActive", APP_ACTIVE);
  });*/  //TODO: try to get this to work with a listener on content.js
  framework.storage.setItem("APP_ACTIVE", APP_ACTIVE);
  
  var color = (APP_ACTIVE) ? [0, 255, 0, 255] : [255, 0, 0, 255];
  var value = (APP_ACTIVE) ? "On" : "Off";
  
  framework.ui.browserButton.setBadgeBackgroundColor(color);
  framework.ui.browserButton.setBadgeValue(value);
}

framework.addMessageListener("setCalId", setCalId);
framework.addMessageListener("submitOAuthRequest", submitOAuthRequest);
framework.addMessageListener("updateAuthString", updateAuthString);
framework.addMessageListener("insertEvent", insertEvent);
framework.addMessageListener("syncBrowserButton", syncBrowserButton);
framework.addMessageListener("disableApp", toggleAppActive);
syncBrowserButton();


