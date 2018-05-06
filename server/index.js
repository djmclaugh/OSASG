var config = require("./config.json");
var path = require("path");
var bodyParser = require("body-parser");
var express = require("express");
var matchManager = new (require("./modules/matches/match_manager").MatchManager)();
var app = express();
var http = require("http").Server(app);
var db =  require("./modules/db");

if (config.mongoURI.length > 0) {
  db.connectToDatabase(config.mongoURI);
} else {
  console.log("Starting server without a database. Some features will be unavailable");
}

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

// Setup session
var Session = require("express-session");
var sessionStore;
var options = {
  secret: config.secret,
  saveUninitialized: true,
  resave: false,
  rolling: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000}
}
var router;
if (config.mongoURI.length > 0) {
  const MongoStore = require('connect-mongo')(Session);
  options.store = new MongoStore({ mongooseConnection: db.connection });
  router = require("./modules/router").getRouter(null, matchManager);
} else {
  console.log("Starting OSASG with memory store for sessions. (Should not be used in prod)");
  options.store = new Session.MemoryStore();
  router = require("./modules/router").getRouter(options.store, matchManager);
}
var session = Session(options);
app.use(session);

// Setup router
app.use(router);

var SocketServer = require("./modules/sockets/socket_server").SocketServer;
var SocketAuthenticator = require("./modules/sockets/socket_authenticator").SocketAuthenticator;
let authenticateRequest = function(request, callback) {
  session(request, {}, () => {
    if (request.session.identifier) {
      callback(null, {
        identifier: request.session.identifier,
        username: request.session.username
      });
    } else {
      callback(null, null);
    }
  });
};

let authenticateInfo = function(info, callback) {
  if (config.mongoURI.length == 0) {
    callback(null, {
      identifier: info.identifier,
      username: info.identifier + "[bot]",
    });
    return;
  }
  db.BotModel.findById(info.identifier).select("+password").exec(function(error, bot) {
    if (error) {
      callback(error, null);
    } else if (!bot) {
      callback(null, null);
    } else if (!info.password || bot.password != info.password) {
      callback(new Error("Wrong password"), null);
    } else {
      callback(null, {
        identifier: info.identifier,
        username: bot.username
      });
    }
  });
};
let authenticator = new SocketAuthenticator(authenticateRequest, authenticateInfo, 5000);
let socketServer = new SocketServer(http, authenticator);

const matchLobby = new (require("./modules/match_lobby").MatchLobby)(socketServer, matchManager);

http.listen(config.port, function(){
  console.log("OSASG started on port " + config.port);
});
