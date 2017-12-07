import { Update } from "ts-turnbased";
import { PlayerInfo } from "../../../shared/player_info";

export class ProcessedUpdate {
  private map: Map<string, Update<any, any>> = new Map();
  constructor(update: Update<any, any>, players: Array<PlayerInfo>) {
    let IDs: Set<string> = new Set();
    for (let player of players) {
      IDs.add(player.identifier);
    }
    for (let identifier of IDs) {
      let newPrivateInfo: Array<any>;
      if (update.privateInfo) {
        newPrivateInfo = update.privateInfo.concat();
        for (let i = 0; i < newPrivateInfo.length; ++i) {
          if (identifier != players[i].identifier) {
            newPrivateInfo[i] = null;
          }
        }
      }
      let newUpdate: Update<any, any> = {
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

  updateForPlayer(identifier: string): Update<any, any> {
    if (this.map.has(identifier)) {
      return this.map.get(identifier);
    } else {
      return this.map.get("");
    }
  }
}
