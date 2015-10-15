var assert = require("assert");
var GameManager = require("../modules/game_manager.js");
var Matchup = require("../modules/matchup.js");
var Games = require("../modules/games.js");

describe("Game Manager", function() {
  var manager;
  
  beforeEach(function() {
    manager = new GameManager();
  });
  
  it("should be able to create new matchups", function() {
    var matchup_0 = manager.createNewMatchup("Tictactoe", {});
    var matchup_1 = manager.createNewMatchup("Connect6", {});
    var matchup_2 = manager.createNewMatchup("Tictactoe", {}, ["a", "b"]);
    assert.equal(manager.matchups.length, 3);
    var matchup;
    
    matchup = manager.matchups[0];
    assert(matchup instanceof Matchup);
    assert.equal(matchup.id, "tictactoe_0");
    assert(matchup.game instanceof Games.Tictactoe);
    assert.equal(matchup.privateUsers, null);
    
    matchup = manager.matchups[1];
    assert(matchup instanceof Matchup);
    assert.equal(matchup.id, "connect6_1");
    assert(matchup.game instanceof Games.Connect6);
    assert.equal(matchup.privateUsers, null);
    
    matchup = manager.matchups[2];
    assert(matchup instanceof Matchup);
    assert.equal(matchup.id, "tictactoe_2");
    assert(matchup.game instanceof Games.Tictactoe);
    assert.deepEqual(matchup.privateUsers, ["a", "b"]);
  });
  
  it("should store completed games");
  
  it("should show which matchups the user can join", function() {
    var matchup_0 = manager.createNewMatchup("Connect6", {});  // public - should be able to join.
    var matchup_1 = manager.createNewMatchup("Connect6", {}, ["User_0", "User_1"]);  // private but included - should be able to join.
    var matchup_2 = manager.createNewMatchup("Connect6", {}, ["User_2", "User_1"]);  // private and excluded - should NOT be able to join.
    
    var matchups = manager.getMatchesUserCanJoin("User_0");
    assert.equal(matchups.length, 2);
    assert.notEqual(matchups.indexOf(matchup_0), -1);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.equal(matchups.indexOf(matchup_2), -1);
  });
  
  it("should show which matchups the user is currently playing", function() {
    var matchup_0 = manager.createNewMatchup("Tictactoe", {});
    var matchup_1 = manager.createNewMatchup("Tictactoe", {});
    var matchup_2 = manager.createNewMatchup("Tictactoe", {});
    var matchup_3 = manager.createNewMatchup("Tictactoe", {});
    var matchup_4 = manager.createNewMatchup("Tictactoe", {}, ["a", "b"]);
    var matchup_5 = manager.createNewMatchup("Tictactoe", {}, ["a", "b"]);
    var matchup_6 = manager.createNewMatchup("Tictactoe", {}, ["a", "b"]);
    var matchup_7 = manager.createNewMatchup("Tictactoe", {}, ["a", "b"]);
    
    matchup_1.p1Username = "a";
    matchup_2.p2Username = "a";
    matchup_3.p1Username = "c";
    matchup_3.p2Username = "d";
    
    matchup_5.p1Username = "a";
    matchup_6.p2Username = "a";
    matchup_7.p1Username = "c";
    matchup_7.p2Username = "d";
    
    var matchups = manager.getMatchesUserIsPlaying("a");
    assert.equal(matchups.length, 4);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.notEqual(matchups.indexOf(matchup_2), -1);
    assert.notEqual(matchups.indexOf(matchup_5), -1);
    assert.notEqual(matchups.indexOf(matchup_6), -1);
  });
  
  it("should be able to fetch specific matchups", function() {
    var matchup_abc = manager.createNewMatchup("Tictactoe", {});
    matchup_abc.id = "abc";
    var matchup_efg = manager.createNewMatchup("Tictactoe", {});
    matchup_efg.id = "efg";
    var matchup_hij = manager.createNewMatchup("Tictactoe", {});
    matchup_hij.id = "hij";
    
    assert.equal(manager.getMatchupById("efg"), matchup_efg);
  });
});
