import {
  SocketMessage,
  JoinMatchMessage,
  PlayMessage,
  SpectateMatchMessage,
  SubscriptionMessage,
  isJoinMatchMessage,
  isPlayMessage,
  isSpectateMatchMessage,
  isSubscriptionMessage
} from "../../../shared/socket_protocol";
import { PlayerInfo, isBot, isGuest } from "../../../shared/player_info";

export class PlayerSocket {
  public onClose:() => void;
  public onSubscription: (message: SubscriptionMessage) => void;
  public onJoinMatch: (message: JoinMatchMessage) => void;
  public onPlay: (message: PlayMessage) => void;
  public onSpectateMatch: (message: SpectateMatchMessage) => void;
  public readonly isBot: boolean;
  public readonly isGuest: boolean;
  constructor(readonly playerInfo:PlayerInfo, readonly socket: WebSocket) {
    this.isBot = isBot(playerInfo);
    this.isGuest = isGuest(playerInfo);
    socket.onmessage = (ev: MessageEvent) => {
      try {
        let message: SocketMessage = JSON.parse(ev.data);
        if (isJoinMatchMessage(message)) {
          this.onJoinMatch(message);
        } else if (isPlayMessage(message)) {
          this.onPlay(message);
        } else if (isSpectateMatchMessage(message)) {
          this.onSpectateMatch(message);
        } else if (isSubscriptionMessage(message)) {
          this.onSubscription(message);
        } else {
          throw new Error("Unexpected message type: " + message.type);
        }
      } catch(e) {
        console.log("Error prossesing message for socket '" + this.playerInfo.username + "':");
        console.log(e);
        socket.close(1011, e.message);
      }
    };
    socket.onclose = (ev: CloseEvent) => {
      this.onClose();
    };
  }

  public send(message: SocketMessage): boolean {
    if (this.socket.readyState == this.socket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    }
    return false;
  }
}
