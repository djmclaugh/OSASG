"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_protocol_1 = require("../../../shared/socket_protocol");
const player_info_1 = require("../../../shared/player_info");
// Removes the first occurent of "item" from "list"
// Does nothing if "item" is not in list.
function removeFromList(list, item) {
    let firstOccurence = list.indexOf(item);
    if (firstOccurence != -1) {
        list.splice(firstOccurence, 1);
    }
}
class PlayerSocket {
    constructor(playerInfo, socket) {
        this.playerInfo = playerInfo;
        this.socket = socket;
        this.isBot = player_info_1.isBot(playerInfo);
        this.isGuest = player_info_1.isGuest(playerInfo);
        this.subscriptionsCallbacks = [];
        socket.onmessage = (ev) => {
            let message = JSON.parse(ev.data);
            if (socket_protocol_1.isSubscriptionMessage(message)) {
                for (let callback of this.subscriptionsCallbacks) {
                    callback(message);
                }
            }
            else {
                throw new Error("Unknown message type: " + message.type);
            }
        };
        socket.onclose = (ev) => {
            for (let callback of this.onCloseCallbacks) {
                callback();
            }
        };
    }
    send(message) {
        this.socket.send(JSON.stringify(message));
    }
    onSubscription(callback) {
        this.subscriptionsCallbacks.push(callback);
    }
    removeSubscriptionListener(callback) {
        removeFromList(this.subscriptionsCallbacks, callback);
    }
    onClose(callback) {
        this.onCloseCallbacks.push(callback);
    }
    removeOnCloseListener(callback) {
        removeFromList(this.onCloseCallbacks, callback);
    }
}
exports.PlayerSocket = PlayerSocket;
