"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const ts_turnbased_connect_1 = require("ts-turnbased-connect");
const ts_turnbased_normalform_1 = require("ts-turnbased-normalform");
function newGame(gameName, gameSettings) {
    if (gameName == "Tictactoe") {
        return new ts_turnbased_connect_1.Connect(ts_turnbased_connect_1.tictactoeOptions());
    }
    else if (gameName == "Connect6") {
        return new ts_turnbased_connect_1.Connect(ts_turnbased_connect_1.connect6Options(gameSettings.boardWidth, gameSettings.boardHeight));
    }
    else if (gameName == "Connect") {
        return new ts_turnbased_connect_1.Connect(gameSettings);
    }
    else if (gameName == "Roshambo") {
        return new ts_turnbased_normalform_1.NormalFormGame({
            payoffTensor: ts_turnbased_normalform_1.roshamboPayoffTensor(),
            numRounds: gameSettings.numRounds
        });
    }
    throw new Error("Unkown game type: " + gameName);
}
exports.newGame = newGame;
;
