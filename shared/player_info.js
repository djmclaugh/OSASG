"use strict";
function isBot(info) {
    return info.username.indexOf("[bot]") != -1;
}
exports.isBot = isBot;
