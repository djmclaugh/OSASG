module.exports = ["$http", function($http) {
  var self = this;

  self.desiredUsername = "";
  self.isSubmitting = false;
  self.error = null;
  self.successMessage = null;

  self.submit = function() {
    self.isSubmitting = true;

    function onSuccess(response) {
      self.error = null;
      self.successMessage = response.data;
      self.isSubmitting = false;
      self.desiredUsername = "";
    }

    function onError(response) {
      self.error = new Error(response.data);
      self.successMessage = null;
      self.isSubmitting = false;
    }

    var body = {desiredUsername: self.desiredUsername};
    $http.post("/api/settings/change_username", body).then(onSuccess, onError);
  };
}];
