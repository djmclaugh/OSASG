BronsteinTimer = require("./bronstein_timer");
FisherTimer = require("./fisher_timer");

exports.newTimer = function(settings) {
  if (settings.type == "Bronstein") {
    return new BronsteinTimer(settings.initialTime, settings.bonusTime);
  } else if (settings.type == "Fisher") {
    return new FisherTimer(settings.initialTime, settings.extraTime);
  }
  throw new Error("Invalid timer type.");
};
