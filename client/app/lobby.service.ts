import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";

import { MatchInfo, MatchUpdate, OSASGService } from "./osasg.service";

@Injectable()
export class LobbyService {

  activeMatches: Array<MatchInfo>;

  constructor (private osasgService: OSASGService) {
    this.activeMatches = [];
    // TODO(djmclaugh): optimize
    osasgService.getMatchUpdates().subscribe(matchUpdate => {
      switch(matchUpdate.action) {
        case "set":
          this.activeMatches = matchUpdate.matches;
          break;
        case "add":
          this.activeMatches = this.activeMatches.concat(matchUpdate.matches);
          break;
        case "remove":
          this.activeMatches = this.activeMatches.filter(matchInfo => {
            for (let toRemove of matchUpdate.matches) {
              if (toRemove.matchId == matchInfo.matchId) {
                return false;
              }
            }
            return true;
          })
          break;
        case "update":
          for (let i:number = 0; i < this.activeMatches.length; ++i) {
            for (let toUpdate of matchUpdate.matches) {
              if (toUpdate.matchId == this.activeMatches[i].matchId) {
                this.activeMatches[i] = toUpdate;
                break;
              }
            }
          }
          break;
        default:
          console.log("Unexpected action type: " + matchUpdate.action);
      }
    });
  }

  createMatch(): Observable<string> {
    return this.osasgService.createMatch({});
  }
}
