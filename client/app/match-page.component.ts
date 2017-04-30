import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable, Subscription } from "rxjs/Rx";

import { OSASGService, MatchMessage, PlayMessage, UpdateMessage, UserInfo } from "./osasg.service";
import { GUI } from "./guis/GUI";
import { ConnectGUI } from "./guis/connectGUI";

@Component({
  selector: "match-page",
  templateUrl: "/templates/match_page.html",
})

export class MatchPageComponent {
  matchData: UpdateMessage;
  game: any;
  gameGUI: GUI;
  subscription: Subscription;
  requestAnimationFrameHandle: number;
  @ViewChild("match_canvas") canvas: ElementRef;

  constructor (
      private route: ActivatedRoute,
      private osasgService: OSASGService,
      private _ngZone: NgZone) {
  }

  ngOnInit() {
    // do: Clear previous user info when new route parameters are emited.
    // switchMap: Transform the parameters into an Observable<UserInfo> that will either emit
    //     a UserInfo or handle whatever error might occure.
    // subscribe: Handled fetched user information.
    this.subscription = this.route.params
        .do(() => this.clearFetchedInfo())
        .switchMap((params: Params) => this.matchObservableFromParams(params))
        .subscribe((message: MatchMessage) => this.handleMessage(message));
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    window.cancelAnimationFrame(this.requestAnimationFrameHandle);
  }

  ngAfterViewInit() {
    this._ngZone.runOutsideAngular(() => {
      let self: MatchPageComponent = this;
      function step() {
        self.onFrame();
        self.requestAnimationFrameHandle = window.requestAnimationFrame(step);
      }
      self.requestAnimationFrameHandle = window.requestAnimationFrame(step);
    });
  }

  private matchObservableFromParams(params: Params): Observable<MatchMessage> {
    return this.osasgService.getUpdatesForMatch(params["matchID"]);
  }

  private handleMessage(message: MatchMessage) {
    if (!("settings" in message)) {
      let playMessage: PlayMessage = <PlayMessage> message;
      this.matchData.updates.push(playMessage.update);
      this.matchData.toPlay = playMessage.toPlay;
      this.gameGUI.addUpdate(playMessage.update);
    } else {
      this.matchData = <UpdateMessage> message;
      this.gameGUI = new ConnectGUI(
          message.matchID.split("_")[0],
          this.matchData.settings.gameSettings,
          this.canvas.nativeElement);
      this.gameGUI.setUpdates(this.matchData.updates);
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
    this.gameGUI.isMyTurn = false;
    if (this.matchData.status == "ONGOING") {
      if ((this.matchData.toPlay.indexOf(0) != -1 && this.matchData.players[0].identifier == myID)
          || (this.matchData.toPlay.indexOf(1) != -1 && this.matchData.players[1].identifier == myID)) {
        this.gameGUI.isMyTurn = true;
      }
    }
  }

  clearFetchedInfo() {
    this.matchData = null;
  }

  onSeatSelect(seat: number): void {
    this.osasgService.sit(this.matchData.matchID, seat);
  }

  moveToSubmit(): any {
    if (this.gameGUI) {
      return this.gameGUI.getMove();
    }
    return null;
  }

  onMoveSubmit(): void {
    this.osasgService.play(this.matchData.matchID, this.moveToSubmit());
  }

  onFrame(): void {
    if (this.gameGUI && this.gameGUI.needsRedraw) {
      this.gameGUI.draw();
    }
  }
}
