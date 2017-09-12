"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
var core_1 = require("@angular/core");
var CreateMatchFormComponent = (function () {
    function CreateMatchFormComponent(osasgService) {
        this.osasgService = osasgService;
        this.selectedGame = "Connect6";
        this.possibleGames = [
            "Connect",
            "Connect6",
            "Tictactoe"
        ];
        this.submitted = false;
        // Connect6 options
        this.connect6Width = 19;
        this.connect6Height = 19;
        // Connect options
        this.connectWidth = 19;
        this.connectHeight = 19;
        this.connectK = 6;
        this.connectP = 2;
        this.connectQ = 1;
    }
    CreateMatchFormComponent.prototype.onSubmit = function () {
        console.log(this.selectedGame);
        this.osasgService
            .createMatch(this.selectedGame, this.getOptions())
            .subscribe(function (response) {
            console.log("Successfully created match " + response);
        }, function (error) {
            console.log("Error: " + error);
        });
    };
    CreateMatchFormComponent.prototype.getOptions = function () {
        switch (this.selectedGame) {
            case "Tictactoe":
                return {};
            case "Connect6":
                return this.getConnect6Options();
            case "Connect":
                return this.getConnectOptions();
        }
        throw new Error("Unknown game type: " + this.selectedGame);
    };
    CreateMatchFormComponent.prototype.getConnect6Options = function () {
        return {
            boardWidth: this.connect6Width,
            boardHeight: this.connect6Height
        };
    };
    CreateMatchFormComponent.prototype.getConnectOptions = function () {
        return {
            boardWidth: this.connectWidth,
            boardHeight: this.connectHeight,
            k: this.connectK,
            p: this.connectP,
            q: this.connectQ
        };
    };
    return CreateMatchFormComponent;
}());
CreateMatchFormComponent = __decorate([
    core_1.Component({
        selector: "create-match-form",
        templateUrl: "/templates/create_match_form.html"
    })
], CreateMatchFormComponent);
exports.CreateMatchFormComponent = CreateMatchFormComponent;
