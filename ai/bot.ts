import * as WebSocket from "ws";

import { PlayerInfo } from "../shared/player_info";
import { MatchInfo, MatchSummary } from "../shared/match_info";
import { Update } from "../shared/update";
import {
  AUTHENTICATION_TYPE,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  JOIN_MATCH_TYPE,
  PLAY_TYPE,
  PREFERENCES_TYPE,
  AuthenticationMessage,
  InviteMessage,
  JoinMatchMessage,
  MatchUpdateMessage,
  PlayMessage,
  PreferencesMessage,
  SocketMessage,
  isErrorMessage,
  isInviteMessage,
  isMatchUpdateMessage,
  isPlayerInfoMessage,
} from "../shared/socket_protocol";

let config: any = require("./config.json");

export abstract class Bot {
  private socket: WebSocket;
  private identifier: string;
  private password: string;
  private username: string;
  private matches: Map<string, MatchInfo>;

  constructor(identifier: string, password: string) {
    this.identifier = identifier;
    this.password = password;
    this.matches = new Map<string, MatchInfo>();
  }

  start() {
    this.socket = new WebSocket("ws://" + config.serverURL, CREDENTIALS_AUTHENTICATION_SUBPROTOCOL);
    this.socket.onopen = () => {
      console.log("Socket connected");
      let authMessage: AuthenticationMessage = {
        type: AUTHENTICATION_TYPE,
        identifier: this.identifier,
        password: this.password
      }
      this.send(authMessage);
    };
    this.socket.onclose = (event: any) => {
      console.log("Socket closed: " + event.reason);
    };
    this.socket.onerror = (err: Error) => {
      console.log("Error: " + err.message);
    };
    this.socket.onmessage = (event: any) => {
      let message: SocketMessage = JSON.parse(event.data);
      console.log("Received: " + message.type);
      this.onMessage(message);
    };
  }

  private send(message: SocketMessage): void {
    this.socket.send(JSON.stringify(message));
  }

  private onMessage(message: SocketMessage): void {
    if (isPlayerInfoMessage(message)) {
      this.username = message.playerInfo.username;
      // Successfully authenticated. Make yourself available for invites.
      let preferencesMessage: PreferencesMessage = {
        type: PREFERENCES_TYPE,
        profile: {
          identifier: this.identifier,
          username: this.username,
          canPlay: this.listOfGames()
        }
      };
      this.send(preferencesMessage);
    } else if (isInviteMessage(message)) {
      this.onInvite(message);
    } else if (isMatchUpdateMessage(message)) {
      this.onUpdate(message);
    } else if (isErrorMessage(message)) {
      console.log("Error: " + message.error);
    } else {
      console.log("Received message of unknown type:");
      console.log(message);
    }
  }

  protected abstract listOfGames(): Array<string>;
  protected abstract wantToJoin(matchSettings: MatchSummary): boolean;

  private onInvite(message: InviteMessage) {
    if (this.wantToJoin(message.matchSummary)) {
      let joinMessage: JoinMatchMessage = {
        type: JOIN_MATCH_TYPE,
        matchID: message.matchSummary.identifier,
        seat: message.seat
      }
      this.send(joinMessage);
    }
  }

  private onUpdate(message: MatchUpdateMessage) {
    // Each update is either a "full update", a change of players, or a sigle game event.
    if (message.matchInfo) {
      this.matches.set(message.matchID, message.matchInfo);
    } else if (message.players) {
      this.matches.get(message.matchID).players = message.players;
    } else if (message.gameUpdate) {
      this.matches.get(message.matchID).updates.push(message.gameUpdate);
    }
    this.processMatch(message.matchID);
  }

  private processMatch(matchID: string): void {
    let currentInfo: MatchInfo = this.matches.get(matchID);
    if (currentInfo.updates.length == 0) {
      // Match hasn't started yet, nothing to do.
      return;
    }
    let latestUpdate: Update = currentInfo.updates[currentInfo.updates.length - 1];
    if (latestUpdate.winners != null) {
      // Match is over, the bot can forget about it.
      this.matches.delete(matchID);
      return;
    }
    // Figure out which players we are in this match
    let playingAs: Set<number> = new Set();
    for (let i: number = 0; i < currentInfo.players.length; ++i) {
      let player: PlayerInfo = currentInfo.players[i];
      if (player.identifier == this.identifier) {
        playingAs.add(i);
      }
    }
    // For each player that needs to play this turn, submit a move.
    for (let p of latestUpdate.toPlay) {
      if (playingAs.has(p)) {
        let playMessage: PlayMessage = {
          type: PLAY_TYPE,
          matchID: matchID,
          move: this.getMove(currentInfo, p),
          turnNumber: currentInfo.updates.length,
          playerNumber: p
        };
        this.send(playMessage);
      }
    }
  }

  // Delegate finding moves to subclasses.
  protected abstract getMove(match: MatchInfo, asPlayer: number): any;
}
