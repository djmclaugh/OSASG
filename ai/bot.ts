import * as WebSocket from "ws";

import { PlayerInfo } from "../shared/player_info";
import { MatchInfo, MatchSummary } from "../shared/match_info";
import {
  AUTHENTICATION_TYPE,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  JOIN_MATCH_TYPE,
  PLAY_TYPE,
  PREFERENCES_TYPE,
  SPECTATE_MATCH_TYPE,
  AuthenticationMessage,
  Channel,
  InviteMessage,
  JoinMatchMessage,
  MatchUpdateMessage,
  PlayMessage,
  PreferencesMessage,
  SpectateMatchMessage,
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
    if (message.matchInfo) {
      this.matches.set(message.matchID, message.matchInfo);
    } else if (message.players) {
      this.matches.get(message.matchID).players = message.players;
    } else if (message.gameUpdate) {
      this.matches.get(message.matchID).updates.push(message.gameUpdate);
    }
    this.processMatch(message.matchID);
  }

  private onPlay(message: any) {
    let match: MatchInfo = this.matches[message.matchID];
    match.updates.push(message.update);
    //match.toPlay = message.toPlay;
    //match.winners = message.winners;
    //this.processMatch(match);
  }

  private processMatch(matchID: string): void {
    let currentInfo: MatchInfo = this.matches.get(matchID);
    if (currentInfo.updates.length == 0) {
      return;
    } else if (currentInfo.updates[currentInfo.updates.length - 1].winners != null) {
      this.matches.delete(matchID);
      return;
    }
    let playingAs: Set<number> = new Set();
    for (let i: number = 0; i < currentInfo.players.length; ++i) {
      let player: PlayerInfo = currentInfo.players[i];
      if (player.identifier == this.identifier) {
        playingAs.add(i);
      }
    }
    if (playingAs.size == 0) {
      this.matches.delete(matchID);
      return;
    }
    for (let p of currentInfo.updates[currentInfo.updates.length - 1].toPlay) {
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

  protected abstract getMove(match: MatchInfo, asPlayer: number): any;
}
