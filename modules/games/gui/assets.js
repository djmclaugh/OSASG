var _c;
var _ctx;

// Hex Board
HEX_BOARDS = {};

exports.getHexBoard = function(size) {
  if (HEX_BOARDS[size]) {
    return HEX_BOARDS[size];
  }
  var c = document.createElement("canvas");
  c.width = c.height = 500;
  ctx = c.getContext("2d");
  ctx.fillStyle = "#DDDDDD";
  ctx.fillRect(0, 0, 500, 500);

  ctx.lineWidth = 1;
  ctx.strokeStyle = "black";
  ctx.lineCap = "round";
  ctx.beginPath();

  var center = size / 2;
  var radius = 160 / size;
  for (var i = 0; i < size; ++i) {
    for (var j = 0; j < size; ++j) {
      var isRed = i == 0 || i == size - 1;
      var isBlue = j == 0 || j == size - 1;
      if (isRed && isBlue) {
        ctx.fillStyle = "#FFF5FF";
      } else if (isRed) {
        ctx.fillStyle = "#FFF5F5";
      } else if (isBlue) {
        ctx.fillStyle = "#F5F5FF";
      } else {
        ctx.fillStyle = "#F5F5F5";  
      }
      var centerX = i + 0.5 - center;
      centerX += (j + 0.5 - center) / 2
      var centerY = j + 0.5 - center;

      var actualCenterX = 250 + 2 * radius * centerX;
      var actualCenterY = 250 + 0.87 * 2 * radius * centerY;

      ctx.beginPath();
      ctx.arc(actualCenterX, actualCenterY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    }
  }

  var image = new Image();
  image.src = c.toDataURL();
  HEX_BOARDS[size] = image;
  return HEX_BOARDS[size];
};

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

// Tictactoe Board
_c = document.createElement("canvas");
_c.width = _c.height = 500;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#FFFFFF";
_ctx.fillRect(0, 0, 500, 500);

_ctx.lineWidth = 2;
_ctx.strkeStyle = "black";
_ctx.lineCap = "round";
_ctx.beginPath();
for (var i = 0; i < 4; ++i) {
  _ctx.moveTo(25 + (150 * i), 25);
  _ctx.lineTo(25 + (150 * i), 475);
}
for (var j = 0; j < 4; ++j) {
  _ctx.moveTo(25, 25 + (150 * j));
  _ctx.lineTo(475, 25 + (150 * j));
}

_ctx.stroke();

exports.TICTACTOE_BOARD = new Image();
exports.TICTACTOE_BOARD.src = _c.toDataURL();

// Hex Stone Red
HEX_RED_STONES = {};

exports.getHexRedStone = function(size) {
  if (HEX_RED_STONES[size]) {
    return HEX_RED_STONES[size];
  }
  var radius = 120/size;
  c = document.createElement("canvas");
  c.width = c.height = 2*radius + 6;
  ctx = c.getContext("2d");
  ctx.fillStyle = "#FF0000";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.arc(radius + 3, radius + 3, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  var image = new Image();
  image.src = c.toDataURL();
  HEX_RED_STONES[size] = image;
  return HEX_RED_STONES[size];
};

// Hex Stone Red
HEX_BLUE_STONES = {};

exports.getHexBlueStone = function(size) {
  if (HEX_BLUE_STONES[size]) {
    return HEX_BLUE_STONES[size];
  }
  var radius = 120/size;
  c = document.createElement("canvas");
  c.width = c.height = 2*radius + 6;
  ctx = c.getContext("2d");
  ctx.fillStyle = "#0000FF";
  ctx.lineWidth = 1;
  ctx.strokeStyle = "#000000";
  ctx.beginPath();
  ctx.arc(radius + 3, radius + 3, radius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
  var image = new Image();
  image.src = c.toDataURL();
  HEX_BLUE_STONES[size] = image;
  return HEX_BLUE_STONES[size];
};

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

// X
_c = document.createElement("canvas");
_c.width = _c.height = 148;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 5;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.moveTo(15, 15);
_ctx.lineTo(135, 135);
_ctx.moveTo(15, 135);
_ctx.lineTo(135, 15);
_ctx.stroke();

exports.X = new Image();
exports.X.src = _c.toDataURL();

// O
_c = document.createElement("canvas");
_c.width = _c.height = 148;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 5;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(75, 75, 60, 0, 2 * Math.PI);
_ctx.stroke();

exports.O = new Image();
exports.O.src = _c.toDataURL();

// Tictactoe Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 148;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#555555";
_ctx.beginPath();
_ctx.moveTo(5.5, 5.5);
_ctx.lineTo(5.5, 144.5);
_ctx.lineTo(144.5, 144.5);
_ctx.lineTo(144.5, 5.5);
_ctx.lineTo(5.5, 5.5);
_ctx.stroke();

exports.BOX_HIGHLIGHT_2 = new Image();
exports.BOX_HIGHLIGHT_2.src = _c.toDataURL();

// Tictactoe Win Line Markup
_c = document.createElement("canvas");
_c.width = _c.height = 148;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#555555";
_ctx.beginPath();
_ctx.moveTo(65.5, 65.5);
_ctx.lineTo(65.5, 84.5);
_ctx.lineTo(84.5, 84.5);
_ctx.lineTo(84.5, 65.5);
_ctx.lineTo(65.5, 65.5);
_ctx.stroke();

exports.BOX_HIGHLIGHT_1 = new Image();
exports.BOX_HIGHLIGHT_1.src = _c.toDataURL();

// Hex Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 14;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(7.5, 7.5, 3, 0, 2 * Math.PI);
_ctx.stroke();

exports.HEX_HIGHLIGHT_1 = new Image();
exports.HEX_HIGHLIGHT_1.src = _c.toDataURL();

// Hex Win Line Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 1;
_ctx.strokeStyle = "#FFFFFF";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 5, 0, 2 * Math.PI);
_ctx.stroke();

exports.HEX_HIGHLIGHT_2 = new Image();
exports.HEX_HIGHLIGHT_2.src = _c.toDataURL();

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
