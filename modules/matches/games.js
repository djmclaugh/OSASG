var ConnectModule = require("ts-turnbased-connect");

exports.newGame = function(gameName, gameSettings) {
  if (gameName == "Tictactoe") {
    return new ConnectModule.Connect(ConnectModule.tictactoeOptions());
  } else if (gameName == "Connect6") {
    return new ConnectModule.Connect(
        ConnectModule.connect6Options(gameSettings.boardWidth, gameSettings.boardHeight));
  } else if (gameName == "Connect") {
    return new ConnectModule.Connect(gameSettings);
  }
  throw new Error("Unkown game type: " + gameName);
}
