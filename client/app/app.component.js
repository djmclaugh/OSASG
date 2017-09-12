"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
require("./rxjs-operators");
var available_bots_service_1 = require("./available-bots.service");
var lobby_service_1 = require("./lobby.service");
var osasg_service_1 = require("./osasg.service");
var AppComponent = (function () {
    function AppComponent(osasgService, router) {
        this.osasgService = osasgService;
        this.router = router;
        this.username = null;
        this.errors = [];
    }
    AppComponent.prototype.ngOnInit = function () {
        var self = this;
        this.username = this.osasgService.getUsername();
    };
    AppComponent.prototype.getIdentifier = function () {
        if (this.osasgService.getCurrentUserInfo()) {
            return this.osasgService.getCurrentUserInfo()._id;
        }
        return null;
    };
    AppComponent.prototype.getUsername = function () {
        return this.osasgService.getUsername();
    };
    AppComponent.prototype.isGuest = function () {
        return this.osasgService.isGuest();
    };
    AppComponent.prototype.logout = function () {
        this.osasgService.logout();
    };
    return AppComponent;
}());
AppComponent = __decorate([
    core_1.Component({
        selector: "osasg-client",
        templateUrl: "/templates/app_root.html",
        providers: [osasg_service_1.OSASGService, lobby_service_1.LobbyService, available_bots_service_1.AvailableBotsService]
    })
], AppComponent);
exports.AppComponent = AppComponent;
