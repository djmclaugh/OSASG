import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs } from "@angular/http";
import { Observable, Observer, Subject } from "rxjs/Rx";
import { Update } from "ts-turnbased";

import { PlayerInfo } from "../../shared/player_info";
import { MatchInfo, MatchSettings, MatchStatus, MatchSummary } from "../../shared/match_info";
import {
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  JOIN_MATCH_TYPE,
  PLAY_TYPE,
  SPECTATE_MATCH_TYPE,
  SUBSCRIPTION_TYPE,
  Channel,
  JoinMatchMessage,
  MatchUpdateMessage,
  PlayMessage,
  PlayerInfoMessage,
  SpectateMatchMessage,
  SubscriptionMessage,
  SubscriptionUpdateMessage,
  isMatchUpdateMessage,
  isPlayerInfoMessage,
  isMatchSummarySubscriptionUpdateMessage,
  SocketMessage,
} from "../../shared/socket_protocol";

const config = require("../../config.json");

const osasgUrlBase: string = config.serverURL + ":" + config.port + "/";
const httpOptions: RequestOptionsArgs = {withCredentials: true};
const requestEmailEndpoint: string = "send_login_email";
const fetchUsersEndpoint: string = "api/users";
const fetchBotsEndpoint: string = "api/bots";
const createBotEndpoint: string = "api/bots/create_bot";
const changeBotUsernameEndpoint: string = "api/bots/:botID/change_username";
const changeBotPasswordEndpoint: string = "api/bots/:botID/change_password";
const changeUsernameEndpoint: string = "api/settings/change_username";
const createMatchEndpoint: string = "api/create_match";
const logoutEndpoint: string = "logout";

export interface UserInfo {
  username: string,
  _id: string,
  email: string
}

export interface PlayerInfo {
  username: string,
  identifier: string
}

export interface BotInfo {
  username: string,
  _id: string,
  description: string,
  password: string,
  owner: string|UserInfo
}

export interface ActiveBotInfo {
  gameList: Array<string>,
  username: string,
  identifier: string
}

export interface UserPageInfo {
  user: UserInfo,
  bots: Array<BotInfo>
}

export type ListUpdatAction = "set"|"add"|"remove"|"update";

export interface BotUpdate {
  action: ListUpdatAction,
  bots: Array<ActiveBotInfo>
}

@Injectable()
export class OSASGService {

  private socket:WebSocket = null;
  private userInfo: PlayerInfo = null;
  private errors: Array<Error> = [];

  private matchUpdateObservable: Observable<SubscriptionUpdateMessage<MatchSummary>>;
  private matchUpdateSubject: Subject<SubscriptionUpdateMessage<MatchSummary>>;
  private botUpdateObservable: Observable<BotUpdate>;
  private botUpdateSubject: Subject<BotUpdate>;
  private matchSubjects: Map<string, Subject<MatchUpdateMessage>>;
  private isSubscribedToMatches: boolean = false;
  private isSubscribedToBots: boolean = false;

  constructor (private http: Http) {
    this.createNewSocket();
    this.matchUpdateSubject = new Subject<SubscriptionUpdateMessage<MatchSummary>>();
    this.matchUpdateObservable = Observable.create((observer: Observer<SubscriptionUpdateMessage<MatchSummary>>) => {
      if (this.userInfo) {
        let subscirptionMessage: SubscriptionMessage = {
          type: SUBSCRIPTION_TYPE,
          channel: Channel.ACTIVE_MATCHES,
          subscribe: true
        }
        this.sendMessage(subscirptionMessage);
      }
      this.isSubscribedToMatches = true;
      this.matchUpdateSubject.subscribe(observer);
    });
    this.matchSubjects = new Map();
  }

  private createNewSocket(): void {
    var self: OSASGService = this;
    self.get("ping").subscribe(
      response => {
        self.socket = new WebSocket("ws://" + osasgUrlBase, COOKIE_AUTHENTICATION_SUBPROTOCOL);
        self.socket.onopen = function(event) {
          console.log("Socket connection succesfully established.");
        }
        self.socket.onmessage = (event) => {
          let message: SocketMessage = JSON.parse(event.data);
          console.log("RECEIVED: " + message.type);
          if (isPlayerInfoMessage(message)) {
            this.userInfo = message.playerInfo;
            // It's possible we tried subscribing to active matches before the server fully processed
            // the socket connection. Try again when the server sends the user info.
            if (this.isSubscribedToMatches) {
              let subscriptionMessage: SubscriptionMessage = {
                type: SUBSCRIPTION_TYPE,
                subscribe: true,
                channel: Channel.ACTIVE_MATCHES
              }
              this.sendMessage(subscriptionMessage);
            }
            this.matchSubjects.forEach((value: any, key: string) => {
              let spectateMessage: SpectateMatchMessage = {
                type: SPECTATE_MATCH_TYPE,
                matchID: key,
                spectate: true
              }
              this.sendMessage(spectateMessage);
            });
          } else if (isMatchSummarySubscriptionUpdateMessage(message)) {
            this.matchUpdateSubject.next(message);
          } else if (isMatchUpdateMessage(message)) {
            let subject: Subject<MatchUpdateMessage> = this.matchSubjects.get(message.matchID);
            if (subject) {
              subject.next(message);
            }
          } else {
            console.log("Unknown message of type: " + message.type);
            console.log(message);
          }
        }
        self.socket.onclose = function(event) {
          console.log("Socket closed: " + event.reason);
          setTimeout(() => {self.createNewSocket()}, 5000);
        }
      },
      error => {
        setTimeout(() => this.createNewSocket(), 5000);
      }
    );
  }

  sendMessage(message: SocketMessage): void {
    if (this.socket.readyState == this.socket.OPEN) {
      this.socket.send(JSON.stringify(message));
      console.log("Sent: " + message.type);
    } else {
      console.log("Could not send '" + message.type + "'message because the socket is not open.");
      console.log("Current socket status: " + this.socket.readyState);
    }
  }

  getMatchUpdates(): Observable<SubscriptionUpdateMessage<MatchSummary>> {
    return this.matchUpdateObservable;
  }

  getBotUpdates(): Observable<BotUpdate> {
    return this.botUpdateObservable;
  }

  getUpdatesForMatch(matchID: string): Observable<MatchUpdateMessage> {
    return Observable.create((observer: Observer<MatchUpdateMessage>) => {
      if (this.userInfo) {
        let spectateMessage: SpectateMatchMessage = {
          type: SPECTATE_MATCH_TYPE,
          matchID: matchID,
          spectate: true
        }
        this.sendMessage(spectateMessage);
      }
      let subject: Subject<MatchUpdateMessage> = this.matchSubjects.get(matchID);
      if (!subject) {
        subject = new Subject<MatchUpdateMessage>();
        this.matchSubjects.set(matchID, subject);
      }
      subject.subscribe(observer);
    });
  }

  sit(matchID: string, seat: number): void {
    let joinMessage: JoinMatchMessage = {
      type: JOIN_MATCH_TYPE,
      matchID: matchID,
      seat: seat
    }
    this.sendMessage(joinMessage);
  }

  play(matchID: string, player: number, move: any, turnNumber: number) :void {
    let playMessage: PlayMessage = {
      type: PLAY_TYPE,
      matchID: matchID,
      playerNumber: player,
      move: move,
      turnNumber: turnNumber
    }
    this.sendMessage(playMessage);
  }

  getUserInfo(userID): Observable<UserPageInfo> {
    return this.get(fetchUsersEndpoint + "/" + userID)
        .map(response => response.json());
  }

  getBotInfo(botID): Observable<BotInfo> {
    return this.get(fetchBotsEndpoint + "/" + botID)
        .map(response => response.json());
  }

  getCurrentUserInfo(): PlayerInfo {
    if (this.userInfo) {
      return this.userInfo;
    }
    return null;
  }

  getUsername(): string {
    if (this.userInfo) {
      return this.userInfo.username;
    }
    return null;
  }

  // Emits the new username on success, throws an error otherwise.
  updateUsername(newUsername: string): Observable<string> {
    return this.post(changeUsernameEndpoint, {desiredUsername: newUsername})
        .map((response: Response) => response.text())
        .do((username: string) => this.userInfo.username = username);
  }

  // Emits the new username on success, throws an error otherwise.
  updateBotUsername(botID: string, newUsername: string): Observable<string> {
    let endpoint: string = changeBotUsernameEndpoint.replace(":botID", botID);
    return this.post(endpoint, {desiredUsername: newUsername})
        .map((response: Response) => response.text());
  }

  // Emits the new password on success, throws an error otherwise.
  changeBotPassword(botID: string): Observable<string> {
    let endpoint: string = changeBotPasswordEndpoint.replace(":botID", botID);
    return this.post(endpoint, {})
        .map((response: Response) => response.text());
  }

  isGuest(): boolean {
    return !this.userInfo || this.userInfo.identifier.indexOf("guest-") == 0;
  }

  requestEmail(address: string): Promise<string> {
    return new Promise((resolve, reject) => {
      this.post(requestEmailEndpoint, {user: address})
          .map(response => response.json())
          .subscribe(
              response => {
                resolve(response.message);
              },
              error => {
                reject(this.handleError(error));
              });
    });
  }

  // Emits the match id if the match has succesfully been created.
  createMatch(gameName: string, options: any): Observable<string> {
    let body: MatchSettings = {
      gameName: gameName,
      gameOptions: options
    }
    return this.post(createMatchEndpoint, body)
        .map((response: Response) => response.text());
  }

  // Emits the new bot's id if the bot has succesfully been created.
  createBot(): Observable<string> {
    return this.post(createBotEndpoint, {})
        .map((response: Response) => response.text());
  }

  logout(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      this.get(logoutEndpoint)
          .subscribe(
              response => {
                this.socket.close();
                resolve(true);
              },
              error => {
                reject(this.handleError(error));
              });
    });
  }

  private get(endpoint: string): Observable<Response> {
    return this.http.get("http://" + osasgUrlBase + endpoint, httpOptions);
  }

  private post(endpoint: string, body: any): Observable<Response> {
    return this.http.post("http://" + osasgUrlBase + endpoint, body, httpOptions);
  }

  private handleError(response: Response | any): Error {
    let errorMessage: string = "Request failed: ";
    if (response instanceof Response) {
      const body = response.json() || {};
      errorMessage += `${response.status} - ${JSON.stringify(body)}`;
    } else {
      errorMessage += response.message ? response.message : response.toString();
    }
    let error = new Error(errorMessage);
    this.errors.push(error);
    console.log(error);
    return error;
  }
}
