import { Component, OnInit } from "@angular/core";
import { Router } from '@angular/router';

import './rxjs-operators';

import { AvailableBotsService } from "./available-bots.service";
import { LobbyService } from "./lobby.service";
import { OSASGService } from "./osasg.service";

@Component({
  selector: "osasg-client",
  templateUrl: "/templates/app_root.html",
  providers: [OSASGService, LobbyService, AvailableBotsService]
})
export class AppComponent implements OnInit {
  username: string = null;
  errors: Array<Error> = [];

  constructor(
    private osasgService: OSASGService,
    private router: Router
  ) {}

  ngOnInit(): void {
    var self = this;
    this.username = this.osasgService.getUsername();
  }

  getIdentifier(): string {
    if (this.osasgService.getCurrentUserInfo()) {
      return this.osasgService.getCurrentUserInfo()._id;
    }
    return null;
  }

  getUsername(): string {
    return this.osasgService.getUsername();
  }

  isGuest(): boolean {
    return this.osasgService.isGuest();
  }

  logout(): void {
    this.osasgService.logout();
  }
}
