var assert = require("assert");
var Matchup = require("../../modules/utilities/matchup");

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

describe("Matchups", function() {
  it("should send an error message if the user plays out of turn", function(done) {
    var match = new Matchup("Tictactoe_0", "Tictactoe", defaultSettings);
    var p1SentAValidMove = false;
    
    var p1Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE && payload.p2 != null) {
        // If the match has started, play a move.
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 0});
      } else if (topic == match.MESSAGES.PLAY) {
        p1SentAValidMove = true;
        // When I receive my move, try to play again.
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 1});
      } else if (topic == match.MESSAGES.ERROR) {
        // Make sure that the first move went through successfully.
        assert.equal(p1SentAValidMove, true);
        // Make sure that the error message is appropriate.
        assert.equal(payload.error, "It isn't your turn to play.");
        done();
      }
    };

    var player1 = new MockPlayer("p1_name", "p1_id", p1Callback);
    var player2 = new MockPlayer("p2_name", "p2_id", null);
    
    match.addPlayer(player1, 1);
    match.addPlayer(player2, 2);
  });
  
  it("should send an error message if the user makes an illegal move", function(done) {
    var match = new Matchup("Tictactoe_0", "Tictactoe", defaultSettings);
    
    var p1Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE && payload.p2 != null) {
        // If the match has started, play a move.
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 10});
      } else if (topic == match.MESSAGES.ERROR) {
        assert.equal(payload.error.indexOf("Error while trying to make a move: "), 0);
        done();
      }
    };

    var player1 = new MockPlayer("p1_name", "p1_id", p1Callback);
    var player2 = new MockPlayer("p2_name", "p2_id", null);
    
    match.addPlayer(player1, 1);
    match.addPlayer(player2, 2);
  });
  
  it("should not allow a user to sit in an occupied seat", function() {
    var match = new Matchup("Tictactoe_0", "Tictactoe", defaultSettings);
    match.addPlayer(new MockPlayer("name_1", "id_1"), 1);
    assert.throws(function() {
      match.addPlayer(new MockPlayer("name_2", "id_2"), 1);
    }, match.ERRORS.FAILED_TO_JOIN_MATCHUP);
  });
  
 it("should allow a user to reconnect", function(done) {
    var match = new Matchup("Tictactoe_0", "Tictactoe", defaultSettings);
    
    var p1ReceivedFirstP2Move = false;
    var p1ReceivedSecondP2Move = false;

    var p1Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE && payload.p2 != null) {
        // If the match has started, play a move.
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 0});
      } else if (topic == match.MESSAGES.PLAY) {
        if (payload.move == 1) {
          player1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 2});
        } else if (payload.move == 3) {
          done();
        }
      }
    };

    var p2Callback1 = function(topic, payload) {
      if (topic == match.MESSAGES.PLAY) {
        if (payload.move == 0) {
          player2_1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 1});
          player2_1.disconnect();
          match.addPlayer(player2_2, 2);
        }
      }
    };

    var p2Callback2 = function(topic, payload) {
      // Play the 4th move if you receive the 3rd move or if the 3rd move was already played when
      // you joined.
      if (topic == match.MESSAGES.PLAY) {
        if (payload.move == 2) {
          player2_2.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 3});
        }
      } else if (topic == match.MESSAGES.UPDATE) {
        if (payload.gameData.moves.length == 3) {
          player2_2.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: 3});
        }
      }
    };

    var player1 = new MockPlayer("p1_name", "p1_id", p1Callback);
    var player2_1 = new MockPlayer("p2_1_name", "p2_id", p2Callback1);
    var player2_2 = new MockPlayer("p2_2_name", "p2_id", p2Callback2);

    match.addPlayer(player1, 1);
    match.addPlayer(player2_1, 2);
  });
    
  it("should let two users join and play a full game while being spectated", function(done) {
    var match = new Matchup("Tictactoe_0", "Tictactoe", defaultSettings);

    // The sequence of moves the player should play.
    var moves = [4, 0, 2, 6, 3, 5, 7, 1, 8];

    var p1ReceivedMoves = 0;
    var p2ReceivedMoves = 0;
    var spectatorReceivedMoves = 0;

    function isDone() {
      return p1ReceivedMoves == moves.length
          && p2ReceivedMoves == moves.length
          && spectatorReceivedMoves == moves.length;
    }

    var p1Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE) {
        if (payload.p2 != null) {
          // If the match has started, play a move.
          player1.mockSocketSent(match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: moves[0]});
        }
      } else if (topic == match.MESSAGES.PLAY) {
        assert.equal(payload.move, moves[p1ReceivedMoves]);
        ++p1ReceivedMoves;
        if (p1ReceivedMoves % 2 == 0) {
          player1.mockSocketSent(
            match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: moves[p1ReceivedMoves]});
        }
      } else {
        assert(false, "Unexpected message on topic '" + topic + "'.");
      }
      if (isDone()) {
        done();
      }
    };

    var p2Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE) {
        // Do nothing
      } else if (topic == match.MESSAGES.PLAY) {
        assert.equal(payload.move, moves[p2ReceivedMoves]);
        ++p2ReceivedMoves;
        if (p2ReceivedMoves % 2 == 1) {
          player2.mockSocketSent(
            match.MESSAGES.PLAY, {matchId: "Tictactoe_0", move: moves[p2ReceivedMoves]});
        }
      } else {
        assert(false, "Unexpected message on topic '" + topic + "'.");
      }
      if (isDone()) {
        done();
      }
    };

    var spectatorCallback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE) {
        // Do nothing
      } else if (topic == match.MESSAGES.PLAY) {
        assert.equal(payload.move, moves[spectatorReceivedMoves]);
        ++spectatorReceivedMoves;
      } else {
        assert(false, "Unexpected message on topic '" + topic + "'.");
      }
      if (isDone()) {
        done();
      }
    };

    var player1 = new MockPlayer("p1_name", "p1_id", p1Callback);
    var player2 = new MockPlayer("p2_name", "p2_id", p2Callback);
    var spectator = new MockPlayer("spectator_name", "spectator_id", spectatorCallback);
 
    match.addPlayer(spectator, 3);
    match.addPlayer(player1, 1);
    match.addPlayer(player2, 2);
  });
});
