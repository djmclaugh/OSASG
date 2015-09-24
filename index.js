var express = require("express");
var session = require('express-session');
var cookieParser = require('cookie-parser');
var app = express();
var http = require("http").Server(app);
var io = require("socket.io")(http);
var path = require("path");
var router = require("./modules/router");

var MongoStore = require('connect-mongo')(session);

var secret = 'not_secret';
var memoryStore = new MongoStore({ db: "OSASG"});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

app.use(cookieParser(secret));

app.use(session({
  secret: secret,
  saveUninitialized: true,
  resave: true,
  store: memoryStore
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
var Connect6 = require("./public/javascript/games/connect6").Connect6;
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

io.on('connection', function (socket) {
  console.log(socket.session.username + " has connected!");
  players.push(socket);
  var data = {};
  if (players.length == 2) {
    data.view = "BLACK";
    data.names = [players[0].session.username, players[1].session.username];
    data.settings = {};
    players[0].emit("init", data);
    data.view = "WHITE";
    players[1].emit("init", data);
    players[0].on("play", receiveBlackMove);
    players[1].on("play", receiveWhiteMove);
  } else if (players.length > 2) {
    data.view = "SPECTATOR";
    data.names = [players[0].session.username, players[1].session.username];
    data.gameData = game.makeGameData();
    players[players.length - 1].emit("init", data);
  }
  socket.on('disconnect', function(){
    console.log(socket.session.username + " has disconnected!");
  });
})

http.listen(8881, function(){
  console.log('listening on *:8881');
});
