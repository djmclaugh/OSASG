import { SocketMessage, SubscriptionSocketMessage, isSubscriptionMessage } from "../../../shared/socket_protocol";
import { PlayerInfo, isBot, isGuest } from "../../../shared/player_info";

type SubscriptionCallback = (message: SubscriptionSocketMessage) => void;

// Removes the first occurent of "item" from "list"
// Does nothing if "item" is not in list.
function removeFromList(list: Array<any>, item: any): void {
  let firstOccurence: number = list.indexOf(item);
  if (firstOccurence != -1) {
    list.splice(firstOccurence, 1);
  }
}

export class PlayerSocket {
  private onCloseCallbacks: Array<() => void>;
  private subscriptionsCallbacks: Array<SubscriptionCallback>;
  public readonly isBot: boolean;
  public readonly isGuest: boolean;
  constructor(readonly playerInfo:PlayerInfo, readonly socket: WebSocket) {
    this.isBot = isBot(playerInfo);
    this.isGuest = isGuest(playerInfo);
    this.subscriptionsCallbacks = [];
    socket.onmessage = (ev: MessageEvent) => {
      let message: SocketMessage = JSON.parse(ev.data);
      if (isSubscriptionMessage(message)) {
        for (let callback of this.subscriptionsCallbacks) {
          callback(message);
        }
      } else {
        throw new Error("Unknown message type: " + message.type);
      }
    };
    socket.onclose = (ev: CloseEvent) => {
      for (let callback of this.onCloseCallbacks) {
        callback();
      }
    };
  }

  public send(message: SocketMessage) {
    this.socket.send(JSON.stringify(message));
  }

  public onSubscription(callback: SubscriptionCallback): void {
    this.subscriptionsCallbacks.push(callback);
  }
  public removeSubscriptionListener(callback: SubscriptionCallback): void {
    removeFromList(this.subscriptionsCallbacks, callback);
  }

  public onClose(callback: () => void): void {
    this.onCloseCallbacks.push(callback);
  }
  public removeOnCloseListener(callback: () => void): void {
    removeFromList(this.onCloseCallbacks, callback);
  }
}
