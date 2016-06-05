module.exports = ["$http", function($http) {
  var self = this;

  var urlPrefix = null;
  self.bot = null;
  self.error = null;
  self.isEditingDescription = false;
  self.descriptionEdit = "";
  self.nameEdit;

  function onSuccess(response) {
    self.bot = response.data;
    self.error = null;
  }

  function onError(response) {
    self.error = new Error(response.data);
  }

  self.fetchBot = function(identifier) {
    urlPrefix = "/api/bots/" + identifier; 
    $http.get(urlPrefix).then(onSuccess, onError);
  };

  self.submitName = function() {
    self.changeName(self.nameEdit);
    self.nameEdit = "";
  };

  self.startDescriptionEdit = function() {
    self.descriptionEdit = self.bot.description;
    self.isEditingDescription = true;
  };

  self.cancelDescriptionEdit = function() {
    self.isEditingDescription = false;
  };

  self.finishDescriptionEdit = function() {
    self.changeDescription(self.descriptionEdit);
    self.isEditingDescription = false;
  }

  self.changeName = function(newName) {
    var body = {desiredUsername: newName};
    var oldName = self.bot.username;
    self.bot.username = newName;
    function onNameChangeError(response) {
      self.error = new Error(response.data);
      self.nameEdit = newName;
      self.bot.username = oldName;
    }
    $http.post(urlPrefix + "/change_username", body).then(onSuccess, onNameChangeError);
  };

  self.changeDescription = function(newDescription) {
    var body = {desiredDescription: newDescription};
    self.bot.description = newDescription;
    $http.post(urlPrefix + "/change_description", body).then(onSuccess, onError);
  };

  self.changePassword = function() {
    self.bot.password = "generating new password...";
    $http.post(urlPrefix + "/change_password", {}).then(onSuccess, onError);
  };
}];
