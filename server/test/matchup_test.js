var assert = require("assert");
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

xdescribe("Matchups", function() {
  it("should send an error message if the user plays out of turn", function(done) {
    var match = new Matchup("Tictactoe_0", "Tictactoe", defaultSettings);
    var p1SentAValidMove = false;

    var p1Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE && payload.p2 != null) {
        // If the match has started, play a move.
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: {x: 0, y: 0}});
      } else if (topic == match.MESSAGES.PLAY) {
        p1SentAValidMove = true;
        // When I receive my move, try to play again.
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: {x: 1, y: 0}});
      } else if (topic == match.MESSAGES.ERROR) {
        // Make sure that the first move went through successfully.
        assert.equal(p1SentAValidMove, true);
        // Make sure that the error message is appropriate.
        var message = "Error while trying to make a move: Out of turn play by player 0: No legal moves this turn for this player";
        assert.equal(payload.error, message);
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
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: {x: 10, y: 10}});
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
        player1.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: {x: 0, y: 0}});
      } else if (topic == match.MESSAGES.PLAY) {
        if (payload.events.x == 0 && payload.events.y == 1) {
          player1.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: {x: 0, y: 2}});
        } else if (payload.events.x == 1 && payload.events.y == 0) {
          done();
        }
      }
    };

    var p2Callback1 = function(topic, payload) {
      if (topic == match.MESSAGES.PLAY) {
        if (payload.events.x == 0 && payload.events.y == 0) {
          player2_1.mockSocketSent(match.MESSAGES.PLAY,
              {matchID: "Tictactoe_0",  move: {x: 0, y: 1}});
          player2_1.disconnect();
          match.addPlayer(player2_2, 2);
        }
      }
    };

    var p2Callback2 = function(topic, payload) {
      // Play the 4th move if you receive the 3rd move or if the 3rd move was already played when
      // you joined.
      if (topic == match.MESSAGES.PLAY) {
        if (payload.events.x == 0 && payload.events.y == 2) {
          player2_2.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0",  move: {x: 1, y: 0}});
        }
      } else if (topic == match.MESSAGES.UPDATE) {
        if (payload.events.length == 4) {
          player2_2.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0",  move: {x: 1, y: 0}});
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

    var p1ReceivedMoves = 0;
    var p2ReceivedMoves = 0;
    var spectatorReceivedMoves = 0;

    var p1ReceivedMatchOverUpdate = false;
    var p2ReceivedMatchOverUpdate = false;
    var spectatorReceivedMatchOverUpdate = false;

    function isDone() {
      return p1ReceivedMoves == moves.length
          && p2ReceivedMoves == moves.length
          && spectatorReceivedMoves == moves.length
          && p1ReceivedMatchOverUpdate
          && p2ReceivedMatchOverUpdate
          && spectatorReceivedMatchOverUpdate;
    }

    var p1Callback = function(topic, payload) {
      if (topic == match.MESSAGES.UPDATE) {
        if (payload.status == "ONGOING" && payload.toPlay.indexOf(0) != -1) {
          // If the match has started, play a move.
          player1.mockSocketSent(match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: moves[0]});
        }
        if (p1ReceivedMoves == moves.length) {
          assert.equal(payload.status, match.STATUS.COMPLETED);
          p1ReceivedMatchOverUpdate = true;
        }
      } else if (topic == match.MESSAGES.PLAY) {
        assert.equal(payload.events.x, moves[p1ReceivedMoves].x);
        assert.equal(payload.events.y, moves[p1ReceivedMoves].y);
        ++p1ReceivedMoves;
        if (p1ReceivedMoves % 2 == 0) {
          player1.mockSocketSent(
            match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: moves[p1ReceivedMoves]});
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
        if (p2ReceivedMoves == moves.length) {
          assert.equal(payload.status, match.STATUS.COMPLETED);
          p2ReceivedMatchOverUpdate = true;
        }
      } else if (topic == match.MESSAGES.PLAY) {
        assert.equal(payload.events.x, moves[p2ReceivedMoves].x);
        assert.equal(payload.events.y, moves[p2ReceivedMoves].y);
        ++p2ReceivedMoves;
        if (p2ReceivedMoves % 2 == 1) {
          player2.mockSocketSent(
            match.MESSAGES.PLAY, {matchID: "Tictactoe_0", move: moves[p2ReceivedMoves]});
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
        if (spectatorReceivedMoves == moves.length) {
          assert.equal(payload.status, match.STATUS.COMPLETED);
          spectatorReceivedMatchOverUpdate = true;
        }
      } else if (topic == match.MESSAGES.PLAY) {
        assert.equal(payload.events.x, moves[spectatorReceivedMoves].x);
        assert.equal(payload.events.y, moves[spectatorReceivedMoves].y);
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
