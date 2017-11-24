"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const socket_protocol_1 = require("../../../shared/socket_protocol");
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
}
exports.PlayerSocket = PlayerSocket;
