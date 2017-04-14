import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";

import { ActiveBotInfo, OSASGService } from "./osasg.service";

@Injectable()
export class AvailableBotsService {
  activeBots: Array<ActiveBotInfo>;

  constructor (private osasgService: OSASGService) {
    this.activeBots = [];
    // TODO(djmclaugh): optimize
    osasgService.getBotUpdates().subscribe(botUpdate => {
      switch(botUpdate.action) {
        case "set":
          this.activeBots = botUpdate.bots;
          break;
        case "add":
          this.activeBots = this.activeBots.concat(botUpdate.bots);
          break;
        case "remove":
          this.activeBots = this.activeBots.filter(botInfo => {
            for (let toRemove of botUpdate.bots) {
              if (toRemove.identifier == botInfo.identifier) {
                return false;
              }
            }
            return true;
          })
          break;
        case "update":
          for (let i:number = 0; i < this.activeBots.length; ++i) {
            for (let toUpdate of botUpdate.bots) {
              if (toUpdate.identifier == this.activeBots[i].identifier) {
                this.activeBots[i] = toUpdate;
                break;
              }
            }
          }
          break;
        default:
          console.log("Unexpected action type: " + botUpdate.action);
      }
    });
  }

  inviteBotToMatch(matchID: string, botID: string, seat: number) {
    this.osasgService.sendMessage("api-invite-player", {
      matchID: matchID,
      playerID: botID,
      seat: seat
    });
  }
}
