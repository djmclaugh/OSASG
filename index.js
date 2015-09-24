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

var players = [];
var Connect6 = require("./modules/games").Connect6;
var game = new Connect6({});

function receiveBlackMove(move) {
  if (game.turnNumber % 2 == 1) {
    return;
  }
  var error = game.validateMove(move);
  if (error) {
    console.log(error);
    players[1].emit("error", error);
    return;
  }
  game.makeMove(move);
  players[0].broadcast.emit("play", move);
}

function receiveWhiteMove(move) {
  if (game.turnNumber % 2 === 0) {
    return;
  }
  var error = game.validateMove(move);
  if (error) {
    console.log(error);
    players[0].emit("error", error);
    return;
  }
  game.makeMove(move);
  players[1].broadcast.emit("play", move);
}

var hasGameStarted = false;

io.on('connection', function (socket) {
  console.log(socket.session.username + " has connected!");
  var playerIndex = -1;
  for (var i = 0; i < players.length; ++i) {
    if (players[i].session.username == socket.session.username) {
      players[i] = socket;
      playerIndex = i;
    }
  }
  if (playerIndex == -1) {
    players.push(socket);
    playerIndex = players.length - 1;
  }
  
  var data = {};
  data.gameData = game.makeGameData();
  
  if (playerIndex == 0) {
    data.view = "BLACK";
    socket.on("play", receiveBlackMove);
  } else if (playerIndex == 1) {
    data.view = "WHITE";
    socket.on("play", receiveWhiteMove);
  } else {
    data.view = "SPECTATOR";
  }
  
  if (hasGameStarted) {
    data.names = [players[0].session.username, players[1].session.username];
    socket.emit("init", data);
  }
  
  if (!hasGameStarted && players.length == 2) {
    data.names = [players[0].session.username, players[1].session.username];
    hasGameStarted = true;
    data.view = "BLACK";
    players[0].emit("init", data);
    data.view = "WHITE";
    players[0].emit("init", data);
  }
  
  socket.on('disconnect', function(){
    console.log(socket.session.username + " has disconnected!");
  });
})

http.listen(8881, function(){
  console.log("OSASG started on port 8881");
});
