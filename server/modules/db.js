"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid = require("uuid");
const mongoose = require("mongoose");
const mongoose_1 = require("mongoose");
let config = require("../config.json");
// DeprecationWarning: Mongoose: mpromise (mongoose's default promise library) is deprecated,
// plug in your own promise library instead: http://mongoosejs.com/docs/promises.html
mongoose.Promise = global.Promise;
const sessionModelName = "Session";
const userModelName = "User";
const botModelName = "Bot";
const matchModelName = "Match";
////////////////////
// --- Sessions ---
////////////////////
let sessionSchema = new mongoose_1.Schema({
    data: Object
});
;
;
exports.SessionModel = mongoose.model(sessionModelName, sessionSchema);
////////////////////
// --- Users ---
////////////////////
let userSchema = new mongoose_1.Schema({
    username: {
        type: String,
        unique: true,
        validate: {
            isAsync: true,
            validator: (v, cb) => {
                let usernameRegex = /[a-zA-Z0-9_\-]{3,20}/;
                let msg = "'" + v + "'' is not a valid username."
                    + " Usernames must satisfy the following regex: " + usernameRegex;
                cb(usernameRegex.test(v), msg);
            },
        }
    },
    password: { type: String, select: false }
});
;
;
userSchema.methods.changeUsername = function (newUsername, callback) {
    let thisUser = this;
    if (newUsername == null || newUsername.length < 3) {
        callback(new Error("Username must be at least 3 charaters long."), null);
    }
    else if (newUsername.length > 20) {
        callback(new Error("Username must be at most 20 characters long."), null);
    }
    else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
        callback(new Error("Username must only contain letters, numbers, '-', or '_'."), null);
    }
    else {
        // If a user is found, then the username is not available.
        // Otherwise, procede with changeing the user's username.
        let onLookup = function (error, user) {
            if (error) {
                callback(error, null);
            }
            else if (user && user.username.toLowerCase() != thisUser.username.toLowerCase()) {
                callback(new Error("The username \"" + user.username + "\" is already taken."), null);
            }
            else {
                thisUser.username = newUsername;
                thisUser.save(callback);
            }
        };
        thisUser.model(userModelName).findOne({ username: new RegExp(newUsername, "i") }, onLookup);
    }
};
userSchema.statics.getOrCreateWithUsername = function (username, password, callback) {
    let thisModel = this;
    // Pass the user to the callback if it exists.
    // If the user doesn't exist, create a new one and pass it to the callback
    let onLookup = function (error, user) {
        if (error) {
            console.log(error);
            callback(error, null);
        }
        else if (user) {
            if (!user.password || user.password == password) {
                callback(null, user);
            }
            else {
                callback(new Error("Wrong password"), null);
            }
        }
        else {
            // If the user doesn't already exist, creat it.
            let userData = {
                username: username,
                password: password
            };
            thisModel.create(userData, callback);
        }
    };
    thisModel.findOne({ username: username }).select("+password").exec(onLookup);
};
exports.UserModel = mongoose.model(userModelName, userSchema);
////////////////////
// --- Bots ---
////////////////////
var botSchema = new mongoose_1.Schema({
    username: { type: String, unique: true },
    password: { type: String, select: false },
    description: { type: String, maxlength: 1000 },
    owner: { type: mongoose_1.Schema.Types.ObjectId, ref: userModelName }
});
;
botSchema.methods.changeUsername = function (newUsername, callback) {
    let thisBot = this;
    if (newUsername == null || newUsername.length < 3) {
        callback(new Error("Username must be at least 3 charaters long."), null);
    }
    else if (newUsername.length > 20) {
        callback(new Error("Username must be at most 20 characters long."), null);
    }
    else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
        callback(new Error("Username must only contain letters, numbers, '-', or '_'."), null);
    }
    else {
        // If a user is found, then the username is not available.
        // Otherwise, procede with changeing the user's username.
        newUsername += "[bot]";
        var onLookup = function (error, bot) {
            if (error) {
                callback(error, null);
            }
            else if (bot && bot.username.toLowerCase() != this.username.toLowerCase()) {
                callback(new Error("The username \"" + bot.username + "\" is already taken."), null);
            }
            else {
                thisBot.username = newUsername;
                thisBot.save(callback);
            }
        };
        thisBot.model(botModelName).findOne({ username: new RegExp(newUsername, "i") }, onLookup);
    }
};
botSchema.methods.generateNewPassword = function (callback) {
    this.password = uuid.v4();
    this.save(callback);
};
botSchema.statics.createBotForUser = function (user, callback) {
    let thisModel = this;
    let baseUsername = user.username;
    let suffixValue = 0;
    var onSameNameLookup = function (error, bot) {
        if (error) {
            callback(error, null);
        }
        else if (!bot) {
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
            botData.username += "[bot]";
            thisModel.create(botData, callback);
        }
        else {
            // If we found a user with the desired username, try again with another one.
            ++suffixValue;
            thisModel.findOne({ username: baseUsername + "_" + suffixValue + "[bot]" }, onSameNameLookup);
        }
    };
    var onUserLookup = function (error, bots) {
        if (error) {
            callback(error, null);
        }
        else if (bots.length >= 5) {
            callback(new Error("Only 5 bots per user."), null);
        }
        else {
            thisModel.findOne({ username: baseUsername + "[bot]" }, onSameNameLookup);
        }
    };
    thisModel.find({ owner: user }, onUserLookup);
};
exports.BotModel = mongoose.model(botModelName, botSchema);
function connectToDatabase(URI) {
    if (mongoose.connection.readyState != 0) {
        console.log("Already connected to a database");
    }
    mongoose.connect(URI, { useMongoClient: true }, (error) => {
        if (error) {
            console.log("Failed to connect to mongo database");
            console.log(error);
        }
        else {
            console.log("Successfully connected to mongo database");
        }
    });
}
exports.connectToDatabase = connectToDatabase;
exports.connection = mongoose.connection;
