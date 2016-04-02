var path = require("path");
var Sessions = require("./db").Session;
var fs = require('fs');
var names_location = path.join(__dirname, '../public/other/guest_names.txt');

function getAvailablesGuestNames(callback) {
  var lines = fs.readFileSync(names_location).toString().split("\n");
  var names = [];
  for (var i = 0; i < lines.length; ++i) {
    names.push(lines[i] + "Guest");
  }

  Sessions.find({}, function(error, sessions) {
    if (error) {
      callback(error, null);
      return;
    }
    for (var i = 0; i < sessions.length; ++i) {
      var index = names.indexOf(sessions[i].session.username);
      if (index >= 0) {
        names.splice(index, 1);
      }
    }
    callback(null, names);
  });
}

exports.getGuestName = function(callback) {
  getAvailablesGuestNames(function(error, names) {
    if (error) {
      throw error;
    }
    if (names.length == 0) {
      return null;
    }
    var randIndex = Math.floor(Math.random() * names.length);
    var username = names[randIndex];
    callback(username);
  });
};
