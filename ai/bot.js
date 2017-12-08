"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var WebSocket = require("ws");
var socket_protocol_1 = require("../shared/socket_protocol");
var config = require("../config.json");
var Bot = /** @class */ (function () {
    function Bot(identifier, password) {
        this.identifier = identifier;
        this.password = password;
        this.matches = new Map();
    }
    Bot.prototype.start = function () {
        var _this = this;
        this.socket = new WebSocket("ws://localhost:8000", socket_protocol_1.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL);
        this.socket.onopen = function () {
            console.log("Socket connected");
            var authMessage = {
                type: socket_protocol_1.AUTHENTICATION_TYPE,
                identifier: _this.identifier,
                password: _this.password
            };
            _this.send(authMessage);
        };
        this.socket.onclose = function (event) {
            console.log("Socket closed: " + event.reason);
        };
        this.socket.onerror = function (err) {
            console.log("Error: " + err.message);
        };
        this.socket.onmessage = function (event) {
            var message = JSON.parse(event.data);
            console.log("Received: " + message.type);
            _this.onMessage(message);
        };
    };
    Bot.prototype.send = function (message) {
        this.socket.send(JSON.stringify(message));
    };
    Bot.prototype.onMessage = function (message) {
        if (socket_protocol_1.isPlayerInfoMessage(message)) {
            // Successfully authenticated. Make your self available for invites.
            var preferencesMessage = {
                type: socket_protocol_1.PREFERENCES_TYPE,
                profile: {
                    identifier: this.identifier,
                    canPlay: this.listOfGames()
                }
            };
            this.send(preferencesMessage);
        }
        else if (socket_protocol_1.isInviteMessage(message)) {
            this.onInvite(message);
        }
        else if (socket_protocol_1.isMatchUpdateMessage(message)) {
            this.onUpdate(message);
        }
        else if (socket_protocol_1.isErrorMessage(message)) {
            console.log("Error: " + message.error);
        }
        else {
            console.log("Received message of unknown type:");
            console.log(message);
        }
    };
    Bot.prototype.onInvite = function (message) {
        if (this.wantToJoin(message.matchSummary)) {
            var joinMessage = {
                type: socket_protocol_1.JOIN_MATCH_TYPE,
                matchID: message.matchID,
                seat: message.seat
            };
            this.send(joinMessage);
        }
    };
    Bot.prototype.onUpdate = function (message) {
        if (message.matchInfo) {
            this.matches.set(message.matchID, message.matchInfo);
        }
        else if (message.players) {
            this.matches.get(message.matchID).players = message.players;
        }
        else if (message.gameUpdate) {
            this.matches.get(message.matchID).updates.push(message.gameUpdate);
        }
        this.processMatch(message.matchID);
    };
    Bot.prototype.onPlay = function (message) {
        var match = this.matches[message.matchID];
        match.updates.push(message.update);
        //match.toPlay = message.toPlay;
        //match.winners = message.winners;
        //this.processMatch(match);
    };
    Bot.prototype.processMatch = function (matchID) {
        var currentInfo = this.matches.get(matchID);
        if (currentInfo.updates.length == 0) {
            return;
        }
        else if (currentInfo.updates[currentInfo.updates.length - 1].winners != null) {
            this.matches.delete(matchID);
            return;
        }
        var playingAs = new Set();
        for (var i = 0; i < currentInfo.players.length; ++i) {
            var player = currentInfo.players[i];
            if (player.identifier == this.identifier) {
                playingAs.add(i);
            }
        }
        if (playingAs.size == 0) {
            this.matches.delete(matchID);
            return;
        }
        for (var _i = 0, _a = currentInfo.updates[currentInfo.updates.length - 1].toPlay; _i < _a.length; _i++) {
            var p = _a[_i];
            if (playingAs.has(p)) {
                var playMessage = {
                    type: socket_protocol_1.PLAY_TYPE,
                    matchID: matchID,
                    move: this.getMove(currentInfo, p),
                    turnNumber: currentInfo.updates.length,
                    playerNumber: p
                };
                this.send(playMessage);
            }
        }
    };
    return Bot;
}());
exports.Bot = Bot;
