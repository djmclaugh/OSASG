var config = require("./config.json");
var path = require("path");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
var express = require("express");
var app = express();
var http = require("http").Server(app);
var expressWs = require("express-ws")(app, http);
var Player = require("./modules/matches/player");

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser(config.secret));

// Setup session
var session = require("express-session");

const MongoStore = require('connect-mongo')(session);
var sessionStore = new MongoStore({ url: 'mongodb://localhost/test' });
app.use(session({
  secret: config.secret,
  saveUninitialized: true,
  resave: false,
  store: sessionStore,
  rolling: true,
  cookie: {maxAge: 24 * 60 * 60 * 1000}
}));

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
passwordless.init(new PasswordlessMongoStore(config.passwordlessStoreLocation));
passwordless.addDelivery(emailDelivery);

app.use(passwordless.sessionSupport());
app.use(passwordless.acceptToken({successRedirect: "http://" + config.clientURL}));

// Setup router
var router = require("./modules/router");
app.use(router);

// Setup TCP socket server for bots
var SocketServer = require("./modules/socket_server");
var socketServer = new SocketServer(config.botPort);

var ConnectionHandler = require("./modules/connection_handler");
var connectionHandler = new ConnectionHandler(socketServer);
connectionHandler.start();

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

http.listen(config.port, function(){
  console.log("OSASG started on port " + config.port);
});
