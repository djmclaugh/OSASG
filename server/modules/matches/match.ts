import { Game, Update } from "ts-turnbased";
import { MatchInfo, MatchSettings, MatchSummary } from "../../../shared/match_info";
import { PlayerInfo } from "../../../shared/player_info";
import { areEqual } from "../../../shared/identifiable";
import { newGame } from "./games";
import { ProcessedUpdate } from "./processed_update";

function newRandomSeed(): string {
  return Math.random().toString(36).slice(2);
}

export class Match {
  private seed: string;
  private game: Game<any, any, any, any>;
  private players: Array<PlayerInfo>;
  public onPlayersUpdate: (update: Array<PlayerInfo>) => void;
  public onGameUpdate: (update: ProcessedUpdate) => void;
  public onMatchEnd: (winners: Array<number>) => void;

  constructor(readonly identifier: string, readonly matchSettings: MatchSettings) {
    this.game = newGame(matchSettings.gameName, matchSettings.gameOptions);
    this.players = [];
    for (let i = 0; i < this.game.numberOfPlayers; ++i) {
      this.players.push(null);
    }
  }

  public isCurrentlyPlaying(player: PlayerInfo): boolean {
    for (let playerInfo of this.players) {
      if (playerInfo && areEqual(playerInfo, player)) {
        return true;
      }
    }
    return false;
  }

  public addPlayer(player: PlayerInfo, seat: number = -1) {
    if (this.players[seat]) {
      throw new Error("Seat " + seat + " already taken");
    }
    this.players[seat] = player;
    this.onPlayersUpdate(this.players);
    this.startIfFull();
  }

  public play(player: PlayerInfo, move: any, playerNumber: number = -1, turnNumber?: number): void {
    let currentTurn: number = this.game.getAllUpdates().length
    if (turnNumber && currentTurn != turnNumber) {
      throw new Error("Received move for turn " + turnNumber + " but game is waiting for turn " + currentTurn);
    }
    if (playerNumber == -1) {
      for (let i = 0; i < this.players.length; ++i) {
        if (player.identifier == this.players[i].identifier) {
          playerNumber = i;
          break;
        }
      }
      if (playerNumber == -1) {
        throw new Error("You are not a player in match " + this.identifier);
      }
    } else if (this.players[playerNumber].identifier != player.identifier) {
      throw new Error("You are not player " + playerNumber);
    }
    let didTurnAdvance: boolean = false;
    didTurnAdvance = this.game.playMove(move, playerNumber);
    if (didTurnAdvance) {
      this.onGameUpdate(new ProcessedUpdate(this.game.getLatestUpdate(), this.players));
      this.endIfOver();
    }
  }

  private startIfFull(): void {
    for (let player of this.players) {
      if (!player) {
        return;
      }
    }
    this.seed = newRandomSeed();
    this.game.start(this.seed);
    this.onGameUpdate(new ProcessedUpdate(this.game.getLatestUpdate(), this.players));
    // It is technically possible for the game to be over immediatly...
    this.endIfOver();
  }

  private endIfOver(): void {
    if (this.game.getPlayersToPlay().size == 0) {
      this.onMatchEnd(this.game.getLatestUpdate().winners);
    }
  }

  public matchSummary(): MatchSummary {
    return {
      identifier: this.identifier,
      settings: this.matchSettings,
      players: this.players,
    }
  }

  private getAllUpdates(playerIdentifier: string): Array<Update<any, any>> {
    return this.game.getAllUpdates().map((value: Update<any, any>) => {
      return (new ProcessedUpdate(value, this.players)).updateForPlayer(playerIdentifier);
    });
  }

  public matchInfoForPlayer(playerIdentifier: string): MatchInfo {
    return {
      identifier: this.identifier,
      players: this.players,
      settings: this.matchSettings,
      updates: this.getAllUpdates(playerIdentifier),
    }
  }
}
