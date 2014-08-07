FrameworkAPI.onReady(function() {
  framework.dispatchMessage("syncBrowserButton");        //in background script

  var oAuthURL      = "",
      $form         = $("#form1"),
      $statusId     = $("#statusId"),
      $statusAuth   = $("#statusAuth"),
      $idRow        = $("#idRow"),
      $authRow      = $("#authRow"),
      statusAuthVal = framework.storage.getItem("AUTH_STATUS"),
      statusIdVal   = framework.storage.getItem("CAL_ID");
  
  if (statusIdVal == null) {
    $statusId.html("No Calendar ID set");
    $statusId.css("color", "red");
    $idRow.addClass("bg-danger");
  } else {
    $statusId.html(statusIdVal);
    $statusId.css("color","green");
    $idRow.addClass("bg-success");
  }
  
  if (statusAuthVal) {
    $statusAuth.html("The application IS currently authorized");
    $statusAuth.css("color","green");
    $authRow.addClass("bg-success");
  } else {
    $statusAuth.html("The application is NOT currently authorized");
    $statusAuth.css("color","red");
    $authRow.addClass("bg-danger");
  }
 
  $("#updateCalendarId-btn").on("click", function(e) {
    e.preventDefault();

    var calId = document.getElementById("calId").value;
    framework.dispatchMessage("setCalId",calId);

    $form.html('<div>Great! Date Clipper will use '+ calId +' as your calendar ID! </div>');
    $statusId.html(calId);
    $statusId.css("color","green");
    $idRow.removeClass("bg-danger").addClass("bg-success");

  });
    
  $("#authorize-btn").on("click", function(e) {
    e.preventDefault();
    framework.console.log("submitOAuthRequest dispatched");
    framework.dispatchMessage("submitOAuthRequest");
  });

  $("#disable-btn").on("click", function(e) {
    e.preventDefault();
    framework.dispatchMessage("disableApp");
    var disableText = $("#disable-btn");

    if (disableText.html() === "Enable Extension")
      disableText.html("Disable Extension");
    else disableText.html("Enable Extension");
  });

});