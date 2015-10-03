var assert = require("assert");
var GameManager = require("../modules/game_manager.js");

describe("Game Manager", function() {
  var manager;
  
  beforeEach(function() {
    manager = new GameManager();
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
});
