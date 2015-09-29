var assert = require("assert");
var GameManager = require("../modules/game_manager.js");
var manager;

// Create a mock server that accepts the client sockets and mocks there session data.
var serverIO = require('socket.io').listen(5000);
var serverSockets = [];
serverIO.sockets.on("connect", function (socket) {
  socket.on("mock-session", function(session) {
    socket.session = session;
  });
  serverSockets.push(socket);
});
function serverSocket(index) {
  for (var i = 0; i < serverSockets.length; ++i) {
    if (serverSockets[i].session.username == "User_" + index) {
      return serverSockets[i];
    }
  }
  return null;
}

// Create mock clients.
var clientIO = require("socket.io/node_modules/socket.io-client");
var clientSockets = [];
function onConnectFunction(i) {
  return function() {
    clientSockets[i].emit("mock-session", {username: "User_" + i});
  };
}
for (var i = 0; i < 10; ++i) {
  var socket = clientIO("http://localhost:5000", {forceNew: true});
  socket.on("connect", onConnectFunction(i));
  clientSockets.push(socket);
}
function clientSocket(index) {
  return clientSockets[index];
}

describe("Game Manager", function() {
  beforeEach(function() {
    manager = new GameManager();
  });
  
  it("should store completed games");
  it("should automatch me");
  it("should show which matchips I am currently playing");
  
  it("should show which matchups I can join", function() {
    var matchup_0 = manager.createNewMatchup("Connect6", {});  // public - should be able to join.
    var matchup_1 = manager.createNewMatchup("Connect6", {}, ["User_0", "User_1"]);  // private but included - should be able to join.
    var matchup_2 = manager.createNewMatchup("Connect6", {}, ["User_2", "User_1"]);  // private and excluded - should NOT be able to join.
    
    var matchup_3 = manager.createNewMatchup("Connect6", {});
    matchup_3.addPlayer(serverSocket(1));  // One spot remaining, should be able to join.
    
    var matchup_4 = manager.createNewMatchup("Connect6", {});
    matchup_4.addPlayer(serverSocket(1));
    matchup_4.addPlayer(serverSocket(2));  // Full, should NOT be able to join.

    var matchups = manager.getMatchesUserCanJoin(serverSocket(0));
    assert.equal(matchups.length, 3);
    assert.notEqual(matchups.indexOf(matchup_0), -1);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.equal(matchups.indexOf(matchup_2), -1);
    assert.notEqual(matchups.indexOf(matchup_3), -1);
    assert.equal(matchups.indexOf(matchup_4), -1);
  });
  
  it("should show which matchups I can spectate", function() {
    var matchup_0 = manager.createNewMatchup("Connect6", {});  // public - should be able to spectate.
    var matchup_1 = manager.createNewMatchup("Connect6", {}, ["User_0", "User_1"]);  // private but included - should be able to spectate.
    var matchup_2 = manager.createNewMatchup("Connect6", {}, ["User_2", "User_1"]);  // private and excluded - should NOT be able to spectate.
    
    var matchup_3 = manager.createNewMatchup("Connect6", {});
    matchup_3.addPlayer(serverSocket(1));  // One spot remaining, should be able to spectate.
    
    var matchup_4 = manager.createNewMatchup("Connect6", {});
    matchup_4.addPlayer(serverSocket(1));
    matchup_4.addPlayer(serverSocket(2));  // Full, should still be able to join.

    var matchups = manager.getMatchesUserCanSpectate(serverSocket(0));
    assert.equal(matchups.length, 4);
    assert.notEqual(matchups.indexOf(matchup_0), -1);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.equal(matchups.indexOf(matchup_2), -1);
    assert.notEqual(matchups.indexOf(matchup_3), -1);
    assert.notEqual(matchups.indexOf(matchup_4), -1);
  });
  
  context("Matchups", function() {
    it("should send an error message if the user plays out of turn");
    it("should send an error message if the user makes an illegal move");
    it("should allow a user to join a private game they belong to");
    it("should allow a user to spectate a private game they belong to");
    it("should not allow a user to join a full game");
    it("should not allow a user to join a private game they do not belong to");
    it("should not allow a user to spectate a private game they do not belong to");
    it("should allow a user to reconect");
    
    it("should let two users join and play a full game while being spectated", function(done) {
      var matchup = manager.createNewMatchup("Tictactoe", {});
      var id = matchup.id;

      var player1 = clientSocket(0);
      var player2 = clientSocket(1);
      var spectator = clientSocket(2);
      
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
      
      function player1_init(data) {
        assert.equal(data.id, id);
        assert.deepEqual(data.names, ["User_0", "User_1"]);
        assert.equal(data.view, "P1");
        player1.removeAllListeners("matchup-update");
        player1.on("matchup-play", p1_move_received);
        movesReceivedByP1.push(moves[0]);
        player1.emit("matchup-play", {id: id, move: moves[0]});
      };
      function player2_init(data) {
        assert.equal(data.id, id);
        assert.deepEqual(data.names, ["User_0", "User_1"]);
        assert.equal(data.view, "P2");
        player2.removeAllListeners("matchup-update");
        player2.on("matchup-play", p2_move_received);
      };
      function spectator_init(data) {
        assert.equal(data.id, id);
        assert.deepEqual(data.names, ["User_0", "User_1"]);
        assert.equal(data.view, "SPECTATOR");
        spectator.removeAllListeners("matchup-update");
        spectator.on("matchup-play", spectator_move_received);
      };
      
      function p1_move_received(data) {
        assert.equal(data.id, id);
        assert.deepEqual(data.move, moves[movesReceivedByP1.length]);
        movesReceivedByP1.push(data.move);
        var nextMove = moves[movesReceivedByP1.length];
        movesReceivedByP1.push(nextMove);
        player1.emit("matchup-play", {id: id, move: nextMove});
      }
      
      function p2_move_received(data) {
        assert.equal(data.id, id);
        assert.deepEqual(data.move, moves[movesReceivedByP2.length]);
        movesReceivedByP2.push(data.move);
        var nextMove = moves[movesReceivedByP2.length];
        if (nextMove == null) {
          // The last move has been received. We wait 1ms to ensure the spectator has also processed the last move.
          setTimeout(onDone, 1);
          return;
        }
        movesReceivedByP2.push(nextMove);
        player2.emit("matchup-play", {id: id, move: nextMove});
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
        done();
      }
      
      player1.on("matchup-update", player1_init);
      player2.on("matchup-update", player2_init);
      spectator.on("matchup-update", spectator_init);
      
      matchup.addPlayer(serverSocket(0));
      matchup.addPlayer(serverSocket(1));
      matchup.addSpectator(serverSocket(2));
    });
  });
});
