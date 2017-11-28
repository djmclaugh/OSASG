var assert = require("assert");
var GameManager = require("../modules/matches/game_manager");
var Matchup = require("../modules/matches/matchup");
var MockPlayer = require("./mock/matches/mock_player");

var defaultSettings = {
  p1Timer: {
    type: "Fisher",
    initialTime: 100,
    extraTime: 10
  },
  p2Timer: {
    type: "Fisher",
    initialTime: 100,
    extraTime: 10
  }
};

xdescribe("Game Manager", function() {
  var manager;

  beforeEach(function() {
    manager = new GameManager();
  });

  it("should be able to create new matchups", function() {
    var matchup_0 = manager.createNewMatchup("Tictactoe", defaultSettings);
    var matchup_1 = manager.createNewMatchup("Connect6", defaultSettings);
    assert.equal(manager.matchups.length, 2);

    var matchup;

    matchup = manager.matchups[0];
    assert(matchup instanceof Matchup);
    assert.equal(matchup.id, "tictactoe_0");

    matchup = manager.matchups[1];
    assert(matchup instanceof Matchup);
    assert.equal(matchup.id, "connect6_1");
  });

  it("should store completed games");

  it("should show which matchups the user is currently playing", function() {
    var matchup_0 = manager.createNewMatchup("Tictactoe", defaultSettings);
    var matchup_1 = manager.createNewMatchup("Tictactoe", defaultSettings);
    var matchup_2 = manager.createNewMatchup("Tictactoe", defaultSettings);
    var matchup_3 = manager.createNewMatchup("Tictactoe", defaultSettings);

    var player = new MockPlayer("player_name", "player_id", null);

    matchup_1.addPlayer(player, 1);
    matchup_2.addPlayer(player, 2);
    matchup_3.addPlayer(player, 3);

    var matchups = manager.getMatchesPlayerIsIn(player);
    assert.equal(matchups.length, 2);
    assert.notEqual(matchups.indexOf(matchup_1), -1);
    assert.notEqual(matchups.indexOf(matchup_2), -1);
  });

  it("should be able to fetch specific matchups", function() {
    var matchup_abc = manager.createNewMatchup("Tictactoe", defaultSettings);
    matchup_abc.id = "abc";
    var matchup_efg = manager.createNewMatchup("Tictactoe", defaultSettings);
    matchup_efg.id = "efg";
    var matchup_hij = manager.createNewMatchup("Tictactoe", defaultSettings);
    matchup_hij.id = "hij";

    assert.equal(manager.getMatchupById("efg"), matchup_efg);
  });
});
