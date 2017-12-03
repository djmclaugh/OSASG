import { Identifiable } from "./identifiable";

export interface PlayerInfo extends Identifiable {
  username: string,
}

export function isBot(info: PlayerInfo) {
  return info.username.indexOf("[bot]") != -1;
}

export function isGuest(info: PlayerInfo) {
  return info.username.indexOf("[guest]") != -1;
}
