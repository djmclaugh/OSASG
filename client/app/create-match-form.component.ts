import { Component } from '@angular/core';

import { OSASGService } from "./osasg.service";

import { ConnectOptions } from "ts-turnbased-connect";
import { NormalFormOptions } from "ts-turnbased-normalform";
import { OhHellOptions, ScoringVariant } from "ts-turnbased-ohhell";

@Component({
  selector: "create-match-form",
  templateUrl: "/templates/create_match_form.html"
})

export class CreateMatchFormComponent {

  selectedGame: string = "Connect6";
  possibleGames: Array<string> = [
    "Connect",
    "Connect6",
    "Tictactoe",
    "Roshambo",
    "OhHell"
  ];
  submitted = false;

  // Connect6 options
  connect6Width: number = 19;
  connect6Height: number = 19;

  // Connect options
  connectWidth: number = 19;
  connectHeight: number = 19;
  connectK: number = 6;
  connectP: number = 2;
  connectQ: number = 1;

  // Roshambo options
  roshamboNumberOfRounds: number = 10;

  // Oh Hell options
  ohHellNumberOfPlayers: number = 4;
  ohHellPossibleScoringVariants: Array<ScoringVariant> = [ "BASIC", "EXACT" ];
  ohHellScoringVariant: ScoringVariant = this.ohHellPossibleScoringVariants[0];

  constructor (private osasgService: OSASGService) {}

  onSubmit() {
    console.log(this.selectedGame);
    this.osasgService
        .createMatch(this.selectedGame, this.getOptions())
        .subscribe(
          (response: string) => {
            console.log("Successfully created match " + response);
          },
          (error: any) => {
            console.log("Error: " + error);
          });
  }

  getOptions(): any {
    switch (this.selectedGame) {
      case "Tictactoe":
        return {};
      case "Connect6":
        return this.getConnect6Options();
      case "Connect":
        return this.getConnectOptions();
      case "Roshambo":
        return this.getRoshamboOptions();
      case "OhHell":
        return this.getOhHellOptions();
    }
    throw new Error("Unknown game type: " + this.selectedGame);
  }

  getConnect6Options(): any {
    return {
      boardWidth: this.connect6Width,
      boardHeight: this.connect6Height
    };
  }

  getConnectOptions(): ConnectOptions {
    return {
      boardWidth: this.connectWidth,
      boardHeight: this.connectHeight,
      k: this.connectK,
      p: this.connectP,
      q: this.connectQ
    };
  }

  getRoshamboOptions(): any {
    return {
      numRounds: this.roshamboNumberOfRounds
    };
  }

  getOhHellOptions(): OhHellOptions {
    return {
      numberOfPlayers: this.ohHellNumberOfPlayers,
      scoringVariant: this.ohHellScoringVariant
    };
  }
}
