var config = require("./config.json");
var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");
var router = require("./modules/router");
var MongoStore = require("connect-mongo")(session);
var memoryStore = new MongoStore({ url: config.databaseLocation });

var secret = config.secret;

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser(secret));

app.use(session({
  secret: secret,
  saveUninitialized: false,
  resave: false,
  store: memoryStore,
  rolling: true
}));

app.use(router);

// Set session information to any socket that tries to connect.
io.use(function setSessionInfo(socket, next) {
  var req = socket.request;
  cookieParser(secret)(req, null, function (err) {
    memoryStore.get(req.signedCookies["connect.sid"], function (err, session) {
      if (!session) {
        console.log("Error - no session found");
        next(new Error("Authentication error"));
        return;
      } else {
        socket.session = session;
        socket.emit("session-info", socket.session);
      }
      next();
    });
  });
});

var SocketServer = require("./modules/socket_server");
var socketServer = new SocketServer(config.botPort);

var ConnectionHandler = require("./modules/connection_handler");
var connectionHandler = new ConnectionHandler(io, socketServer);
connectionHandler.start();

http.listen(config.port, function(){
  console.log("OSASG started on port " + config.port);
});
