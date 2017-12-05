import { Update } from "ts-turnbased";
import { Connect, ConnectOptions, Coordinate, ConnectMove, connect6Options, sanitizeOptions, tictactoeOptions } from "ts-turnbased-connect";

import { getGoBoardImage, BLACK_STONE, WHITE_STONE, BLACK_STONE_LM, BLACK_STONE_WL, WHITE_STONE_LM, WHITE_STONE_WL } from "./assets";
import { GUI, MousePosition } from "./GUI";

export class ConnectGUI extends GUI {
  playedMoves: Array<ConnectMove>;
  options: ConnectOptions;
  background: HTMLImageElement;
  mouseTarget: Coordinate;
  presets: Array<Coordinate>;
  game: Connect;

  constructor(gameName: string, options: any, canvas: HTMLCanvasElement, asPlayers: Set<number>) {
    super(canvas, asPlayers);
    if (gameName == "tictactoe") {
      this.options = sanitizeOptions(tictactoeOptions());
    } else if (gameName == "connect6") {
      this.options = sanitizeOptions(connect6Options(options.boardWidth, options.boardHeight));
    } else {
      this.options = sanitizeOptions(options);
    }
    this.background = getGoBoardImage(this.options.boardWidth, this.options.boardHeight);
    this.playedMoves = new Array<ConnectMove>();
    this.mouseTarget = null;
    this.presets = new Array<Coordinate>();
  }

  setUpdates(updates: Array<Update>) {
    // Ignore the empty "game start" event;
    this.playedMoves = new Array<ConnectMove>();
    this.game = new Connect(this.options);
    this.game.start();
    for (let i: number = 1; i < updates.length; ++i) {
      this.addUpdate(updates[i]);
    }
    this.presets = new Array<Coordinate>();
    this.mouseTarget = null;
    this.needsRedraw = true;
  }

  addUpdate(update: Update) {
    let move: ConnectMove = update.publicInfo;
    if (move == null) {
      return;
    }
    this.game.playMove(move, this.playedMoves.length % 2);
    this.playedMoves.push(move);
    this.presets = new Array<Coordinate>();
    this.mouseTarget = null;
    this.needsRedraw = true;
  };

  onMouseMove(p: MousePosition): void {
    let c: Coordinate = this.getMouseTarget(p);
    if (!this.isSameCoordinate(this.mouseTarget, c)) {
      this.needsRedraw = true;
    }
    this.mouseTarget = c;
  }

  onMouseClick(p: MousePosition): void {
    this.onMouseMove(p);
    if (!this.mouseTarget) {
      return;
    }
    let index: number = this.indexInPresets(this.mouseTarget);
    if (index == -1) {
      this.presets.push(this.mouseTarget);
    } else {
      this.presets.splice(index, 1);
    }
    this.mouseTarget = null;
    this.needsRedraw = true;
  }

  onMouseOut(): void {
    if (this.mouseTarget != null) {
      this.needsRedraw = true;
    }
    this.mouseTarget = null;
  }

  getMove(): ConnectMove {
    if (this.hasEnoughPresets()) {
      return this.presets;
    }
    return null;
  }

  hasEnoughPresets(): boolean {
    if (this.playedMoves.length == 0) {
      return this.presets.length == this.options.q;
    }
    let spacesLeft: number = this.options.boardWidth * this.options.boardHeight;
    spacesLeft -= (this.playedMoves.length - 1) * this.options.p;
    spacesLeft -= this.options.q;
    return this.presets.length == Math.min(this.options.p, spacesLeft);
  }

  draw(): void {
    this.needsRedraw = false;
    let context: CanvasRenderingContext2D = this.canvas.getContext("2d");
    context.drawImage(this.background, 0, 0);
    for (let i: number = 0; i < this.playedMoves.length; ++i) {
      let move: ConnectMove = this.playedMoves[i];
      let image: HTMLImageElement = i % 2 == 0 ? BLACK_STONE : WHITE_STONE;
      let coordinates: Array<Coordinate> = Array.isArray(move) ? move : [move];
      for (let c of coordinates) {
        this.drawImageAtCoordinate(image, c, context);
      }
    }
    let image: HTMLImageElement = this.playedMoves.length % 2 == 0 ? BLACK_STONE : WHITE_STONE;
    for (let c of this.presets) {
      this.drawImageAtCoordinate(image, c, context, 0.5);
    }
    if (this.mouseTarget) {
      this.drawImageAtCoordinate(image, this.mouseTarget, context, 0.2);
    }
    if (this.playedMoves.length > 0) {
      let lastMoveImage: HTMLImageElement =
          this.playedMoves.length % 2 == 0 ? WHITE_STONE_LM : BLACK_STONE_LM;
      let lastMove: ConnectMove = this.playedMoves[this.playedMoves.length - 1];
      let coordinates: Array<Coordinate> = Array.isArray(lastMove) ? lastMove : [lastMove];
      for (let c of coordinates) {
        this.drawImageAtCoordinate(lastMoveImage, c, context);
      }
    }
    let winLine: Array<Coordinate> = this.game.getWinLine();
    if (winLine) {
      let winLineImage: HTMLImageElement =
          this.playedMoves.length % 2 == 0 ? WHITE_STONE_WL : BLACK_STONE_WL;
      for (let c of winLine) {
        this.drawImageAtCoordinate(winLineImage, c, context);
      }
    }
  }

  drawImageAtCoordinate(
      image: HTMLImageElement,
      c: Coordinate,
      ctx: CanvasRenderingContext2D,
      alpha: number = 1): void {
    ctx.save();
    ctx.globalAlpha *= alpha;
    let p: MousePosition = this.coordinateToPosition(c);
    ctx.drawImage(image, p.x, p.y);
    ctx.restore();
  }

  mousePositionToCoordinate(p: MousePosition): Coordinate {
    return {
      x: Math.round(((p.x - 25) / 25) - ((19 - this.options.boardWidth) / 2)),
      y: Math.round(((p.y - 25) / 25) - ((19 - this.options.boardHeight) / 2))
    };
  }

  coordinateToPosition(c: Coordinate): MousePosition {
    return {
      x: 13 + ((c.x + ((19 - this.options.boardWidth) / 2)) * 25),
      y: 13 + ((c.y + ((19 - this.options.boardHeight) / 2)) * 25)
    };
  }

  isValidCoordinate(c: Coordinate): boolean {
    return c.x >= 0 && c.x < this.options.boardWidth && c.y >= 0 && c.y < this.options.boardHeight;
  }

  isOccupiedCoordinate(c: Coordinate): boolean {
    for (let move of this.playedMoves) {
      let coordinates: Array<Coordinate> = Array.isArray(move) ? move : [move];
      for (let occupied of coordinates) {
        if (this.isSameCoordinate(c, occupied)) {
          return true;
        }
      }
    }
    return false;
  }

  indexInPresets(c: Coordinate): number {
    for (let i = 0; i < this.presets.length; ++i) {
      if (this.isSameCoordinate(c, this.presets[i])) {
        return i;
      }
    }
    return -1;
  }

  isSameCoordinate(c1: Coordinate, c2: Coordinate): boolean {
    if (c1 == c2) {
      return true;
    }
    if (!c1 || !c2) {
      return false;
    }
    return c1.x == c2.x && c1.y == c2.y;
  }

  getMouseTarget(p: MousePosition): Coordinate {
    let c: Coordinate = this.mousePositionToCoordinate(p);
    if (!this.isValidCoordinate(c) || this.isOccupiedCoordinate(c)) {
      c = null;
    }
    if (c && this.indexInPresets(c) == -1 && this.hasEnoughPresets()) {
      c = null;
    }
    return c;
  }
}
