"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var carrier = require("carrier");
var net = require("net");
var config = require("../config.json");
// Possible message types.
var AUTHORIZATION = "authorization";
var JOIN_MATCH = "api-join-match";
var INVITE_PLAYER = "api-invite-player";
var UPDATE = "update";
var PLAY = "play";
var ERROR = "error-message";
var Bot = (function () {
    function Bot(identifier, password) {
        var _this = this;
        this.identifier = identifier;
        this.password = password;
        this.socket = new net.Socket();
        carrier.carry(this.socket, function (line) { return _this.onMessage(JSON.parse(line)); });
        this.matches = new Map();
    }
    Bot.prototype.start = function () {
        var _this = this;
        this.socket.connect(config.port, config.url, function () {
            _this.sendMessage({
                type: AUTHORIZATION,
                identifier: _this.identifier,
                password: _this.password
            });
        });
    };
    Bot.prototype.onMessage = function (message) {
        switch (message.type) {
            case AUTHORIZATION:
                // NO-OP, but shouldn't actually happen.
                break;
            case JOIN_MATCH:
                // NO-OP, but shouldn't actually happen.
                break;
            case INVITE_PLAYER:
                this.onInvite(message);
                break;
            case UPDATE:
                this.onUpdate(message);
                break;
            case PLAY:
                this.onPlay(message);
                break;
            case ERROR:
                console.log("Error: " + message.error);
                this.socket.destroy();
                break;
            default:
                console.log("Ignoring message of unknown type: " + message.type);
                console.log(JSON.stringify(message));
                break;
        }
    };
    Bot.prototype.sendMessage = function (message) {
        this.socket.write(JSON.stringify(message) + "\n");
    };
    Bot.prototype.onInvite = function (message) {
        if (this.wantToJoin(message)) {
            // IMPORTANT: Sending this message doesn't guaranty that I will join the match.
            // If someone else joined before the server received this, the server will ignore this message.
            // You can only know if you successfully joined a match via the "update" messages.
            this.sendMessage({ type: JOIN_MATCH, matchID: message.matchID });
        }
    };
    Bot.prototype.onUpdate = function (message) {
        this.matches[message.matchID] = message;
        this.processMatch(message);
    };
    Bot.prototype.onPlay = function (message) {
        var match = this.matches[message.matchID];
        match.updates.push(message.update);
        match.toPlay = message.toPlay;
        match.winners = message.winners;
        this.processMatch(match);
    };
    Bot.prototype.processMatch = function (match) {
        if (match.status != "ONGOING") {
            delete this.matches[match.matchID];
            return;
        }
        var playingAs = [];
        for (var i = 0; i < match.players.length; ++i) {
            var player = match.players[i];
            if (player.identifier == this.identifier) {
                playingAs.push(i);
            }
        }
        if (playingAs.length == 0) {
            delete this.matches[match.matchID];
            return;
        }
        for (var _i = 0, _a = match.toPlay; _i < _a.length; _i++) {
            var p = _a[_i];
            if (playingAs.indexOf(p) != -1) {
                this.sendMessage({
                    type: PLAY,
                    matchID: match.matchID,
                    move: this.getMove(match),
                });
                return;
            }
        }
    };
    return Bot;
}());
exports.Bot = Bot;
