import { Server as SocketServer, ServerOptions } from "ws";
import { IncomingMessage, Server as HTTPServer } from "http";
import { PlayerInfo } from "../../../shared/player_info";
import { AuthenticationSocketMessage, isAuthenticationMessage, SubscriptionSocketMessage, newPlayerInfoMessage, SocketMessage } from "../../../shared/socket_protocol";
import { PlayerSocket } from "./player_socket";

type PlayerInfoCallback = (error: Error, playerInfo: PlayerInfo) => void;
type RequestAuthenticator = (request: IncomingMessage, callback: PlayerInfoCallback) => void
type CredentialAuthenticator =
    (credentials: AuthenticationSocketMessage, callback: PlayerInfoCallback) => void

export class SocketAuthenticator {
  private authenticationCredentials: Map<WebSocket, AuthenticationSocketMessage>;

  constructor(
      private requestAuthentication: RequestAuthenticator,
      private credentialAuthentication: CredentialAuthenticator) {
    this.authenticationCredentials = new Map();
  }

  public authenticate(ws: WebSocket, request: IncomingMessage) {
    //if (ws.protocol == )
  }

  private onConnect(ws: WebSocket, request: IncomingMessage) {
    ws.onmessage = (ev: MessageEvent) => {
      // Only listen to one message.
      ws.onmessage = null;
      let message: SocketMessage = JSON.parse(ev.data);
      if (isAuthenticationMessage(message)) {
        this.authenticationCredentials.set(ws, message);
      } else {
        this.onAuthenticationFailed(ws, "Expected first message to be authentication info.");
      }
    }
    this.requestAuthentication(request, (error: Error, playerInfo: PlayerInfo) => {
      if (error) {
        console.log(error);
        this.onAuthenticationFailed(ws, error.message);
      } else if (playerInfo) {
        this.onPlayerInfoFound(ws, playerInfo);
      } else {
        this.onRequestAuthenticationFailed(ws);
      }
    });
  }

  private onRequestAuthenticationFailed(ws: WebSocket) {
    // If the credentials have already been sent while the cookies were being looked at, try to
    // validate them.
    if (this.authenticationCredentials.get(ws)) {
      this.validateAuthenticationCredentials(ws, this.authenticationCredentials.get(ws));
      return;
    }
    // Otherwise, give the player 5 seconds to send them.
    let timer: NodeJS.Timer = setTimeout(() => {
      this.onAuthenticationFailed(ws, "Expected authentication info within 5 seconds of connection.");
    }, 5000);
    ws.onmessage = (ev: MessageEvent) => {
      clearTimeout(timer);
      // Only listen to one message.
      ws.onmessage = null;
      let message: SocketMessage = JSON.parse(ev.data);
      if (isAuthenticationMessage(message)) {
        this.validateAuthenticationCredentials(ws, message);
      } else {
        this.onAuthenticationFailed(ws, "Expected first message to be authentication info.");
      }
    };
  }

  private validateAuthenticationCredentials(ws: WebSocket, authenticationCredentials: AuthenticationSocketMessage) {
    this.credentialAuthentication(authenticationCredentials, (error: Error, playerInfo: PlayerInfo) => {
      if (error) {
        console.log(error);
        this.onAuthenticationFailed(ws, error.message);
      } else if (playerInfo) {
        this.onPlayerInfoFound(ws, playerInfo);
      } else {
        this.onAuthenticationFailed(ws, "Invalid authentication info.");
      }
    })
  }

  private onAuthenticationFailed(ws: WebSocket, reason: string) {
    this.authenticationCredentials.delete(ws);
    ws.send(JSON.stringify(reason + " Clossing connection."));
    ws.close();
  }

  private onPlayerInfoFound(ws: WebSocket, info: PlayerInfo) {
    this.authenticationCredentials.delete(ws);
    //this.addNewPlayerSocket(new PlayerSocket(info, ws));
  }
/*
  private addNewPlayerSocket(playerSocket: PlayerSocket) {
    let playerWithSameID: Set<PlayerSocket> = this.players.get(playerSocket.playerInfo.identifier);
    if (!playerWithSameID) {
      playerWithSameID = new Set();
      this.players.set(playerSocket.playerInfo.identifier, playerWithSameID);
    }
    playerWithSameID.add(playerSocket);
    playerSocket.send(newPlayerInfoMessage(playerSocket.playerInfo));
    playerSocket.onSubscription((message: SubscriptionSocketMessage) => {
      console.log("Oooo yeah");
    });
  }
*/
}
