import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";

import { OSASGService } from "./osasg.service";
import { MatchSummary } from "../../shared/match_info";

import { SubscriptionUpdateMessage } from "../../shared/socket_protocol";

@Injectable()
export class LobbyService {

  activeMatches: Array<MatchSummary>;

  constructor (private osasgService: OSASGService) {
    this.activeMatches = [];
    // TODO(djmclaugh): optimize
    osasgService.getMatchUpdates().subscribe(matchUpdate => {
      if (matchUpdate.add) {
        this.activeMatches = this.activeMatches.concat(matchUpdate.add);
      } else if (matchUpdate.remove) {
        this.activeMatches = this.activeMatches.filter(matchInfo => {
          if (matchUpdate.remove == matchInfo.identifier) {
            return false;
          }
          return true;
        })
      } else if (matchUpdate.set) {
        this.activeMatches = matchUpdate.set;
      } else if (matchUpdate.update) {
        for (let i:number = 0; i < this.activeMatches.length; ++i) {
          if (matchUpdate.update.identifier == this.activeMatches[i].identifier) {
            this.activeMatches[i] = matchUpdate.update;
            break;
          }
        }
      }
    });
  }
}
