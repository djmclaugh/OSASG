import { Identifiable } from "./identifiable"
import { MatchInfo, MatchSummary } from "./match_info"
import { PlayerInfo } from "./player_info"
import { Update } from "./update"

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
}


export const AUTHENTICATION_TYPE: string = "AUTHENTICATION";
/**
 * AUTHENTICATION: Sent by clients
 * @param {string} identifier - The ID of the player the client wants to authenticat as.
 * @param {string} password - The raw, unencrypted, password associated with the player's account.
 * A client using the "credentials_authentication" subprotocol should send a message of this type as
 * soon they connect to the server.
 */
export interface AuthenticationMessage extends SocketMessage {
  identifier: string
  password: string
}
export function isAuthenticationMessage(message: SocketMessage): message is AuthenticationMessage {
  return message.type == AUTHENTICATION_TYPE;
}


export const ERROR_TYPE: string = "ERROR";
/**
 * ERROR: Sent by server
 * @param {string} error - A description of the error that happened.
 * Sent for any non-fatal errors (i.e. Received malformed message, trying to subscribe to
 * non-existant channel, playing out of turn, etc.)
 * Fatal errors will instead have the connection terminated with an error code and reason.
 */
export interface ErrorMessage extends SocketMessage {
  error: string
}
export function isMessageMessage(message: SocketMessage): message is ErrorMessage {
  return message.type == ERROR_TYPE;
}
export function newErrorMessage(errorDescription: string): ErrorMessage {
  return {
    type: ERROR_TYPE,
    error: errorDescription
  };
}


export const PLAYER_INFO_TYPE: string = "PLAYER_INFO";
/**
 * PLAYER_INFO: Sent by server
 * @param {PlayerInfo} playerInfo - Basic info about a player
 * A message of this type is sent to the client as soon as the server authenticates them.
 * That message is confirmation that the client successfully authenticated as the player contained
 * in the message.
 */
export interface PlayerInfoMessage extends SocketMessage {
  playerInfo: PlayerInfo;
}
export function isPlayerInfoMessage(message: SocketMessage): message is PlayerInfoMessage {
  return message.type == PLAYER_INFO_TYPE;
}
export function newPlayerInfoMessage(playerInfo: PlayerInfo): PlayerInfoMessage {
  return {
    type: PLAYER_INFO_TYPE,
    playerInfo: playerInfo
  };
}


export const SUBSCRIPTION_TYPE: string = "SUBSCRIPTION";
export interface PlayerPreferenceProfile extends PlayerInfo {
  preferences: any;
}
export enum Channel {
  ACTIVE_MATCHES = "ACTIVE_MATCHES", // MatchInfo
  AVAILABLE_PLAYERS = "AVAILABLE_PLAYERS", // PlayerPreferenceProfile
}
/**
 * SUBSCRIPTION: Sent by clients
 * @param {boolean} subscribe - Whether or not the user wants to be subscribed to a particular channel.
 * @param {string} channel - The channel the user wants to subscribe to (or unsubscribe from).
 * A client should send a message of this type whenever they want continuous updates about a
 * particular topic. The client should send another message of this type but with "subscribed" set
 * to false whenever they no longer wish to receive these updates.
 */
export interface SubscriptionMessage extends SocketMessage {
  subscribe: boolean,
  channel: Channel
}
export function isSubscriptionMessage(message: SocketMessage): message is SubscriptionMessage {
  return message.type == SUBSCRIPTION_TYPE;
}


export const SUBSCRIPTION_UPDATE_TYPE: string = "SUBSCRIPTION_UPDATE"
/**
 * SUBSCRIPTION_UPDATE: Sent by server
 * @param {string} channel - The channel this update comes from.
 * @param {Array<T>} set - The currently existing items.
 * @param {T} add - An item that just got created.
 * @param {string} remove - The identifer of an item that just get removed.
 * @param {T} set - An item that just got updated.
 */
export interface SubscriptionUpdateMessage<T extends Identifiable> extends SocketMessage {
  channel: Channel,
  set?: Array<T>,
  add?: T,
  remove?: string,
  update?: T
}
export function isSubscriptionUpdateMessage(message: SocketMessage): message is SubscriptionUpdateMessage<any> {
  return message.type == SUBSCRIPTION_UPDATE_TYPE;
}
export function isMatchSummarySubscriptionUpdateMessage(message: SocketMessage): message is SubscriptionUpdateMessage<MatchSummary> {
  return isSubscriptionUpdateMessage(message) && message.channel == Channel.ACTIVE_MATCHES;
}


export const JOIN_MATCH_TYPE: string = "JOIN_MATCH"
/**
 * JOIN_MATCH: Sent by client
 * @param {string} matchID - The identifier for the match to join.
 * @param {number} seat - The desired seat. If no seat is provided, will sit in the first available
 *     seat.
 */
export interface JoinMatchMessage extends SocketMessage {
  matchID: string,
  seat?: number
}
export function isJoinMatchMessage(message: SocketMessage): message is JoinMatchMessage {
  return message.type == JOIN_MATCH_TYPE;
}


export const SPECTATE_MATCH_TYPE: string = "SPECTATE_MATCH"
/**
 * SPECTATE_MATCH: Sent by client
 * @param {string} matchID - The identifier for the match to join.
 * @param {boolean} spectate - Whether to start or stop spectating the specified match.
 */
export interface SpectateMatchMessage extends SocketMessage {
  matchID: string,
  spectate: boolean
}
export function isSpectateMatchMessage(message: SocketMessage): message is SpectateMatchMessage {
  return message.type == SPECTATE_MATCH_TYPE;
}


export const MATCH_UPDATE_TYPE: string = "MATCH_UPDATE"
/**
 * MATCH_UPDATE: Sent by server
 * @param {string} matchID - The identifier for the match to join.
 * @param {MatchInfo} matchInfo - Full update of the match.
 * @param {Array<PlayerInfo>} players - Sent when only the players have changed.
 * @param {Update} update - Sent when a turn is processed.
 */
export interface MatchUpdateMessage extends SocketMessage {
  matchID: string,
  matchInfo?: MatchInfo,
  players?: Array<PlayerInfo>,
  gameUpdate?: Update
}
export function isMatchUpdateMessage(message: SocketMessage): message is MatchUpdateMessage {
  return message.type == MATCH_UPDATE_TYPE;
}


export const PLAY_TYPE: string = "PLAY"
/**
 * PLAY: Sent by player, returned by server to confirm it has been processed.
 * @param {string} matchID - The identifier for the match to play in.
 * @param {number} playerNumber - The player the move is for. Optional if the user is only playing
 *    as one of the players.
 * @param {number} turnNumber - Optional confirmation of the turn number.
 * @param {any} move - Move to play.
 */
export interface PlayMessage extends SocketMessage {
  matchID: string,
  playerNumber?: number,
  turnNumber?: number,
  move: any
}
export function isPlayMessage(message: SocketMessage): message is PlayMessage {
  return message.type == PLAY_TYPE;
}
