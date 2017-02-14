import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs } from "@angular/http";
import { Observable } from "rxjs/Rx";

const config = require("../../config.json");

const osasgUrlBase: string = config.serverURL + ":" + config.port + "/";
const httpOptions: RequestOptionsArgs = {withCredentials: true};
const userInfoEndpoint: string = "user_info";
const requestEmailEndpoint: string = "send_login_email";
const fetchUsersEndpoint: string = "api/users";
const fetchBotsEndpoint: string = "api/bots";
const changeBotUsernameEndpoint: string = "api/bots/:botID/change_username";
const changeBotPasswordEndpoint: string = "api/bots/:botID/change_password";
const changeUsernameEndpoint: string = "api/settings/change_username";
const logoutEndpoint: string = "logout";

export interface UserInfo {
  username: string,
  _id: string,
  email: string
}

export interface BotInfo {
  username: string,
  _id: string,
  description: string,
  password: string,
  owner: string|UserInfo
}

export interface UserPageInfo {
  user: UserInfo,
  bots: Array<BotInfo>
}

@Injectable()
export class OSASGService {
  
  private socket:WebSocket = null;
  private userInfo: UserInfo = null;
  private errors: Array<Error> = [];

  constructor (private http: Http) {
    this.createNewSocket();
  }

  private createNewSocket(): void {
    var self: OSASGService = this;
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
  }

  private handleMessage(type: string, data: any): void {
    console.log("Received: " + type);
    switch(type) {
      case "user-info":
        this.userInfo = data;
        break;
      default:
        console.log("Unknown type");
        break;
    }
  }

  private sendMessage(type, data): void {
    if (this.socket.readyState == this.socket.OPEN) {
      data.type = type;
      this.socket.send(JSON.stringify(data));
    } else {
      console.log("Could not send '" + type + "'message because the socket is not open.");
      console.log("Current socket status: " + this.socket.readyState);
    }
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

  private get(endpoint): Observable<Response> {
    return this.http.get("http://" + osasgUrlBase + endpoint, httpOptions);
  }

  private post(endpoint, body): Observable<Response> {
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
