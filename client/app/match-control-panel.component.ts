import { Component, ViewChild, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService } from "./osasg.service";
import { AvailablePlayersService } from "./available-players.service";

import { MatchInfo, MatchSummary } from "../../shared/match_info";
import { Update } from "../../shared/update";
import { PreferenceProfile } from "../../shared/preference_profile";
import { MatchUpdateMessage } from "../../shared/socket_protocol";

@Component({
  selector: "match-control-panel",
  templateUrl: "/templates/match_control_panel.html",
})
export class MatchControlPanelComponent {
  private _matchData: MatchInfo = null;
  @Input()
  set matchData(matchData: MatchInfo) {
    this._matchData = matchData;

  }
  get matchData(): MatchInfo {
    return this._matchData;
  }

  @Input() hasMoveToSubmit: boolean;
  @Output() onSeatSelect = new EventEmitter<number>();
  @Output() onMoveSubmit = new EventEmitter<void>();

  constructor (private availablePlayersService: AvailablePlayersService) {}

  title(): string {
    return this.matchData ? this.matchData.identifier : "Match not found";
  }

  winners(): Array<number> {
    let lastUpdate: Update = this._matchData.updates[this._matchData.updates.length - 1];
    if (lastUpdate) {
      return lastUpdate.winners;
    }
    return null;
  }

  winnersString(): string {
    let winners: Array<number> = this.winners();
    if (winners) {
      let winnerNames: Array<string> = winners.map(player => "P" + (1 + player));
      if (winners.length == 0) {
        return "Draw!";
      } else if (winners.length == 1) {
        return winnerNames[0] + " won!"
      } else {
        let numWinners = winnerNames.length;
        let message: string = winnerNames.slice(0, numWinners - 1).join(", ");
        if (numWinners > 2) {
          message += ",";
        }
        message += " and " + winnerNames[numWinners - 1] + " won!";
        return message;
      }
    }
    return null;
  }

  selectSeat(seat: number): void {
    this.onSeatSelect.emit(seat);
  }

  invitePlayer(playerID: string, seat: number): void {
    let summary: MatchSummary = {
      identifier: this.matchData.identifier,
      players: this.matchData.players,
      settings: this.matchData.settings
    }
    this.availablePlayersService.invitePlayerToMatch(summary, playerID, seat);
  }

  submitMove(): void {
    this.onMoveSubmit.emit();
  }

  availablePlayers(): Array<PreferenceProfile> {
    return this.availablePlayersService.availablePlayers.filter(profile => {
      return profile.canPlay.indexOf(this.matchData.settings.gameName) != -1;
    });
  }
}
