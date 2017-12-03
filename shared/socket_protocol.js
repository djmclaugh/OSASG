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
exports.AUTHENTICATION_TYPE = "AUTHENTICATION";
function isAuthenticationMessage(message) {
    return message.type == exports.AUTHENTICATION_TYPE;
}
exports.isAuthenticationMessage = isAuthenticationMessage;
exports.ERROR_TYPE = "ERROR";
function isMessageMessage(message) {
    return message.type == exports.ERROR_TYPE;
}
exports.isMessageMessage = isMessageMessage;
function newErrorMessage(errorDescription) {
    return {
        type: exports.ERROR_TYPE,
        error: errorDescription
    };
}
exports.newErrorMessage = newErrorMessage;
exports.PLAYER_INFO_TYPE = "PLAYER_INFO";
function isPlayerInfoMessage(message) {
    return message.type == exports.PLAYER_INFO_TYPE;
}
exports.isPlayerInfoMessage = isPlayerInfoMessage;
function newPlayerInfoMessage(playerInfo) {
    return {
        type: exports.PLAYER_INFO_TYPE,
        playerInfo: playerInfo
    };
}
exports.newPlayerInfoMessage = newPlayerInfoMessage;
exports.SUBSCRIPTION_TYPE = "SUBSCRIPTION";
var Channel;
(function (Channel) {
    Channel["ACTIVE_MATCHES"] = "ACTIVE_MATCHES";
    Channel["AVAILABLE_PLAYERS"] = "AVAILABLE_PLAYERS";
})(Channel = exports.Channel || (exports.Channel = {}));
function isSubscriptionMessage(message) {
    return message.type == exports.SUBSCRIPTION_TYPE;
}
exports.isSubscriptionMessage = isSubscriptionMessage;
exports.SUBSCRIPTION_UPDATE_TYPE = "SUBSCRIPTION_UPDATE";
exports.JOIN_MATCH_TYPE = "JOIN_MATCH";
function isJoinMatchMessage(message) {
    return message.type == exports.JOIN_MATCH_TYPE;
}
exports.isJoinMatchMessage = isJoinMatchMessage;
exports.SPECTATE_MATCH_TYPE = "SPECTATE_MATCH";
function isSpectateMatchMessage(message) {
    return message.type == exports.SPECTATE_MATCH_TYPE;
}
exports.isSpectateMatchMessage = isSpectateMatchMessage;
exports.MATCH_UPDATE_TYPE = "MATCH_UPDATE";
function isMatchUpdateMessage(message) {
    return message.type == exports.MATCH_UPDATE_TYPE;
}
exports.isMatchUpdateMessage = isMatchUpdateMessage;
exports.PLAY_TYPE = "PLAY";
function isPlayMessage(message) {
    return message.type == exports.PLAY_TYPE;
}
exports.isPlayMessage = isPlayMessage;
//
