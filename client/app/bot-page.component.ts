import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService, BotInfo } from "./osasg.service";

@Component({
  selector: "bot-page",
  templateUrl: "/templates/bot_page.html",
})
export class BotPageComponent {
  botInfo: BotInfo = null;
  errorText: string = null;

  tempUsername: string = "";
  usernameChangeError: string = null;
  updatingUsername: boolean = false;

  passwordChangeError: string = null;
  updatingPassword: boolean = false;

  tempDescription: string = "";
  descriptionChangeError: string = null;
  updatingDescription: boolean = false;

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
        .switchMap((params: Params) => this.botObservableFromParams(params))
        .subscribe((bot: BotInfo) => this.handleFetchedBot(bot));
  }

  // Returns true if and only if this is the details page for the currently logged ing user.
  isOwner(): boolean {
    if (!this.botInfo || !this.osasgService.getCurrentUserInfo()) {
      return false;
    }
    if (this.botInfo.owner instanceof String) {
      return this.botInfo.owner == this.osasgService.getCurrentUserInfo()._id;
    } else {
      return this.botInfo.owner._id == this.osasgService.getCurrentUserInfo()._id;
    }
  }

  updateUsername(): void {
    this.updatingUsername = true;
    this.osasgService.updateBotUsername(this.botInfo._id, this.tempUsername)
        .subscribe(
            (newUsername: string) => {
              this.tempUsername = "";
              this.botInfo.username = newUsername;
              this.usernameChangeError = null;
              this.updatingUsername = false;
            },
            (errorResponse: Response) => {
              this.usernameChangeError = errorResponse.text();
              this.updatingUsername = false;
            });
  }

  updatePassword(): void {
    console.log("wut");
    this.updatingPassword = true;
    this.osasgService.changeBotPassword(this.botInfo._id)
        .subscribe(
            (newPassword: string) => {
              this.botInfo.password = newPassword;
              this.passwordChangeError = null;
              this.updatingPassword = false;
            },
            (errorResponse: Response) => {
              this.passwordChangeError = errorResponse.text();
              this.updatingPassword = false;
            });
  }

  updateDescription(): void {
    this.descriptionChangeError = "Changing description has not been implemented yet.";
  }

  private clearFetchedInfo(): void {
    this.botInfo = null;
    this.errorText = null;

    this.tempUsername = "";
    this.usernameChangeError = null;
    this.updatingUsername = false;

    this.tempDescription = "";
    this.descriptionChangeError = null;
    this.updatingDescription = false;
  }

  private botObservableFromParams(params: Params): Observable<BotInfo> {
    return this.osasgService.getBotInfo(params["botID"])
        .catch((err:any, caught: Observable<BotInfo>) => this.handleBadBotFetch(err, caught));
  }

  // If fetching a user fails (which can happen if the user enters a bad URL), note the error and
  // replace the failing Observable with and empty Observable.
  private handleBadBotFetch(error: any, caught: Observable<BotInfo>): Observable<BotInfo> {
    this.botInfo = null;
    if (error instanceof Response) {
      this.errorText = error.text();
    } else if (error instanceof Error) {
      this.errorText = error.message;
    } else {
      this.errorText = error.toString();
    }
    return Observable.empty<BotInfo>();
  }

  private handleFetchedBot(bot: BotInfo): void {
    this.botInfo = bot;
    this.errorText = null;
  }

}
