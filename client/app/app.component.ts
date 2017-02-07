import { Component, OnInit } from "@angular/core";

import './rxjs-operators';

import { OSASGService } from "./osasg.service";

@Component({
  selector: "osasg-client",
  templateUrl: "/templates/title.html",
  providers: [OSASGService]
})
export class AppComponent implements OnInit {
  username: string = null;
  errors: Array<Error> = [];

  constructor(private osasgService: OSASGService) { }

  ngOnInit(): void {
    var self = this;
    this.username = this.osasgService.getUsername();
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
