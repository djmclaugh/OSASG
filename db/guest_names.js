require('./db');
var mongoose = require('mongoose');
var GuestUser = mongoose.model('GuestUser');
var path = require("path");
var uuid = require("node-uuid");
var goodToGo = false;

var nameMap = {};

var fs = require('fs');
var names_location = path.join(__dirname, '../public/other/guest_names.txt');
var lines = fs.readFileSync(names_location).toString().split("\n");

const ONE_WEEK = 7 * 24 * 60 * 60 * 1000;


function setDate(un) {
  return function(err, result) {
    if (!result) {
      new GuestUser({username:un, currentSession:'', sessionStart:new Date(0)}).save();
      nameMap[un] = {date: new Date(0), id:""};
    } else {
      nameMap[un] = {date: result.sessionStart, id: result.sessionID};
    }
  };
}

for (var i = 0; i < lines.length; ++i) {
  var line = lines[i];
  GuestUser.findOne({username: line}, setDate(line));
}

exports.assignGuestNameAndSessionID = function() {
  var now = new Date();
  var then = now;
  var username = "";
  
  var keys = Object.keys(nameMap);
  while (now.getTime() - then.getTime() < ONE_WEEK) {
    username = keys[Math.floor(keys.length * Math.random())];
    then = nameMap[username].date;
  }
  var id = uuid();
  nameMap[username] = {date: now, id: id};
  GuestUser.update({username: username}, {sessionStart: now, sessionID: id}, function(err, rows) {
    //Do nothing
  });
  return {username: username+"Guest", uuid: id};
}

exports.isValidPair = function(username, id) {
  if (username.substring(username.length - 5, username.length) != "Guest") {
    return false;
  }
  username = username.substring(0, username.length - 5);
  var data = nameMap[username];
  if (!data) {
    return false;
  }
  if (data.id != id) {
    return false;
  }
  if (isExpired(data.date)) {
    return false;
  }
  return true;
};

function isExpired(date) {
  return (new Date() - date.getTime() > ONE_WEEK);
}

exports.resetAll = function() {
  var date = new Date(0);
  GuestUser.update({}, {sessionStart: date}, {multi: true}, function(err, rows) {
    //Do nothing
  });
};