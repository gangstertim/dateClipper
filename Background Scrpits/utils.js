//These utilities taken from Patrick Hulce's BetterBrowserSearcher (https://stage.canvasapps.io/apps/38916/stage/)
(function (utils) {
  utils.erroredRequest = function (raw_response) {
    var response = JSON.parse(raw_response.response);
    if (response.status == "success") return false;
 
    if (!(raw_response.status == 200 || raw_response.status == 202)) {
      return { "status": "failed", "details": "Server responded with status code " + raw_response.status};
    }
    
    return response;
  };
  
  utils.unauthorizedRequest = function (raw_response) {
    var response = utils.erroredRequest(raw_response);
    if (!response) return false;
    return response.type == "auth";
  };
  
})(window.utils = {});