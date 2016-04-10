var config = require("../config.json");
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const sessionModelName = "Session";
const userModelName = "User";

// --- Sessions ---
var SessionSchema = new Schema({
  session: Object
});

exports.Session = mongoose.model(sessionModelName, SessionSchema);

// --- Users ---
var userSchema = Schema({
  username: {type: String, unique: true},
  email: {type: String, unique: true, lowercase: true}
});


// Statics
// callback - function(error, user)
userSchema.statics.getOrCreateWithEmail = function (email, callback) {
  var self = this;
  email = email.toLowerCase();

  var baseUsername = "";
  
  // Pass the user to the callback if it exists.
  // If the user doesn't exist, create a new one and pass it to the callback
  var onLookup = function(error, user) {
    if (user || error) {
      callback(error, user);
    } else {
      // If the user doesn't already exist, try creating a username based on the email.
      baseUsername = email.split("@")[0];
      baseUsername = baseUsername.replace(/[^a-zA-Z0-9_\-]/g, "");
      console.log("Trying to create new user: " + baseUsername);
      self.findOne({username: baseUsername}, onSameNameLookup);
    }
  };

  // Used to keep track of what suffixes we've tried so far.
  var suffixValue = 0;

  // Makes sure the username is available.
  // If the username was taken, change the suffix and try again.
  // Otherwise, just pass along the error or the user to the callback.
  var onSameNameLookup = function(error, user) {
    console.log("Found:");
    console.log(error);
    console.log(user);
    if (!error && !user) {
      var userData = {
        username: baseUsername,
        email: email
      };
      if (suffixValue > 0) {
        userData.username += "_" + suffixValue;
      }
      self.create(userData, callback);
    } else if (error) {
      callback(error, null);
    } else {
      ++suffixValue;
      self.findOne({username: baseUsername + "_" + suffixValue}, onSameNameLookup);
    }
  }

  self.findOne({email: email}, onLookup);
};

// Methods
// callback - function(error, user)
userSchema.methods.changeUsername = function(newUsername, callback) {
  var self = this;
  if (newUsername == null || newUsername.length < 3) {
    callback(new Error("Username must be at least 3 charaters long."));
  } else if (newUsername.length > 20) {
    callback(new Error("Username must be at most 20 characters long."));
  } else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
    callback(new Error("Username must only contain characters, numbers, '-', or '_'."));
  } else {
    // If a user is found, then the username is not available.
    // Otherwise, procede with changeing the user's username.
    var onLookup = function(error, user) {
      if (error) {
        callback(error, null);
      } else if (user && user.username.toLowerCase() != self.username.toLowerCase()) {
        callback(new Error("The username \"" + user.username + "\" is already taken."), null);
      } else {
        self.username = newUsername;
        self.save(callback);
      } 
    };
    self.model(userModelName).findOne({username:  new RegExp(newUsername, "i")}, onLookup);
  }
};

exports.User = mongoose.model(userModelName, userSchema);

mongoose.connect(config.databaseLocation);
