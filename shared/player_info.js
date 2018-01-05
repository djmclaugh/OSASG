"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isBot(info) {
    return info.username.indexOf("[bot]") != -1;
}
exports.isBot = isBot;
function isGuest(info) {
    return info.username.indexOf("[guest]") != -1;
}
exports.isGuest = isGuest;
