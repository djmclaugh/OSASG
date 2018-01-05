import * as uuid from "uuid";
import * as mongoose from "mongoose";
import { Connection, Document, Model, Schema } from "mongoose";
import { MongoError } from "mongodb";

let config: any = require("../config.json");

// DeprecationWarning: Mongoose: mpromise (mongoose's default promise library) is deprecated,
// plug in your own promise library instead: http://mongoosejs.com/docs/promises.html
(<any>mongoose).Promise = global.Promise;

const sessionModelName = "Session";
const userModelName = "User";
const botModelName = "Bot";
const matchModelName = "Match";

////////////////////
// --- Sessions ---
////////////////////
let sessionSchema: Schema = new Schema({
  data: Object
});
export interface Session {
  data: any
};
export interface SessionDocument extends Session, Document {};
export const SessionModel: Model<SessionDocument> = mongoose.model(sessionModelName, sessionSchema);

////////////////////
// --- Users ---
////////////////////
let userSchema: Schema = new Schema({
  username: {
    type: String,
    unique: true,
    validate: {
      isAsync: true,
      validator: (v: string, cb: (b: boolean, msg: string) => void) => {
        let usernameRegex: RegExp = /[a-zA-Z0-9_\-]{3,20}/;
        let msg: string = "'" + v + "'' is not a valid username."
            + " Usernames must satisfy the following regex: "+ usernameRegex;
        cb(usernameRegex.test(v), msg);
      },
    }
  },
  password: {type: String, select: false}
});
export interface User {
  username: string,
  password?: string,
};
export interface UserDocument extends User, Document {
  changeUsername: (newUsername: string, callback: (err: Error, user: UserDocument) => void) => void
};
userSchema.methods.changeUsername = function(
    newUsername: string,
    callback: (err: Error, user: UserDocument) => void) {
  let thisUser: UserDocument = this;
  if (newUsername == null || newUsername.length < 3) {
    callback(new Error("Username must be at least 3 charaters long."), null);
  } else if (newUsername.length > 20) {
    callback(new Error("Username must be at most 20 characters long."), null);
  } else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
    callback(new Error("Username must only contain letters, numbers, '-', or '_'."), null);
  } else {
    // If a user is found, then the username is not available.
    // Otherwise, procede with changeing the user's username.
    let onLookup: (err: MongoError, user: UserDocument) => void =
        function(error: MongoError, user: UserDocument) {
      if (error) {
        callback(error, null);
      } else if (user && user.username.toLowerCase() != thisUser.username.toLowerCase()) {
        callback(new Error("The username \"" + user.username + "\" is already taken."), null);
      } else {
        thisUser.username = newUsername;
        thisUser.save(callback);
      }
    };
    thisUser.model(userModelName).findOne({username: new RegExp(newUsername, "i")}, onLookup);
  }
};

interface IUserModel extends Model<UserDocument> {
  /**
   * Fetches the user document with the given username.
   * If the user exists and the password is correct, the user document is passed to the callback.
   * If the user exists but the password is wrong, an error is passed to the callback.
   * If the user doesn't exist, a new user is created with the provied username and password. That
   * new user is then passed to the callback.
   */
  getOrCreateWithUsername: (
    username: string,
    password: string,
    callback: (error: Error, user: UserDocument) => void
  ) => void
}
userSchema.statics.getOrCreateWithUsername = function (
    username: string, password: string, callback: (error: Error, user: UserDocument) => void) {
  let thisModel: IUserModel = this;
  // Pass the user to the callback if it exists.
  // If the user doesn't exist, create a new one and pass it to the callback
  let onLookup: (err: MongoError, user: UserDocument) => void =
      function(error: MongoError, user: UserDocument) {
    if (error) {
      console.log(error);
      callback(error, null);
    } else if (user) {
      if (!user.password || user.password == password) {
        callback(null, user);
      } else {
        callback(new Error("Wrong password"), null);
      }
    } else {
      // If the user doesn't already exist, creat it.
      let userData: User = {
        username: username,
        password: password
      };
      thisModel.create(userData, callback);
    }
  }
  thisModel.findOne({username: username}).select("+password").exec(onLookup);
}

export const UserModel: IUserModel =
    mongoose.model<UserDocument, IUserModel>(userModelName, userSchema);

////////////////////
// --- Bots ---
////////////////////
var botSchema: Schema = new Schema({
  username: {type: String, unique: true},
  password: {type: String, select: false},
  description: {type: String, maxlength: 1000},
  owner: {type: Schema.Types.ObjectId, ref: userModelName}
});
export interface Bot {
  username: string,
  password: string,
  description: string
  owner: string|User
}
export interface BotDocument extends Bot, Document {
  changeUsername: (newUsername: string, callback: (err: Error, bot: BotDocument) => void) => void,
  generateNewPassword: (callback: (err: Error, bot: BotDocument) => void) => void
};
botSchema.methods.changeUsername = function(newUsername, callback) {
  let thisBot: BotDocument = this;
  if (newUsername == null || newUsername.length < 3) {
    callback(new Error("Username must be at least 3 charaters long."), null);
  } else if (newUsername.length > 20) {
    callback(new Error("Username must be at most 20 characters long."), null);
  } else if (!new RegExp(/^[a-zA-Z0-9_\-]*$/).test(newUsername)) {
    callback(new Error("Username must only contain letters, numbers, '-', or '_'."), null);
  } else {
    // If a user is found, then the username is not available.
    // Otherwise, procede with changeing the user's username.
    newUsername += "[bot]"
    var onLookup = function(error, bot) {
      if (error) {
        callback(error, null);
      } else if (bot && bot.username.toLowerCase() != this.username.toLowerCase()) {
        callback(new Error("The username \"" + bot.username + "\" is already taken."), null);
      } else {
        thisBot.username = newUsername;
        thisBot.save(callback);
      }
    };
    thisBot.model(botModelName).findOne({username: new RegExp(newUsername, "i")}, onLookup);
  }
};
botSchema.methods.generateNewPassword = function(callback) {
  this.password = uuid.v4();
  this.save(callback);
};

interface IBotModel extends Model<BotDocument> {
  createBotForUser: (user: User, callback: (error: Error, bot: BotDocument) => void) => void
}
botSchema.statics.createBotForUser = function (user: User, callback) {
  let thisModel: IBotModel = this;
  let baseUsername: string = user.username;
  let suffixValue = 0;

  var onSameNameLookup = function(error: MongoError, bot: BotDocument) {
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
      thisModel.create(botData, callback);
    } else {
      // If we found a user with the desired username, try again with another one.
      ++suffixValue;
      thisModel.findOne({username: baseUsername + "_" + suffixValue + "[bot]"}, onSameNameLookup);
    }
  }

  var onUserLookup = function(error: MongoError, bots: Array<BotDocument>) {
    if (error) {
      callback(error, null);
    } else if (bots.length >= 5) {
      callback(new Error("Only 5 bots per user."), null);
    } else {
      thisModel.findOne({username: baseUsername + "[bot]"}, onSameNameLookup);
    }
  };

  thisModel.find({owner: user}, onUserLookup);
};

export const BotModel: IBotModel = mongoose.model<BotDocument, IBotModel>(botModelName, botSchema);

export function connectToDatabase(URI: string): void {
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

export const connection: Connection = mongoose.connection;
