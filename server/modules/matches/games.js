var ConnectModule = require("ts-turnbased-connect");
var NormalformModule = require("ts-turnbased-normalform");

exports.newGame = function(gameName, gameSettings) {
  if (gameName == "Tictactoe") {
    return new ConnectModule.Connect(ConnectModule.tictactoeOptions());
  } else if (gameName == "Connect6") {
    return new ConnectModule.Connect(
        ConnectModule.connect6Options(gameSettings.boardWidth, gameSettings.boardHeight));
  } else if (gameName == "Connect") {
    return new ConnectModule.Connect(gameSettings);
  } else if (gameName == "Roshambo") {
    return new NormalformModule.NormalFormGame({
      payoffTensor: NormalformModule.roshamboPayoffTensor(),
      numRounds: gameSettings.numRounds
    });
  }
  throw new Error("Unkown game type: " + gameName);
}
