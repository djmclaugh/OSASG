import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs } from "@angular/http";
import { Observable, Observer, Subject } from "rxjs/Rx";

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

export interface MatchInfo {
  matchID: string,
  p1: PlayerInfo,
  p2: PlayerInfo,
  status: string
}

export interface MatchUpdate {
  action: ListUpdatAction,
  matches: Array<MatchInfo>
}

export interface BotUpdate {
  action: ListUpdatAction,
  bots: Array<ActiveBotInfo>
}

export type MatchStatus =
    "NOT_STARTED"
    |"ONGOING"
    |"COMPLETED";

export interface PlayMessage {
  matchID: string,
  events: any,
  timestamp: number,
  status: MatchStatus,
  toPlay: Array<number>
}

export interface UpdateMessage {
  matchID: string,
  players: Array<PlayerInfo>,
  events: Array<any>,
  settings: any,
  timers: any,
  status: MatchStatus,
  toPlay: Array<number>
}

export interface ErrorMessage {
  error: string;
}

export type MatchMessage = PlayMessage|UpdateMessage;

@Injectable()
export class OSASGService {
  
  private socket:WebSocket = null;
  private userInfo: UserInfo = null;
  private errors: Array<Error> = [];

  private matchUpdateObservable: Observable<MatchUpdate>;
  private matchUpdateSubject: Subject<MatchUpdate>;
  private botUpdateObservable: Observable<BotUpdate>;
  private botUpdateSubject: Subject<BotUpdate>;
  private matchSubjects: Map<String, Subject<MatchMessage>>;
  private isSubscribedToMatches: boolean = false;
  private isSubscribedToBots: boolean = false;

  constructor (private http: Http) {
    this.createNewSocket(); 
    this.matchUpdateSubject = new Subject<MatchUpdate>();
    this.matchUpdateObservable = Observable.create((observer: Observer<MatchUpdate>) => {
      if (this.userInfo) {
        this.sendMessage("api-active-matches", {});
      }
      this.isSubscribedToMatches = true;
      this.matchUpdateSubject.subscribe(observer);
    });
    this.botUpdateSubject = new Subject<BotUpdate>();
    this.botUpdateObservable = Observable.create((observer: Observer<BotUpdate>) => {
      if (this.userInfo) {
        this.sendMessage("api-active-bots", {});
      }
      this.isSubscribedToBots = true;
      this.botUpdateSubject.subscribe(observer);
    });
    this.matchSubjects = new Map<String, Subject<MatchMessage>>();
  }

  private createNewSocket(): void {
    var self: OSASGService = this;
    self.get("ping").subscribe(
      response => {
        self.socket = new WebSocket("ws://" + osasgUrlBase);
        self.socket.onopen = function(event) {
          console.log("Socket connection succesfully established.");
        }
        self.socket.onmessage = function(event) {
          var json = JSON.parse(event.data);
          self.handleMessage(json.type, json);
        }
        self.socket.onclose = function(event) {
          console.log("Socket closed. Creating new socket.");
          self.createNewSocket();
        }
      },
      error => {
        setTimeout(() => this.createNewSocket(), 5000);
      }
    );
  }

  private handleMessage(type: string, data: any): void {
    console.log("Received: " + type);
    // console.log(data);
    switch(type) {
      case "user-info":
        this.userInfo = data;
        // It's possible we tried subscribing to active matches before the server fully processed
        // the socket connection. Try again when the server sends the user info.
        if (this.isSubscribedToMatches) {
          this.sendMessage("api-active-matches", {});
        }
        if (this.isSubscribedToBots) {
          this.sendMessage("api-active-bots", {});
        }
        this.matchSubjects.forEach((value:any, key:String) => {
          this.sendMessage("api-join-match", {
              matchID: key,
              seat: 3
          });
        });
        break;
      case "api-active-matches":
        this.matchUpdateSubject.next(data);
        break;
      case "api-active-bots":
        this.botUpdateSubject.next(data);
        break;
      case "play":
      case "update":
        let subject: Subject<MatchMessage> = this.matchSubjects.get(data.matchID);
        if (subject) {
          subject.next(data);
        }
        break;
      case "error-message":
        console.log(data.error);
        break;
      default:
        console.log("Unknown type");
        break;
    }
  }

  sendMessage(type, data): void {
    if (this.socket.readyState == this.socket.OPEN) {
      data.type = type;
      this.socket.send(JSON.stringify(data));
      console.log("Sent: " + type);
    } else {
      console.log("Could not send '" + type + "'message because the socket is not open.");
      console.log("Current socket status: " + this.socket.readyState);
    }
  }

  getMatchUpdates(): Observable<MatchUpdate> {
    return this.matchUpdateObservable;
  }

  getBotUpdates(): Observable<BotUpdate> {
    return this.botUpdateObservable;
  }

  getUpdatesForMatch(matchID: string): Observable<MatchMessage> {
    return Observable.create((observer: Observer<MatchMessage>) => {
      if (this.userInfo) {
        this.sit(matchID, 3);
      }
      let subject: Subject<MatchMessage> = this.matchSubjects.get(matchID);
      if (!subject) {
        subject = new Subject<MatchMessage>();
        this.matchSubjects.set(matchID, subject);
      }
      subject.subscribe(observer);
    });
  }

  sit(matchID: string, seat: number): void {
    this.sendMessage("api-join-match", {
      matchID: matchID,
      seat: seat
    });
  }

  play(matchID: string, move: any) :void {
    this.sendMessage("play", {
      matchID: matchID,
      move: move
    });
  }

  getUserInfo(userID): Observable<UserPageInfo> {
    return this.get(fetchUsersEndpoint + "/" + userID)
        .map(response => response.json());
  }

  getBotInfo(botID): Observable<BotInfo> {
    return this.get(fetchBotsEndpoint + "/" + botID)
        .map(response => response.json());
  }

  getCurrentUserInfo(): UserInfo {
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
    return !this.userInfo || !this.userInfo._id;
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
  createMatch(options: any): Observable<string> {
    return this.post(createMatchEndpoint, options)
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
