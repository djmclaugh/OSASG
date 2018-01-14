import { IncomingMessage } from "http";
import { PlayerInfo } from "../../../shared/player_info";
import {
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  AuthenticationMessage,
  SocketMessage,
  isAuthenticationMessage,
  newPlayerInfoMessage,
} from "../../../shared/socket_protocol";
import { PlayerSocket } from "./player_socket";

export type PlayerInfoCallback = (error: Error, playerInfo: PlayerInfo) => void;
export type RequestAuthenticator = (request: IncomingMessage, callback: PlayerInfoCallback) => void;
export type CredentialAuthenticator =
    (credentials: AuthenticationMessage, callback: PlayerInfoCallback) => void;

// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes
// The endpoint is terminating the connection due to a protocol error.
const PROTOCOL_ERROR:number = 1002;
// The server is terminating the connection because it encountered an unexpected condition that
// prevented it from fulfilling the request.
const INTERNAL_ERROR:number = 1011;

/**
 * Class that combines the different authentication strategies for WebSockets.
 * Given a WebSocket to authenticate via the "authenticate" method, it will either return a
 * PlayerSocket with the appropriate PlayerInfo (via the "onAuthentication" method) or close the the
 * connection with the socket if it fails to authenticate.
 */
export class SocketAuthenticator {
  /**
   * Called whenever a socket successfully authenticates.
   * Should be set by the owner of this object to receive authenticated users.
   */
  public onAuthentication: (playerSocket: PlayerSocket) => void;

  constructor(
      private requestAuthentication: RequestAuthenticator,
      private credentialAuthentication: CredentialAuthenticator,
      private authenticationTimeout: number) {}

  /**
   * This asynchronous method either authenticates the socket and calls "onAuthentication" with the
   * appropriate PlayerSocket or closes the connection with "ws".
   */
  public authenticate(ws: WebSocket, request: IncomingMessage) {
    if (ws.protocol == CREDENTIALS_AUTHENTICATION_SUBPROTOCOL) {
      this.authenticateWithCredentials(ws);
    } else if (ws.protocol == COOKIE_AUTHENTICATION_SUBPROTOCOL) {
      this.authenticateWithCookie(ws, request);
    } else {
      ws.close(PROTOCOL_ERROR, "Unknown subprotocol: " + ws.protocol);
    }
  }

  private authenticateWithCookie(ws: WebSocket, request: IncomingMessage) {
    this.requestAuthentication(request, (error: Error, playerInfo: PlayerInfo) => {
      if (error) {
        console.log(error);
        ws.close(INTERNAL_ERROR, error.message);
      } else if (playerInfo) {
        this.onPlayerInfoFound(ws, playerInfo);
      } else {
        ws.close(INTERNAL_ERROR, "Player info not found. Invalid or expired cookie.");
      }
    });
  }

  private authenticateWithCredentials(ws: WebSocket) {
    let seconds = this.authenticationTimeout / 1000;
    let timer: NodeJS.Timer = setTimeout(() => {
      ws.close(PROTOCOL_ERROR, "Expected authentication info within " + seconds + " seconds of connection.");
    }, this.authenticationTimeout);
    ws.onmessage = (ev: MessageEvent) => {
      clearTimeout(timer);
      // Only listen to one message.
      ws.onmessage = null;
      let message: SocketMessage;
      try {
        message = JSON.parse(ev.data);
      } catch(e) {
        console.log("Error parsing authentication message as JSON:");
        console.log(ev.data);
        ws.close(PROTOCOL_ERROR, "Expected first message to be authentication info (as a JSON string).")
        return;
      }
      if (isAuthenticationMessage(message)) {
        this.validateAuthenticationCredentials(ws, message);
      } else {
        ws.close(PROTOCOL_ERROR, "Expected first message to be authentication info.");
      }
    };
  }

  private validateAuthenticationCredentials(ws: WebSocket, authenticationCredentials: AuthenticationMessage) {
    this.credentialAuthentication(authenticationCredentials, (error: Error, playerInfo: PlayerInfo) => {
      if (error) {
        console.log(error);
        ws.close(INTERNAL_ERROR, error.message);
      } else if (playerInfo) {
        this.onPlayerInfoFound(ws, playerInfo);
      } else {
        ws.close(INTERNAL_ERROR, "Invalid authentication info.");
      }
    })
  }

  private onPlayerInfoFound(ws: WebSocket, info: PlayerInfo) {
    ws.send(JSON.stringify(newPlayerInfoMessage(info)));
    this.onAuthentication(new PlayerSocket(info, ws));
  }
}
