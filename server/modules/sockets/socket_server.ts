import { Server, ServerOptions } from "ws";
import { IncomingMessage, Server as HTTPServer } from "http";
import { SocketAuthenticator } from "./socket_authenticator";
import { PlayerSocket } from "./player_socket";
import {
  COOKIE_AUTHENTICATION_SUBPROTOCOL,
  CREDENTIALS_AUTHENTICATION_SUBPROTOCOL,
  Channel,
  SocketMessage,
  SubscriptionSocketMessage,
  newPlayerInfoMessage,
} from "../../../shared/socket_protocol";

export class SocketServer {
  private server: Server;
  private onlineSockets: Map<string, Set<PlayerSocket>> =  new Map();
  private channels: Map<Channel, Set<PlayerSocket>> = new Map();
  private wantsInvites: Map<string, Set<PlayerSocket>> = new Map();

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

  private onAuthentication(playerSocket: PlayerSocket) {
    this.addPlayer(playerSocket);
    playerSocket.onClose(() => { this.removePlayer(playerSocket)});
    playerSocket.onSubscription((message: SubscriptionSocketMessage) => {
      let channel: Set<PlayerSocket> = this.channels.get(message.channel);
      if (message.subscribe) {
        if (!channel) {
          channel = new Set();
          this.channels.set(message.channel, channel);
        }
        channel.add(playerSocket);
      } else {
        channel.delete(playerSocket);
      }
    });
  }

  private addPlayer(playerSocket: PlayerSocket) {
    let playerSet: Set<PlayerSocket> = this.onlineSockets.get(playerSocket.playerInfo.identifier);
    if (!playerSet) {
      playerSet = new Set();
      this.onlineSockets.set(playerSocket.playerInfo.identifier, playerSet);
    }
    playerSet.add(playerSocket);
  }

  private removePlayer(playerSocket: PlayerSocket) {
    this.onlineSockets.get(playerSocket.playerInfo.identifier).delete(playerSocket);
    for (let channel of this.channels.values()) {
      channel.delete(playerSocket);
    }
  }

  private broadcastToChannel(channel: Channel, message: SocketMessage) {
    for (let playerSocket of this.channels.get(channel)) {
      playerSocket.send(message);
    }
  }
}
