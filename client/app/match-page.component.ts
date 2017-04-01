import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService, MatchMessage, PlayMessage, UpdateMessage, UserInfo } from "./osasg.service";

const TicTacToe = require("../../modules/matches/games/tictactoe");
const TicTacToeGUI = require("../../modules/matches/games/gui/tictactoe_gui");

@Component({
  selector: "match-page",
  templateUrl: "/templates/match_page.html",
})
export class MatchPageComponent {
  matchData: UpdateMessage;
  moveToSubmit: any;
  game: any;
  gameGUI: any;
  @ViewChild("match_canvas") canvas: ElementRef;

  constructor (
    private route: ActivatedRoute,
    private osasgService: OSASGService) {}

  ngOnInit() {
    // do: Clear previous user info when new route parameters are emited.
    // switchMap: Transform the parameters into an Observable<UserInfo> that will either emit
    //     a UserInfo or handle whatever error might occure.
    // subscribe: Handled fetched user information.
    this.route.params
        .do(() => this.clearFetchedInfo())
        .switchMap((params: Params) => this.matchObservableFromParams(params))
        .subscribe((message: MatchMessage) => this.handleMessage(message));

  }

  private matchObservableFromParams(params: Params): Observable<MatchMessage> {
    return this.osasgService.getUpdatesForMatch(params["matchID"]);
  }

  private handleMessage(message: MatchMessage) {
    if ("move" in message) {
      let playMessage: PlayMessage = <PlayMessage> message;
      this.game.makeMove(playMessage.move);
      this.gameGUI.clean();
      this.gameGUI.draw();
      this.matchData.status = message.status;
    } else {
      this.matchData = <UpdateMessage> message;
      this.game.initFromGameData(this.matchData.gameData);
      this.gameGUI.clean();
      this.gameGUI.draw();
    }
    let currentUser: UserInfo = this.osasgService.getCurrentUserInfo();
    let myID: string = null;
    if (currentUser) {
      if (currentUser._id) {
        myID = currentUser._id;
      } else {
        myID = currentUser.username;
      }
    }
    if ((this.matchData.status == "P1_TO_PLAY" && this.matchData.p1.identifier == myID)
        || (this.matchData.status == "P2_TO_PLAY" && this.matchData.p2.identifier == myID)) {
      this.gameGUI.setMouseDisabled(false);
    } else {
      this.gameGUI.setMouseDisabled(true);
    }
  }

  clearFetchedInfo() {
    this.matchData = null;
    this.game = new TicTacToe();
    this.gameGUI = new TicTacToeGUI(this.game, this.canvas.nativeElement);
    this.gameGUI.draw();
    this.gameGUI.onChange(() => {
      this.gameGUI.draw();
      this.moveToSubmit = this.gameGUI.getMove();
    });
    this.gameGUI.setMouseDisabled(true);
    this.moveToSubmit = this.gameGUI.getMove();
  }

  onSeatSelect(seat: number): void {
    this.osasgService.sit(this.matchData.matchId, seat);
  }

  onMoveSubmit(): void {
    this.osasgService.play(this.matchData.matchId, this.moveToSubmit);
  }
}