import { PlayerInfo } from "./player_info"

/**
 * This file defines the types of messages that will be sent and accepted via a WebSocket connection
 * and what they represent. When requesting a socket connection, the user must specify which
 * authentication subprotocol to use. Once authenticated the server will send the user a
 * PlayerInfoSocketMessage with the identifier and username of the player the user authenticated as.
 * After that, the user is free to subscribe to topics and join matches as they please.
 */

/**
 * If this subprotocol is used while establishing a websocket connection, the server will expect an
 * AuthenticationSocketMessage containing the identifier and password of the user.
 * The server expects that AuthenticationSocketMessage as the very first message and within 5
 * seconds.
 * Defaults to this subprotocol if non is specified while connecting.
 */
export const CREDENTIALS_AUTHENTICATION_SUBPROTOCOL = "credentials_authentication";
/**
 * If this subprotocol is used while establishing a websocket connection, the server will detect the
 * user from the cookies attached to their conneciton request.
 */
export const COOKIE_AUTHENTICATION_SUBPROTOCOL = "cookie_authentication";


export interface SocketMessage {
  type: string
};

export const SUBSCRIPTION_TYPE: string = "SUBSCRIPTION";
export interface SubscriptionSocketMessage extends SocketMessage {
  state: 0|1
  channel: "ACTIVE_MATCHES"
};
export function isSubscriptionMessage(message: SocketMessage): message is SubscriptionSocketMessage {
  return message.type == SUBSCRIPTION_TYPE;
};

export const AUTHENTICATION_TYPE: string = "AUTHENTICATION";
export interface AuthenticationSocketMessage extends SocketMessage {
  identifier: string
  password: string
};
export function isAuthenticationMessage(message: SocketMessage): message is AuthenticationSocketMessage {
  return message.type == AUTHENTICATION_TYPE;
};

export const PLAYER_INFO_TYPE: string = "PLAYER_INFO";
export interface PlayerInfoSocketMessage extends SocketMessage {
  playerInfo: PlayerInfo;
};
export function isPlayerInfoMessage(message: SocketMessage): message is PlayerInfoSocketMessage {
  return message.type == PLAYER_INFO_TYPE;
};
export function newPlayerInfoMessage(playerInfo: PlayerInfo): PlayerInfoSocketMessage {
  return {
    type: PLAYER_INFO_TYPE,
    playerInfo: playerInfo
  };
}
