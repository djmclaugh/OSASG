var socketIO = require("socket.io/node_modules/socket.io-client");
module.exports = ["$rootScope", function($rootScope) {
  var self = this;
  
  self.session = {};
  var socket = socketIO();
  function wrappedCallback(callback) {
    return function wrapperMethod(data) {
      console.log("Received: ");
      console.log(data);
      $rootScope.$apply(function() {
        callback(data);
      });
    };
  }
  self.on = function(message, callback) {
    socket.on(message, wrappedCallback(callback));
  };
  self.emit = function(message, data) {
    socket.emit(message, data);
    console.log("Sent: " + message);
    console.log(data);
  };
    
  self.on("session-info", function(data) {
    self.session = data;
  });
}];
