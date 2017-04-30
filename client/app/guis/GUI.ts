import { Update } from "ts-turnbased";

export interface MousePosition {
  x: number;
  y: number;
}

export abstract class GUI {
  needsRedraw: boolean;
  canvas: HTMLCanvasElement;
  isMyTurn: boolean;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.canvas.addEventListener("mousemove", e => this.onMouseMoveEvent(e));
    this.canvas.addEventListener("mouseout", e => this.onMouseOutEvent(e));
    this.canvas.addEventListener("click", e => this.onMouseClickEvent(e));
  }

  private onMouseMoveEvent(e: MouseEvent) {
    if (this.isMyTurn) {
      this.onMouseMove(this.getMousePosition(e));
    }
  }

  private onMouseClickEvent(e: MouseEvent) {
    if (this.isMyTurn) {
      this.onMouseClick(this.getMousePosition(e));
    }
  }

  private onMouseOutEvent(e: MouseEvent) {
    if (this.isMyTurn) {
      this.onMouseOut();
    }
  }

  // Utitlity method to get the mouse's position on the canvas even if the canvas gets resized.
  protected getMousePosition(e: MouseEvent): MousePosition {
    let rect: ClientRect = this.canvas.getBoundingClientRect();

    let actualX: number = e.clientX - rect.left;
    let actualY: number = e.clientY - rect.top;
    let ratio: number = 500 / (rect.right - rect.left);
    return {x: actualX * ratio, y: actualY * ratio};
  };

  abstract setUpdates(events: Array<Update>): void;
  abstract addUpdate(event: Update): void;

  abstract onMouseMove(p: MousePosition): void;
  abstract onMouseClick(p: MousePosition): void;
  abstract onMouseOut(): void;

  abstract getMove(): any;
  abstract draw(): void;
}