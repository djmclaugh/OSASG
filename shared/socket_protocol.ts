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

/**
 * Every socket message will be a JSON string. The JSON object will always have a "type" property
 * used to described what type of message it is.
 * Every accepted type is described below.
 */
export interface SocketMessage {
  type: string
};

export const AUTHENTICATION_TYPE: string = "AUTHENTICATION";
/**
 * AUTHENTICATION: Sent by clients
 * @param {string} identifier - The ID of the player the client wants to authenticat as.
 * @param {string} password - The raw, unencrypted, password associated with the player's account.
 * A client using the "credentials_authentication" subprotocol should send a message of this type as
 * soon they connect to the server.
 */
export interface AuthenticationSocketMessage extends SocketMessage {
  identifier: string
  password: string
};
export function isAuthenticationMessage(message: SocketMessage): message is AuthenticationSocketMessage {
  return message.type == AUTHENTICATION_TYPE;
};

export const ERROR_TYPE: string = "ERROR";
/**
 * ERROR: Sent by server
 * @param {string} error - A description of the error that happened.
 * Sent for any non-fatal errors (i.e. Received malformed message, trying to subscribe to
 * non-existant channel, playing out of turn, etc.)
 * Fatal errors will instead have the connection terminated with an error code and reason.
 */
export interface ErrorSocketMessage extends SocketMessage {
  error: string
};
export function isMessageMessage(message: SocketMessage): message is ErrorSocketMessage {
  return message.type == ERROR_TYPE;
};
export function newErrorMessage(errorDescription: string): ErrorSocketMessage {
  return {
    type: ERROR_TYPE,
    error: errorDescription
  };
};

export const PLAYER_INFO_TYPE: string = "PLAYER_INFO";
/**
 * PLAYER_INFO: Sent by server
 * @param {PlayerInfo} playerInfo - Basic info about a player
 * A message of this type is sent to the client as soon as the server authenticates them.
 * That message is confirmation that the client successfully authenticated as the player contained
 * in the message.
 */
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
};

export const SUBSCRIPTION_TYPE: string = "SUBSCRIPTION";
export enum Channel {
  ACTIVE_MATCHES = "ACTIVE_MATCHES",
  PLAYERS_LOOKING_FOR_INVITES = "PLAYERS_LOOKING_FOR_INVITES",
}
/**
 * SUBSCRIPTION: Sent by clients
 * @param {boolean} subscribed - Whether or not the user wants to be subscribed to a particular channel.
 * @param {string} channel - The channel the user wants to subscribe to (or unsubscribe from).
 * A client should send a message of this type whenever they want continuous updates about a
 * particular topic. The client should send another message of this type but with "subscribed" set
 * to false whenever they no longer wish to receive these updates.
 */
export interface SubscriptionSocketMessage extends SocketMessage {
  subscribe: boolean,
  channel: Channel
};
export function isSubscriptionMessage(message: SocketMessage): message is SubscriptionSocketMessage {
  return message.type == SUBSCRIPTION_TYPE;
};
