var Connect6GUI = require("./connect6_gui");
var TictactoeGUI = require("./tictactoe_gui");
var HexGUI = require("./hex_gui");

exports.newGameGUI = function(game, canvas) {
  if (game.constructor.name == "Connect6") {
    return new Connect6GUI(game, canvas);
  } else if (game.constructor.name == "Tictactoe") {
    return new TictactoeGUI(game, canvas);
  } else if (game.constructor.name == "Hex") {
    return new HexGUI(game, canvas);
  } else {
    throw new Error("Invalid game:"  + game);
  } 
};

