import { PlayerSocket } from "./player_socket";
import { Channel, SocketMessage, SubscriptionSocketMessage } from "../../../shared/socket_protocol";

export class SubscriptionManager {
  private channels: Map<Channel, Set<PlayerSocket>> = new Map();

  public updateSubscription(playerSocket: PlayerSocket, message: SubscriptionSocketMessage) {
    if (message.subscribe) {
      this.subscribe(playerSocket, message.channel);
    } else {
      this.unsubscribe(playerSocket, message.channel);
    }
  }

  private subscribe(playerSocket: PlayerSocket, channel: Channel): void {
    let channelSet: Set<PlayerSocket> = this.channels.get(channel);
    if (!channelSet) {
      channelSet = new Set();
      this.channels.set(channel, channelSet);
    }
    channelSet.add(playerSocket);
  }

  private unsubscribe(playerSocket: PlayerSocket, channel: Channel): void {
    let channelSet: Set<PlayerSocket> = this.channels.get(channel);
    if (channelSet) {
      channelSet.delete(playerSocket);
    }
  }

  public remove(playerSocket: PlayerSocket): void {
    for (let chanelSet of this.channels.values()) {
      chanelSet.delete(playerSocket);
    }
  }

  public broadcastToChannel(message: SocketMessage, channel: Channel): void {
    let channelSet: Set<PlayerSocket> = this.channels.get(channel);
    if (channelSet) {
      for (let socket of channelSet.values()) {
        socket.send(message);
      }
    }
  }
}
