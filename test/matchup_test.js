var assert = require("assert");
var Matchup = require("../modules/matchup");

var mockServer = require("./utilities").mockServer;

describe("Matchups", function() {
  var serverSockets = {};
  var clientSockets = {};
  var matchup;
  
  beforeEach(function(done) {
    matchup = new Matchup("Tictactoe_0", "Tictactoe", {}, null);
    
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
      if (matchup.hasStarted()) {
        player2.removeAllListeners(matchup.MESSAGES.UPDATE);
        player2.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: {x: 0, y: 0}});
      }
    };

    function expected_error_received(data) {
      assert.equal(data.error, "It isn't your turn to play.");
      // Wait a bit to make sure no one else receives an error.
      setTimeout(done, 10);
    }
    
    function unexpected_error_received(data) {
      assert(false, "Only the player playing out of turn should be receiving this message.");
    }

    player2.on(matchup.MESSAGES.UPDATE, player2_init);
    player1.on(matchup.MESSAGES.ERROR, unexpected_error_received);
    player2.on(matchup.MESSAGES.ERROR, expected_error_received);
    spectator.on(matchup.MESSAGES.ERROR, unexpected_error_received);
    
    matchup.addPlayer(serverSockets["User_0"], 1);
    matchup.addPlayer(serverSockets["User_1"], 2);
    matchup.addPlayer(serverSockets["User_2"], 3);
  });
  
  it("should send an error message if the user makes an illegal move", function(done) {
    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var spectator = clientSockets["User_2"];

    function player1_init(data) {
      if (matchup.hasStarted()) {
        player1.removeAllListeners(matchup.MESSAGES.UPDATE);
        player1.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: {x: 4, y: 4}});
      }
    }

    function expected_error_received(data) {
      assert.equal(data.error.indexOf("Error while trying to make a move: "), 0);
      // Wait a bit to make sure no one else receives an error.
      setTimeout(done, 10);
    }
    
    function unexpected_error_received(data) {
      assert(false, "Only the player making the illegal move should be receiving this message.");
    }

    player1.on(matchup.MESSAGES.UPDATE, player1_init);
    player1.on(matchup.MESSAGES.ERROR, expected_error_received);
    player2.on(matchup.MESSAGES.ERROR, unexpected_error_received);
    spectator.on(matchup.MESSAGES.ERROR, unexpected_error_received);
    
    matchup.addPlayer(serverSockets["User_0"], 1);
    matchup.addPlayer(serverSockets["User_1"], 2);
    matchup.addPlayer(serverSockets["User_2"], 3);
  });
  
  it("should allow a user to join a private game they belong to", function(done) {
    matchup.privateUsers = ["User_0", "User_1"];
    
    matchup.addPlayer(serverSockets["User_0"]);
    clientSockets["User_0"].on(matchup.MESSAGES.UPDATE, function(data) {
      done();
    });
  });
  
  it("should not allow a user to sit in an occupied seat", function() {
    matchup.addPlayer(serverSockets["User_0"], 1);
    assert.throws(function() {
      matchup.addPlayer(serverSockets["User_1"], 1);
    }, matchup.ERRORS.FAILED_TO_JOIN_MATCHUP);
  });
  
  it("should not allow a user to join a private game they do not belong to", function() {
    matchup.privateUsers = ["User_0", "User_1"];
    assert.throws(function() {
      matchup.addPlayer(serverSockets["User_2"]);
    }, matchup.ERRORS.FAILED_TO_JOIN_MATCHUP);
  });
  
  it("should allow a user to reconnect", function(done) {
    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var reconnectedPlayer1 = null;
    
    function player1_init(data) {
      if (data.p1 == "User_0" && data.p2 == "User_1") {
        player1.removeAllListeners(matchup.MESSAGES.UPDATE);
        player1.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: 0});
      }
    }
    
    function reconnected_init(data) {
      assert.equal(data.matchId, matchup.id);
      assert.equal(data.p1, "User_0");
      assert.equal(data.p2, "User_1");
      assert.equal(data.gameData.moves[0], 0);
      assert.equal(data.gameData.moves[1], 4);
      assert.equal(data.gameData.moves.length, 2);
      reconnectedPlayer1.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: 8});
    }
    
    function reconnected_onPlay(data) {
      assert.equal(data.matchId, matchup.id);
      if (matchup.game.moves.length == 3) {
        // The reconnected socket should receive the ack of its move.
        assert.equal(data.move, 8);
      }
      if (matchup.game.moves.length == 4) {
        // The reconnected socket should receive p2's move.
        assert.equal(data.move, 3);
        done();
      }
    }
    
    function player2_onPlay(data) {
      assert.equal(data.matchId, matchup.id);
      if (matchup.game.moves.length == 1) {
        player1.disconnect();
        player2.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: 4});
        setTimeout(reconnectP1, 10);
      }
      if (matchup.game.moves.length == 3) {
        assert.equal(data.move, 8);
        player2.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: 3});
      }
    }
    
    function reconnectP1() {
      mockServer.addClient("User_0", function(clientSocket, serverSocket) {
        reconnectedPlayer1 = clientSocket;
        reconnectedPlayer1.on(matchup.MESSAGES.UPDATE, reconnected_init);
        reconnectedPlayer1.on(matchup.MESSAGES.PLAY, reconnected_onPlay);
        matchup.addPlayer(serverSocket);
      });
    }
    
    player1.on(matchup.MESSAGES.JOIN, player1_init);
    player1.on(matchup.MESSAGES.UPDATE, player1_init);
    player2.on(matchup.MESSAGES.PLAY, player2_onPlay);
    
    matchup.addPlayer(serverSockets["User_0"], 1);
    matchup.addPlayer(serverSockets["User_1"], 2);
  });
    
  it("should let two users join and play a full game while being spectated", function(done) {
    var id = matchup.id;

    var player1 = clientSockets["User_0"];
    var player2 = clientSockets["User_1"];
    var spectator = clientSockets["User_2"];
      
    var moves = [4, 0, 2, 6, 3, 5, 7, 1, 8];

    var movesReceivedByP1 = [];
    var movesReceivedByP2 = [];
    var movesReceivedBySpectator = [];

    function player1_update(data) {
      assert.equal(data.matchId, matchup.id);
      if (data.p1 == "User_0" && data.p2 == "User_1") {
        player1.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: moves[0]});
      }
    }
      
    function p1_move_received(data) {
      assert.equal(data.matchId, matchup.id);
      assert.deepEqual(data.move, moves[movesReceivedByP1.length]);
      movesReceivedByP1.push(data.move);
      if (movesReceivedByP1.length % 2 == 0) {
        var nextMove = moves[movesReceivedByP1.length];
        player1.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: nextMove});
      }
    }  
    function p2_move_received(data) {
      assert.equal(data.matchId, matchup.id);
      assert.deepEqual(data.move, moves[movesReceivedByP2.length]);
      movesReceivedByP2.push(data.move);
      if (movesReceivedByP2.length % 2 == 1) {
        var nextMove = moves[movesReceivedByP2.length];
        if (nextMove == null) {
          // The last move has been received. We wait 10ms to ensure everyone else has also
          // processed the last move.
          setTimeout(onDone, 10);
        } else {
          player2.emit(matchup.MESSAGES.PLAY, {matchId: matchup.id, move: nextMove});
        }
      }
    }     
    function spectator_move_received(data) {
      assert.equal(data.matchId, matchup.id);
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

    player1.on(matchup.MESSAGES.UPDATE, player1_update);
    
    player1.on(matchup.MESSAGES.PLAY, p1_move_received);
    player2.on(matchup.MESSAGES.PLAY, p2_move_received);
    spectator.on(matchup.MESSAGES.PLAY, spectator_move_received);
 
    matchup.addPlayer(serverSockets["User_0"], 1);
    matchup.addPlayer(serverSockets["User_1"], 2);
    matchup.addPlayer(serverSockets["User_2"], 3);
  });
});
