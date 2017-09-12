"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var http_1 = require("@angular/http");
var Rx_1 = require("rxjs/Rx");
var BotPageComponent = (function () {
    function BotPageComponent(route, osasgService) {
        this.route = route;
        this.osasgService = osasgService;
        this.botInfo = null;
        this.errorText = null;
        this.tempUsername = "";
        this.usernameChangeError = null;
        this.updatingUsername = false;
        this.passwordChangeError = null;
        this.updatingPassword = false;
        this.tempDescription = "";
        this.descriptionChangeError = null;
        this.updatingDescription = false;
    }
    BotPageComponent.prototype.ngOnInit = function () {
        var _this = this;
        // do: Clear previous user info when new route parameters are emited.
        // switchMap: Transform the parameters into an Observable<UserInfo> that will either emit
        //     a UserInfo or handle whatever error might occure.
        // subscribe: Handled fetched user information.
        this.route.params
            .do(function () { return _this.clearFetchedInfo(); })
            .switchMap(function (params) { return _this.botObservableFromParams(params); })
            .subscribe(function (bot) { return _this.handleFetchedBot(bot); });
    };
    // Returns true if and only if this is the details page for the currently logged ing user.
    BotPageComponent.prototype.isOwner = function () {
        if (!this.botInfo || !this.osasgService.getCurrentUserInfo()) {
            return false;
        }
        if (this.botInfo.owner instanceof String) {
            return this.botInfo.owner == this.osasgService.getCurrentUserInfo()._id;
        }
        else {
            return this.botInfo.owner._id == this.osasgService.getCurrentUserInfo()._id;
        }
    };
    BotPageComponent.prototype.updateUsername = function () {
        var _this = this;
        this.updatingUsername = true;
        this.osasgService.updateBotUsername(this.botInfo._id, this.tempUsername)
            .subscribe(function (newUsername) {
            _this.tempUsername = "";
            _this.botInfo.username = newUsername;
            _this.usernameChangeError = null;
            _this.updatingUsername = false;
        }, function (errorResponse) {
            _this.usernameChangeError = errorResponse.text();
            _this.updatingUsername = false;
        });
    };
    BotPageComponent.prototype.updatePassword = function () {
        var _this = this;
        console.log("wut");
        this.updatingPassword = true;
        this.osasgService.changeBotPassword(this.botInfo._id)
            .subscribe(function (newPassword) {
            _this.botInfo.password = newPassword;
            _this.passwordChangeError = null;
            _this.updatingPassword = false;
        }, function (errorResponse) {
            _this.passwordChangeError = errorResponse.text();
            _this.updatingPassword = false;
        });
    };
    BotPageComponent.prototype.updateDescription = function () {
        this.descriptionChangeError = "Changing description has not been implemented yet.";
    };
    BotPageComponent.prototype.clearFetchedInfo = function () {
        this.botInfo = null;
        this.errorText = null;
        this.tempUsername = "";
        this.usernameChangeError = null;
        this.updatingUsername = false;
        this.tempDescription = "";
        this.descriptionChangeError = null;
        this.updatingDescription = false;
    };
    BotPageComponent.prototype.botObservableFromParams = function (params) {
        var _this = this;
        return this.osasgService.getBotInfo(params["botID"])
            .catch(function (err, caught) { return _this.handleBadBotFetch(err, caught); });
    };
    // If fetching a user fails (which can happen if the user enters a bad URL), note the error and
    // replace the failing Observable with and empty Observable.
    BotPageComponent.prototype.handleBadBotFetch = function (error, caught) {
        this.botInfo = null;
        if (error instanceof http_1.Response) {
            this.errorText = error.text();
        }
        else if (error instanceof Error) {
            this.errorText = error.message;
        }
        else {
            this.errorText = error.toString();
        }
        return Rx_1.Observable.empty();
    };
    BotPageComponent.prototype.handleFetchedBot = function (bot) {
        this.botInfo = bot;
        this.errorText = null;
    };
    return BotPageComponent;
}());
BotPageComponent = __decorate([
    core_1.Component({
        selector: "bot-page",
        templateUrl: "/templates/bot_page.html",
    })
], BotPageComponent);
exports.BotPageComponent = BotPageComponent;
