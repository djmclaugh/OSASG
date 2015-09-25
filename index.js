var express = require("express");
var session = require('express-session');
var cookieParser = require('cookie-parser');

var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

var path = require("path");
var router = require("./modules/router");

var secret = 'not_secret';

var MongoStore = require('connect-mongo')(session);
var memoryStore = new MongoStore({ db: "OSASG"});

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

var gameManager = new (require("./modules/game_manager"))();

io.use(function setSessionInfo(socket, next) {
  var req = socket.request;
  cookieParser(secret)(req, null, function (err) {
    memoryStore.get(req.signedCookies["connect.sid"], function (err, session) {
      if (!session) {
        console.log("Error - no session found");
      } else {
        socket.session = session;
      }
      next();
    });
  });
});

io.on('connection', function (socket) {
  console.log(socket.session.username + " has connected!");
  gameManager.automatchPlayer(socket, "Connect6");
  socket.on('disconnect', function(){
    console.log(socket.session.username + " has disconnected!");
  });
})

http.listen(8881, function(){
  console.log("OSASG started on port 8881");
});
