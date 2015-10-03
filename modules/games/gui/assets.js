var _c;
var _ctx;

// Board Background
_c = document.createElement("canvas");
_c.width = _c.height = 500;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#DDAA77";
_ctx.fillRect(0, 0, 500, 500);

_ctx.lineWidth = 1;
_ctx.strokeStyle = "black";
_ctx.lineCap = "round";
_ctx.beginPath();
for (var i = 0; i < 19; ++i) {
  _ctx.moveTo(25.5 + (25 * i), 25.5);
  _ctx.lineTo(25.5 + (25 * i), 475.5);
}
for (var j = 0; j < 19; ++j) {
  _ctx.moveTo(25.5, 25.5 + (25 * j));
  _ctx.lineTo(475.5, 25.5 + (25 * j));
}
_ctx.stroke();    
    
exports.GO_BOARD = new Image();
exports.GO_BOARD.src = _c.toDataURL();

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