import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule } from '@angular/http';
import { RouterModule, Routes } from '@angular/router';

import { AboutComponent } from "./about.component";
import { AppComponent } from "./app.component";
import { BotPageComponent } from "./bot-page.component";
import { CreateMatchFormComponent } from "./create-match-form.component";
import { HomeComponent } from "./home.component";
import { LobbyComponent } from "./lobby.component";
import { LoginFormComponent } from "./login-form.component";
import { MatchControlPanelComponent } from "./match-control-panel.component";
import { MatchPageComponent } from "./match-page.component";
import { PageNotFoundComponent } from "./page-not-found.component";
import { UserPageComponent } from "./user-page.component";

const appRoutes: Routes = [
  { path: "", component: LobbyComponent },
  { path: "about", component: AboutComponent },
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
    AboutComponent,
    AppComponent,
    BotPageComponent,
    CreateMatchFormComponent,
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
