import { Update } from "ts-turnbased";

export interface MousePosition {
  x: number;
  y: number;
}

export abstract class GUI {
  needsRedraw: boolean;
  playersToPlay: Array<number> = [];

  constructor(public canvas: HTMLCanvasElement, public playingAs: Set<number>) {
    this.canvas = canvas;
    this.canvas.addEventListener("mousemove", e => this.onMouseMoveEvent(e));
    this.canvas.addEventListener("mouseout", e => this.onMouseOutEvent(e));
    this.canvas.addEventListener("click", e => this.onMouseClickEvent(e));
  }

  private isMyTurn() {
    for (let playerToPlay of this.playersToPlay) {
      if (this.playingAs.has(playerToPlay)) {
        return true;
      }
    }
    return false;
  }

  private onMouseMoveEvent(e: MouseEvent) {
    if (this.isMyTurn()) {
      this.onMouseMove(this.getMousePosition(e));
    }
  }

  private onMouseClickEvent(e: MouseEvent) {
    if (this.isMyTurn()) {
      this.onMouseClick(this.getMousePosition(e));
    }
  }

  private onMouseOutEvent(e: MouseEvent) {
    if (this.isMyTurn()) {
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

  // Does nothing by defualt, but can be overrriden to do some clean up
  public onMoveSubmitted(): void {}

  public abstract setUpdates(updates: Array<Update<any, any>>): void
  public addUpdate(update: Update<any, any>): void {
    this.playersToPlay = update.toPlay.concat();
  }

  abstract onMouseMove(p: MousePosition): void;
  abstract onMouseClick(p: MousePosition): void;
  abstract onMouseOut(): void;

  abstract getMove(): any;
  abstract draw(): void;
}
