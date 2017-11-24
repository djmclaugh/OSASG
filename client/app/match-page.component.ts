import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable, Subscription } from "rxjs/Rx";

import { OSASGService, MatchMessage, PlayMessage, UpdateMessage, UserInfo } from "./osasg.service";
import { GUI } from "./guis/GUI";
import { ConnectGUI } from "./guis/connectGUI";
import { RoshamboGUI } from "./guis/roshamboGUI";

import { PlayerInfo } from "../../shared/player_info";

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

      let playingAs: Set<number> = new Set();
      let currentUser: PlayerInfo = this.osasgService.getCurrentUserInfo();
      let myID: string = null;
      if (currentUser) {
        if (currentUser.identifier) {
          myID = currentUser.identifier;
        } else {
          myID = currentUser.username;
        }
      }
      for (let i = 0; i < this.matchData.players.length; ++i) {
        if (this.matchData.players[i] && this.matchData.players[i].identifier == myID) {
          playingAs.add(i);
        }
      }

      let gameName: string = message.matchID.split("_")[0];
      if (gameName == "roshambo") {
        this.gameGUI = new RoshamboGUI(
          this.matchData.settings.gameSettings,
          this.canvas.nativeElement,
          playingAs);
      } else {
        this.gameGUI = new ConnectGUI(
          gameName,
          this.matchData.settings.gameSettings,
          this.canvas.nativeElement,
          playingAs);
      }
      this.gameGUI.setUpdates(this.matchData.updates);
    }
    this.gameGUI.playersToPlay = this.matchData.toPlay;
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
    let playerToPlay: number;
    for (let player of this.gameGUI.playersToPlay) {
      if (this.gameGUI.playingAs.has(player)) {
        playerToPlay = player;
        break;
      }
    }
    this.osasgService.play(this.matchData.matchID, playerToPlay, this.moveToSubmit());
    this.gameGUI.playersToPlay.splice(this.gameGUI.playersToPlay.indexOf(playerToPlay), 1);
    this.gameGUI.onMoveSubmitted();
  }

  onFrame(): void {
    if (this.gameGUI && this.gameGUI.needsRedraw) {
      this.gameGUI.draw();
    }
  }
}
