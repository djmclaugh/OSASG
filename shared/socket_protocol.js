"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
exports.CREDENTIALS_AUTHENTICATION_SUBPROTOCOL = "credentials_authentication";
/**
 * If this subprotocol is used while establishing a websocket connection, the server will detect the
 * user from the cookies attached to their conneciton request.
 */
exports.COOKIE_AUTHENTICATION_SUBPROTOCOL = "cookie_authentication";
;
/**
 * AUTHENTICATION: Sent by clients
 * @param {string} identifier - The ID of the player the client wants to authenticat as.
 * @param {string} password - The raw, unencrypted, password associated with the player's account.
 * A client using the "credentials_authentication" subprotocol should send a message of this type as
 * soon they connect to the server.
 */
exports.AUTHENTICATION_TYPE = "AUTHENTICATION";
;
function isAuthenticationMessage(message) {
    return message.type == exports.AUTHENTICATION_TYPE;
}
exports.isAuthenticationMessage = isAuthenticationMessage;
;
/**
 * ERROR: Sent by server
 * @param {string} error - A description of the error that happened.
 * Sent for any non-fatal errors (i.e. Received malformed message, trying to subscribe to
 * non-existant channel, playing out of turn, etc.)
 * Fatal errors will instead have the connection terminated with an error code and reason.
 */
exports.ERROR_TYPE = "ERROR";
;
function isMessageMessage(message) {
    return message.type == exports.ERROR_TYPE;
}
exports.isMessageMessage = isMessageMessage;
;
function newErrorMessage(errorDescription) {
    return {
        type: exports.ERROR_TYPE,
        error: errorDescription
    };
}
exports.newErrorMessage = newErrorMessage;
/**
 * PLAYER_INFO: Sent by server
 * @param {PlayerInfo} playerInfo - Basic info about a player
 * A message of this type is sent to the client as soon as the server authenticates them.
 * That message is confirmation that the client successfully authenticated as the player contained
 * in the message.
 */
exports.PLAYER_INFO_TYPE = "PLAYER_INFO";
;
function isPlayerInfoMessage(message) {
    return message.type == exports.PLAYER_INFO_TYPE;
}
exports.isPlayerInfoMessage = isPlayerInfoMessage;
;
function newPlayerInfoMessage(playerInfo) {
    return {
        type: exports.PLAYER_INFO_TYPE,
        playerInfo: playerInfo
    };
}
exports.newPlayerInfoMessage = newPlayerInfoMessage;
/**
 * SUBSCRIPTION: Sent by clients
 * @param {boolean} subscribed - Whether or not the user wants to be subscribed to a particular channel.
 * @param {string} channel - The channel the user wants to subscribe to (or unsubscribe from).
 * A client should send a message of this type whenever they want continuous updates about a
 * particular topic. The client should send another message of this type but with "subscribed" set
 * to false whenever they no longer wish to receive these updates.
 */
exports.SUBSCRIPTION_TYPE = "SUBSCRIPTION";
;
function isSubscriptionMessage(message) {
    return message.type == exports.SUBSCRIPTION_TYPE;
}
exports.isSubscriptionMessage = isSubscriptionMessage;
;
