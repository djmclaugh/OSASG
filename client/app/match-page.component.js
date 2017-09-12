"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var connectGUI_1 = require("./guis/connectGUI");
var MatchPageComponent = (function () {
    function MatchPageComponent(route, osasgService, _ngZone) {
        this.route = route;
        this.osasgService = osasgService;
        this._ngZone = _ngZone;
    }
    MatchPageComponent.prototype.ngOnInit = function () {
        var _this = this;
        // do: Clear previous user info when new route parameters are emited.
        // switchMap: Transform the parameters into an Observable<UserInfo> that will either emit
        //     a UserInfo or handle whatever error might occure.
        // subscribe: Handled fetched user information.
        this.subscription = this.route.params
            .do(function () { return _this.clearFetchedInfo(); })
            .switchMap(function (params) { return _this.matchObservableFromParams(params); })
            .subscribe(function (message) { return _this.handleMessage(message); });
    };
    MatchPageComponent.prototype.ngOnDestroy = function () {
        this.subscription.unsubscribe();
        window.cancelAnimationFrame(this.requestAnimationFrameHandle);
    };
    MatchPageComponent.prototype.ngAfterViewInit = function () {
        var _this = this;
        this._ngZone.runOutsideAngular(function () {
            var self = _this;
            function step() {
                self.onFrame();
                self.requestAnimationFrameHandle = window.requestAnimationFrame(step);
            }
            self.requestAnimationFrameHandle = window.requestAnimationFrame(step);
        });
    };
    MatchPageComponent.prototype.matchObservableFromParams = function (params) {
        return this.osasgService.getUpdatesForMatch(params["matchID"]);
    };
    MatchPageComponent.prototype.handleMessage = function (message) {
        if (!("settings" in message)) {
            var playMessage = message;
            this.matchData.updates.push(playMessage.update);
            this.matchData.toPlay = playMessage.toPlay;
            this.gameGUI.addUpdate(playMessage.update);
        }
        else {
            this.matchData = message;
            this.gameGUI = new connectGUI_1.ConnectGUI(message.matchID.split("_")[0], this.matchData.settings.gameSettings, this.canvas.nativeElement);
            this.gameGUI.setUpdates(this.matchData.updates);
        }
        var currentUser = this.osasgService.getCurrentUserInfo();
        var myID = null;
        if (currentUser) {
            if (currentUser._id) {
                myID = currentUser._id;
            }
            else {
                myID = currentUser.username;
            }
        }
        this.gameGUI.isMyTurn = false;
        if (this.matchData.status == "ONGOING") {
            if ((this.matchData.toPlay.indexOf(0) != -1 && this.matchData.players[0].identifier == myID)
                || (this.matchData.toPlay.indexOf(1) != -1 && this.matchData.players[1].identifier == myID)) {
                this.gameGUI.isMyTurn = true;
            }
        }
    };
    MatchPageComponent.prototype.clearFetchedInfo = function () {
        this.matchData = null;
    };
    MatchPageComponent.prototype.onSeatSelect = function (seat) {
        this.osasgService.sit(this.matchData.matchID, seat);
    };
    MatchPageComponent.prototype.moveToSubmit = function () {
        if (this.gameGUI) {
            return this.gameGUI.getMove();
        }
        return null;
    };
    MatchPageComponent.prototype.onMoveSubmit = function () {
        this.osasgService.play(this.matchData.matchID, this.moveToSubmit());
    };
    MatchPageComponent.prototype.onFrame = function () {
        if (this.gameGUI && this.gameGUI.needsRedraw) {
            this.gameGUI.draw();
        }
    };
    return MatchPageComponent;
}());
__decorate([
    core_1.ViewChild("match_canvas")
], MatchPageComponent.prototype, "canvas", void 0);
MatchPageComponent = __decorate([
    core_1.Component({
        selector: "match-page",
        templateUrl: "/templates/match_page.html",
    })
], MatchPageComponent);
exports.MatchPageComponent = MatchPageComponent;
