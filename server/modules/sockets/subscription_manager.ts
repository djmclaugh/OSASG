import { PlayerSocket } from "./player_socket";
import {
  SUBSCRIPTION_UPDATE_TYPE,
  Channel,
  SocketMessage,
  SubscriptionUpdateMessage,
  SubscriptionMessage,
} from "../../../shared/socket_protocol";
import { Identifiable } from "../../../shared/identifiable";
import { MatchInfo } from "../../../shared/match_info";

export class SubscriptionManager {
  private subscribers: Map<Channel, Set<PlayerSocket>> = new Map();
  private channels: Map<Channel, Map<string, Identifiable>> = new Map();

  // Manage sockets
  public add(playerSocket: PlayerSocket): void {
    playerSocket.onSubscription = (message: SubscriptionMessage) => {
      this.updateSubscription(playerSocket, message);
    };
  }

  public remove(playerSocket: PlayerSocket): void {
    for (let subscriberSet of this.subscribers.values()) {
      subscriberSet.delete(playerSocket);
    }
  }

  // Update channels
  public addItem(channel: Channel, item: Identifiable): void {
    if (!this.getChannel(channel).has(item.identifier)) {
      this.getChannel(channel).set(item.identifier, item);
      this.broadcast({
        type: SUBSCRIPTION_UPDATE_TYPE,
        channel: channel,
        add: item
      });
    }
  }

  public removeItem(channel: Channel, itemIdentifier: string): void {
    if (this.getChannel(channel).has(itemIdentifier)) {
      this.getChannel(channel).delete(itemIdentifier);
      this.broadcast({
        type: SUBSCRIPTION_UPDATE_TYPE,
        channel: channel,
        remove: itemIdentifier
      });
    }
  }

  public updateItem(channel: Channel, item: Identifiable): void {
    if (!this.getChannel(channel).has(item.identifier)) {
      this.addItem(channel, item);
    } else {
      this.getChannel(channel).set(item.identifier, item);
      this.broadcast({
        type: SUBSCRIPTION_UPDATE_TYPE,
        channel: channel,
        update: item
      });
    }
  }

  // Private methods
  private updateSubscription(playerSocket: PlayerSocket, message: SubscriptionMessage) {
    if (message.subscribe) {
      this.subscribe(playerSocket, message.channel);
      let setMessage: SubscriptionUpdateMessage<Identifiable> = {
        type: SUBSCRIPTION_UPDATE_TYPE,
        channel: message.channel,
        set: Array.from(this.getChannel(message.channel).values())
      };
      playerSocket.send(setMessage);
    } else {
      this.unsubscribe(playerSocket, message.channel);
    }
  }

  private getChannel(channel:Channel): Map<string, Identifiable> {
    let result = this.channels.get(channel);
    if (!result) {
      result = new Map();
      this.channels.set(channel, result);
    }
    return result;
  }

  private broadcast<T extends Identifiable>(message: SubscriptionUpdateMessage<T>) {
    let channelSet: Set<PlayerSocket> = this.subscribers.get(message.channel);
    if (channelSet) {
      for (let socket of channelSet.values()) {
        socket.send(message);
      }
    }
  }

  private subscribe(playerSocket: PlayerSocket, channel: Channel): void {
    let subsciberSet: Set<PlayerSocket> = this.subscribers.get(channel);
    if (!subsciberSet) {
      subsciberSet = new Set();
      this.subscribers.set(channel, subsciberSet);
    }
    subsciberSet.add(playerSocket);
  }

  private unsubscribe(playerSocket: PlayerSocket, channel: Channel): void {
    let subscriberSet: Set<PlayerSocket> = this.subscribers.get(channel);
    if (subscriberSet) {
      subscriberSet.delete(playerSocket);
    }
  }
}
