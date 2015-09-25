exports.Connect6 = require("./games/connect6");
exports.Tictactoe = require("./games/tictactoe");
exports.newGame = function(gameTitle, settings) {
  return new exports[gameTitle](settings);
}
