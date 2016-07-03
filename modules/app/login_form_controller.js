module.exports = ["$http", function($http) {
  var self = this;

  self.email = null;
  self.recaptchaKey = null;
  self.error = null;
  self.emailSent = false;
  self.isSubmitting = false;
  self.successMessage = "";
  self.submit = function() {
    var body = {};
    if (grecaptcha == null) {
      self.error = new Error("ReCaptcha has not finished loading. Please try again.");
      return;
    }
    body.user = self.email;
    body["g-recaptcha-response"] = grecaptcha.getResponse();
    if (body["g-recaptcha-response"].length == 0) {
      self.error = new Error("Please answer the ReCaptcha.");
      return;
    }
    
    self.isSubmitting = true;

    function onSuccess(response) {
      self.emailSent = true;
      self.error = null;
      self.successMessage = response.data;
      self.isSubmitting = false;
    }

    function onError(response) {
      self.error = new Error(response.data);
      self.isSubmitting = false;
    }
    $http.post("/sendToken", body).then(onSuccess, onError);
  };
}];