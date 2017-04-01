import { Component } from '@angular/core';
import { Observable } from 'rxjs/Observable';

import { LobbyService } from "./lobby.service";
import { MatchInfo } from "./osasg.service";

@Component({
  selector: "lobby",
  templateUrl: "/templates/lobby.html",
})

export class LobbyComponent {

  constructor (private lobbyService: LobbyService) {}

  getMatches(): Array<MatchInfo> {
    return this.lobbyService.activeMatches;
  }

  createMatch(): void {
    this.lobbyService.createMatch().subscribe();
  }

  joinMatch(matchID: string): void {
    window.open("/match/" + matchID);
  }
}