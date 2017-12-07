"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ProcessedUpdate {
    constructor(update, players) {
        this.map = new Map();
        let IDs = new Set();
        for (let player of players) {
            IDs.add(player.identifier);
        }
        for (let identifier of IDs) {
            let newPrivateInfo;
            if (update.privateInfo) {
                newPrivateInfo = update.privateInfo.concat();
                for (let i = 0; i < newPrivateInfo.length; ++i) {
                    if (identifier != players[i].identifier) {
                        newPrivateInfo[i] = null;
                    }
                }
            }
            let newUpdate = {
                publicInfo: update.publicInfo,
                toPlay: update.toPlay,
                winners: update.winners,
                privateInfo: newPrivateInfo,
            };
            this.map.set(identifier, newUpdate);
        }
        this.map.set("", {
            publicInfo: update.publicInfo,
            toPlay: update.toPlay,
            winners: update.winners,
        });
    }
    updateForPlayer(identifier) {
        if (this.map.has(identifier)) {
            return this.map.get(identifier);
        }
        else {
            return this.map.get("");
        }
    }
}
exports.ProcessedUpdate = ProcessedUpdate;
