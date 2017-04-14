let carrier: any = require("carrier");
let net: any = require("net");
let config: any = require("../config.json");

// Possible message types.
const AUTHORIZATION: string = "authorization";
const JOIN_MATCH: string = "api-join-match";
const INVITE_PLAYER: string = "api-invite-player";
const UPDATE: string = "update";
const PLAY: string = "play";
const ERROR: string = "error-message";

export interface PlayerInfo {
  username: string,
  identifier: string
}

export interface MatchSettings {
  gameName: string,
  gameSettings: any
}

export interface MatchInfo {
  matchID: string,
  gameName: string,
  settings: MatchSettings,
  events: Array<any>,
  status: "NOT_STARTED"|"ONGOING"|"COMPLETED",
  players: Array<PlayerInfo>,
  toPlay: Array<number>,
  winners: Array<number>
}

export abstract class Bot {
  private socket;
  private identifier: string;
  private password: string;
  private matches: Map<string, MatchInfo>;

  constructor(identifier: string, password: string) {
    this.identifier = identifier;
    this.password = password;
    this.socket = new net.Socket();
    carrier.carry(this.socket, (line: string) => this.onMessage(JSON.parse(line)));
    this.matches = new Map<string, MatchInfo>();
  }

  start() {
    this.socket.connect(config.port, config.url, () => {
      this.sendMessage({
        type: AUTHORIZATION,
        identifier: this.identifier,
        password: this.password
      });
    });
  }

  private onMessage(message: any): void {
    switch(message.type) {
      case AUTHORIZATION:
        // NO-OP, but shouldn't actually happen.
        break;
      case JOIN_MATCH:
        // NO-OP, but shouldn't actually happen.
        break;
      case INVITE_PLAYER:
        this.onInvite(message);
        break;
      case UPDATE:
        this.onUpdate(message);
        break;
      case PLAY:
        this.onPlay(message);
        break;
      case ERROR:
        console.log("Error: " + message.error);
        this.socket.destroy();
        break;
      default:
        console.log("Ignoring message of unknown type: " + message.type);
        console.log(JSON.stringify(message));
        break;
    }
  }

  private sendMessage(message: any): void {
    this.socket.write(JSON.stringify(message) + "\n");
  }

  protected abstract wantToJoin(matchSettings: MatchInfo): boolean;

  private onInvite(message: MatchInfo) {
    if (this.wantToJoin(message)) {
      // IMPORTANT: Sending this message doesn't guaranty that I will join the match.
      // If someone else joined before the server received this, the server will ignore this message.
      // You can only know if you successfully joined a match via the "update" messages.
      this.sendMessage({type:JOIN_MATCH, matchID: message.matchID});
    }
  }

  private onUpdate(message: MatchInfo) {
    this.matches[message.matchID] = message;
    this.processMatch(message);
  }

  private onPlay(message: any) {
    let match: MatchInfo = this.matches[message.matchID];
    match.events.push(message.events);
    match.toPlay = message.toPlay;
    match.winners = message.winners;
    this.processMatch(match);
  }

  private processMatch(match: MatchInfo): void {
    if (match.status != "ONGOING") {
      delete this.matches[match.matchID];
      return;
    }
    let playingAs: Array<number> = [];
    for (let i: number = 0; i < match.players.length; ++i) {
      let player: PlayerInfo = match.players[i];
      if (player.identifier == this.identifier) {
        playingAs.push(i);
      }
    }
    if (playingAs.length == 0) {
      delete this.matches[match.matchID];
      return;
    }
    for (let p of match.toPlay) {
      if (playingAs.indexOf(p) != -1) {
        this.sendMessage({
          type: PLAY,
          matchID: match.matchID,
          move: this.getMove(match),
        });
        return;
      }
    }
  }

  protected abstract getMove(match: MatchInfo): any;
}
