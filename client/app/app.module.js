"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var platform_browser_1 = require("@angular/platform-browser");
var forms_1 = require("@angular/forms");
var http_1 = require("@angular/http");
var router_1 = require("@angular/router");
var app_component_1 = require("./app.component");
var bot_page_component_1 = require("./bot-page.component");
var create_match_form_component_1 = require("./create-match-form.component");
var home_component_1 = require("./home.component");
var lobby_component_1 = require("./lobby.component");
var login_form_component_1 = require("./login-form.component");
var match_control_panel_component_1 = require("./match-control-panel.component");
var match_page_component_1 = require("./match-page.component");
var page_not_found_component_1 = require("./page-not-found.component");
var user_page_component_1 = require("./user-page.component");
var appRoutes = [
    { path: "", component: lobby_component_1.LobbyComponent },
    { path: "users/:userID", component: user_page_component_1.UserPageComponent },
    { path: "bots/:botID", component: bot_page_component_1.BotPageComponent },
    { path: "match/:matchID", component: match_page_component_1.MatchPageComponent },
    { path: "login", component: login_form_component_1.LoginFormComponent },
    { path: "**", component: page_not_found_component_1.PageNotFoundComponent }
];
var AppModule = (function () {
    function AppModule() {
    }
    return AppModule;
}());
AppModule = __decorate([
    core_1.NgModule({
        imports: [
            router_1.RouterModule.forRoot(appRoutes),
            platform_browser_1.BrowserModule,
            forms_1.FormsModule,
            http_1.HttpModule
        ],
        bootstrap: [app_component_1.AppComponent],
        declarations: [
            app_component_1.AppComponent,
            bot_page_component_1.BotPageComponent,
            create_match_form_component_1.CreateMatchFormComponent,
            home_component_1.HomeComponent,
            lobby_component_1.LobbyComponent,
            login_form_component_1.LoginFormComponent,
            match_control_panel_component_1.MatchControlPanelComponent,
            match_page_component_1.MatchPageComponent,
            page_not_found_component_1.PageNotFoundComponent,
            user_page_component_1.UserPageComponent
        ],
    })
], AppModule);
exports.AppModule = AppModule;
