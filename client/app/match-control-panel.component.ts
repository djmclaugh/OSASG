import { Component, ViewChild, ElementRef, EventEmitter, Input, Output } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService, UpdateMessage, ActiveBotInfo } from "./osasg.service";
import { AvailableBotsService } from "./available-bots.service";

@Component({
  selector: "match-control-panel",
  templateUrl: "/templates/match_control_panel.html",
})
export class MatchControlPanelComponent {
  private _matchData = null;
  @Input()
  set matchData(matchData: UpdateMessage) {
    this._matchData = matchData;

  }
  get matchData(): UpdateMessage {
    return this._matchData;
  }

  @Input() hasMoveToSubmit: boolean;
  @Output() onSeatSelect = new EventEmitter<number>();
  @Output() onMoveSubmit = new EventEmitter<void>();

  constructor (private availableBotsService: AvailableBotsService) {}

  title(): string {
    return this.matchData ? this.matchData.matchID : "Match not found";
  }

  selectSeat(seat: number): void {
    this.onSeatSelect.emit(seat);
  }

  selectBot(botID: string, seat: number): void {
    this.availableBotsService.inviteBotToMatch(this.matchData.matchID, botID, seat);
  }

  submitMove(): void {
    this.onMoveSubmit.emit();
  }

  availableBots(): Array<ActiveBotInfo> {
    return this.availableBotsService.activeBots;
  }
}