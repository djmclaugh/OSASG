"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_protocol_1 = require("../../shared/socket_protocol");
class MatchLobby {
    constructor(server, matchManager) {
        this.server = server;
        this.matchManager = matchManager;
        this.spectators = new Map();
        this.server.onNewPlayer = (player) => {
            this.onNewPlayer(player);
        };
        this.matchManager.onMatchCreated = (match) => {
            this.onNewMatch(match);
        };
        this.matchManager.onMatchEnded = (match) => {
            this.spectators.delete(match.identifier);
            this.server.subsciptionManager.removeItem(socket_protocol_1.Channel.ACTIVE_MATCHES, match.identifier);
        };
    }
    onNewPlayer(player) {
        player.onSpectateMatch = (message) => {
            let spectatorSet = this.getSpectators(message.matchID);
            if (spectatorSet) {
                if (message.spectate) {
                    spectatorSet.add(player);
                    let match = this.matchManager.getMatch(message.matchID);
                    let updateMessage = {
                        type: socket_protocol_1.MATCH_UPDATE_TYPE,
                        matchID: match.identifier,
                        matchInfo: match.matchInfoForPlayer(player.playerInfo.identifier),
                    };
                    player.send(updateMessage);
                }
                else {
                    spectatorSet.delete(player);
                }
            }
        };
        player.onPlay = (message) => {
            let match = this.matchManager.getMatch(message.matchID);
            if (!match) {
                throw new Error("Match " + message.matchID + " is not active.");
            }
            match.play(player.playerInfo, message.move, message.playerNumber, message.turnNumber);
            player.send(message);
        };
        player.onJoinMatch = (message) => {
            let match = this.matchManager.getMatch(message.matchID);
            if (!match) {
                throw new Error("Match " + message.matchID + " is not active.");
            }
            match.addPlayer(player.playerInfo, message.seat);
            // Auto-spectate the match.
            player.onSpectateMatch({
                type: socket_protocol_1.SPECTATE_MATCH_TYPE,
                matchID: message.matchID,
                spectate: true
            });
        };
    }
    onNewMatch(match) {
        this.server.subsciptionManager.addItem(socket_protocol_1.Channel.ACTIVE_MATCHES, match.matchSummary());
        match.onPlayersUpdate = (players) => {
            this.server.subsciptionManager.updateItem(socket_protocol_1.Channel.ACTIVE_MATCHES, match.matchSummary());
            let updateMessage = {
                type: socket_protocol_1.MATCH_UPDATE_TYPE,
                matchID: match.identifier,
                players: players,
            };
            for (let socket of this.getSpectators(match.identifier)) {
                socket.send(updateMessage);
            }
        };
        match.onGameUpdate = (update) => {
            let updateMessage = {
                type: socket_protocol_1.MATCH_UPDATE_TYPE,
                matchID: match.identifier,
            };
            for (let socket of this.getSpectators(match.identifier)) {
                updateMessage.gameUpdate = update.updateForPlayer(socket.playerInfo.identifier);
                socket.send(updateMessage);
            }
        };
    }
    getSpectators(matchID) {
        if (!this.matchManager.getMatch(matchID)) {
            throw new Error("Match " + matchID + " is not active.");
        }
        let spectatorSet = this.spectators.get(matchID);
        if (!spectatorSet) {
            spectatorSet = new Set();
            this.spectators.set(matchID, spectatorSet);
        }
        return spectatorSet;
    }
}
exports.MatchLobby = MatchLobby;
