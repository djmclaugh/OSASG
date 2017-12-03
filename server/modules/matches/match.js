"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const match_info_1 = require("../../../shared/match_info");
const identifiable_1 = require("../../../shared/identifiable");
const games_1 = require("./games");
const processed_update_1 = require("./processed_update");
function newRandomSeed() {
    return Math.random().toString(36).slice(2);
}
class Match {
    constructor(identifier, matchSettings) {
        this.identifier = identifier;
        this.matchSettings = matchSettings;
        this.status = match_info_1.MatchStatus.NOT_STARTED;
        this.game = games_1.newGame(matchSettings.gameName, matchSettings.gameOptions);
        this.players = [null, null];
    }
    isCurrentlyPlaying(player) {
        for (let playerInfo of this.players) {
            if (playerInfo && identifiable_1.areEqual(playerInfo, player)) {
                return true;
            }
        }
        return false;
    }
    addPlayer(player, seat = -1) {
        if (this.players[seat]) {
            throw new Error("Seat " + seat + "already taken");
        }
        this.players[seat] = player;
        this.onPlayersUpdate(this.players);
        this.startIfFull();
    }
    play(player, move, playerNumber = -1, turnNumber) {
        let currentTurn = this.game.getAllUpdates().length;
        if (turnNumber && currentTurn != turnNumber) {
            throw new Error("Received move for turn " + turnNumber + " but game is waiting for turn " + currentTurn);
        }
        if (playerNumber == -1) {
            for (let i = 0; i < this.players.length; ++i) {
                if (player.identifier == this.players[i].identifier) {
                    playerNumber = i;
                    break;
                }
            }
            if (playerNumber == -1) {
                throw new Error("You are not a player in match " + this.identifier);
            }
        }
        else if (this.players[playerNumber].identifier != player.identifier) {
            throw new Error("You are not player " + playerNumber);
        }
        let didTurnAdvance = false;
        didTurnAdvance = this.game.playMove(move, playerNumber);
        if (didTurnAdvance) {
            this.onGameUpdate(new processed_update_1.ProcessedUpdate(this.game.getLatestUpdate(), this.players));
            this.endIfOver();
        }
    }
    startIfFull() {
        for (let player of this.players) {
            if (!player) {
                return;
            }
        }
        this.status = match_info_1.MatchStatus.ONGOING;
        this.seed = newRandomSeed();
        this.game.start(this.seed);
        this.onGameUpdate(new processed_update_1.ProcessedUpdate(this.game.getLatestUpdate(), this.players));
        // It is technically possible for the game to be over immediatly...
        this.endIfOver();
    }
    endIfOver() {
        if (this.game.getPlayersToPlay().size == 0) {
            match_info_1.MatchStatus.COMPLETED;
            this.onMatchEnd(this.game.getWinners());
        }
    }
    matchSummary() {
        return {
            identifier: this.identifier,
            settings: this.matchSettings,
            players: this.players,
        };
    }
    getAllUpdates(playerIdentifier) {
        return this.game.getAllUpdates().map((value) => {
            return (new processed_update_1.ProcessedUpdate(value, this.players)).updateForPlayer(playerIdentifier);
        });
    }
    matchInfoForPlayer(playerIdentifier) {
        return {
            identifier: this.identifier,
            players: this.players,
            settings: this.matchSettings,
            toPlay: this.toPlay(),
            updates: this.getAllUpdates(playerIdentifier),
            status: this.status
        };
    }
    toPlay() {
        return Array.from(this.game.getPlayersToPlay());
    }
}
exports.Match = Match;
