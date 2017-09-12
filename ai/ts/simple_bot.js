"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
var bot_1 = require("./bot");
var ts_turnbased_connect_1 = require("ts-turnbased-connect");
var SimpleBot = (function (_super) {
    __extends(SimpleBot, _super);
    function SimpleBot() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    SimpleBot.prototype.wantToJoin = function (matchSettings) {
        if (matchSettings.gameName == "Tictactoe"
            || matchSettings.gameName == "Connect6"
            || matchSettings.gameName == "Connect") {
            return true;
        }
        return false;
    };
    SimpleBot.prototype.getMove = function (match) {
        if (match.gameName == "Tictactoe") {
            return this.getConnectMove(match.updates, ts_turnbased_connect_1.sanitizeOptions(ts_turnbased_connect_1.tictactoeOptions()));
        }
        else if (match.gameName == "Connect6") {
            return this.getConnectMove(match.updates, ts_turnbased_connect_1.sanitizeOptions(ts_turnbased_connect_1.connect6Options()));
        }
        else if (match.gameName == "Connect") {
            return this.getConnectMove(match.updates, ts_turnbased_connect_1.sanitizeOptions(match.settings.gameSettings));
        }
        throw Error("Don't know how to play: " + match.gameName);
    };
    SimpleBot.prototype.getConnectMove = function (updatesSoFar, options) {
        var playedMoves = updatesSoFar.slice(1).map(function (update) {
            return update.publicInfo;
        });
        var board = [];
        for (var i = 0; i < options.boardWidth; ++i) {
            board[i] = [];
            for (var j = 0; j < options.boardHeight; ++j) {
                board[i].push(0);
            }
        }
        for (var i = 0; i < playedMoves.length; ++i) {
            var move = playedMoves[i];
            var coordinates = Array.isArray(move) ? move : [move];
            for (var _i = 0, coordinates_1 = coordinates; _i < coordinates_1.length; _i++) {
                var c = coordinates_1[_i];
                board[c.x][c.y] = 1 + (i % 2);
            }
        }
        var wins = getAllWins(board, options);
        var currentPlayer = playedMoves.length % 2;
        var moveSoFar = [];
        if (wins[currentPlayer].length > 0) {
            // If you can win, win.
            moveSoFar = wins[currentPlayer][0];
            for (var _a = 0, moveSoFar_1 = moveSoFar; _a < moveSoFar_1.length; _a++) {
                var c = moveSoFar_1[_a];
                board[c.x][c.y] = currentPlayer + 1;
            }
        }
        else if (wins[1 - currentPlayer].length > 0) {
            // If your opponent can win next turn, try to block them.
            moveSoFar = blockingCoordinates(options.p, wins[1 - currentPlayer]);
            for (var _b = 0, moveSoFar_2 = moveSoFar; _b < moveSoFar_2.length; _b++) {
                var c = moveSoFar_2[_b];
                board[c.x][c.y] = currentPlayer + 1;
            }
        }
        // Choose the remainder of your moves randomly.
        var availableCoordinates = [];
        for (var i = 0; i < options.boardWidth; ++i) {
            for (var j = 0; j < options.boardHeight; ++j) {
                if (board[i][j] == 0) {
                    availableCoordinates.push({ x: i, y: j });
                }
            }
        }
        var toPlace = playedMoves.length == 0 ? options.q : options.p;
        while (moveSoFar.length < toPlace && availableCoordinates.length > 0) {
            var index = Math.floor(Math.random() * availableCoordinates.length);
            moveSoFar.push(availableCoordinates[index]);
            availableCoordinates.splice(index, 1);
        }
        return moveSoFar.slice(0, toPlace);
    };
    return SimpleBot;
}(bot_1.Bot));
exports.SimpleBot = SimpleBot;
// --- Connect helper methods ---
function isLegalCoordinate(c, options) {
    return c.x >= 0 && c.x < options.boardWidth && c.y >= 0 && c.y < options.boardHeight;
}
function coordinateToString(c) {
    return c.x + ":" + c.y;
}
function stringToCoordinate(s) {
    var split = s.split(":");
    return { x: parseInt(split[0]), y: parseInt(split[1]) };
}
// Finds and returns all sets of coordinates a player could play this turn to win (asusming it's
// their turn).
// The possibles wins for p1 are stored in the first entry of the returned result and the possible
// wins for p2 are stored in the second entry.
function getAllWins(board, options) {
    var wins = [[], []];
    var partialWins;
    var divider;
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
function getWins(divider, board, stonesToWin, stonesToPlace) {
    var wins = [[], []];
    for (var line = 0; line < divider.getNumberOfLines(); ++line) {
        var queue = new LimitedQueue(stonesToWin);
        for (var index = 0; index < divider.getNumberOfCoordinateOnLine(line); ++index) {
            var position = divider.getCoordinateAt(line, index);
            queue.add(board[position.x][position.y]);
            if (queue.isFull()) {
                var winner = 0;
                if (queue.getCount(1) >= stonesToWin - stonesToPlace && queue.getCount(2) == 0) {
                    winner = 1;
                }
                else if (queue.getCount(2) >= stonesToWin - stonesToPlace && queue.getCount(1) == 0) {
                    winner = 2;
                }
                if (winner) {
                    var newWin = [];
                    for (var backtrack = 1 + index - stonesToWin; backtrack <= index; ++backtrack) {
                        var previousPosition = divider.getCoordinateAt(line, backtrack);
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
var LimitedQueue = (function () {
    function LimitedQueue(size) {
        this.size = size;
        this.contents = [];
        this.currentIndex = 0;
        this.countMap = new Map();
    }
    LimitedQueue.prototype.isFull = function () {
        return this.contents.length == this.size;
    };
    LimitedQueue.prototype.getCount = function (item) {
        var count = this.countMap.get(item);
        return typeof count == "number" ? count : 0;
    };
    LimitedQueue.prototype.add = function (item) {
        this.increaseCountForItem(item);
        if (!this.isFull()) {
            this.currentIndex = this.currentIndex;
            this.contents.push(item);
        }
        else {
            this.decreaseCountForItem(this.contents[this.currentIndex]);
            this.contents[this.currentIndex] = item;
        }
        this.currentIndex = (this.currentIndex + 1) % this.size;
    };
    LimitedQueue.prototype.increaseCountForItem = function (item) {
        this.countMap.set(item, this.getCount(item) + 1);
    };
    LimitedQueue.prototype.decreaseCountForItem = function (item) {
        this.countMap.set(item, this.getCount(item) - 1);
    };
    return LimitedQueue;
}());
// Function that divids the board into lines by allowing us to query the "index"th coordinate of the
//  "line"th line.
var BoardDivider = (function () {
    function BoardDivider(map, options) {
        this.map = map;
        this.lineLenghts = [];
        var currentLine = 0;
        var currentIndex = 0;
        var currentCoord = map(currentLine, currentIndex);
        while (isLegalCoordinate(currentCoord, options)) {
            while (isLegalCoordinate(currentCoord, options)) {
                currentIndex += 1;
                currentCoord = map(currentLine, currentIndex);
            }
            this.lineLenghts.push(currentIndex);
            currentLine += 1;
            currentIndex = 0;
            currentCoord = map(currentLine, currentIndex);
        }
    }
    BoardDivider.prototype.getCoordinateAt = function (line, index) {
        return this.map(line, index);
    };
    BoardDivider.prototype.getNumberOfCoordinateOnLine = function (line) {
        return this.lineLenghts[line];
    };
    BoardDivider.prototype.getNumberOfLines = function () {
        return this.lineLenghts.length;
    };
    return BoardDivider;
}());
function horizontalLineMap(line, index) {
    return { x: index, y: line };
}
function verticalLineMap(line, index) {
    return { x: line, y: index };
}
function positiveSlopeLineMapForOptions(options) {
    return function (line, index) {
        var startOfLine;
        if (line < options.boardWidth) {
            startOfLine = { x: options.boardWidth - line - 1, y: 0 };
        }
        else {
            startOfLine = { x: 0, y: line - options.boardWidth };
        }
        startOfLine.x += index;
        startOfLine.y += index;
        return startOfLine;
    };
}
function negativeSlopeLineMapForOptions(options) {
    return function (line, index) {
        var startOfLine;
        if (line < options.boardHeight) {
            startOfLine = { x: 0, y: line };
        }
        else {
            startOfLine = { x: 1 + line - options.boardHeight, y: options.boardHeight - 1 };
        }
        startOfLine.x += index;
        startOfLine.y -= index;
        return startOfLine;
    };
}
// This function finds the set of n (or less) coordinates that blocks the most number of the "win
// lines" provided in wins.
// This problem is actually equivalent to https://en.wikipedia.org/wiki/Dominating_set, making it
// intractable. However, chances are we will be dealing with a low number of win lines and a low n,
// so an exponetntial algorithm should still be fine for reasonable settings.
function blockingCoordinates(n, wins) {
    if (n <= 0) {
        return [];
    }
    var allCoordinates = new Set();
    var winSets = [];
    for (var _i = 0, wins_1 = wins; _i < wins_1.length; _i++) {
        var winLine = wins_1[_i];
        var winSet = new Set();
        for (var _a = 0, winLine_1 = winLine; _a < winLine_1.length; _a++) {
            var c = winLine_1[_a];
            // transform coordinates to strings so that they have a built in "equals".
            var stringVersion = coordinateToString(c);
            allCoordinates.add(stringVersion);
            winSet.add(stringVersion);
        }
        winSets.push(winSet);
    }
    var coordinatesList = Array.from(allCoordinates);
    var numCoordinates = coordinatesList.length;
    var bestScore = 0;
    var bestBlockers = [];
    for (var i = 1; i <= n && i <= numCoordinates; ++i) {
        // TODO(djmclaugh): Instead of iterating over coordinatesList^i, we should iterate over the
        // incresing sequences only which have a much smaller (but still intractable) size.
        var numPossibilities = Math.pow(numCoordinates, i);
        for (var possibility = 0; possibility < numPossibilities; ++possibility) {
            var counter = possibility;
            var blockers = [];
            while (blockers.length < i) {
                blockers.push(coordinatesList[counter % numCoordinates]);
                counter = Math.floor(counter / numCoordinates);
            }
            var score = getIntersectionScore(blockers, winSets);
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
    return bestBlockers.map(function (s) { return stringToCoordinate(s); });
}
// Returns the number of sets in "winSets" that "blockers" intersect with.
function getIntersectionScore(blockers, winSets) {
    var score = 0;
    for (var _i = 0, winSets_1 = winSets; _i < winSets_1.length; _i++) {
        var winSet = winSets_1[_i];
        for (var _a = 0, blockers_1 = blockers; _a < blockers_1.length; _a++) {
            var c = blockers_1[_a];
            if (winSet.has(c)) {
                score += 1;
                break;
            }
        }
    }
    return score;
}
