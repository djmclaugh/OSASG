var assert = require("assert");
var GameManager = require("../modules/game_manager.js");

var mockServer = require("./utilities").mockServer;

describe("Game Manager", function() {
  var serverSockets = {};
  var clientSockets = {};
  var manager;
  
  before(function(done) {
    function onSocketAdded(clientSocket, serverSocket) {
      var username = serverSocket.session.username;
      serverSockets[username] = serverSocket;
      clientSockets[username] = clientSocket;
      if (Object.keys(serverSockets).length == 5) {
        done();
      }
    }
    mockServer.addClient("User_0", onSocketAdded);
    mockServer.addClient("User_1", onSocketAdded);
    mockServer.addClient("User_2", onSocketAdded);
    mockServer.addClient("User_3", onSocketAdded);
    mockServer.addClient("User_4", onSocketAdded);
  });
  
  beforeEach(function() {
    manager = new GameManager();
  });
  
  after(function() {
    mockServer.removeAllSockets();
  });
  
  it("should store completed games");
  
  it("should automatch the user", function() {
    manager.automatchPlayer(serverSockets["User_0"], "Connect6");
    manager.automatchPlayer(serverSockets["User_1"], "Tictactoe");
    manager.automatchPlayer(serverSockets["User_2"], "Connect6");
    manager.automatchPlayer(serverSockets["User_3"], "Connect6");
    manager.automatchPlayer(serverSockets["User_4"], "Tictactoe");
    
    assert.equal(manager.matchups.length, 3);
    
    var matchup = manager.matchups[0];
    assert.equal(matchup.p1.session.username, "User_0");
    assert.equal(matchup.p2.session.username, "User_2");
    assert.equal(matchup.game.constructor.name, "Connect6");
    
    matchup = manager.matchups[1];
    assert.equal(matchup.p1.session.username, "User_1");
    assert.equal(matchup.p2.session.username, "User_4");
    assert.equal(matchup.game.constructor.name, "Tictactoe");
    
    var matchup = manager.matchups[2];
    assert.equal(matchup.p1.session.username, "User_3");
    assert.equal(matchup.p2, null);
    assert.equal(matchup.game.constructor.name, "Connect6");
  });
  
  it("should show which matchups the user is currently playing", function() {
    var matchup_0 = manager.createNewMatchup("Connect6", {});
    var matchup_1 = manager.createNewMatchup("Connect6", {});
    var matchup_2 = manager.createNewMatchup("Connect6", {});
    var matchup_3 = manager.createNewMatchup("Connect6", {});
    var matchup_4 = manager.createNewMatchup("Connect6", {});
    
    matchup_1.addPlayer(serverSockets["User_0"]);
    
    matchup_2.addPlayer(serverSockets["User_1"]);
    
    matchup_3.addPlayer(serverSockets["User_0"]);
    matchup_3.addPlayer(serverSockets["User_1"]);
    
    matchup_4.addPlayer(serverSockets["User_1"]);
    matchup_4.addPlayer(serverSockets["User_2"]);

    var matchups = manager.getMatchesUserIsPlaying(serverSockets["User_0"]);
    assert.equal(matchups.length, 2);
    assert.equal(matchups.indexOf(matchup_0), -1);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.equal(matchups.indexOf(matchup_2), -1);
    assert.notEqual(matchups.indexOf(matchup_3), -1);
    assert.equal(matchups.indexOf(matchup_4), -1);
  });
  
  it("should show which matchups the user can join", function() {
    var matchup_0 = manager.createNewMatchup("Connect6", {});  // public - should be able to join.
    var matchup_1 = manager.createNewMatchup("Connect6", {}, ["User_0", "User_1"]);  // private but included - should be able to join.
    var matchup_2 = manager.createNewMatchup("Connect6", {}, ["User_2", "User_1"]);  // private and excluded - should NOT be able to join.
    
    var matchup_3 = manager.createNewMatchup("Connect6", {});
    matchup_3.addPlayer(serverSockets["User_1"]);  // One spot remaining, should be able to join.
    
    var matchup_4 = manager.createNewMatchup("Connect6", {});
    matchup_4.addPlayer(serverSockets["User_1"]);
    matchup_4.addPlayer(serverSockets["User_2"]);  // Full, should NOT be able to join.

    var matchups = manager.getMatchesUserCanJoin(serverSockets["User_0"]);
    assert.equal(matchups.length, 3);
    assert.notEqual(matchups.indexOf(matchup_0), -1);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.equal(matchups.indexOf(matchup_2), -1);
    assert.notEqual(matchups.indexOf(matchup_3), -1);
    assert.equal(matchups.indexOf(matchup_4), -1);
  });
  
  it("should show which matchups the user can spectate", function() {
    var matchup_0 = manager.createNewMatchup("Connect6", {});  // public - should be able to spectate.
    var matchup_1 = manager.createNewMatchup("Connect6", {}, ["User_0", "User_1"]);  // private but included - should be able to spectate.
    var matchup_2 = manager.createNewMatchup("Connect6", {}, ["User_2", "User_1"]);  // private and excluded - should NOT be able to spectate.
    
    var matchup_3 = manager.createNewMatchup("Connect6", {});
    matchup_3.addPlayer(serverSockets["User_1"]);  // One spot remaining, should be able to spectate.
    
    var matchup_4 = manager.createNewMatchup("Connect6", {});
    matchup_4.addPlayer(serverSockets["User_1"]);
    matchup_4.addPlayer(serverSockets["User_2"]);  // Full, should still be able to join.

    var matchups = manager.getMatchesUserCanSpectate(serverSockets["User_0"]);
    assert.equal(matchups.length, 4);
    assert.notEqual(matchups.indexOf(matchup_0), -1);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.equal(matchups.indexOf(matchup_2), -1);
    assert.notEqual(matchups.indexOf(matchup_3), -1);
    assert.notEqual(matchups.indexOf(matchup_4), -1);
  });
});
