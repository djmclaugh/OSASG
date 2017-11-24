"use strict";
;
exports.SUBSCRIPTION_TYPE = "SUBSCRIPTION";
;
function isSubscriptionMessage(message) {
    return message.type == exports.SUBSCRIPTION_TYPE;
}
exports.isSubscriptionMessage = isSubscriptionMessage;
;
exports.AUTHENTICATION_TYPE = "AUTHENTICATION";
;
function isAuthenticationMessage(message) {
    return message.type == exports.AUTHENTICATION_TYPE;
}
exports.isAuthenticationMessage = isAuthenticationMessage;
;
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
