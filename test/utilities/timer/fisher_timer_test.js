var assert = require("assert");
var FisherTimer = require("../../../modules/utilities/timer/fisher_timer");

describe("Fisher Timer", function() {
  it("should work on sample sequences", function() {
    timer = new FisherTimer(1000, 100);
    timer.start(0);
    timer.stop(50);
    timer.start(55);
    timer.stop(75);
    timer.start(100);
    // 1000 + 100 - 50 + 100 - 20 + 100 - 10 = 1220
    assert.equal(timer.timeLeft(110), 1220);
    // 1000 + 100 - 50 + 100 - 20 + 100 - 20 = 1210
    assert.equal(timer.timeLeft(120), 1210);
    // 1000 + 100 - 50 + 100 - 20 + 100 - 30 = 1200
    assert.equal(timer.timeLeft(130), 1200);
    timer.stop(130);
    assert.equal(timer.timeLeft(130), 1200);
    assert.equal(timer.timeLeft(140), 1200);

    timer = new FisherTimer(100, 200);
    timer.start(0);
    timer.stop(50);
    timer.start(55);
    timer.stop(75);
    timer.start(100);
    // 100 + 200 - 50 + 200 - 20 + 200 - 10 = 1220
    assert.equal(timer.timeLeft(110), 620);
    // 100 + 200 - 50 + 200 - 20 + 200 - 20 = 1210
    assert.equal(timer.timeLeft(120), 610);
    // 100 + 200 - 50 + 200 - 20 + 200 - 30 = 1200
    assert.equal(timer.timeLeft(130), 600);
    timer.stop(130);
    assert.equal(timer.timeLeft(130), 600);
    assert.equal(timer.timeLeft(140), 600);
  });
});
