import { Game } from "ts-turnbased";
import { Connect, connect6Options, tictactoeOptions } from "ts-turnbased-connect";
import { NormalFormGame, roshamboPayoffTensor} from "ts-turnbased-normalform";

export function newGame(gameName: string, gameSettings: any): Game {
  if (gameName == "Tictactoe") {
    return new Connect(tictactoeOptions());
  } else if (gameName == "Connect6") {
    return new Connect(connect6Options(gameSettings.boardWidth, gameSettings.boardHeight));
  } else if (gameName == "Connect") {
    return new Connect(gameSettings);
  } else if (gameName == "Roshambo") {
    return new NormalFormGame({
      payoffTensor: roshamboPayoffTensor(),
      numRounds: gameSettings.numRounds
    });
  }
  throw new Error("Unkown game type: " + gameName);
};
