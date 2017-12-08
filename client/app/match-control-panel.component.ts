import { Component, ViewChild, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService } from "./osasg.service";
import { AvailablePlayersService } from "./available-players.service";

import { MatchInfo, MatchSummary } from "../../shared/match_info";
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
