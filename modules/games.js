exports.Connect6 = require("./games/connect6");
exports.Tictactoe = require("./games/tictactoe");
exports.newGame = function(gameTitle, settings) {
  return new exports[gameTitle](settings);
}
exports.newGameFromId = function(gameId) {
  var name = gameId.split("_")[0];
  return exports.newGame(name.charAt(0).toUpperCase() + name.slice(1));
}
