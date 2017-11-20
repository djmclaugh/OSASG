function Timer() {
  this.isRunning = false;
  this.lastTimestamp = 0;
}

// Returns the amount of time (in milliseconds) left.
// Returns negative time if the player has run out of time.
Timer.prototype.timeLeft = function(timestamp) {
  if (this.lastTimestamp > timestamp) {
    throw new Error("Cannot check time left before last action.");
  }
  return 0;
};

// Stops the timer at the specified point in time.
// This throws an error if the timer is already stoped or if the timestamp is earlier than the
// last start.
Timer.prototype.stop = function(timestamp) {
  if (!this.isRunning) {
    throw new Error("Timer is already stopped.");  
  } else if (this.lastTimestamp > timestamp) {
    throw new Error("Can't perform actions in the past.");
  }
  this.isRunning = false;
  this.lastTimestamp = timestamp;
};

// Starts the timer at the specified point in time.
// This throws an error if the timer is already stoped or if the timestamp is earlier than the
// last start.
Timer.prototype.start = function(timestamp) {
  if (this.timeLeft(timestamp) <= 0) {
    throw new Error("Can't start the timer because it is out of time.");
  } else if (this.isRunning) {
    throw new Error("Timer is already running.");  
  } else if (this.lastTimestamp > timestamp) {
    throw new Error("Can't perform actions in the past.");
  }
  this.isRunning = true;
  this.lastTimestamp = timestamp;
};

// Creates an object that contains all the information needed to recreate a particular state.
Timer.prototype.exportState = function() {
  return {
    isRunning: this.isRunning,
    lastTimestamp: this.lastTimestamp
  }
};

// Recreates the state specified by the values of the argument.
Timer.prototype.importState = function(state) {
  this.isRunning = state.isRunning;
  this.lastTimestamp = state.lastTimestamp;
};

module.exports = Timer;
