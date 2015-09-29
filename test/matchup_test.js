var assert = require("assert");
var Matchup = require("../modules/matchup");

var mockServer = require("./utilities").mockServer;

describe("Matchups", function() {
  var serverSockets = {};
  var clientSockets = {};
  var matchup;
  
  beforeEach(function(done) {
    matchup = new Matchup("Tictactoe_0", "Tictactoe", {});
    
    function onSocketAdded(clientSocket, serverSocket) {
      var username = serverSocket.session.username;
      serverSockets[username] = serverSocket;
      clientSockets[username] = clientSocket;
      if (Object.keys(serverSockets).length == 3) {
        done();
      }
    }
    mockServer.addClient("User_0", onSocketAdded);
    mockServer.addClient("User_1", onSocketAdded);
    mockServer.addClient("User_2", onSocketAdded);
  });
  
  afterEach(function() {
    mockServer.removeAllSockets();
    serverSockets = {};
    clientSOckets = {};
  });
  
  it("should send an error message if the user plays out of turn", function(done) {
    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var spectator = clientSockets["User_2"];

    function player2_init(data) {
      player2.removeAllListeners("matchup-update");
      player2.emit("matchup-play", {id: matchup.id, move: {x: 0, y: 0}});
    };

    function expected_error_received(data) {
      assert.equal(data.id, matchup.id);
      assert.equal(data.error, "It isn't your turn to play yet.");
      // Wait a bit to make sure no one else receives an error.
      setTimeout(done, 10);
    }
    
    function unexpected_error_received(data) {
      assert(false, "Only the player playing out of turn should be receiving this message.");
    }

    player2.on("matchup-update", player2_init);
    player1.on("matchup-error", unexpected_error_received);
    player2.on("matchup-error", expected_error_received);
    spectator.on("matchup-error", unexpected_error_received);
    
    matchup.addSpectator(serverSockets["User_2"]);
    matchup.addPlayer(serverSockets["User_0"]);
    matchup.addPlayer(serverSockets["User_1"]);
  });
  
  it("should send an error message if the user makes an illegal move", function(done) {
    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var spectator = clientSockets["User_2"];

    function player1_init(data) {
      player1.removeAllListeners("matchup-update");
      player1.emit("matchup-play", {id: matchup.id, move: {x: 4, y: 4}});
    };

    function expected_error_received(data) {
      assert.equal(data.id, matchup.id);
      assert.notEqual(data.error, null);
      // Wait a bit to make sure no one else receives an error.
      setTimeout(done, 10);
    }
    
    function unexpected_error_received(data) {
      assert(false, "Only the player making the illegal move should be receiving this message.");
    }

    player1.on("matchup-update", player1_init);
    player1.on("matchup-error", expected_error_received);
    player2.on("matchup-error", unexpected_error_received);
    spectator.on("matchup-error", unexpected_error_received);
    
    matchup.addSpectator(serverSockets["User_2"]);
    matchup.addPlayer(serverSockets["User_0"]);
    matchup.addPlayer(serverSockets["User_1"]);
  });
  
  it("should allow a user to join a private game they belong to", function() {
    matchup.privateUsers = ["User_0", "User_1"];
    
    matchup.addPlayer(serverSockets["User_0"]);
    
    assert.equal(matchup.p1.session.username, "User_0");
  });
  
  it("should not allow a user to join a full game", function() {
    matchup.addPlayer(serverSockets["User_0"]);
    matchup.addPlayer(serverSockets["User_1"]);
    assert.throws(function() {
      matchup.addPlayer(serverSockets["User_2"]);
    }, matchup.ERRORS.FAILED_TO_JOIN_MATCHUP);
  });
  
  it("should not allow a user to join/spectate a private game they do not belong to", function() {
    matchup.privateUsers = ["User_0", "User_1"];
    
    assert.throws(function() {
      matchup.addPlayer(serverSockets["User_2"]);
    }, matchup.ERRORS.FAILED_TO_JOIN_MATCHUP);
    
    assert.throws(function() {
      matchup.addSpectator(serverSockets["User_2"]);
    }, matchup.ERRORS.FAILED_TO_SPECTATE_MATCHUP);
  });
  
  it("should allow a user to reconnect", function(done) {
    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var reconnectedPlayer1 = null;
    
    function player1_init(data) {
      player1.removeAllListeners("matchup-update");
      player1.emit("matchup-play", {id: matchup.id, move: {x: 0, y: 0}});
    };
    
    function reconnected_join(data) {
      assert.equal(data.id, matchup.id);
      assert.equal(data.view, "P1");
    }
    
    function reconnected_init(data) {
      assert.equal(data.id, matchup.id);
      assert.deepEqual(data.names, ["User_0", "User_1"]);
      assert.deepEqual(data.gameData.moves[0], {x: 0, y: 0});
      assert.deepEqual(data.gameData.moves[1], {x: 1, y: 1});
      assert.equal(data.gameData.moves.length, 2);
      reconnectedPlayer1.emit("matchup-play", {id: matchup.id, move: {x: 2, y: 2}});
    }
    
    function reconnected_onPlay(data) {
      if (matchup.game.moves.length == 3) {
        // The reconnected socket should receive the ack of its move.
        assert.deepEqual(data.move, {x: 2, y: 2});
        done();
      }
      if (matchup.game.moves.length == 4) {
        // The reconnected socket should receive p2's move.
        assert.deepEqual(data.move, {x: 0, y: 1});
        done();
      }
    }
    
    function player2_onPlay(data) {
      if (matchup.game.moves.length == 1) {
        player1.disconnect();
        player2.emit("matchup-play", {id: matchup.id, move: {x: 1, y: 1}});
        setTimeout(reconnectP1, 10);
      }
      if (matchup.game.moves.length == 3) {
        assert.deepEqual(data.move, {x: 2, y: 2});
        player2.emit("matchup-play", {id: matchup.id, move: {x: 0, y: 1}});
      }
    }
    
    function reconnectP1() {
      mockServer.addClient("User_0", function(clientSocket, serverSocket) {
        reconnectedPlayer1 = clientSocket;
        reconnectedPlayer1.on("matchup-join", reconnected_join);
        reconnectedPlayer1.on("matchup-update", reconnected_init);
        reconnectedPlayer1.on("matchup-play", reconnected_onPlay);
        matchup.addPlayer(serverSocket);
      })
    }
    
    player1.on("matchup-update", player1_init);
    player2.on("matchup-play", player2_onPlay);
    
    matchup.addPlayer(serverSockets["User_0"]);
    matchup.addPlayer(serverSockets["User_1"]);
  });
    
  it("should let two users join and play a full game while being spectated", function(done) {
    var id = matchup.id;

    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var spectator = clientSockets["User_2"];
      
    var moves = [
      {x: 1, y: 1},
      {x: 0, y: 0},
      {x: 2, y: 0},
      {x: 0, y: 2},
      {x: 0, y: 1},
      {x: 2, y: 1},
      {x: 1, y: 2},
      {x: 1, y: 0},
      {x: 2, y: 2}
    ];

    var movesReceivedByP1 = [];
    var movesReceivedByP2 = [];
    var movesReceivedBySpectator = [];

    function player1_join(data) {
      assert.equal(data.id, id);
      assert.equal(data.view, "P1");
      player1.removeAllListeners("matchup-join");
    };
    function player2_join(data) {
      assert.equal(data.id, id);
      assert.equal(data.view, "P2");
      player2.removeAllListeners("matchup-join");
    };
    function spectator_join(data) {
      assert.equal(data.id, id);
      assert.equal(data.view, "SPECTATOR");
      spectator.removeAllListeners("matchup-join");
    };

    function player1_init(data) {
      assert.equal(data.id, id);
      assert.deepEqual(data.names, ["User_0", "User_1"]);
      player1.removeAllListeners("matchup-update");
      player1.on("matchup-play", p1_move_received);
      player1.emit("matchup-play", {id: id, move: moves[0]});
    };
    function player2_init(data) {
      assert.equal(data.id, id);
      assert.deepEqual(data.names, ["User_0", "User_1"]);
      player2.removeAllListeners("matchup-update");
      player2.on("matchup-play", p2_move_received);
    };
    function spectator_init(data) {
      assert.equal(data.id, id);
      assert.deepEqual(data.names, ["User_0", "User_1"]);
      spectator.removeAllListeners("matchup-update");
      spectator.on("matchup-play", spectator_move_received);
    };
      
    function p1_move_received(data) {
      assert.equal(data.id, id);
      assert.deepEqual(data.move, moves[movesReceivedByP1.length]);
      movesReceivedByP1.push(data.move);
      if (movesReceivedByP1.length % 2 == 0) {
        var nextMove = moves[movesReceivedByP1.length];
        player1.emit("matchup-play", {id: id, move: nextMove});
      }
    }  
    function p2_move_received(data) {
      assert.equal(data.id, id);
      assert.deepEqual(data.move, moves[movesReceivedByP2.length]);
      movesReceivedByP2.push(data.move);
      if (movesReceivedByP2.length % 2 == 1) {
        var nextMove = moves[movesReceivedByP2.length];
        if (nextMove == null) {
          // The last move has been received. We wait 10ms to ensure everyone else has also processed the last move.
          setTimeout(onDone, 10);
        } else {
          player2.emit("matchup-play", {id: id, move: nextMove});
        }
      }
    }
      
    function spectator_move_received(data) {
      assert.equal(data.id, id);
      assert.deepEqual(data.move, moves[movesReceivedBySpectator.length]);
      movesReceivedBySpectator.push(data.move);
    }
      
    function onDone() {
      assert.equal(movesReceivedByP1.length, 9);
      assert.equal(movesReceivedByP2.length, 9);
      assert.equal(movesReceivedBySpectator.length, 9);
      assert.equal(matchup.game.getStatus(), matchup.game.STATUS_ENUM.DRAW);
      done();
    }
      
    player1.on("matchup-update", player1_init);
    player2.on("matchup-update", player2_init);
    spectator.on("matchup-update", spectator_init);
    
    player1.on("matchup-join", player1_join);
    player2.on("matchup-join", player2_join);
    spectator.on("matchup-join", spectator_join);

    matchup.addSpectator(serverSockets["User_2"]);
    matchup.addPlayer(serverSockets["User_0"]);
    matchup.addPlayer(serverSockets["User_1"]);
  });
});