import { Injectable } from "@angular/core";
import { Http, Response, RequestOptionsArgs } from "@angular/http";
import { Observable } from "rxjs/Rx";

const osasgUrlBase: string = "localhost:8000/";
const httpOptions: RequestOptionsArgs = {withCredentials: true};
const userInfoEndpoint: string = "user_info";
const requestEmailEndpoint: string = "send_login_email";
const logoutEndpoint: string = "logout";

interface UserInfo {
  username: string,
  userId: string
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

  private handleMessage(type, data): void {
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

  getUsername(): string {
    if (this.userInfo) {
      return this.userInfo.username;
    }
    return null;
  }

  isGuest(): boolean {
    return !this.userInfo || !this.userInfo.userId;
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