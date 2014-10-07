var path = require("path");
var uuid = require("node-uuid");

const DAY = 24 * 60 * 60 * 1000;
const WEEK = 7 * DAY;
const BEGINING_OF_TIMES = new Date(0);

var originalNames = [];
var overflowData = {pass: 2, index: 0};
var nameMap = {};
var freeNames = [];
var usedNames = [];

var fs = require('fs');
var names_location = path.join(__dirname, '../public/other/guest_names.txt');
var lines = fs.readFileSync(names_location).toString().split("\n");

for (var i = 0; i < lines.length; ++i) {
  var line = lines[i];
  originalNames.push(line);
  var username = line + "Guest";
  freeNames.push(username);
  nameMap[username] = {start: BEGINING_OF_TIMES, id: ""};
}

setInterval(freeExpiredNames, DAY);

function ensureFreeName() {
  if (freeNames.length > 0) {
    return;
  }
  var username = originalNames[overflowData.index] + "Guest_" + overflowData.pass;
  freeNames.push(username);
  nameMap[username] = {start: BEGINING_OF_TIMES, id: ""};
  overflowData.index += 1;
  if (overflowData.index >= originalNames.length) {
    overflowData.index = 0;
    overflowData.pass += 1;
  }
}

function freeExpiredNames() {
  while (usedNames.length > 0 && isNameExpired(usedNames[0])) {
    freeNames.push(usedNames.shift());
  }
}

function isNameExpired(username) {
  return isDateExpired(nameMap[username].start);
}

function isDateExpired(date) {
  return (new Date() - date.getTime() > WEEK);
}

exports.assignGuestNameAndSessionID = function() {
  ensureFreeName();
  var randIndex = Math.floor(Math.random() * freeNames.length);
  var username = freeNames[randIndex];
  freeNames.splice(randIndex, 1);
  usedNames.push(username);
  var now = new Date();
  var id = uuid();
  nameMap[username] = {start: now, id: id};
  return {username: username, uuid: id};
}

exports.isValidPair = function(username, id) {
  var data = nameMap[username];
  if (!data) {
    return false;
  }
  if (data.id != id) {
    return false;
  }
  if (isDateExpired(data.start)) {
    return false;
  }
  return true;
};