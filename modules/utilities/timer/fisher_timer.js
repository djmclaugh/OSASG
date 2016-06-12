var Timer = require("./timer");

function FisherTimer(initialTime, extraTimePerTurn) {
  if (typeof initialTime != "number") {
    throw new Error("initialTime should be a number.");
  }
  if (typeof extraTimePerTurn != "number") {
    throw new Error("extraTimePerTurn should be a number.");
  }
  Timer.call(this);
  this.remainingTime = initialTime;
  this.extraTimePerTurn = extraTimePerTurn
}

FisherTimer.prototype = Object.create(Timer.prototype);
FisherTimer.prototype.constructor = FisherTimer;
FisherTimer.prototype.super = Timer.prototype;

module.exports = FisherTimer;

FisherTimer.prototype.timeLeft = function(timestamp) {
  this.super.timeLeft.call(this, timestamp);
  if (this.isRunning) {
    return this.remainingTime - (timestamp - this.lastTimestamp)
  } else {
    return this.remainingTime;
  }
};

FisherTimer.prototype.start = function(timestamp) {
  this.super.start.call(this, timestamp);
  this.remainingTime += this.extraTimePerTurn;
};

FisherTimer.prototype.stop = function(timestamp) {
  this.remainingTime = this.timeLeft(timestamp);
  this.super.stop.call(this, timestamp);
};

FisherTimer.prototype.exportState = function() {
  state = this.super.exportState.call(this);
  state.remainingTime = this.remainingTime;
  return state;
};

FisherTimer.prototype.importState = function(state) {
  this.super.importState.call(this, state);
  this.remainingTime = state.remainingTime;
};
