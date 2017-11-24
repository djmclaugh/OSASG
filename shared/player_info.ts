export interface PlayerInfo {
  identifier: string,
  username: string,
}

export function isBot(info: PlayerInfo) {
  return info.username.indexOf("[bot]") != -1;
}
