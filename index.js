var express = require("express");
var session = require("express-session");
var cookieParser = require("cookie-parser");

var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);

var path = require("path");
var router = require("./modules/router");

var secret = "not_secret";

var MongoStore = require("connect-mongo")(session);
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

var gameManager = require("./modules/game_manager").prototype.getInstance();
var bots = [];

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

io.on("connection", function (socket) {
  console.log(socket.session.username + " has connected!");
  socket.on("join", function(data) {
    gameManager.getMatchupById(data.matchId).addPlayer(socket, data.seat);
  });
  socket.on("request-bot", function(data) {
    for (var i = 0; i < bots.length; ++i) {
      if (bots[i].session.username == data.username) {
        bots[i].emit("join", {matchId: data.matchId});
        break;
      }
    }
  });
  socket.on("disconnect", function(){
    console.log(socket.session.username + " has disconnected!");
  });
});

var SocketServer = require("./modules/socket_server");
var socketServer = new SocketServer(8882);
socketServer.onConnection(function(socket) {
  console.log(socket.session.username + " has connected!");
  bots.push(socket);
  socket.on("join", function(data) {
    var matchup = gameManager.getMatchupById(data.matchId);
    if (matchup) {
      try {
        matchup.addPlayer(socket, data.seat);
      } catch (e) {}
    }
  });
  socket.on("disconnect", function() {
    bots.splice(bots.indexOf(socket), 1);
    console.log(socket.session.username + " has disconnected!");
  });
});

http.listen(8881, function(){
  console.log("OSASG started on port 8881");
});
