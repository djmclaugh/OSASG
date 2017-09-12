"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var LobbyService = (function () {
    function LobbyService(osasgService) {
        var _this = this;
        this.osasgService = osasgService;
        this.activeMatches = [];
        // TODO(djmclaugh): optimize
        osasgService.getMatchUpdates().subscribe(function (matchUpdate) {
            switch (matchUpdate.action) {
                case "set":
                    _this.activeMatches = matchUpdate.matches;
                    break;
                case "add":
                    _this.activeMatches = _this.activeMatches.concat(matchUpdate.matches);
                    break;
                case "remove":
                    _this.activeMatches = _this.activeMatches.filter(function (matchInfo) {
                        for (var _i = 0, _a = matchUpdate.matches; _i < _a.length; _i++) {
                            var toRemove = _a[_i];
                            if (toRemove.matchID == matchInfo.matchID) {
                                return false;
                            }
                        }
                        return true;
                    });
                    break;
                case "update":
                    for (var i = 0; i < _this.activeMatches.length; ++i) {
                        for (var _i = 0, _a = matchUpdate.matches; _i < _a.length; _i++) {
                            var toUpdate = _a[_i];
                            if (toUpdate.matchID == _this.activeMatches[i].matchID) {
                                _this.activeMatches[i] = toUpdate;
                                break;
                            }
                        }
                    }
                    break;
                default:
                    console.log("Unexpected action type: " + matchUpdate.action);
            }
        });
    }
    return LobbyService;
}());
LobbyService = __decorate([
    core_1.Injectable()
], LobbyService);
exports.LobbyService = LobbyService;
