import { Server, ServerOptions } from "ws";
import { IncomingMessage, Server as HTTPServer } from "http";
import { SocketAuthenticator } from "./socket_authenticator";
import { PlayerSocket } from "./player_socket";
import {
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
} from "../../../shared/socket_protocol";

export class SocketServer {
  private server: Server;

  constructor(
      httpServer: HTTPServer,
      private socketAuthenticator: SocketAuthenticator) {
    let serverOptions: ServerOptions = {
      server: httpServer,
      handleProtocols: (protocols: Array<string>, request: IncomingMessage) => {
        return this.selectSubprotocol(protocols);
      }
    }
    this.server = new Server(serverOptions);
    this.server.on("connection", (ws: WebSocket, request: IncomingMessage) => {
      this.onConnection(ws, request);
    });
    this.socketAuthenticator.onAuthentication = (playerSocket: PlayerSocket) => {
      this.onAuthentication(playerSocket);
    }
  }

  private selectSubprotocol(protocols: Array<string>): string|false {
    if (protocols.length == 0 || protocols.indexOf(CREDENTIALS_AUTHENTICATION_SUBPROTOCOL) != -1) {
      return CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
    } else if (protocols.indexOf(COOKIE_AUTHENTICATION_SUBPROTOCOL) != -1) {
      return COOKIE_AUTHENTICATION_SUBPROTOCOL;
    }
    return false;
  }

  private onConnection(ws: WebSocket, request: IncomingMessage) {
    this.socketAuthenticator.authenticate(ws, request);
  }

  private onAuthentication(playerSocket: PlayerSocket) {

  }
}
