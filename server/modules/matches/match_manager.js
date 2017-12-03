"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const match_1 = require("./match");
class MatchManager {
    constructor() {
        this.counter = 1;
        this.allMatches = new Map();
    }
    getMatch(matchID) {
        return this.allMatches.get(matchID);
    }
    createNewMatch(matchSettings) {
        let matchID = matchSettings.gameName.toLowerCase() + "_" + this.counter++;
        let match = new match_1.Match(matchID, matchSettings);
        this.allMatches.set(matchID, match);
        match.onMatchEnd = () => {
            this.allMatches.delete(matchID);
            this.onMatchEnded(match);
        };
        this.onMatchCreated(match);
        return match;
    }
    getMatchesUserCanJoin(playerIdentifier) {
        let matches = [];
        for (let match of this.allMatches.values()) {
            matches.push(match);
        }
        return matches;
    }
}
exports.MatchManager = MatchManager;
