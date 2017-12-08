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
// Each move is a number from 0 to 8 indicating which cell the player is taking:
// 0 | 1 | 2
// ---------
// 3 | 4 | 5
// ---------
// 6 | 7 | 8
// List of patterns for the possible "3-in-a-row"s
var WINS = [
    1 + 2 + 4,
    8 + 16 + 32,
    64 + 128 + 256,
    1 + 8 + 64,
    2 + 16 + 128,
    4 + 32 + 256,
    1 + 16 + 256,
    4 + 16 + 64,
];
var GAME_TREE = new Map();
var boardBitSize = Math.pow(2, 9);
var TictactoeBoard = /** @class */ (function () {
    function TictactoeBoard() {
        this.oBoard = 0;
        this.xBoard = 0;
    }
    TictactoeBoard.fromMoves = function (moves) {
        var board = new TictactoeBoard();
        var colour = "X";
        for (var _i = 0, moves_1 = moves; _i < moves_1.length; _i++) {
            var move = moves_1[_i];
            board.setColour(colour, move.x + (3 * move.y));
            colour = colour == "X" ? "O" : "X";
        }
        return board;
    };
    TictactoeBoard.prototype.toPlay = function () {
        var xCount = 0;
        var oCount = 0;
        for (var i = 0; i < 9; ++i) {
            if ((Math.pow(2, i) & this.xBoard) != 0) {
                xCount += 1;
            }
            if ((Math.pow(2, i) & this.oBoard) != 0) {
                oCount += 1;
            }
        }
        if (xCount == oCount) {
            return "X";
        }
        else if (xCount - 1 == oCount) {
            return "O";
        }
        throw new Error("Illegal board position: " + this.hash());
    };
    TictactoeBoard.prototype.setColour = function (colour, position) {
        var boardWithPosition = Math.pow(2, position);
        this.oBoard = (this.oBoard | boardWithPosition) - boardWithPosition;
        this.xBoard = (this.xBoard | boardWithPosition) - boardWithPosition;
        if (colour == "X") {
            this.xBoard += boardWithPosition;
        }
        else if (colour == "O") {
            this.oBoard += boardWithPosition;
        }
    };
    TictactoeBoard.prototype.hash = function () {
        return boardBitSize * this.xBoard + this.oBoard;
    };
    TictactoeBoard.prototype.getResult = function () {
        for (var _i = 0, WINS_1 = WINS; _i < WINS_1.length; _i++) {
            var win = WINS_1[_i];
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
        var result = GAME_TREE.get(this.hash());
        if (!result) {
            var player = this.toPlay();
            var posibilities = new Map();
            posibilities.set("O_WIN", false);
            posibilities.set("X_WIN", false);
            posibilities.set("DRAW", false);
            for (var _a = 0, _b = this.getLegalMoves(); _a < _b.length; _a++) {
                var i = _b[_a];
                this.setColour(player, i);
                posibilities.set(this.getResult(), true);
                this.setColour("EMPTY", i);
            }
            if (player == "O" && posibilities.get("O_WIN")) {
                result = "O_WIN";
            }
            else if (player == "X" && posibilities.get("X_WIN")) {
                result = "X_WIN";
            }
            else if (posibilities.get("DRAW")) {
                result = "DRAW";
            }
            else if (player == "O") {
                result = "X_WIN";
            }
            else if (player == "X") {
                result = "O_WIN";
            }
            GAME_TREE.set(this.hash(), result);
        }
        return result;
    };
    TictactoeBoard.prototype.getLegalMoves = function () {
        var moves = new Array();
        for (var i = 0; i < 9; ++i) {
            if ((Math.pow(2, i) & (this.xBoard | this.oBoard)) == 0) {
                moves.push(i);
            }
        }
        return moves;
    };
    TictactoeBoard.prototype.getBestMoves = function (toPlay) {
        var win = new Array();
        var draw = new Array();
        var lose = new Array();
        for (var _i = 0, _a = this.getLegalMoves(); _i < _a.length; _i++) {
            var i = _a[_i];
            this.setColour(toPlay, i);
            switch (this.getResult()) {
                case "O_WIN":
                    if (toPlay == "O") {
                        win.push(i);
                    }
                    else {
                        lose.push(i);
                    }
                    break;
                case "X_WIN":
                    if (toPlay == "X") {
                        win.push(i);
                    }
                    else {
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
        }
        else if (draw.length) {
            return draw;
        }
        return lose;
    };
    return TictactoeBoard;
}());
var TictacproBot = /** @class */ (function (_super) {
    __extends(TictacproBot, _super);
    function TictacproBot() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    TictacproBot.prototype.listOfGames = function () {
        return ["Tictactoe"];
    };
    TictacproBot.prototype.wantToJoin = function (matchSettings) {
        if (matchSettings.settings.gameName == "Tictactoe") {
            return true;
        }
        return false;
    };
    TictacproBot.prototype.getMove = function (match) {
        if (match.settings.gameName == "Tictactoe") {
            return this.getTictactoeMove(match.updates);
        }
        throw Error("Don't know how to play: " + match.settings.gameName);
    };
    TictacproBot.prototype.getTictactoeMove = function (updatesSoFar) {
        var movesSoFar = updatesSoFar.slice(1).map(function (update) {
            return update.publicInfo;
        });
        var coordinates = [];
        for (var _i = 0, movesSoFar_1 = movesSoFar; _i < movesSoFar_1.length; _i++) {
            var move = movesSoFar_1[_i];
            coordinates.push(Array.isArray(move) ? move[0] : move);
        }
        var board = TictactoeBoard.fromMoves(coordinates);
        var toPlay = coordinates.length % 2 == 0 ? "X" : "O";
        var bestMoves = board.getBestMoves(toPlay).map(function (position) {
            return { x: position % 3, y: Math.floor(position / 3) };
        });
        var index = Math.floor(Math.random() * bestMoves.length);
        return [bestMoves[index]];
    };
    return TictacproBot;
}(bot_1.Bot));
exports.TictacproBot = TictacproBot;
