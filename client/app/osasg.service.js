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
var config = require("../../config.json");
var osasgUrlBase = config.serverURL + ":" + config.port + "/";
var httpOptions = { withCredentials: true };
var requestEmailEndpoint = "send_login_email";
var fetchUsersEndpoint = "api/users";
var fetchBotsEndpoint = "api/bots";
var createBotEndpoint = "api/bots/create_bot";
var changeBotUsernameEndpoint = "api/bots/:botID/change_username";
var changeBotPasswordEndpoint = "api/bots/:botID/change_password";
var changeUsernameEndpoint = "api/settings/change_username";
var createMatchEndpoint = "api/create_match";
var logoutEndpoint = "logout";
var OSASGService = (function () {
    function OSASGService(http) {
        var _this = this;
        this.http = http;
        this.socket = null;
        this.userInfo = null;
        this.errors = [];
        this.isSubscribedToMatches = false;
        this.isSubscribedToBots = false;
        this.createNewSocket();
        this.matchUpdateSubject = new Rx_1.Subject();
        this.matchUpdateObservable = Rx_1.Observable.create(function (observer) {
            if (_this.userInfo) {
                _this.sendMessage("api-active-matches", {});
            }
            _this.isSubscribedToMatches = true;
            _this.matchUpdateSubject.subscribe(observer);
        });
        this.botUpdateSubject = new Rx_1.Subject();
        this.botUpdateObservable = Rx_1.Observable.create(function (observer) {
            if (_this.userInfo) {
                _this.sendMessage("api-active-bots", {});
            }
            _this.isSubscribedToBots = true;
            _this.botUpdateSubject.subscribe(observer);
        });
        this.matchSubjects = new Map();
    }
    OSASGService.prototype.createNewSocket = function () {
        var _this = this;
        var self = this;
        self.get("ping").subscribe(function (response) {
            self.socket = new WebSocket("ws://" + osasgUrlBase);
            self.socket.onopen = function (event) {
                console.log("Socket connection succesfully established.");
            };
            self.socket.onmessage = function (event) {
                var json = JSON.parse(event.data);
                self.handleMessage(json.type, json);
            };
            self.socket.onclose = function (event) {
                console.log("Socket closed. Creating new socket.");
                self.createNewSocket();
            };
        }, function (error) {
            setTimeout(function () { return _this.createNewSocket(); }, 5000);
        });
    };
    OSASGService.prototype.handleMessage = function (type, data) {
        var _this = this;
        console.log("Received: " + type);
        // console.log(data);
        switch (type) {
            case "user-info":
                this.userInfo = data;
                // It's possible we tried subscribing to active matches before the server fully processed
                // the socket connection. Try again when the server sends the user info.
                if (this.isSubscribedToMatches) {
                    this.sendMessage("api-active-matches", {});
                }
                if (this.isSubscribedToBots) {
                    this.sendMessage("api-active-bots", {});
                }
                this.matchSubjects.forEach(function (value, key) {
                    _this.sendMessage("api-join-match", {
                        matchID: key,
                        seat: 3
                    });
                });
                break;
            case "api-active-matches":
                this.matchUpdateSubject.next(data);
                break;
            case "api-active-bots":
                this.botUpdateSubject.next(data);
                break;
            case "play":
            case "update":
                var subject = this.matchSubjects.get(data.matchID);
                if (subject) {
                    subject.next(data);
                }
                break;
            case "error-message":
                console.log(data.error);
                break;
            default:
                console.log("Unknown type");
                break;
        }
    };
    OSASGService.prototype.sendMessage = function (type, data) {
        if (this.socket.readyState == this.socket.OPEN) {
            data.type = type;
            this.socket.send(JSON.stringify(data));
            console.log("Sent: " + type);
        }
        else {
            console.log("Could not send '" + type + "'message because the socket is not open.");
            console.log("Current socket status: " + this.socket.readyState);
        }
    };
    OSASGService.prototype.getMatchUpdates = function () {
        return this.matchUpdateObservable;
    };
    OSASGService.prototype.getBotUpdates = function () {
        return this.botUpdateObservable;
    };
    OSASGService.prototype.getUpdatesForMatch = function (matchID) {
        var _this = this;
        return Rx_1.Observable.create(function (observer) {
            if (_this.userInfo) {
                _this.sit(matchID, 3);
            }
            var subject = _this.matchSubjects.get(matchID);
            if (!subject) {
                subject = new Rx_1.Subject();
                _this.matchSubjects.set(matchID, subject);
            }
            subject.subscribe(observer);
        });
    };
    OSASGService.prototype.sit = function (matchID, seat) {
        this.sendMessage("api-join-match", {
            matchID: matchID,
            seat: seat
        });
    };
    OSASGService.prototype.play = function (matchID, move) {
        this.sendMessage("play", {
            matchID: matchID,
            move: move
        });
    };
    OSASGService.prototype.getUserInfo = function (userID) {
        return this.get(fetchUsersEndpoint + "/" + userID)
            .map(function (response) { return response.json(); });
    };
    OSASGService.prototype.getBotInfo = function (botID) {
        return this.get(fetchBotsEndpoint + "/" + botID)
            .map(function (response) { return response.json(); });
    };
    OSASGService.prototype.getCurrentUserInfo = function () {
        if (this.userInfo) {
            return this.userInfo;
        }
        return null;
    };
    OSASGService.prototype.getUsername = function () {
        if (this.userInfo) {
            return this.userInfo.username;
        }
        return null;
    };
    // Emits the new username on success, throws an error otherwise.
    OSASGService.prototype.updateUsername = function (newUsername) {
        var _this = this;
        return this.post(changeUsernameEndpoint, { desiredUsername: newUsername })
            .map(function (response) { return response.text(); })
            .do(function (username) { return _this.userInfo.username = username; });
    };
    // Emits the new username on success, throws an error otherwise.
    OSASGService.prototype.updateBotUsername = function (botID, newUsername) {
        var endpoint = changeBotUsernameEndpoint.replace(":botID", botID);
        return this.post(endpoint, { desiredUsername: newUsername })
            .map(function (response) { return response.text(); });
    };
    // Emits the new password on success, throws an error otherwise.
    OSASGService.prototype.changeBotPassword = function (botID) {
        var endpoint = changeBotPasswordEndpoint.replace(":botID", botID);
        return this.post(endpoint, {})
            .map(function (response) { return response.text(); });
    };
    OSASGService.prototype.isGuest = function () {
        return !this.userInfo || !this.userInfo._id;
    };
    OSASGService.prototype.requestEmail = function (address) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.post(requestEmailEndpoint, { user: address })
                .map(function (response) { return response.json(); })
                .subscribe(function (response) {
                resolve(response.message);
            }, function (error) {
                reject(_this.handleError(error));
            });
        });
    };
    // Emits the match id if the match has succesfully been created.
    OSASGService.prototype.createMatch = function (gameName, options) {
        var body = {
            gameName: gameName,
            gameSettings: options
        };
        return this.post(createMatchEndpoint, body)
            .map(function (response) { return response.text(); });
    };
    // Emits the new bot's id if the bot has succesfully been created.
    OSASGService.prototype.createBot = function () {
        return this.post(createBotEndpoint, {})
            .map(function (response) { return response.text(); });
    };
    OSASGService.prototype.logout = function () {
        var _this = this;
        return new Promise(function (resolve, reject) {
            _this.get(logoutEndpoint)
                .subscribe(function (response) {
                _this.socket.close();
                resolve(true);
            }, function (error) {
                reject(_this.handleError(error));
            });
        });
    };
    OSASGService.prototype.get = function (endpoint) {
        return this.http.get("http://" + osasgUrlBase + endpoint, httpOptions);
    };
    OSASGService.prototype.post = function (endpoint, body) {
        return this.http.post("http://" + osasgUrlBase + endpoint, body, httpOptions);
    };
    OSASGService.prototype.handleError = function (response) {
        var errorMessage = "Request failed: ";
        if (response instanceof http_1.Response) {
            var body = response.json() || {};
            errorMessage += response.status + " - " + JSON.stringify(body);
        }
        else {
            errorMessage += response.message ? response.message : response.toString();
        }
        var error = new Error(errorMessage);
        this.errors.push(error);
        console.log(error);
        return error;
    };
    return OSASGService;
}());
OSASGService = __decorate([
    core_1.Injectable()
], OSASGService);
exports.OSASGService = OSASGService;
