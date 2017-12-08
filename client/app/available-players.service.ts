import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Rx";

import { OSASGService } from "./osasg.service";

import { MatchSummary } from "../../shared/match_info";

import { PreferenceProfile } from "../../shared/preference_profile";
import {
  INVITE_TYPE,
  Channel,
  InviteMessage,
  MatchUpdateMessage,
  SubscriptionUpdateMessage,
} from "../../shared/socket_protocol";

@Injectable()
export class AvailablePlayersService {
  availablePlayers: Array<PreferenceProfile> = [];

  constructor (private osasgService: OSASGService) {
    // TODO(djmclaugh): optimize
    osasgService.getAvailablePlayersUpdates().subscribe(profileUpdate => {
      if (profileUpdate.add) {
        this.availablePlayers = this.availablePlayers.concat(profileUpdate.add);
      } else if (profileUpdate.remove) {
        this.availablePlayers = this.availablePlayers.filter(profileInfo => {
          if (profileUpdate.remove == profileInfo.identifier) {
            return false;
          }
          return true;
        })
      } else if (profileUpdate.set) {
        this.availablePlayers = profileUpdate.set;
      } else if (profileUpdate.update) {
        for (let i:number = 0; i < this.availablePlayers.length; ++i) {
          if (profileUpdate.update.identifier == this.availablePlayers[i].identifier) {
            this.availablePlayers[i] = profileUpdate.update;
            break;
          }
        }
      }
    });
  }

  invitePlayerToMatch(matchSummary: MatchSummary, playerID: string, seat: number) {
    let inviteMessage: InviteMessage = {
      type: INVITE_TYPE,
      matchSummary: matchSummary,
      sender: this.osasgService.getCurrentUserInfo().identifier,
      receiver: playerID,
      seat: seat
    }
    this.osasgService.sendMessage(inviteMessage);
  }
}
