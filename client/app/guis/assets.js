"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var _c;
var _ctx;
function getGoBoardImage(width, height) {
    _c = document.createElement("canvas");
    _c.width = _c.height = 500;
    _ctx = _c.getContext("2d");
    _ctx.fillStyle = "#DDAA77";
    _ctx.fillRect(0, 0, 500, 500);
    _ctx.lineWidth = 1;
    _ctx.strokeStyle = "black";
    _ctx.lineCap = "round";
    _ctx.beginPath();
    var max = Math.max(width, height);
    var spacing = 25;
    var extraPaddingX = (19 - width) * spacing / 2;
    var extraPaddingY = (19 - height) * spacing / 2;
    for (var i = 0; i < width; ++i) {
        _ctx.moveTo(25.5 + extraPaddingX + (spacing * i), 25.5 + extraPaddingY);
        _ctx.lineTo(25.5 + extraPaddingX + (spacing * i), 475.5 - extraPaddingY);
    }
    for (var j = 0; j < height; ++j) {
        _ctx.moveTo(25.5 + extraPaddingX, 25.5 + extraPaddingY + (spacing * j));
        _ctx.lineTo(475.5 - extraPaddingX, 25.5 + extraPaddingY + (spacing * j));
    }
    _ctx.stroke();
    var image = new Image();
    image.src = _c.toDataURL();
    return image;
}
exports.getGoBoardImage = getGoBoardImage;
// Black Stone
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#000000";
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 10, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
exports.BLACK_STONE = new Image();
exports.BLACK_STONE.src = _c.toDataURL();
// White Stone
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#FFFFFF";
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 10, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
exports.WHITE_STONE = new Image();
exports.WHITE_STONE.src = _c.toDataURL();
// Black Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#FFFFFF";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 5, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
exports.BLACK_STONE_LM = new Image();
exports.BLACK_STONE_LM.src = _c.toDataURL();
// White Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 5, 0, 2 * Math.PI);
_ctx.stroke();
exports.WHITE_STONE_LM = new Image();
exports.WHITE_STONE_LM.src = _c.toDataURL();
// Black Win Line Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#FFFFFF";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 1, 0, 2 * Math.PI);
_ctx.fill();
_ctx.stroke();
exports.BLACK_STONE_WL = new Image();
exports.BLACK_STONE_WL.src = _c.toDataURL();
// White Win Line Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 1, 0, 2 * Math.PI);
_ctx.stroke();
exports.WHITE_STONE_WL = new Image();
exports.WHITE_STONE_WL.src = _c.toDataURL();
