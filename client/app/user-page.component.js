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
var UserPageComponent = (function () {
    function UserPageComponent(route, osasgService) {
        this.route = route;
        this.osasgService = osasgService;
        this.userInfo = null;
        this.bots = [];
        this.errorText = null;
        this.tempUsername = "";
        this.usernameChangeError = null;
        this.updatingUsername = false;
        this.tempEmail = "";
        this.emailChangeError = null;
        this.updatingEmail = false;
        this.botCreateError = null;
        this.creatingBot = false;
    }
    UserPageComponent.prototype.ngOnInit = function () {
        var _this = this;
        // do: Clear previous user info when new route parameters are emited.
        // switchMap: Transform the parameters into an Observable<UserInfo> that will either emit
        //     a UserInfo or handle whatever error might occure.
        // subscribe: Handled fetched user information.
        this.route.params
            .do(function () { return _this.clearFetchedInfo(); })
            .switchMap(function (params) { return _this.userObservableFromParams(params); })
            .subscribe(function (user) { return _this.handleFetchedUser(user); });
    };
    // Returns true if and only if this is the details page for the currently logged ing user.
    UserPageComponent.prototype.isSelf = function () {
        if (!this.userInfo || !this.osasgService.getCurrentUserInfo()) {
            return false;
        }
        return this.userInfo._id == this.osasgService.getCurrentUserInfo()._id;
    };
    UserPageComponent.prototype.updateUsername = function () {
        var _this = this;
        this.updatingUsername = true;
        this.osasgService.updateUsername(this.tempUsername)
            .subscribe(function (newUsername) {
            _this.tempUsername = "";
            _this.userInfo.username = newUsername;
            _this.usernameChangeError = null;
            _this.updatingUsername = false;
        }, function (errorResponse) {
            _this.usernameChangeError = errorResponse.text();
            _this.updatingUsername = false;
        });
    };
    UserPageComponent.prototype.updateEmail = function () {
        this.emailChangeError = "Changing associated email has not been implemented yet.";
    };
    UserPageComponent.prototype.createNewBot = function () {
        var _this = this;
        this.creatingBot = true;
        this.osasgService.createBot()
            .subscribe(function (newBotID) {
            _this.refresh(function () {
                _this.creatingBot = false;
                _this.botCreateError = null;
            });
        }, function (errorResponse) {
            _this.botCreateError = errorResponse.text();
            _this.creatingBot = false;
        });
        ;
    };
    UserPageComponent.prototype.refresh = function (callback) {
        var _this = this;
        if (this.userInfo._id) {
            this.userObservableFromID(this.userInfo._id)
                .subscribe(function (user) {
                _this.handleFetchedUser(user);
                callback();
            });
        }
        else {
            callback();
        }
    };
    UserPageComponent.prototype.clearFetchedInfo = function () {
        this.userInfo = null;
        this.errorText = null;
        this.tempUsername = "";
        this.usernameChangeError = null;
        this.updatingUsername = false;
        this.tempEmail = "";
        this.emailChangeError = null;
        this.updatingEmail = false;
    };
    UserPageComponent.prototype.userObservableFromParams = function (params) {
        return this.userObservableFromID(params["userID"]);
    };
    UserPageComponent.prototype.userObservableFromID = function (id) {
        var _this = this;
        return this.osasgService.getUserInfo(id)
            .catch(function (err, caught) { return _this.handleBadUserFetch(err); });
    };
    // If fetching a user fails (which can happen if the user enters a bad URL), note the error and
    // replace the failing Observable with and empty Observable.
    UserPageComponent.prototype.handleBadUserFetch = function (error) {
        this.userInfo = null;
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
    UserPageComponent.prototype.handleFetchedUser = function (user) {
        this.userInfo = user.user;
        this.bots = user.bots;
        this.errorText = null;
    };
    return UserPageComponent;
}());
UserPageComponent = __decorate([
    core_1.Component({
        selector: "user-page",
        templateUrl: "/templates/user_page.html",
    })
], UserPageComponent);
exports.UserPageComponent = UserPageComponent;
