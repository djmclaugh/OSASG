exports.Connect6 = require("../public/javascript/games/connect6").Connect6;
exports.Tictactoe = require("../public/javascript/games/tictactoe").Tictactoe;
exports.newGame = function(gameTitle, settings) {
  return new exports[gameTitle](settings);
}
