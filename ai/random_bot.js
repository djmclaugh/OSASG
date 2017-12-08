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
var RandomBot = /** @class */ (function (_super) {
    __extends(RandomBot, _super);
    function RandomBot() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    RandomBot.prototype.listOfGames = function () {
        return ["Tictactoe", "Connect6", "Connect"];
    };
    RandomBot.prototype.wantToJoin = function (matchSettings) {
        if (matchSettings.settings.gameName == "Tictactoe"
            || matchSettings.settings.gameName == "Connect6"
            || matchSettings.settings.gameName == "Connect") {
            return true;
        }
        console.log("Unexpected game: " + matchSettings.settings.gameName);
        console.log("Random bot should be able to play any game, please update.");
        return false;
    };
    RandomBot.prototype.getMove = function (match) {
        if (match.settings.gameName == "Tictactoe") {
            return this.getConnectMove(match.updates, ts_turnbased_connect_1.sanitizeOptions(ts_turnbased_connect_1.tictactoeOptions()));
        }
        else if (match.settings.gameName == "Connect6") {
            return this.getConnectMove(match.updates, ts_turnbased_connect_1.sanitizeOptions(ts_turnbased_connect_1.connect6Options()));
        }
        else if (match.settings.gameName == "Connect") {
            return this.getConnectMove(match.updates, ts_turnbased_connect_1.sanitizeOptions(match.settings.gameOptions));
        }
        throw Error("Don't know how to play: " + match.settings.gameName);
    };
    // --- Connect helper methods ---
    RandomBot.prototype.getConnectMove = function (updatesSoFar, options) {
        var movesSoFar = updatesSoFar.slice(1).map(function (update) {
            return update.publicInfo;
        });
        var board = [];
        for (var i = 0; i < options.boardWidth; ++i) {
            board[i] = [];
            for (var j = 0; j < options.boardHeight; ++j) {
                board[i].push(true);
            }
        }
        for (var _i = 0, movesSoFar_1 = movesSoFar; _i < movesSoFar_1.length; _i++) {
            var move_1 = movesSoFar_1[_i];
            var coordinates = Array.isArray(move_1) ? move_1 : [move_1];
            for (var _a = 0, coordinates_1 = coordinates; _a < coordinates_1.length; _a++) {
                var c = coordinates_1[_a];
                board[c.x][c.y] = false;
            }
        }
        var availableCoordinates = [];
        for (var i = 0; i < options.boardWidth; ++i) {
            for (var j = 0; j < options.boardHeight; ++j) {
                if (board[i][j]) {
                    availableCoordinates.push({ x: i, y: j });
                }
            }
        }
        var toPlace = movesSoFar.length == 0 ? options.q : options.p;
        var move = [];
        while (move.length < toPlace && availableCoordinates.length > 0) {
            var index = Math.floor(Math.random() * availableCoordinates.length);
            move.push(availableCoordinates[index]);
            availableCoordinates.splice(index, 1);
        }
        return move;
    };
    return RandomBot;
}(bot_1.Bot));
exports.RandomBot = RandomBot;
