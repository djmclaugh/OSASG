var assert = require("assert");
var BronsteinTimer = require("../../../modules/utilities/timer/bronstein_timer");

describe("Bronstein Timer", function() {
  it("should work on sample sequences", function() {
    timer = new BronsteinTimer(1000, 100);
    timer.start(0);
    timer.stop(150);
    timer.start(155);
    timer.stop(175);
    timer.start(300);
    // 1000 - 50 - 0 + (100 - 10) = 1040
    assert.equal(timer.timeLeft(310), 1040);
    assert.equal(timer.timeLeft(320), 1030);
    assert.equal(timer.timeLeft(330), 1020);
    timer.stop(330);
    assert.equal(timer.timeLeft(330), 950);
    assert.equal(timer.timeLeft(340), 950);

    timer = new BronsteinTimer(200, 10);
    timer.start(0);
    timer.stop(150);
    timer.start(155);
    timer.stop(175);
    timer.start(300);
    // 200 - 140 - 10 + (10 - 10)  = 50
    assert.equal(timer.timeLeft(310), 50);
    assert.equal(timer.timeLeft(320), 40);
    assert.equal(timer.timeLeft(330), 30);
    timer.stop(330);
    assert.equal(timer.timeLeft(330), 30);
    assert.equal(timer.timeLeft(340), 30);
  });
});