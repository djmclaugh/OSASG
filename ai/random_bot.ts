import { Bot } from "./bot";
import { Update } from "ts-turnbased";
import { Coordinate, ConnectMove, ConnectOptions, connect6Options, tictactoeOptions, sanitizeOptions } from "ts-turnbased-connect";
import { MatchInfo, MatchSummary } from "../shared/match_info";

export class RandomBot extends Bot {
  protected listOfGames(): Array<string> {
    return ["Tictactoe", "Connect6", "Connect", "Roshambo"];
  }
  protected wantToJoin(matchSettings: MatchInfo): boolean {
    if (matchSettings.settings.gameName == "Tictactoe"
        || matchSettings.settings.gameName == "Connect6"
        || matchSettings.settings.gameName == "Connect"
        || matchSettings.settings.gameName == "Roshambo") {
      return true;
    }
    console.log("Unexpected game: " + matchSettings.settings.gameName);
    console.log("Random bot should be able to play any game, please update.");
    return false;
  }

  protected getMove(match: MatchInfo): any {
    if (match.settings.gameName == "Tictactoe") {
      return this.getConnectMove(match.updates, sanitizeOptions(tictactoeOptions()));
    } else if (match.settings.gameName == "Connect6") {
      return this.getConnectMove(match.updates, sanitizeOptions(connect6Options()));
    } else if (match.settings.gameName == "Connect") {
      return this.getConnectMove(match.updates, sanitizeOptions(match.settings.gameOptions));
    } else if (match.settings.gameName == "Roshambo") {
      return Math.floor(Math.random() * 3);
    }
    throw Error("Don't know how to play: " + match.settings.gameName);
  }

  // --- Connect helper methods ---
  private getConnectMove(updatesSoFar: Array<Update>, options: ConnectOptions): ConnectMove {
    let movesSoFar: Array<ConnectMove> = updatesSoFar.slice(1).map(update => {
      return update.publicInfo;
    });
    let board: Array<Array<boolean>> = [];
    for (let i: number = 0; i < options.boardWidth; ++i) {
      board[i] = [];
      for (let j: number = 0; j < options.boardHeight; ++j) {
        board[i].push(true);
      }
    }
    for (let move of movesSoFar) {
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
    let toPlace: number = movesSoFar.length == 0 ? options.q : options.p;
    let move: Array<Coordinate> = [];
    while (move.length < toPlace && availableCoordinates.length > 0) {
      let index: number = Math.floor(Math.random() * availableCoordinates.length);
      move.push(availableCoordinates[index]);
      availableCoordinates.splice(index, 1);
    }
    return move;
  }
}
