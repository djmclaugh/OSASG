var config = require("./config.json");
var path = require("path");
var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var http = require("http").Server(app);

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
const matchManager = new (require("./modules/matches/match_manager").MatchManager)();
var router;
if (config.databaseLocation.length > 0) {
  const MongoStore = require('connect-mongo')(session);
  options.store = new MongoStore({ url: "mongodb://" + config.databaseLocation + "/test" });
  router = require("./modules/router").getRouter(null, matchManager);
} else {
  console.log("Starting OSASG with memory store for sessions. (Should not be used in prod)");
  options.store = new Session.MemoryStore();
  router = require("./modules/router").getRouter(options.store, matchManager);
}
var session = Session(options);
app.use(session);

// Setup passwordless
var PasswordlessMongoStore = require("passwordless-mongostore-bcrypt-node");
var passwordless = require("passwordless");

var emailDelivery = function(tokenToSend, uidToSend, recipient, callback) {
  var email = {
      text: "You can now access your account by following this link:\n" +
            config.serverURL + ":" + config.port + "?token=" + tokenToSend + "&uid=" +
            encodeURIComponent(uidToSend),
  };
  // TODO(djmclaugh): This was added so that I can get the link when email delivery failed.
  // This should be removed once I figure out a better email delivery system.
  console.log("Trying to send the following email:");
  console.log(email);
  callback();
};
if (config.passwordlessStoreLocation.length > 0) {
  passwordless.init(new PasswordlessMongoStore(config.passwordlessStoreLocation));
} else {
  console.log("Starting OSASG with memory store for passwordless. (Should not be used in prod)");
  var MemoryStore = require("passwordless-memorystore");
  passwordless.init(new MemoryStore());
}
passwordless.addDelivery(emailDelivery);

app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({successRedirect: "http://" + config.clientURL}));

// Setup router
app.use(router);


var SocketServer = require("./modules/sockets/socket_server").SocketServer;
var SocketAuthenticator = require("./modules/sockets/socket_authenticator").SocketAuthenticator;
let authenticateRequest = function(request, callback) {
  session(request, {}, () => {
    if (request.session) {
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
  callback(null, null);
};
let authenticator = new SocketAuthenticator(authenticateRequest, authenticateInfo, 5000);
let socketServer = new SocketServer(http, authenticator);

/*
app.ws("/", function(ws, req, next, other) {
  // Wrap in a try/catch because otherwise errors get dropped for some reason.
  // TODO(djmclaugh): find root cause and actualy fix.
  try {
    var message = {};
    message.type = "user-info";
    message.username = req.session.username;
    message._id = req.session.user ? req.session.user.id : null;
    connectionHandler._addPlayer(new Player(ws, message.username, message._id));
    ws.send(JSON.stringify(message));
  } catch (e) {
    console.log("ERROR IN index.js' 'app.ws(\"/\"...'.");
    console.log(e);
  }
});
*/
const matchLobby = new (require("./modules/match_lobby").MatchLobby)(socketServer, matchManager);

http.listen(config.port, function(){
  console.log("OSASG started on port " + config.port);
});
