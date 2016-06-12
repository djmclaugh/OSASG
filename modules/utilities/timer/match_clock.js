function MatchClock(timer1, timer2) {
  this.currentlyPlaying = 0;
  this.timer1 = timer1;
  this.timer2 = timer2;
}

module.exports = MatchClock;

MatchClock.prototype.hasStarted = function() {
  return this.currentlyPlaying != 0;
};

MatchClock.prototype.currentPlayerIsOutOfTime = function(timestamp) {
  if (this.currentlyPlaying == 0) {
    return false;
  } else if (this.currentlyPlaying == 1) {
    return this.timer1.timeLeft(timestamp) <= 0;
  } else {
    return this.timer2.timeLeft(timestamp) <= 0;
  }
};

MatchClock.prototype.start = function(timestamp) {
  if (this.currentlyPlaying != 0) {
    throw new Error("The clock has already started.");
  } else {
    this.currentlyPlaying = 1;
    this.timer1.start(timestamp);
  }
};

MatchClock.prototype.toggle = function(timestamp) {
  if (this.currentlyPlaying == 0) {
    throw new Error("The clock hasn't started yet.");
  } else if (this.currentlyPlaying == 1) {
    this.currentlyPlaying = 2;
    this.timer1.stop(timestamp);
    this.timer2.start(timestamp);
  } else {
    this.currentlyPlaying = 1;
    this.timer1.start(timestamp);
    this.timer2.stop(timestamp);
  }
};
