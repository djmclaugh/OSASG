import { Bot } from "./bot";
import { Update } from "ts-turnbased";
import { Coordinate, ConnectMove, ConnectOptions, connect6Options, tictactoeOptions, sanitizeOptions } from "ts-turnbased-connect";
import { MatchInfo, MatchSummary } from "../shared/match_info";

// Each move is a number from 0 to 8 indicating which cell the player is taking:
// 0 | 1 | 2
// ---------
// 3 | 4 | 5
// ---------
// 6 | 7 | 8

// List of patterns for the possible "3-in-a-row"s
const WINS: ReadonlyArray<number> = [
   1 +   2 +   4,  // 000 000 111
   8 +  16 +  32,  // 000 111 000
  64 + 128 + 256,  // 111 000 000
   1 +   8 +  64,  // 001 001 001
   2 +  16 + 128,  // 010 010 010
   4 +  32 + 256,  // 100 100 100
   1 +  16 + 256,  // 100 010 001
   4 +  16 +  64,  // 001 010 100
];

type Result = "O_WIN"|"X_WIN"|"DRAW"
type Player = "X"|"O"

const GAME_TREE: Map<number, Result> = new Map<number, Result>();

let boardBitSize: number = Math.pow(2, 9);

class TictactoeBoard {
  oBoard: number = 0;
  xBoard: number = 0;

  static fromMoves(moves: Array<Coordinate>) {
    let board: TictactoeBoard = new TictactoeBoard();
    let colour: Player = "X";
    for (let move of moves) {
      board.setColour(colour, move.x + (3 * move.y));
      colour = colour == "X" ? "O" : "X";
    }
    return board;
  }

  toPlay(): Player {
    let xCount: number = 0;
    let oCount: number = 0;
    for (let i: number = 0; i < 9; ++i) {
      if ((Math.pow(2, i) & this.xBoard) != 0) {
        xCount += 1;
      }
      if ((Math.pow(2, i) & this.oBoard) != 0) {
        oCount += 1;
      }
    }
    if (xCount == oCount) {
      return "X";
    } else if (xCount - 1 == oCount) {
      return "O";
    }
    throw new Error("Illegal board position: " + this.hash());
  }

  setColour(colour: "X"|"O"|"EMPTY", position: number) {
    let boardWithPosition = Math.pow(2, position);
    this.oBoard = (this.oBoard | boardWithPosition) - boardWithPosition;
    this.xBoard = (this.xBoard | boardWithPosition) - boardWithPosition;
    if (colour == "X") {
      this.xBoard += boardWithPosition;
    } else if (colour == "O") {
      this.oBoard += boardWithPosition;
    }
  }

  hash(): number {
    return boardBitSize * this.xBoard + this.oBoard;
  }

  getResult(): Result {
    for (let win of WINS) {
      if ((this.oBoard & win) == win) {
        return "O_WIN";
      }
      if ((this.xBoard & win) == win) {
        return "X_WIN";
      }
    }
    if (this.getLegalMoves().length == 0) {
      return "DRAW";
    }
    let result: Result = GAME_TREE.get(this.hash());
    if (!result) {
      let player: Player = this.toPlay();
      let posibilities = new Map<Result, boolean>();
      posibilities.set("O_WIN", false);
      posibilities.set("X_WIN", false);
      posibilities.set("DRAW", false);
      for (let i of this.getLegalMoves()) {
        this.setColour(player, i);
        posibilities.set(this.getResult(), true);
        this.setColour("EMPTY", i);
      }
      if (player == "O" && posibilities.get("O_WIN")) {
        result = "O_WIN";
      } else if (player == "X" && posibilities.get("X_WIN")) {
        result = "X_WIN";
      } else if (posibilities.get("DRAW")) {
        result = "DRAW";
      } else if (player == "O") {
        result = "X_WIN";
      } else if (player == "X") {
        result = "O_WIN";
      }
      GAME_TREE.set(this.hash(), result);
    }
    return result;
  }

  getLegalMoves(): Array<number> {
    let moves: Array<number> = new Array<number>();
    for (let i = 0; i < 9; ++i) {
      if ((Math.pow(2, i) & (this.xBoard | this.oBoard)) == 0) {
        moves.push(i);
      }
    }
    return moves;
  }

  getBestMoves(toPlay: "X"|"O"): Array<number> {
    let win: Array<number> = new Array<number>();
    let draw: Array<number> = new Array<number>();
    let lose: Array<number> = new Array<number>();
    for (let i of this.getLegalMoves()) {
      this.setColour(toPlay, i);
      switch(this.getResult()) {
        case "O_WIN":
          if (toPlay == "O") {
            win.push(i);
          } else {
            lose.push(i);
          }
          break;
        case "X_WIN":
          if (toPlay == "X") {
            win.push(i);
          } else {
            lose.push(i);
          }
          break;
         default:
           draw.push(i);
      }
      this.setColour("EMPTY", i);
    }
    if (win.length) {
      return win;
    } else if (draw.length) {
      return draw;
    }
    return lose;
  }
}

export class TictacproBot extends Bot {
  protected listOfGames(): Array<string> {
    return ["Tictactoe"];
  }

  protected wantToJoin(matchSettings: MatchInfo): boolean {
    if (matchSettings.settings.gameName == "Tictactoe") {
      return true;
    }
    return false;
  }

  protected getMove(match: MatchInfo): any {
    if (match.settings.gameName == "Tictactoe") {
      return this.getTictactoeMove(match.updates);
    }
    throw Error("Don't know how to play: " + match.settings.gameName);
  }

  private getTictactoeMove(updatesSoFar: Array<Update>): ConnectMove {
    let movesSoFar: Array<ConnectMove> = updatesSoFar.slice(1).map(update => {
      return update.publicInfo;
    });
    let coordinates: Array<Coordinate> = [];
    for (let move of movesSoFar.slice(1)) {
      coordinates.push(Array.isArray(move) ? move[0] : move);
    }
    let board: TictactoeBoard = TictactoeBoard.fromMoves(coordinates);
    let toPlay: Player = coordinates.length % 2 == 0 ? "X" : "O";
    let bestMoves: Array<Coordinate> =
        board.getBestMoves(toPlay).map((position: number) => {
          return {x: position % 3, y: Math.floor(position / 3)};
        });
    let index: number = Math.floor(Math.random() * bestMoves.length);
    return [bestMoves[index]];
  }
}
