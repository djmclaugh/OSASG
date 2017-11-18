import { Update } from "ts-turnbased";
import { NormalFormGame, NormalFormOptions, roshamboPayoffTensor } from "ts-turnbased-normalform";

import { GUI, MousePosition } from "./GUI";

type RoshamboMove = 0|1|2;
type RoshamboTurn = [RoshamboMove, RoshamboMove];

function nameForMove(move: RoshamboMove): string {
  switch(move) {
    case 0:
      return "Rock";
    case 1:
      return "Paper";
    case 2:
      return "Scissors"
  }
}

function stringForTurn(turn: RoshamboTurn): string {
  return nameForMove(turn[0]) + " - " + nameForMove(turn[1]);
}

function pointsForPlayerForTurn(player:0|1, turn: RoshamboTurn): number {
  let difference = (3 + (turn[1] - turn[0])) % 3;
  return (difference == 2 && player == 0) || (difference == 1 && player == 1) ? 1 : 0;
}

type MouseTarget = {
  player: 0|1,
  move: RoshamboMove
}

function areSameTarget(target1: MouseTarget, target2: MouseTarget): boolean {
  if (!target1 || !target2) {
    return target1 == target2;
  }
  return target1.player == target2.player && target1.move == target2.move;
}

export class RoshamboGUI extends GUI {
  playedMoves: Array<RoshamboTurn>;
  numRounds: number;
  mouseTarget: MouseTarget;
  preset: MouseTarget;
  points: [number, number];

  constructor(options: any, canvas: HTMLCanvasElement, asPlayers: Set<number>) {
    super(canvas, asPlayers);
    this.numRounds = options.numRounds;
    this.playedMoves = [];
    this.mouseTarget = null;
    this.preset = null;
    this.points = [0, 0];
  }

  playerToPlay(): -1|0|1 {
    if (this.playersToPlay.indexOf(0) != -1 && this.playingAs.has(0)) {
      return 0;
    } else if (this.playersToPlay.indexOf(1) != -1 && this.playingAs.has(1)) {
      return 1;
    }
    return -1;
  }

  onMoveSubmitted(): void {
    this.preset = null;
    this.mouseTarget = null;
    this.needsRedraw = true;
  }

  setUpdates(updates: Array<Update>) {
    this.playedMoves = [];
    this.preset = null;
    this.mouseTarget = null;
    this.needsRedraw = true;
    this.points = [0, 0];
    // Ignore the empty "game start" event;
    for (let i: number = 1; i < updates.length; ++i) {
      this.addUpdate(updates[i]);
    }
  }

  addUpdate(update: Update) {
    let turn: RoshamboTurn = update.publicInfo;
    this.points[0] += pointsForPlayerForTurn(0, turn);
    this.points[1] += pointsForPlayerForTurn(1, turn);
    this.playedMoves.push(turn);
    this.preset = null;
    this.mouseTarget = null;
    this.needsRedraw = true;
  };

  onMouseMove(p: MousePosition): void {
    let target: MouseTarget = this.mousePositionToTarget(p);
    if (areSameTarget(target, this.mouseTarget)) {
      this.needsRedraw = true;
    }
    this.mouseTarget = target;
  }

  onMouseClick(p: MousePosition): void {
    this.onMouseMove(p);
    if (!this.mouseTarget) {
      return;
    }
    if (areSameTarget(this.mouseTarget, this.preset)) {
      this.preset = null;
    } else {
      this.preset = this.mouseTarget;
    }
    this.needsRedraw = true;
  }

  onMouseOut(): void {
    if (this.mouseTarget != null) {
      this.needsRedraw = true;
    }
    this.mouseTarget = null;
  }

  getMove(): RoshamboMove {
    if (this.preset) {
      return this.preset.move;
    }
    return null;
  }

  colourForMove(move: RoshamboMove): string {
    let isPreset: boolean = this.preset && this.preset.move == move;
    let isMouseOver: boolean = this.mouseTarget && this.mouseTarget.move == move;
    if (isPreset && isMouseOver) {
      return "#bbbbbb";
    } else if (isPreset && !isMouseOver) {
      return "#aaaaaa";
    } else if (!isPreset && isMouseOver) {
      return "#eeeeee";
    } else {
      return "#ffffff";
    }
  }

  draw(): void {
    this.needsRedraw = false;
    let context: CanvasRenderingContext2D = this.canvas.getContext("2d");

    context.beginPath();
    context.fillStyle = "#ffffff";
    context.rect(0, 0, 500, 500);
    context.fill();

    context.fillStyle = "#000000";
    context.textAlign = "left";
    context.fillText("" + this.points[0], 25, 50);
    context.textAlign = "center";
    context.fillText(this.playedMoves.length + "/" + this.numRounds, 250, 50);
    context.textAlign = "right";
    context.fillText("" + this.points[1], 475, 50);

    if (this.playedMoves.length > 0) {
      let lastTurn: RoshamboTurn = this.playedMoves[this.playedMoves.length - 1];
      context.textAlign = "center";
      context.fillText("Last Turn:", 250, 100);
      context.fillText(stringForTurn(lastTurn) , 250, 120);
    }

    let colour: string;
    if (this.playerToPlay() == 0) {
      this.drawButtonAtCoordinate("Rock", 25, 300, this.colourForMove(0), context);
      this.drawButtonAtCoordinate("Paper", 25, 350, this.colourForMove(1), context);
      this.drawButtonAtCoordinate("Scissors", 25, 400, this.colourForMove(2), context);
    } else if (this.playerToPlay() == 1) {
      this.drawButtonAtCoordinate("Rock", 275, 300, this.colourForMove(0), context);
      this.drawButtonAtCoordinate("Paper", 275, 350, this.colourForMove(1), context);
      this.drawButtonAtCoordinate("Scissors", 275, 400, this.colourForMove(2), context);
    }
  }

  drawButtonAtCoordinate(title: string, x: number, y: number, colour: string, ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.beginPath();
    ctx.fillStyle = colour;
    ctx.rect(x, y, 200, 50);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = "center";
    ctx.fillStyle = "#000000";
    ctx.fillText(title, x + 100, y + 30);
    ctx.restore();
  }

  mousePositionToTarget(p: MousePosition): MouseTarget {
    let player: 0|1;
    let move: 0|1|2;
    if (p.x >= 25 && p.x <= 225 && this.playerToPlay() == 0) {
      player = 0;
    } else if (p.x >= 275 && p.x <= 475 && this.playerToPlay() == 1) {
      player = 1;
    } else {
      return null;
    }
    if (p.y > 300 && p.y < 350) {
      move = 0;
    } else if (p.y > 350 && p.y < 400) {
      move = 1;
    } else if (p.y > 400 && p.y < 450) {
      move = 2;
    } else {
      return null;
    }
    return {
      player: player,
      move: move
    }
  }
}
