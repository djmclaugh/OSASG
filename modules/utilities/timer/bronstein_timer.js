var Timer = require("./timer");

function BronsteinTimer(initialTime, bonusTimePerTurn) {
  if (typeof initialTime != "number") {
    throw new Error("initialTime should be a number.");
  }
  if (typeof bonusTimePerTurn != "number") {
    throw new Error("bonusTimePerTurn should be a number.");
  }

  Timer.call(this);

  this.remainingTime = initialTime;
  this.bonusTimePerTurn = bonusTimePerTurn
}

BronsteinTimer.prototype = Object.create(Timer.prototype);
BronsteinTimer.prototype.constructor = BronsteinTimer;
BronsteinTimer.prototype.super = Timer.prototype;

module.exports = BronsteinTimer;

BronsteinTimer.prototype.timeLeft = function(timestamp) {
  this.super.timeLeft.call(this, timestamp);
  if (this.isRunning) {
    return this.bonusTimePerTurn + this.remainingTime - (timestamp - this.lastTimestamp)
  } else {
    return this.remainingTime;
  }
};

BronsteinTimer.prototype.start = function(timestamp) {
  this.super.start.call(this, timestamp);
};

BronsteinTimer.prototype.stop = function(timestamp) {
  this.remainingTime = Math.min(this.timeLeft(timestamp), this.remainingTime);
  this.super.stop.call(this, timestamp);
};

BronsteinTimer.prototype.exportState = function() {
  state = this.super.exportState.call(this);
  state.remainingTime = this.remainingTime;
  return state;
};

BronsteinTimer.prototype.importState = function(state) {
  this.super.importState.call(this, state);
  this.remainingTime = state.remainingTime;
};
