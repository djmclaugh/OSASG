var config = require("../config.json");
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

var uuid = require("uuid");

const sessionModelName = "Session";
const userModelName = "User";
const botModelName = "Bot";
const matchModelName = "Match";

// --- Sessions ---
var SessionSchema = new Schema({
  data: Object
});

exports.Session = mongoose.model(sessionModelName, SessionSchema);

// --- Users ---
var userSchema = Schema({
  username: {
    type: String,
    unique: true,
    validate: {
      isAsync: true,
      validator: function(v, cb) {
        var usernameRegex = /[a-zA-Z0-9_\-]{3,20}/;
        var msg = "'" + v + "'' is not a valid username."
            + " Usernames must satisfy the following regex: "+ usernameRegex;
        cb(usernameRegex.test(v), msg);
      },
    }
  },
  password: {type: String, select: false}
});


// Statics
// callback - function(error, user)
userSchema.statics.getOrCreateWithUsername = function (username, password, callback) {
  var self = this;

  // Pass the user to the callback if it exists.
  // If the user doesn't exist, create a new one and pass it to the callback
  var onLookup = function(error, user) {
    if (error) {
      callback(error, null);
    } else if (user) {
      if (!user.password || user.password == password) {
        callback(null, user);
      } else {
        callback(new Error("Wrong password"), null);
      }
    } else {
      // If the user doesn't already exist, creat it.
      var userData = {
        username: username,
        password: password
      };
      self.create(userData, callback);
    }
  }
  self.findOne({username: username}).select("+password").exec(onLookup);
}

// Methods
// callback - function(error, user)
userSchema.methods.changeUsername = function(newUsername, callback) {
  var self = this;
  if (newUsername == null || newUsername.length < 3) {
    callback(new Error("Username must be at least 3 charaters long."));
  } else if (newUsername.length > 20) {
    callback(new Error("Username must be at most 20 characters long."));
  } else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
    callback(new Error("Username must only contain letters, numbers, '-', or '_'."));
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

// --- Bots ---
var botSchema = Schema({
  username: {type: String, unique: true},
  password: {type: String, select: false},
  description: {type: String, maxlength: 1000},
  owner: {type: Schema.Types.ObjectId, ref: userModelName}
});


// Statics
// callback - function(error, user)
botSchema.statics.createBotForUser = function (user, callback) {
  var self = this;

  var baseUsername = user.username;
  var suffixValue = 0;

  var onSameNameLookup = function(error, bot) {
    if (error) {
      callback(error, null);
    } else if (!bot) {
      // If we didn't encounter any errors and didn't find any other bots with that username, we'll
      // use that username.
      var botData = {
        username: baseUsername,
        password: uuid.v4(),
        owner: user
      };
      if (suffixValue > 0) {
        botData.username += "_" + suffixValue;
      }
      botData.username += "[bot]"
      self.create(botData, callback);
    } else {
      // If we found a user with the desired username, try again with another one.
      ++suffixValue;
      self.findOne({username: baseUsername + "_" + suffixValue + "[bot]"}, onSameNameLookup);
    }
  }

  var onUserLookup = function(error, bots) {
    if (error) {
      callback(error, null);
    } else if (bots.length >= 5) {
      var error = new Error("Only 5 bots per user.");
      callback(error, null);
    } else {
      self.findOne({username: baseUsername + "[bot]"}, onSameNameLookup);
    }
  };

  self.find({owner: user}, onUserLookup);
};

// Methods
// callback - function(error, bot)
botSchema.methods.changeUsername = function(newUsername, callback) {
  var self = this;
  if (newUsername == null || newUsername.length < 3) {
    callback(new Error("Username must be at least 3 charaters long."));
  } else if (newUsername.length > 20) {
    callback(new Error("Username must be at most 20 characters long."));
  } else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
    callback(new Error("Username must only contain letters, numbers, '-', or '_'."));
  } else {
    // If a user is found, then the username is not available.
    // Otherwise, procede with changeing the user's username.
    newUsername += "[bot]"
    var onLookup = function(error, bot) {
      if (error) {
        callback(error, null);
      } else if (bot && bot.username.toLowerCase() != self.username.toLowerCase()) {
        callback(new Error("The username \"" + bot.username + "\" is already taken."), null);
      } else {
        self.username = newUsername;
        self.save(callback);
      }
    };
    self.model(botModelName).findOne({username:  new RegExp(newUsername, "i")}, onLookup);
  }
};

// callback - function(error, bot)
botSchema.methods.generateNewPassword = function(callback) {
  this.password = uuid.v4();
  this.save(callback);
};

exports.Bot = mongoose.model(botModelName, botSchema);

// --- Matches ---
var matchSchema = Schema({
  p1: {
    identifier: String,
    bot: {type: Schema.Types.ObjectId, ref:botModelName},
    user: {type: Schema.Types.ObjectId, ref:userModelName}
  },
  p2: {
    identifier: String,
    bot: {type: Schema.Types.ObjectId, ref:botModelName},
    user: {type: Schema.Types.ObjectId, ref:userModelName}
  },
  result: {type: String, enum: ["P1", "P2", "DRAW"]},
  game: String,
  timeControls: {type: String, enum: ["Bullet", "Rapid", "Long"]},
});


// Statics
// callback - function(error, match)
matchSchema.statics.addMatchToDatabase = function(match, result, callback) {
  // Time controls in a ranked match are the same for both players so we only have to check the
  // p1 time controls. We also assume a Bronstein timer.
  if (match._settings.p1Timer.type != "Bronstein") {
    callback(new Error("Invalid timer type for ranked match."), null);
    return;
  }

  if (match._p1.identifier == match._p2.identifier) {
    callback(new Error("Ranked matches should be between two different players."), null);
    return;
  }

  var timePerTurn = match._settings.p1Timer.bonusTime;
  var timeControls = "Long";
  if (timePerTurn <= 30 * 1000) {
    timeControls = "Rapid";
  }
  if (timePerTurn <= 5 * 1000) {
    timeControls = "Bullet";
  }
  var p1Object = match._p1.username.indexOf("[bot]") == -1 ?
      {user: match._p1.identifier} :
      {bot: match._p1.identifier};
  p1Object.identifier = match._p1.identifier;
  var p2Object = match._p2.username.indexOf("[bot]") == -1 ?
      {user: match._p2.identifier} :
      {bot: match._p2.identifier};
  p2Object.identifier = match._p2.identifier;
  matchData = {
    p1: p1Object,
    p2: p2Object,
    result: result,
    game: match._gameTitle,
    timeControls: timeControls
  };

  this.create(matchData, callback);
};

// callback - function(error, matches)
matchSchema.statics.getMatchesForPlayer = function(identifier, callback) {
  this.find({$or: [
      {"p1.identifier": identifier},
      {"p2.identifier": identifier},
  ]})
      .populate("p1.bot", "username")
      .populate("p1.user", "username")
      .populate("p2.bot", "username")
      .populate("p2.user", "username")
      .exec(function(error, matches) {
        callback(error, matches);
      });
};

exports.Match = mongoose.model(matchModelName, matchSchema);

mongoose.Promise = global.Promise;

exports.connectToDatabase = function (URI, username, password) {
  if (mongoose.connection.readyState != 0) {
    console.log("Already connected to a database");
  }
  mongoose.connect(URI, { useMongoClient: true }, (error) => {
    if (error) {
      console.log("Failed to connect to mongo database");
      console.log(error);
    } else {
      console.log("Successfully connected to mongo database");
    }
  });
}

exports.connection = mongoose.connection;
