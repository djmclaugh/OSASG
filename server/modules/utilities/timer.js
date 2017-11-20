function Timer() {}

// Returns the amount of time (in milliseconds) left for the player.
Timer.prototype.timeLeftForPlayer = function(player) {
  throw new Error("This method needs to be implemented by the subclass.");
};

// Attempt to tap the clock as the specified player at the specified time.
// Tapping the clock when it is not your turn is a NO-OP that returns true.
// Returns false if the player is out of time.
// Returns true otherwise.
Timer.prototype.tapClock = function(player, timestamp) {
  throw new Error("This method needs to be implemented by the subclass.");
};

module.exports = Timer;
