"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var AvailableBotsService = (function () {
    function AvailableBotsService(osasgService) {
        var _this = this;
        this.osasgService = osasgService;
        this.activeBots = [];
        // TODO(djmclaugh): optimize
        osasgService.getBotUpdates().subscribe(function (botUpdate) {
            switch (botUpdate.action) {
                case "set":
                    _this.activeBots = botUpdate.bots;
                    break;
                case "add":
                    _this.activeBots = _this.activeBots.concat(botUpdate.bots);
                    break;
                case "remove":
                    _this.activeBots = _this.activeBots.filter(function (botInfo) {
                        for (var _i = 0, _a = botUpdate.bots; _i < _a.length; _i++) {
                            var toRemove = _a[_i];
                            if (toRemove.identifier == botInfo.identifier) {
                                return false;
                            }
                        }
                        return true;
                    });
                    break;
                case "update":
                    for (var i = 0; i < _this.activeBots.length; ++i) {
                        for (var _i = 0, _a = botUpdate.bots; _i < _a.length; _i++) {
                            var toUpdate = _a[_i];
                            if (toUpdate.identifier == _this.activeBots[i].identifier) {
                                _this.activeBots[i] = toUpdate;
                                break;
                            }
                        }
                    }
                    break;
                default:
                    console.log("Unexpected action type: " + botUpdate.action);
            }
        });
    }
    AvailableBotsService.prototype.inviteBotToMatch = function (matchID, botID, seat) {
        this.osasgService.sendMessage("api-invite-player", {
            matchID: matchID,
            playerID: botID,
            seat: seat
        });
    };
    return AvailableBotsService;
}());
AvailableBotsService = __decorate([
    core_1.Injectable()
], AvailableBotsService);
exports.AvailableBotsService = AvailableBotsService;
