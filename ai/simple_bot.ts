import { Bot } from "./bot";
import { Update } from "ts-turnbased";
import { Coordinate, ConnectMove, ConnectOptions, connect6Options, tictactoeOptions, sanitizeOptions } from "ts-turnbased-connect";
import { MatchInfo, MatchSummary } from "../shared/match_info";

export class SimpleBot extends Bot {
  protected listOfGames(): Array<string> {
    return ["Tictactoe", "Connect6", "Connect"];
  }
  protected wantToJoin(matchSettings: MatchInfo): boolean {
    if (matchSettings.settings.gameName == "Tictactoe"
        || matchSettings.settings.gameName == "Connect6"
        || matchSettings.settings.gameName == "Connect") {
      return true;
    }
    return false;
  }

  protected getMove(match: MatchInfo): any {
    if (match.settings.gameName == "Tictactoe") {
      return this.getConnectMove(match.updates, sanitizeOptions(tictactoeOptions()));
    } else if (match.settings.gameName == "Connect6") {
      return this.getConnectMove(match.updates, sanitizeOptions(connect6Options()));
    } else if (match.settings.gameName == "Connect") {
      return this.getConnectMove(match.updates, sanitizeOptions(match.settings.gameOptions));
    }
    throw Error("Don't know how to play: " + match.settings.gameName);
  }

  private getConnectMove(updatesSoFar: Array<Update>, options: ConnectOptions): ConnectMove {
    let playedMoves: Array<ConnectMove> = updatesSoFar.slice(1).map(update => {
      return update.publicInfo;
    });
    let board: Array<Array<number>> = [];
    for (let i: number = 0; i < options.boardWidth; ++i) {
      board[i] = [];
      for (let j: number = 0; j < options.boardHeight; ++j) {
        board[i].push(0);
      }
    }
    for (let i = 0; i < playedMoves.length; ++i) {
      let move: ConnectMove = playedMoves[i];
      let coordinates: Array<Coordinate> = Array.isArray(move) ? move : [move];
      for (let c of coordinates) {
        board[c.x][c.y] = 1 + (i % 2);
      }
    }
    let wins: Array<Array<Array<Coordinate>>> = getAllWins(board, options);
    let currentPlayer: number = playedMoves.length % 2;
    let moveSoFar: Array<Coordinate> = [];
    if (wins[currentPlayer].length > 0) {
      // If you can win, win.
      moveSoFar = wins[currentPlayer][0];
      for (let c of moveSoFar) {
        board[c.x][c.y] = currentPlayer + 1;
      }
    } else if (wins[1 - currentPlayer].length > 0) {
      // If your opponent can win next turn, try to block them.
      moveSoFar = blockingCoordinates(options.p, wins[1 - currentPlayer]);
      for (let c of moveSoFar) {
        board[c.x][c.y] = currentPlayer + 1;
      }
    }
    // Choose the remainder of your moves randomly.
    let availableCoordinates: Array<Coordinate> = [];
    for (let i: number = 0; i < options.boardWidth; ++i) {
      for (let j: number = 0; j < options.boardHeight; ++j) {
        if (board[i][j] == 0) {
          availableCoordinates.push({x: i, y: j});
        }
      }
    }
    let toPlace: number = playedMoves.length == 0 ? options.q : options.p;
    while (moveSoFar.length < toPlace && availableCoordinates.length > 0) {
      let index: number = Math.floor(Math.random() * availableCoordinates.length);
      moveSoFar.push(availableCoordinates[index]);
      availableCoordinates.splice(index, 1);
    }
    return moveSoFar.slice(0, toPlace);
  }
}

// --- Connect helper methods ---
function isLegalCoordinate(c: Coordinate, options: ConnectOptions): boolean {
  return c.x >= 0 && c.x < options.boardWidth && c.y >= 0 && c.y < options.boardHeight;
}

function coordinateToString(c: Coordinate) {
  return c.x + ":" + c.y;
}

function stringToCoordinate(s: string) {
  let split: Array<string> = s.split(":");
  return {x: parseInt(split[0]), y: parseInt(split[1])};
}

// Finds and returns all sets of coordinates a player could play this turn to win (asusming it's
// their turn).
// The possibles wins for p1 are stored in the first entry of the returned result and the possible
// wins for p2 are stored in the second entry.
function getAllWins(
    board: Array<Array<number>>,
    options: ConnectOptions): Array<Array<Array<Coordinate>>> {
  let wins: Array<Array<Array<Coordinate>>> = [[], []];
  let partialWins: Array<Array<Array<Coordinate>>>;
  let divider: BoardDivider;

  // Finds all horizontal lines
  divider = new BoardDivider(horizontalLineMap, options);
  partialWins = getWins(divider, board, options.k, options.p);
  wins[0] = wins[0].concat(partialWins[0]);
  wins[1] = wins[1].concat(partialWins[1]);

  // Finds all vertical lines
  divider = new BoardDivider(verticalLineMap, options);
  partialWins = getWins(divider, board, options.k, options.p);
  wins[0] = wins[0].concat(partialWins[0]);
  wins[1] = wins[1].concat(partialWins[1]);

  // Finds all x = y lines
  divider = new BoardDivider(positiveSlopeLineMapForOptions(options), options);
  partialWins = getWins(divider, board, options.k, options.p);
  wins[0] = wins[0].concat(partialWins[0]);
  wins[1] = wins[1].concat(partialWins[1]);

  // Finds all x = -y lines
  divider = new BoardDivider(negativeSlopeLineMapForOptions(options), options);
  partialWins = getWins(divider, board, options.k, options.p);
  wins[0] = wins[0].concat(partialWins[0]);
  wins[1] = wins[1].concat(partialWins[1]);

  return wins;
}

// Finds and returns all sets of coordinate a player could play to form a line based on "divider".
function getWins(
    divider: BoardDivider,
    board: Array<Array<number>>,
    stonesToWin: number,
    stonesToPlace: number): Array<Array<Array<Coordinate>>> {
  let wins: Array<Array<Array<Coordinate>>> = [[], []];
  for (var line = 0; line < divider.getNumberOfLines(); ++line) {
    let queue: LimitedQueue<number> = new LimitedQueue<number>(stonesToWin);
    for (var index = 0; index < divider.getNumberOfCoordinateOnLine(line); ++index) {
      let position: Coordinate = divider.getCoordinateAt(line, index);
      queue.add(board[position.x][position.y]);
      if (queue.isFull()) {
        let winner: number = 0;
        if (queue.getCount(1) >= stonesToWin - stonesToPlace && queue.getCount(2) == 0) {
          winner = 1;
        } else if (queue.getCount(2) >= stonesToWin - stonesToPlace && queue.getCount(1) == 0) {
          winner = 2;
        }
        if (winner) {
          let newWin: Array<Coordinate> = [];
          for (var backtrack: number = 1 + index - stonesToWin; backtrack <= index; ++backtrack) {
            let previousPosition: Coordinate = divider.getCoordinateAt(line, backtrack);
            if (board[previousPosition.x][previousPosition.y] == 0) {
              newWin.push(previousPosition);
            }
          }
          wins[winner - 1].push(newWin);
        }
      }
    }
  }
  return wins;
}

// Queue with a max size that pops the oldest item when trying to add a new item while full.
// Keeps track of the count of each item.
class LimitedQueue<E> {
  // Max size, set in constructor
  private size: number;
  // Current contents of the queue
  private contents: Array<E>;
  // Index of where the next added element will go.
  private currentIndex: number;
  // Dictionary keeping track of the amount of each item present.
  private countMap: Map<E, number>;

  constructor(size: number) {
    this.size = size;
    this.contents = [];
    this.currentIndex = 0;
    this.countMap = new Map<E, number>();
  }

  isFull(): boolean {
    return this.contents.length == this.size;
  }

  getCount(item: E): number {
    let count: number = this.countMap.get(item);
    return typeof count == "number" ? count : 0;
  }

  add(item: E): void {
    this.increaseCountForItem(item);
    if (!this.isFull()) {
      this.currentIndex = this.currentIndex;
      this.contents.push(item);
    } else {
      this.decreaseCountForItem(this.contents[this.currentIndex]);
      this.contents[this.currentIndex] = item;
    }
    this.currentIndex = (this.currentIndex + 1) % this.size;
  }

  private increaseCountForItem(item: E): void {
    this.countMap.set(item, this.getCount(item) + 1);
  }

  private decreaseCountForItem(item: E): void {
    this.countMap.set(item, this.getCount(item) - 1);
  }
}

type LineMap = (line:number, index: number) => Coordinate;

// Function that divids the board into lines by allowing us to query the "index"th coordinate of the
//  "line"th line.
class BoardDivider {
  private map: LineMap;
  private lineLenghts: Array<number>;

  constructor(map: LineMap, options: ConnectOptions) {
    this.map = map;
    this.lineLenghts = [];
    let currentLine = 0;
    let currentIndex = 0;
    let currentCoord = map(currentLine, currentIndex);
    while(isLegalCoordinate(currentCoord, options)) {
      while(isLegalCoordinate(currentCoord, options)) {
        currentIndex += 1;
        currentCoord = map(currentLine, currentIndex);
      }
      this.lineLenghts.push(currentIndex);
      currentLine += 1;
      currentIndex = 0;
      currentCoord = map(currentLine, currentIndex);
    }
  }

  getCoordinateAt(line: number, index: number) {
    return this.map(line, index);
  }

  getNumberOfCoordinateOnLine(line: number) {
    return this.lineLenghts[line];
  }

  getNumberOfLines() {
    return this.lineLenghts.length;
  }
}

function horizontalLineMap(line: number, index: number): Coordinate {
  return {x: index, y: line};
}

function verticalLineMap(line: number, index: number): Coordinate {
  return {x: line, y: index};
}

function positiveSlopeLineMapForOptions(options: ConnectOptions): LineMap {
  return (line: number, index: number) => {
    let startOfLine: Coordinate
    if (line < options.boardWidth) {
      startOfLine = {x: options.boardWidth - line - 1, y: 0};
    } else {
      startOfLine = {x: 0, y: line - options.boardWidth};
    }
    startOfLine.x += index;
    startOfLine.y += index;
    return startOfLine;
  }
}

function negativeSlopeLineMapForOptions(options: ConnectOptions): LineMap {
  return (line: number, index: number) => {
    let startOfLine: Coordinate
    if (line < options.boardHeight) {
      startOfLine = {x: 0, y: line};
    } else {
      startOfLine = {x: 1 + line - options.boardHeight , y: options.boardHeight - 1};
    }
    startOfLine.x += index;
    startOfLine.y -= index;
    return startOfLine;
  }
}

// This function finds the set of n (or less) coordinates that blocks the most number of the "win
// lines" provided in wins.
// This problem is actually equivalent to https://en.wikipedia.org/wiki/Dominating_set, making it
// intractable. However, chances are we will be dealing with a low number of win lines and a low n,
// so an exponetntial algorithm should still be fine for reasonable settings.
function blockingCoordinates(n: number, wins: Array<Array<Coordinate>>): Array<Coordinate> {
  if (n <= 0) {
    return [];
  }
  let allCoordinates: Set<string> = new Set<string>();
  let winSets: Array<Set<string>> = [];
  for (let winLine of wins) {
    let winSet: Set<string> = new Set<string>();
    for (let c of winLine) {
      // transform coordinates to strings so that they have a built in "equals".
      let stringVersion: string = coordinateToString(c);
      allCoordinates.add(stringVersion);
      winSet.add(stringVersion);
    }
    winSets.push(winSet);
  }
  let coordinatesList: Array<string> = Array.from(allCoordinates);
  let numCoordinates: number = coordinatesList.length;
  let bestScore: number = 0;
  let bestBlockers: Array<string> = [];
  for (let i = 1; i <= n && i <= numCoordinates; ++i) {
    // TODO(djmclaugh): Instead of iterating over coordinatesList^i, we should iterate over the
    // incresing sequences only which have a much smaller (but still intractable) size.
    let numPossibilities: number = Math.pow(numCoordinates, i);
    for (let possibility: number = 0; possibility < numPossibilities; ++possibility) {
      let counter: number = possibility;
      let blockers: Array<string> = [];
      while (blockers.length < i) {
        blockers.push(coordinatesList[counter % numCoordinates]);
        counter = Math.floor(counter / numCoordinates);
      }
      let score: number = getIntersectionScore(blockers, winSets);
      if (score > bestScore) {
        bestScore = score;
        bestBlockers = blockers;
      }
      if (bestScore == winSets.length) {
        break;
      }
    }
    if (bestScore == winSets.length) {
      break;
    }
  }
  return bestBlockers.map((s: string) => stringToCoordinate(s));
}

// Returns the number of sets in "winSets" that "blockers" intersect with.
function getIntersectionScore<T>(blockers: Array<T>, winSets: Array<Set<T>>): number {
  let score: number = 0;
  for (let winSet of winSets) {
    for (let c of blockers) {
      if (winSet.has(c)) {
        score += 1;
        break;
      }
    }
  }
  return score;
}
