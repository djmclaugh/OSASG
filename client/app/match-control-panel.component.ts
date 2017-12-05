import { Component, ViewChild, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService, ActiveBotInfo } from "./osasg.service";
import { AvailableBotsService } from "./available-bots.service";

import { MatchInfo } from "../../shared/match_info";
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

  constructor (private availableBotsService: AvailableBotsService) {}

  title(): string {
    return this.matchData ? this.matchData.identifier : "Match not found";
  }

  selectSeat(seat: number): void {
    this.onSeatSelect.emit(seat);
  }

  selectBot(botID: string, seat: number): void {
    this.availableBotsService.inviteBotToMatch(this.matchData.identifier, botID, seat);
  }

  submitMove(): void {
    this.onMoveSubmit.emit();
  }

  availableBots(): Array<ActiveBotInfo> {
    return [];
  }
}
