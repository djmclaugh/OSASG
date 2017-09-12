"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var MatchControlPanelComponent = (function () {
    function MatchControlPanelComponent(availableBotsService) {
        this.availableBotsService = availableBotsService;
        this._matchData = null;
        this.onSeatSelect = new core_1.EventEmitter();
        this.onMoveSubmit = new core_1.EventEmitter();
    }
    Object.defineProperty(MatchControlPanelComponent.prototype, "matchData", {
        get: function () {
            return this._matchData;
        },
        set: function (matchData) {
            this._matchData = matchData;
        },
        enumerable: true,
        configurable: true
    });
    MatchControlPanelComponent.prototype.title = function () {
        return this.matchData ? this.matchData.matchID : "Match not found";
    };
    MatchControlPanelComponent.prototype.selectSeat = function (seat) {
        this.onSeatSelect.emit(seat);
    };
    MatchControlPanelComponent.prototype.selectBot = function (botID, seat) {
        this.availableBotsService.inviteBotToMatch(this.matchData.matchID, botID, seat);
    };
    MatchControlPanelComponent.prototype.submitMove = function () {
        this.onMoveSubmit.emit();
    };
    MatchControlPanelComponent.prototype.availableBots = function () {
        return this.availableBotsService.activeBots;
    };
    return MatchControlPanelComponent;
}());
__decorate([
    core_1.Input()
], MatchControlPanelComponent.prototype, "matchData", null);
__decorate([
    core_1.Input()
], MatchControlPanelComponent.prototype, "hasMoveToSubmit", void 0);
__decorate([
    core_1.Output()
], MatchControlPanelComponent.prototype, "onSeatSelect", void 0);
__decorate([
    core_1.Output()
], MatchControlPanelComponent.prototype, "onMoveSubmit", void 0);
MatchControlPanelComponent = __decorate([
    core_1.Component({
        selector: "match-control-panel",
        templateUrl: "/templates/match_control_panel.html",
    })
], MatchControlPanelComponent);
exports.MatchControlPanelComponent = MatchControlPanelComponent;
