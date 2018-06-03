import { Component, ViewChild, ElementRef, NgZone } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable, Subscription } from "rxjs/Rx";

import { OSASGService, UserInfo } from "./osasg.service";
import { GUI } from "./guis/GUI";
import { ConnectGUI } from "./guis/connectGUI";
import { RoshamboGUI } from "./guis/roshamboGUI";
import { OhHellGUI } from "./guis/ohHellGUI";

import { MatchInfo, MatchSettings, MatchSummary } from "../../shared/match_info";
import { PlayerInfo } from "../../shared/player_info";

import {
  MatchUpdateMessage,
} from "../../shared/socket_protocol";

@Component({
  selector: "match-page",
  templateUrl: "/templates/match_page.html",
})

export class MatchPageComponent {
  matchData: MatchInfo;
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
        .subscribe((message: MatchUpdateMessage) => this.handleMessage(message));
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

  private matchObservableFromParams(params: Params): Observable<MatchUpdateMessage> {
    return this.osasgService.getUpdatesForMatch(params["matchID"]);
  }

  private onPlayersUpdate(): void {
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

    let gameName: string = this.matchData.identifier.split("_")[0];
    if (gameName == "roshambo") {
      this.gameGUI = new RoshamboGUI(
        this.matchData.settings.gameOptions,
        this.canvas.nativeElement,
        playingAs
      );
    } else if (gameName == "ohhell") {
      this.gameGUI = new OhHellGUI(
        this.matchData.settings.gameOptions,
        this.canvas.nativeElement,
        playingAs
      );
    } else if (gameName == "connect" || gameName == "connect6" || gameName == "tictactoe") {
      this.gameGUI = new ConnectGUI(
        gameName,
        this.matchData.settings.gameOptions,
        this.canvas.nativeElement,
        playingAs
      );
    } else {
      throw new Error("Unknown game: " + gameName);
    }
    this.gameGUI.setUpdates(this.matchData.updates);
  }

  private handleMessage(message: MatchUpdateMessage) {
    if (message.players) {
      this.matchData.players = message.players;
      this.onPlayersUpdate();
    } else if (message.gameUpdate) {
      this.matchData.updates.push(message.gameUpdate);
      this.gameGUI.addUpdate(message.gameUpdate);
    } else if (message.matchInfo) {
      this.matchData = message.matchInfo;
      this.onPlayersUpdate();
    }
  }

  clearFetchedInfo() {
    this.matchData = null;
  }

  onSeatSelect(seat: number): void {
    this.osasgService.sit(this.matchData.identifier, seat);
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
    this.osasgService.play(this.matchData.identifier, playerToPlay, this.moveToSubmit(), this.matchData.updates.length);
    this.gameGUI.playersToPlay.splice(this.gameGUI.playersToPlay.indexOf(playerToPlay), 1);
    this.gameGUI.onMoveSubmitted();
  }

  onFrame(): void {
    if (this.gameGUI && this.gameGUI.needsRedraw) {
      this.gameGUI.draw();
    }
  }
}
