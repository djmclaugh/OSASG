import { Server, ServerOptions } from "ws";
import { IncomingMessage, Server as HTTPServer } from "http";
import { PlayerSocket } from "./player_socket";
import { SocketAuthenticator } from "./socket_authenticator";
import { SubscriptionManager } from "./subscription_manager";
import {
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  Channel,
  PreferencesMessage,
  SocketMessage,
  SubscriptionMessage,
  newPlayerInfoMessage,
} from "../../../shared/socket_protocol";

export class SocketServer {
  private server: Server;
  private onlineSockets: Map<string, Set<PlayerSocket>> =  new Map();
  private wantsInvites: Map<string, Set<PlayerSocket>> = new Map();
  public readonly subsciptionManager: SubscriptionManager = new SubscriptionManager();
  public onNewPlayer: (player: PlayerSocket) => void;
  public onPlayerClose: (player: PlayerSocket) => void;

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
      this.addPlayer(playerSocket);
    }
    this.onlineSockets = new Map();
  }

  public updateUsername(identifier: string, newUsername: string) {
    let playerSockets: Set<PlayerSocket> = this.onlineSockets.get(identifier);
    if (!playerSockets) {
      return;
    }
    for (let socket of this.onlineSockets.get(identifier)) {
      if (socket.playerInfo.username != newUsername) {
        socket.playerInfo.username = newUsername;
        socket.send(newPlayerInfoMessage(socket.playerInfo));
      }
    }
  }

  private selectSubprotocol(protocols: Array<string>): string|false {
    if (protocols.indexOf(CREDENTIALS_AUTHENTICATION_SUBPROTOCOL) != -1) {
      return CREDENTIALS_AUTHENTICATION_SUBPROTOCOL;
    } else if (protocols.indexOf(COOKIE_AUTHENTICATION_SUBPROTOCOL) != -1) {
      return COOKIE_AUTHENTICATION_SUBPROTOCOL;
    }
    return false;
  }

  private onConnection(ws: WebSocket, request: IncomingMessage) {
    this.socketAuthenticator.authenticate(ws, request);
  }

  private addPlayer(playerSocket: PlayerSocket) {
    playerSocket.onClose = () => {
      this.removePlayer(playerSocket)
      this.subsciptionManager.removeItem(
          Channel.AVAILABLE_PLAYERS, playerSocket.playerInfo.identifier);
    };
    playerSocket.onPreferences = (message: PreferencesMessage) => {
      message.profile.identifier = playerSocket.playerInfo.identifier;
      this.subsciptionManager.addItem(Channel.AVAILABLE_PLAYERS, message.profile);
    };
    this.subsciptionManager.add(playerSocket);
    let playerSet: Set<PlayerSocket> = this.onlineSockets.get(playerSocket.playerInfo.identifier);
    if (!playerSet) {
      playerSet = new Set();
      this.onlineSockets.set(playerSocket.playerInfo.identifier, playerSet);
    }
    playerSet.add(playerSocket);
    this.onNewPlayer(playerSocket);
  }

  private removePlayer(playerSocket: PlayerSocket) {
    this.onlineSockets.get(playerSocket.playerInfo.identifier).delete(playerSocket);
    this.subsciptionManager.remove(playerSocket);
    if (this.onPlayerClose) {
      this.onPlayerClose(playerSocket);
    }
  }

  public getSocketsForUser(identifier: string): Set<PlayerSocket> {
    let sockets: Set<PlayerSocket> = this.onlineSockets.get(identifier);
    return sockets ? sockets : new Set();
  }
}
