var ConnectModule = require("ts-turnbased-connect");

exports.newGame = function(gameTitle, gameSettings) {
  if (gameTitle == "Tictactoe") {
    return new ConnectModule.Connect(ConnectModule.tictactoeOptions());
  } else if (gameTitle == "Connect6") {
    return new ConnectModule.Connect(ConnectModule.connect6Options());
  } else if (gameTitle == "Connect") {
    return new ConnectModule.Connect(gameSettings);
  }
  throw new Error("Unkown game type: " + gameTitle);
}

exports.newGameFromID = function(gameId, gameSettings) {
  var name = gameId.split("_")[0];
  return exports.newGame(name.charAt(0).toUpperCase() + name.slice(1), gameSettings);
}
