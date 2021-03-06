import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { LobbyService } from "./lobby.service";
import { MatchSummary } from "../../shared/match_info";

@Component({
  selector: "lobby",
  templateUrl: "/templates/lobby.html",
})

export class LobbyComponent {

  constructor (private lobbyService: LobbyService) {}

  getMatches(): Array<MatchSummary> {
    return this.lobbyService.activeMatches;
  }

  joinMatch(matchID: string): void {
    window.open("/match/" + matchID);
  }

  matchPlayers(match: MatchSummary): string {
    let players: Array<string> = [];
    for (let player of match.players) {
      players.push(player ? player.username : "[empty]");
    }
    return players.join(" - ");
  }
}
