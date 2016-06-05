module.exports = ["$http", function($http) {
  var self = this;

  self.bots = [];
  self.error = null;
  
  self.createBot = function() {
    function onSuccess(response) {
      self.error = null;
      self.bots.push(response.data);
    }

    function onError(response) {
      self.error = new Error(response.data);
    }

    var body = {};
    $http.post("/api/bots/create_bot", body).then(onSuccess, onError);
  };

  function onSuccess(response) {
    self.error = null;
    self.bots = response.data;
  }

  function onError(response) {
    self.error = new Error(response.data);
  }
  $http.get("/api/bots").then(onSuccess, onError);
}];