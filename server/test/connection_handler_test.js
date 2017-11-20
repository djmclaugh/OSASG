/* Comment out for now, this needs a major fix that will happen in it's own commit.
   Should mock out client and bot servers using sinon.
var assert = require("assert");
var WebsocketServer = require("socket.io");
var clientIO = require("socket.io-client");
var SocketAdapter = require("../modules/socket_adapter");
var SocketServer = require("../modules/socket_server");
var ConnectionHandler = require("../modules/connection_handler");
var net = require("net");

const CLIENT_PORT = 10000;
const CLIENT_SERVER_URL = "http://localhost:" + CLIENT_PORT; 
const BOT_PORT = 10001;

const gameManager = require("../modules/matches/game_manager").prototype.getInstance();

describe("Connection Handler", function() {
  var botServer;
  var clientServer;
  var connectionHandler;

  beforeEach(function() {
    gameManager.reset();
    clientServer = WebsocketServer.listen(CLIENT_PORT);
    var counter = 0;
    clientServer.use(function setSessionInfo(socket, next) {
      socket.session = {};
      socket.session.username = "client_" + counter;
      socket.session.identifier = "client_id_" + counter;
      socket.emit("session", socket.session);
      counter++;
      next();
    });
    botServer = new SocketServer(BOT_PORT);
    connectionHandler = new ConnectionHandler(clientServer, botServer);
    connectionHandler.start();
  });

  afterEach(function(done) {
    clientServer.close();
    connectionHandler.stop();
    botServer.close(done);
  });

  it("should send suscribed clients updates about the active matches", function(done) {
    const ACTIVE_MATCHES = "api-active-matches";
    socket_0 = clientIO(CLIENT_SERVER_URL, {forceNew: true});
    socket_1 = clientIO(CLIENT_SERVER_URL, {forceNew: true});
    socket_2 = clientIO(CLIENT_SERVER_URL, {forceNew: true});

    var clients =
      [unsuscribed_uninvited, suscribed_uninvited, unsuscribed_invited, suscribed_invited];
    var expectations = [];
    // socket_0 will do nothing and shouldn't receive any match related updates.
    expectations[0] = [];
    // socket_1 will subscribe as soon as possible and should see all updates.
    expectations[1] = [
      {action: "set", matches: [0]},
      {action: "add", match: 2},
      {action: "remove", match: 0},
      {action: "update", match: 2}
    ];
    // socket_2 will subscribe later
    expectations[2] = [
      {action: "set", matches: [0]},
      {action: "add", match: 2},
      {action: "remove", match: 0},
      {action: "update", match: 2}
    ];
    
    var hasTriggeredStep2 = false;

    function checkIfExpectedForClient(i) {
      clients[i].on(ACTIVE_MATCHES, function(data) {
        var assertMessage = "Socket " + i + " received:\n"
            + JSON.stringify(data) + "\n\n But wasn't expecting any.";
        assert(expectations[i].length > 0, assertMessage);
        var expected = expectations[i][0];
        assertMessage = "Socket " + i + " received:\n"
            + JSON.stringify(data) + "\n\nBut was expecting: \n"
            + JSON.stringify(expected);
        assert(expected.action in data, assertMessage);
        if (expected.action == "set") {
          assert(data[expected.action].length == expected.matches.length, assertMessage);
          for (var index = 0; index < expected.matches.length; ++index) {
            assert(data[expected.action][index].id == "tictactoe_" + expected.matches[index],
                assertMessage);
          }
        } else {
          assert.equal(data[expected.action].id, "tictactoe_" + expected.match, assertMessage);
        }
        expectations[i].splice(0, 1);
        if (isCompleted()) {
          done();
        } else if (!hasTriggeredStep2 && isStep1Completed()) {
          hasTriggeredStep2 = true;
          step2();
        }
      });
    }

    function isStep1Completed() {
      return expectations[0].length == 0
          && expectations[1].length == 3
    }

    function isCompleted() {
      for (var i = 0; i < clients.length; ++i) {
        if (expectations[i].length > 0) {
          return false;
        }
      }
      return true;
    }

    for (var i = 0; i < clients.length; ++i) {
      checkIfExpectedForClient(i);
    }

    var match_0;
    var match_1;
    var match_2;
    var match_3;

    function step1() {
      match_0 = gameManager.createNewMatchup("Tictactoe", {});
      suscribed.emit(ACTIVE_MATCHES);
    }

    function step2() {
      match_2 = gameManager.createNewMatchup("Tictactoe", {});
      gameManager.removeMatch(match_0);
      suscribed_invited.emit("join", {matchId: "tictactoe_2", seat: 1});
      suscribed_invited.emit("join", {matchId: "tictactoe_3", seat: 2});
    }

    step1();
  });

  it("should send suscribed clients updates about the active bots", function(done) {
    const ACTIVE_BOTS = "api-active-bots";
    unsuscribed = clientIO(CLIENT_SERVER_URL, {forceNew: true});
    suscribed = clientIO(CLIENT_SERVER_URL, {forceNew: true});

    unsuscribed.on(ACTIVE_BOTS, function(data) {
      assert(false, "Received unexpected message on unsuscribed client:\n" + JSON.stringnify(data));
    });

    var counter = 0;
    suscribed.on(ACTIVE_BOTS, function(data) {
      if (counter == 0) {
        assert.equal(data.set[0].id, "bot_0");
      } else if (counter == 1) {
        assert.equal(data.add.id, "bot_1");
      } else if (counter == 2) {
        assert.equal(data.remove, "bot_0");
        setTimeout(done, 100);
      }
      ++counter;
    });

    socket_0 = new net.Socket();
    bot_0 = new SocketAdapter(socket_0, 100000);

    socket_1 = new net.Socket();
    bot_1 = new SocketAdapter(socket_1, 100000);

    function step1() {
      socket_0.connect(BOT_PORT, "localhost", function() {
        bot_0.emit("authorization", {
          name: "bot_0",
          password: "no password needed",
          gameList: []
        });
      });
      setTimeout(step2, 100);
    }

    function step2() {
      suscribed.emit(ACTIVE_BOTS);
      setTimeout(step3, 100);
    }

    function step3() {
      socket_1.connect(BOT_PORT, "localhost", function() { 
        bot_1.emit("authorization", {
          name: "bot_1",
          password: "no password needed",
          gameList: []
        });
      });
      setTimeout(step4, 100);
    }

    function step4() {
      bot_0.close();
    }

    step1();
  });

  it("should let users join matches", function(done) {
    var user = clientIO(CLIENT_SERVER_URL, {forceNew: true});
    gameManager.createNewMatchup("Tictactoe", {});
    user.emit("join", {matchId: "tictactoe_0"});
    user.on("update", function(data) {
      assert.equal(data.matchId, "tictactoe_0");
      done();
    });
  });

  it("should let users request bots to join matches", function(done) {
    var user = clientIO(CLIENT_SERVER_URL, {forceNew: true});
    gameManager.createNewMatchup("Tictactoe", {});
    
    socket_0 = new net.Socket();
    bot_0 = new SocketAdapter(socket_0, 100000);
    bot_0.on("join", function(data) {
      assert.equal(data.matchId, "tictactoe_0");
      done();
    });

    function step1() {
      socket_0.connect(BOT_PORT, "localhost", function() {
        bot_0.emit("authorization", {
          name: "bot_0",
          password: "no password needed",
          gameList: []
        });
      });
      setTimeout(step2, 100);
    }
    
    function step2() {
      user.emit("request-bot", {username: "bot_0", matchId: "tictactoe_0", seat: 2}); 
    }
    
    step1();
  });

  it("should invite bots to their ongoing games when they reconnect", function(done) {
    var user = clientIO(CLIENT_SERVER_URL, {forceNew: true});
    gameManager.createNewMatchup("Tictactoe", {});

    socket_0 = new net.Socket();
    bot_0 = new SocketAdapter(socket_0, 100000);
    bot_0.on("join", onJoin1);

    socket_1 = new net.Socket();
    bot_1 = new SocketAdapter(socket_1, 100000);
    bot_1.on("join", onJoin2);

    function onJoin1(data) {
      assert.equal(data.matchId, "tictactoe_0");
      bot_0.emit("join", {matchId: data.matchId});
      setTimeout(function() {
        bot_0.close();
        step3();
      }, 100);
    }

    function onJoin2(data) {
      assert.equal(data.matchId, "tictactoe_0");
      done();
    }

    var credentials = {
      name: "bot_0",
      password: "no password needed",
      gameList: []
    };

    function step1() {
      socket_0.connect(BOT_PORT, "localhost", function() {
        bot_0.emit("authorization", credentials);
      });
      setTimeout(step2, 100);
    }

    function step2() {
      user.emit("request-bot", {username: "bot_0", matchId: "tictactoe_0", seat: 2});
    }

    function step3() {
      socket_1.connect(BOT_PORT, "localhost", function() {
        bot_1.emit("authorization", credentials);
      });
    }

    step1();
  });
});
*/
