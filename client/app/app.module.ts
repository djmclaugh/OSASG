import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AppComponent } from "./app.component";
import { BotPageComponent } from "./bot-page.component";
import { HomeComponent } from "./home.component";
import { LobbyComponent } from "./lobby.component";
import { LoginFormComponent } from "./login-form.component";
import { MatchControlPanelComponent } from "./match-control-panel.component";
import { MatchPageComponent } from "./match-page.component";
import { PageNotFoundComponent } from "./page-not-found.component";
import { UserPageComponent } from "./user-page.component";

const appRoutes: Routes = [
  { path: "", component: LobbyComponent },
  { path: "users/:userID", component: UserPageComponent },
  { path: "bots/:botID", component: BotPageComponent },
  { path: "match/:matchID", component: MatchPageComponent },
  { path: "login", component: LoginFormComponent },
  { path: "**", component: PageNotFoundComponent }
];

@NgModule({
  imports: [
    RouterModule.forRoot(appRoutes),
    BrowserModule,
    FormsModule,
    HttpModule
  ],
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    BotPageComponent,
    HomeComponent,
    LobbyComponent,
    LoginFormComponent,
    MatchControlPanelComponent,
    MatchPageComponent,
    PageNotFoundComponent,
    UserPageComponent
  ],
})
export class AppModule {}
