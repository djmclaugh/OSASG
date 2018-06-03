let _c: HTMLCanvasElement;
let _ctx: CanvasRenderingContext2D;

export function getGoBoardImage(width: number, height: number): HTMLImageElement {
  _c = document.createElement("canvas");
  _c.width = _c.height = 500;
  _ctx = _c.getContext("2d");
  _ctx.fillStyle = "#DDAA77";
  _ctx.fillRect(0, 0, 500, 500);

  _ctx.lineWidth = 1;
  _ctx.strokeStyle = "black";
  _ctx.lineCap = "round";
  _ctx.beginPath();
  let max: number = Math.max(width, height);
  let spacing: number = 25;
  let extraPaddingX = (19 - width) * spacing / 2
  let extraPaddingY = (19 - height) * spacing / 2
  for (var i = 0; i < width; ++i) {
    _ctx.moveTo(25.5 + extraPaddingX + (spacing * i), 25.5 + extraPaddingY);
    _ctx.lineTo(25.5 + extraPaddingX + (spacing * i), 475.5 - extraPaddingY);
  }
  for (var j = 0; j < height; ++j) {
    _ctx.moveTo(25.5 + extraPaddingX, 25.5 + extraPaddingY + (spacing * j));
    _ctx.lineTo(475.5 - extraPaddingX, 25.5 + extraPaddingY + (spacing * j));
  }
  _ctx.stroke();
  let image: HTMLImageElement = new Image();
  image.src = _c.toDataURL();
  return image;
}


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

export const BLACK_STONE: HTMLImageElement = new Image();
BLACK_STONE.src = _c.toDataURL();

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

export const WHITE_STONE: HTMLImageElement = new Image();
WHITE_STONE.src = _c.toDataURL();

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

export const BLACK_STONE_LM = new Image();
BLACK_STONE_LM.src = _c.toDataURL();

// White Last Move Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 5, 0, 2 * Math.PI);
_ctx.stroke();

export const WHITE_STONE_LM = new Image();
WHITE_STONE_LM.src = _c.toDataURL();

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

export const BLACK_STONE_WL = new Image();
BLACK_STONE_WL.src = _c.toDataURL();

// White Win Line Markup
_c = document.createElement("canvas");
_c.width = _c.height = 24;
_ctx = _c.getContext("2d");
_ctx.lineWidth = 2;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.arc(12.5, 12.5, 1, 0, 2 * Math.PI);
_ctx.stroke();

export const WHITE_STONE_WL = new Image();
WHITE_STONE_WL.src = _c.toDataURL();

// Card Back
_c = document.createElement("canvas");
_c.height = 100;
_c.width = 70;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#888888";
_ctx.lineWidth = 3;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.rect(0, 0, _c.width, _c.height);
_ctx.fill();
_ctx.stroke();

export const CARD_BACK: HTMLImageElement = new Image();
CARD_BACK.src = _c.toDataURL();

// Card Front
_c = document.createElement("canvas");
_c.height = 100;
_c.width = 70;
_ctx = _c.getContext("2d");
_ctx.fillStyle = "#FFFFFF";
_ctx.lineWidth = 3;
_ctx.strokeStyle = "#000000";
_ctx.beginPath();
_ctx.rect(0, 0, _c.width, _c.height);
_ctx.fill();
_ctx.stroke();

export const CARD_FRONT: HTMLImageElement = new Image();
CARD_FRONT.src = _c.toDataURL();

// Spades suit
export const SPADES: HTMLImageElement = new Image();
SPADES.src = "assets/cards/spades.svg";

// Spades suit
export const CLUBS: HTMLImageElement = new Image();
CLUBS.src = "assets/cards/clubs.svg";

// Spades suit
export const HEARTS: HTMLImageElement = new Image();
HEARTS.src = "assets/cards/hearts.svg";

// Spades suit
export const DIAMONDS: HTMLImageElement = new Image();
DIAMONDS.src = "assets/cards/diamonds.svg";


export function cardImage(text: string, suit: HTMLImageElement): HTMLImageElement {
  let c = document.createElement("canvas");
  c.height = 100;
  c.width = 70;
  let ctx = c.getContext("2d");
  ctx.font = "14px Consolas";
  ctx.fillStyle = "#000000";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.drawImage(CARD_FRONT, 0, 0);
  ctx.drawImage(suit, 6, 18, 12, 12);
  ctx.fillText(text, 6 + (12 / 2), 2);

  ctx.font = "bold 18px Consolas";
  ctx.textBaseline = "bottom";
  ctx.drawImage(suit, 35 - 10, 60 - 11, 20, 20);
  ctx.fillText(text, 35, 60 - 9);

  ctx.translate(70, 100);
  ctx.rotate(Math.PI);

  ctx.font = "14px Consolas";
  ctx.textBaseline = "top";
  ctx.drawImage(suit, 6, 18, 12, 12);
  ctx.fillText(text, 6 + (12 / 2), 2);

  ctx.fill();
  ctx.stroke();

  let image: HTMLImageElement = new Image();
  image.src = c.toDataURL();
  return image;
}
