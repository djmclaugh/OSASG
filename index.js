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

gameManager.onMatchAdded(function(match) {
  io.to("api-active-matches").emit("api-active-matches-add", match);
});

gameManager.onMatchRemoved(function(match) {
  io.to("api-active-matches").emit("api-active-matches-remove", match);
});

gameManager.onMatchUpdated(function(match) {
  io.to("api-active-matches").emit("api-active-matches-update", match);
});

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
  socket.emit("session-info", socket.session);
  socket.on("api-active-matches", function() {
    socket.emit("api-active-matches", gameManager.getMatchesUserCanJoin(socket.session.username));
    socket.join("api-active-matches");
  });
  socket.on("api-active-bots", function() {
    var botData = bots.map(function(bot) {
      return {id: bot.session.username, gameList: bot.session.gameList};
    });
    socket.emit("api-active-bots", botData);
    socket.join("api-active-bots");
  });
  socket.on("join", function(data) {
    gameManager.getMatchupById(data.matchId).addPlayer(socket, data.seat);
  });
  socket.on("request-bot", function(data) {
    for (var i = 0; i < bots.length; ++i) {
      if (bots[i].session.username == data.username) {
        bots[i].emit("join", {matchId: data.matchId, seat:data.seat});
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
  io.to("api-active-bots").emit("api-active-bots-add", {id: socket.session.username, gameList: socket.session.gameList});
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
    io.to("api-active-bots").emit("api-active-bots-remove", {id: socket.session.username});
  });
});

http.listen(8881, function(){
  console.log("OSASG started on port 8881");
});
