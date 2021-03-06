import { Component } from '@angular/core';
import { Router, ActivatedRoute, Params } from '@angular/router';
import { Response } from "@angular/http";
import { Observable } from "rxjs/Rx";

import { OSASGService, UserInfo, BotInfo, UserPageInfo } from "./osasg.service";

@Component({
  selector: "user-page",
  templateUrl: "/templates/user_page.html",
})
export class UserPageComponent {
  userInfo: UserInfo = null;
  bots: Array<BotInfo> = [];
  errorText: string = null;

  tempUsername: string = "";
  usernameChangeError: string = null;
  updatingUsername: boolean = false;

  botCreateError: string = null;
  creatingBot: boolean = false;

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
        .switchMap((params: Params) => this.userObservableFromParams(params))
        .subscribe((user: UserPageInfo) => this.handleFetchedUser(user));
  }

  // Returns true if and only if this is the details page for the currently logged in user.
  isSelf(): boolean {
    if (!this.userInfo || !this.osasgService.getCurrentUserInfo()) {
      return false;
    }
    return this.userInfo._id == this.osasgService.getCurrentUserInfo().identifier;
  }

  updateUsername(): void {
    this.updatingUsername = true;
    this.osasgService.updateUsername(this.tempUsername)
        .subscribe(
            (newUsername: string) => {
              this.tempUsername = "";
              this.userInfo.username = newUsername;
              this.usernameChangeError = null;
              this.updatingUsername = false;
            },
            (errorResponse: Response) => {
              this.usernameChangeError = errorResponse.text();
              this.updatingUsername = false;
            });
  }

  createNewBot(): void {
    this.creatingBot = true;
    this.osasgService.createBot()
        .subscribe(
            (newBotID: string) => {
              this.refresh(() => {
                this.creatingBot = false;
                this.botCreateError = null;
              });
            },
            (errorResponse: Response) => {
              this.botCreateError = errorResponse.text();
              this.creatingBot = false;
            });;
  }

  private refresh(callback: () => void) {
    if (this.userInfo._id) {
      this.userObservableFromID(this.userInfo._id)
          .subscribe((user: UserPageInfo) => {
            this.handleFetchedUser(user);
            callback();
          });
    } else {
      callback();
    }
  }

  private clearFetchedInfo(): void {
    this.userInfo = null;
    this.errorText = null;

    this.tempUsername = "";
    this.usernameChangeError = null;
    this.updatingUsername = false;
  }

  private userObservableFromParams(params: Params): Observable<UserPageInfo> {
    return this.userObservableFromID(params["userID"]);
  }

  private userObservableFromID(id: string): Observable<UserPageInfo> {
    return this.osasgService.getUserInfo(id)
        .catch((err:any, caught: Observable<UserPageInfo>) => this.handleBadUserFetch(err));
  }

  // If fetching a user fails (which can happen if the user enters a bad URL), note the error and
  // replace the failing Observable with and empty Observable.
  private handleBadUserFetch(error: any): Observable<UserPageInfo> {
    this.userInfo = null;
    if (error instanceof Response) {
      this.errorText = error.text();
    } else if (error instanceof Error) {
      this.errorText = error.message;
    } else {
      this.errorText = error.toString();
    }
    return Observable.empty<UserPageInfo>();
  }

  private handleFetchedUser(user: UserPageInfo): void {
    this.userInfo = user.user;
    this.bots = user.bots;
    this.errorText = null;
  }

}
