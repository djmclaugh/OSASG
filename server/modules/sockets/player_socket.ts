import { SocketMessage, SubscriptionSocketMessage, isSubscriptionMessage } from "../../../shared/socket_protocol";
import { PlayerInfo } from "../../../shared/player_info";

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
  private subscriptionsCallbacks: Array<SubscriptionCallback>;
  constructor(readonly playerInfo:PlayerInfo, readonly socket: WebSocket){
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
    }
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
}
