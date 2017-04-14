import { Bot, MatchInfo } from "./bot";
import { Coordinate, ConnectMove, ConnectOptions, connect6Options, tictactoeOptions, sanitizeOptions } from "ts-turnbased-connect";

export class RandomBot extends Bot {
  protected wantToJoin(matchSettings: MatchInfo): boolean {
    if (matchSettings.gameName == "Tictactoe"
        || matchSettings.gameName == "Connect6"
        || matchSettings.gameName == "Connect") {
      return true;
    }
    console.log("Unexpected game: " + matchSettings.gameName);
    console.log("Random bot should be able to play any game, please update.");
    return false;
  }

  protected getMove(match: MatchInfo): any {
    if (match.gameName == "Tictactoe") {
      return this.getConnectMove(match.events, sanitizeOptions(tictactoeOptions()));
    } else if (match.gameName == "Connect6") {
      return this.getConnectMove(match.events, sanitizeOptions(connect6Options()));
    } else if (match.gameName == "Connect") {
      return this.getConnectMove(match.events, sanitizeOptions(match.settings.gameSettings));
    }
    throw Error("Don't know how to play: " + match.gameName);
  }

  // --- Connect helper methods ---
  private getConnectMove(movesSoFar: Array<ConnectMove>, options: ConnectOptions): ConnectMove {
    let board: Array<Array<boolean>> = [];
    for (let i: number = 0; i < options.boardWidth; ++i) {
      board[i] = [];
      for (let j: number = 0; j < options.boardHeight; ++j) {
        board[i].push(true);
      }
    }
    for (let move of movesSoFar.slice(1)) {
      let coordinates: Array<Coordinate> = Array.isArray(move) ? move : [move];
      for (let c of coordinates) {
        board[c.x][c.y] = false;
      }
    }
    let availableCoordinates: Array<Coordinate> = [];
    for (let i: number = 0; i < options.boardWidth; ++i) {
      for (let j: number = 0; j < options.boardHeight; ++j) {
        if (board[i][j]) {
          availableCoordinates.push({x: i, y: j});
        }
      }
    }
    let toPlace: number = movesSoFar.length == 1 ? options.q : options.p;
    let move: Array<Coordinate> = [];
    while (move.length < toPlace && availableCoordinates.length > 0) {
      let index: number = Math.floor(Math.random() * availableCoordinates.length);
      move.push(availableCoordinates[index]);
      availableCoordinates.splice(index, 1);
    }
    return move;
  }
}