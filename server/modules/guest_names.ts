import * as fs from 'fs';
import * as path from "path";
import { SessionModel } from "./db";

let namesLocation: string = path.join(__dirname, '../guest_names.txt');
let sessionStore = null;

function getAvailablesGuestNames(callback): void {
  var lines = fs.readFileSync(namesLocation).toString().split("\r\n");
  if (lines.length == 1) {
    lines = lines[0].split("\n");
  }
  var names = [];
  for (var i = 0; i < lines.length; ++i) {
    names.push(lines[i] + "[guest]");
  }

  let onFetchAll = function(error, sessions) {
    if (error) {
      callback(error, null);
      return;
    }
    for (var i = 0; i < sessions.length; ++i) {
      var index = names.indexOf(sessions[i].username);
      if (index >= 0) {
        names.splice(index, 1);
      }
    }
    callback(null, names);
  };

  if (!sessionStore) {
    SessionModel.find({}, onFetchAll);
  } else {
    sessionStore.all(onFetchAll);
  }
}

export function getGuestName(callback: (name: string) => void): void {
  getAvailablesGuestNames(function(error, names) {
    if (error) {
      throw error;
    }
    if (names.length == 0) {
      callback(null);
    } else {
      var randIndex = Math.floor(Math.random() * names.length);
      var username = names[randIndex];
      callback(username);
    }
  });
};

export function setStore(store): void {
  sessionStore = store;
}
