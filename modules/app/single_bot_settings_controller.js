module.exports = ["$http", "$scope", function($http, $scope) {
  var self = this;
  var bot = $scope.bot;

  self.editing = false;
  self.text = "";
  self.error = null;

  self.regeneratePassword = function() {
    function onSuccess(response) {
      self.error = null;
      bot.password = response.data.password;
    }

    function onError(response) {
      self.error = new Error(response.data);
    }

    var body = {identifier: bot.id};
    $http.post("/bots/regenerate_password", body).then(onSuccess, onError);
  };

  self.changeUsername = function() {
    function onSuccess(response) {
      self.error = null;
      bot.username = response.data.username;
    }

    function onError(response) {
      self.error = new Error(response.data);
    }

    var body = {identifier: bot.id, newUsername: self.text};
    $http.post("/bots/change_username", body).then(onSuccess, onError);
  };
}];