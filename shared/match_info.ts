import { Identifiable } from "./identifiable";
import { PlayerInfo } from "./player_info";
import { Update } from "./update";

export enum MatchStatus {
  NOT_STARTED = "NOT_STARTED",
  ONGOING = "ONGOING",
  COMPLETED = "COMPLETED",
}

export interface MatchSettings {
  gameName: string,
  seed?: string,  // Not set for in-progress games.
  gameOptions: any,
}

export interface MatchSummary extends Identifiable {
  settings: MatchSettings,
  players: Array<PlayerInfo>
}

export interface MatchInfo extends Identifiable {
  settings: MatchSettings,
  status: MatchStatus,
  toPlay: Array<number>,
  players: Array<PlayerInfo>,
  updates: Array<Update>
}
