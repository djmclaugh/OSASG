var config = require("./config.json");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var http = require("http").Server(app);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(config.secret));

// Setup session
var session = require("express-session");
var memoryStore = new (require("express-sessions"))({
  storage: "mongodb"
});
app.use(session({
  secret: config.secret,
  saveUninitialized: false,
  resave: false,
  store: memoryStore,
  rolling: true
}));

// Setup passwordless
var PasswordlessMongoStore = require("passwordless-mongostore-bcrypt-node");
var passwordless = require("passwordless");

var emailDelivery = function(tokenToSend, uidToSend, recipient, callback) {
  var email = {
      text: "You can now access your account by following this link:\n" +
            config.appURL + ":" + config.port + "?token=" + tokenToSend + "&uid=" +
            encodeURIComponent(uidToSend),
  };
  //TODO(djmclaugh): This was added so that I can get the link when email delivery failed.
  // This should be removed once I figure out a better email delivery system.
  console.log("Trying to send the following email:");
  console.log(email);
};
passwordless.init(new PasswordlessMongoStore(config.passwordlessStoreLocation));
passwordless.addDelivery(emailDelivery);

app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({ successRedirect: "/"}));

// Setup router
var router = require("./modules/router");
app.use(router);

// Setup websockets
var io = require("socket.io")(http);
// Set session information to any socket that tries to connect.
io.use(function setSessionInfo(socket, next) {
  var req = socket.request;
  cookieParser(config.secret)(req, null, function (err) {
    memoryStore.get(req.signedCookies["connect.sid"], function (err, session) {
      if (!session) {
        console.log("Error - no session found");
        next(new Error("Authentication error"));
        return;
      } else {
        socket.session = {};
        socket.session.username = session.username;
        socket.session.identifier = session.isGuest ? session.username : session.passwordless;
        socket.emit("session-info", socket.session);
      }
      next();
    });
  });
});

// Setup TCP socket server for bots
var SocketServer = require("./modules/socket_server");
var socketServer = new SocketServer(config.botPort);

var ConnectionHandler = require("./modules/connection_handler");
var connectionHandler = new ConnectionHandler(io, socketServer);
connectionHandler.start();

http.listen(config.port, function(){
  console.log("OSASG started on port " + config.port);
});
