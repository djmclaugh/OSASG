import { PublicUpdate } from "ts-turnbased";
import { OhHell, OhHellUpdate, OhHellMove, OhHellOptions, Rank, Suit, Card, indexOfCard } from "ts-turnbased-ohhell";

import { CARD_BACK, CARD_FRONT, cardImage, HEARTS, SPADES, DIAMONDS, CLUBS } from "./assets";
import { GUI, MousePosition } from "./GUI";

const CARD_WIDTH = CARD_BACK.width;
const CARD_HEIGHT = CARD_BACK.height;

const NUMBER_DIMENSIONS = 16;

interface CardImageOptions {
  higlighted: boolean,
  hidden: boolean
}

interface Position {
  x: number,
  y: number
}

interface ClickableCard {
  card: Card,
  position: Position
}

interface ClickableNumber {
  value: number,
  position: Position
}

function isOnCard(position: Position, card: ClickableCard) {
  let xOK: boolean = position.x > card.position.x && position.x < card.position.x + CARD_WIDTH;
  let yOK: boolean = position.y > card.position.y && position.y < card.position.y + CARD_HEIGHT;
  return xOK && yOK;
}

function isOnNumber(position: Position, number: ClickableNumber) {
  let xOK: boolean = position.x > number.position.x && position.x < number.position.x + NUMBER_DIMENSIONS;
  let yOK: boolean = position.y > number.position.y && position.y < number.position.y + NUMBER_DIMENSIONS;
  return xOK && yOK;
}

function nullArrayOfSize(size: number): Array<any> {
  let array: Array<any> = [];
  for (let i = 0; i < size; ++i)  {
    array.push(null);
  }
  return array;
}

const SUIT_ORDERING = ["C", "D", "S", "H"];

function sortedHand(hand: Array<Card>): Array<Card> {
  hand.sort((a: Card, b: Card) => {
    let suitOrdering: number = SUIT_ORDERING.indexOf(a.suit) - SUIT_ORDERING.indexOf(b.suit)
    if (suitOrdering != 0) {
      return suitOrdering;
    }
    return a.rank - b.rank;
  })
  return hand;
}

function cardRankToText(rank: number): string {
  switch(rank) {
    case 11:
      return "J";
    case 12:
      return "Q";
    case 13:
      return "K";
    case 14:
      return "A";
    default:
      return "" + rank;
  }
}

let ALL_CARDS: Map<Rank, Map<Suit, HTMLImageElement>> = null;

export class OhHellGUI extends GUI {
  private static loadCards() {
    if (ALL_CARDS == null) {
      ALL_CARDS = new Map();
      for (let r: Rank = 2; r <= 14; ++r) {
        ALL_CARDS.set(<Rank>r, new Map());
        ALL_CARDS.get(<Rank>r).set("H", cardImage(cardRankToText(r), HEARTS));
        ALL_CARDS.get(<Rank>r).set("D", cardImage(cardRankToText(r), DIAMONDS));
        ALL_CARDS.get(<Rank>r).set("C", cardImage(cardRankToText(r), CLUBS));
        ALL_CARDS.get(<Rank>r).set("S", cardImage(cardRankToText(r), SPADES));
      }
    }
  }

  updates: Array<OhHellUpdate>;
  hands: Array<Array<Card>> = null;
  scores: Array<number> = null;
  bids: Array<number> = null;
  tricksTaken: Array<number> = null;
  revealedCard: Card;
  trickStarter: number;
  lastTrickStarter: number;
  currentTrick: Array<Card> = null;
  lastTrick: Array<Card> = null;
  options: OhHellOptions;
  bidPhase: boolean;
  toPlay: number;

  clickableCards: Array<ClickableCard> = [];
  clickableBids: Array<ClickableNumber> = [];

  selectedCard: Card = null;
  selectedBid: number = -1;

  constructor(options: OhHellOptions, canvas: HTMLCanvasElement, asPlayers: Set<number>) {
    super(canvas, asPlayers);
    this.options = options;
    OhHellGUI.loadCards();
  }

  setUpdates(updates: Array<OhHellUpdate>) {
    this.updates = [];
    this.scores = [];
    for (let i = 0; i < this.options.numberOfPlayers; ++i) {
      this.scores.push(0);
    }
    for (let update of updates) {
      this.addUpdate(update);
    }
    this.needsRedraw = true;
  }

  addUpdate(update: OhHellUpdate) {
    console.log(update);
    super.addUpdate(update);
    this.updates.push(update);

    this.bidPhase = false;

    if (update.publicInfo.cardPlayed !== undefined) {
      if (this.hands[this.toPlay][0] === null) {
        this.hands[this.toPlay].pop();
      } else {
        let index: number = indexOfCard(this.hands[this.toPlay], update.publicInfo.cardPlayed);
        this.hands[this.toPlay].splice(index, 1);
      }
      this.currentTrick.push(update.publicInfo.cardPlayed);
      this.toPlay = this.nextPlayer(this.toPlay);
    }

    if (update.publicInfo.trickWinner !== undefined) {
      this.lastTrick = this.currentTrick;
      this.lastTrickStarter = this.trickStarter;
      this.trickStarter = update.publicInfo.trickWinner;
      this.tricksTaken[update.publicInfo.trickWinner] += 1;
      this.currentTrick = [];
      this.toPlay = this.trickStarter;
    }

    if (update.publicInfo.points !== undefined) {
      this.scores = update.publicInfo.points;
    }

    if (update.publicInfo.newHandInfo !== undefined) {
      if (update.privateInfo) {
        this.hands = update.privateInfo.map((hand: Array<Card>) => {
          return hand ?  sortedHand(hand) : nullArrayOfSize(update.publicInfo.newHandInfo.handSize);
        });
      } else {
        this.hands = [];
        for (let i = 0; i < this.options.numberOfPlayers; ++i) {
          this.hands.push(nullArrayOfSize(update.publicInfo.newHandInfo.handSize));
        }
      }
      this.revealedCard = update.publicInfo.newHandInfo.revealedCard;
      this.trickStarter = this.nextPlayer(update.publicInfo.newHandInfo.dealer);
      this.bidPhase = true;
    }

    if (update.publicInfo.bids !== undefined) {
      this.currentTrick = [];
      this.tricksTaken = [];
      this.bids = [];
      for (let i = 0; i < this.options.numberOfPlayers; ++i) {
        this.tricksTaken.push(0);
        this.bids.push(update.publicInfo.bids[i]);
      }
      this.toPlay = this.trickStarter;
    }

    this.selectedCard = null;
    this.needsRedraw = true;
  }

  onMouseMove(p: MousePosition): void {}

  onMouseClick(p: MousePosition): void {
    this.onMouseMove(p);
    if (this.bidPhase) {
      for (let i = this.clickableBids.length - 1; i >= 0; --i) {
        if (isOnNumber(p, this.clickableBids[i])) {
          if (this.clickableBids[i].value == this.selectedBid) {
            this.selectedBid = -1;
          } else {
            this.selectedBid = this.clickableBids[i].value;
          }
          this.needsRedraw = true;
          break;
        }
      }
    } else {
      for (let i = this.clickableCards.length - 1; i >= 0; --i) {
        if (isOnCard(p, this.clickableCards[i])) {
          if (this.clickableCards[i].card == this.selectedCard) {
            this.selectedCard = null;
          } else {
            this.selectedCard = this.clickableCards[i].card;
          }
          this.needsRedraw = true;
          break;
        }
      }
    }
  }

  onMouseOut(): void {}

  getMove(): OhHellMove {
    if (this.selectedBid != -1) {
      return {
        bid: this.selectedBid
      };
    } else if (this.selectedCard) {
      return {
        card: this.selectedCard
      };
    }
    return null;
  }

  onMoveSubmitted(): void {
    this.selectedCard = null;
    this.selectedBid = -1;
    this.needsRedraw = true;
  }

  draw(): void {
    this.needsRedraw = false;
    this.clickableCards = [];
    this.clickableBids = [];
    let context: CanvasRenderingContext2D = this.canvas.getContext("2d");

    context.beginPath();
    context.fillStyle = "#99DD99";
    context.fillRect(0, 0, 500, 500);
    context.fill();

    context.beginPath();
    context.fillStyle = "#CCFFCC";
    context.fillRect(400, 400, 100, 100);
    context.fill();

    context.beginPath();
    context.fillStyle = "#CCFFCC";
    context.fillRect(0, 0, 150, 150);
    context.fill();


    if (this.updates.length == 0) {
      // Draw waiting for players screen
    } else {
      this.drawTurnArrow(context);
      this.drawHands(context);
      this.drawTrick(context);
      this.drawRevealedCard(context);
      this.drawDetails(context);
      this.drawBidOptions(context);
      this.drawLastTrick(context);
    }
  }

  drawTurnArrow(context: CanvasRenderingContext2D): void {
    context.save();
    let player = this.bidPhase ? this.trickStarter : this.toPlay;
    context.strokeStyle = "black";
    context.beginPath();
    if (player == 0) {
      let height: number = 500 - 20 - CARD_HEIGHT - 20;
      context.moveTo(250, height);
      context.lineTo(250, height - 10);
    } else if (player == 1) {
      let width: number = 20 + CARD_WIDTH + 15;
      context.moveTo(width, 250);
      context.lineTo(width + 10, 250);
    } else if (player == 2) {
      let height: number = 20 + CARD_HEIGHT + 20;
      context.moveTo(250, height);
      context.lineTo(250, height + 10);
    } else if (player == 3) {
      let width: number = 500 -20 - CARD_WIDTH - 15;
      context.moveTo(width, 250);
      context.lineTo(width - 10, 250);
    }
    context.stroke();
    context.restore();
  }

  drawHands(context: CanvasRenderingContext2D): void {
    for (let i = 0; i < this.options.numberOfPlayers; ++i) {
      for (let j = 0; j < this.hands[i].length; ++j) {
        let position: Position = this.positionForCard(i, j);
        let card: Card = this.hands[i][j];
        let state: number = 0;
        if (!this.bidPhase && this.toPlay == i && this.playingAs.has(i)) {
          if (this.isCardLegalForPlayer(card, i)) {
            state = this.selectedCard == card ? 2 : 1;
          }
        }
        this.drawCard(card, position.x, position.y, context, state);
      }
    }
  }

  isCardLegalForPlayer(card: Card, player: number) {
    if (!this.currentTrick || this.currentTrick.length == 0 || this.currentTrick.length == this.options.numberOfPlayers) {
      return true;
    }
    let leadingSuit: Suit = this.currentTrick[0].suit;
    if (card.suit == leadingSuit) {
      return true;
    }
    for (let cardInHand of this.hands[player]) {
      if (leadingSuit == cardInHand.suit) {
        return false;
      }
    }
    return true;
  }

  drawTrick(context: CanvasRenderingContext2D): void {
    if (this.currentTrick) {
      for (let i = 0; i < this.currentTrick.length; ++i) {
        let position: Position = this.positionForCard(-1, (this.trickStarter + i) % this.options.numberOfPlayers);
        let card: Card = this.currentTrick[i];
        this.drawCard(card, position.x, position.y, context);
      }
    }
  }

  drawLastTrick(context: CanvasRenderingContext2D): void {
    if (this.lastTrick) {
      context.save();
      context.scale(0.7, 0.7);
      for (let i = 0; i < this.lastTrick.length; ++i) {
        let position: Position = this.positionForCard(-1, (this.lastTrickStarter + i) % this.options.numberOfPlayers);
        let card: Card = this.lastTrick[i];
        this.drawCard(card, position.x - 110, position.y - 120, context);
      }
      context.restore();
    }
  }

  drawRevealedCard(context: CanvasRenderingContext2D): void {
    context.save();
    context.scale(0.7, 0.7);
    this.drawCard(this.revealedCard, 10, 10, context);
    context.restore();
  }

  drawCard(card: Card, x: number, y: number, context: CanvasRenderingContext2D, state: number = 0): void {
    context.save();
    let image: HTMLImageElement;
    if (!card) {
      image = CARD_BACK
    } else {
      if (state != 0) {
        this.clickableCards.push({
          card: card,
          position: {x: x, y: y}
        });
        if (state == 1) {
          context.shadowColor = "#881111"
          context.shadowBlur = 10;
        } else if (state == 2) {
          context.shadowColor = "#111188"
          context.shadowBlur = 20;
        }
      }
      image = ALL_CARDS.get(card.rank).get(card.suit);
    }
    context.drawImage(image, x, y);
    context.restore();
  }

  drawDetails(context: CanvasRenderingContext2D): void {
    context.save();
    context.fillStyle = "black";
    context.textAlign = "center"

    for (let i = 0; i < this.options.numberOfPlayers; ++i) {
      let message: string = "P" + (i + 1) + ": " + this.scores[i];
      if (this.bids) {
        message += " - " + this.tricksTaken[i] + "/" + this.bids[i];
      }
      context.fillText(message, 450, 420 + (20 * i));
    }
    context.restore();
  }

  // hand == -1 means the card is in the current trick
  positionForCard(hand: number, index: number): {x: number, y: number} {
    if (hand == -1) {
      let player = index;
      if (player == 0) {
        return {
          x: 250.5 - (CARD_WIDTH / 2),
          y: 250 - 5
        }
      } else if (player == 1) {
        return {
          x: 250 - CARD_WIDTH - 5,
          y: 250 - (CARD_HEIGHT / 2)
        }
      } else if (player == 2) {
        return {
          x: 250.5 - (CARD_WIDTH / 2),
          y: 250 - CARD_HEIGHT + 5
        }
      } else if (player == 3) {
        return {
          x: 250 + 5,
          y: 250 - (CARD_HEIGHT / 2)
        }
      }
    } else {
      let offset: number = index - ((this.hands[hand].length - 1) / 2)
      let range: number = 270 / (this.hands[hand].length + 2);
      if (hand == 0) {
        return {
          x: (230 - (CARD_WIDTH / 2)) + (offset * range),
          y: 470 - CARD_HEIGHT,
        }
      } else if (hand == 1) {
        range += 50 / (this.hands[hand].length + 2);
        return {
          x: 20,
          y: (150 + 175 - (CARD_HEIGHT / 2)) + (offset * range),
        }
      } else if (hand == 2) {
        return {
          x: (284 - (CARD_WIDTH / 2)) + (offset * range),
          y: 20,
        }
      } else if (hand == 3) {
        range += 50 / (this.hands[hand].length + 2);
        return {
          x: 480 - CARD_WIDTH,
          y: (200 - (CARD_HEIGHT / 2)) + (offset * range),
        }
      }
    }
    throw new Error("Failed to find position for card");
  }

  drawBidOptions(context: CanvasRenderingContext2D): void {
    if (!this.bidPhase) {
      return;
    }
    let playingAsPlayerThatNeedsToBid: boolean = false;
    let currentPlayer: number;
    for (let player of this.playersToPlay) {
      if (this.playingAs.has(player)) {
        playingAsPlayerThatNeedsToBid = true;
        currentPlayer = player;
        break;
      }
    }
    if (!playingAsPlayerThatNeedsToBid) {
      return;
    }

    context.save();
    context.strokeStyle = "#000000";
    context.fillStyle = "#FFFFFF";
    context.beginPath();

    context.rect(110, 250 - 35, 280, 70);

    context.fill();
    context.stroke();

    let handSize: number = this.hands[0].length;
    let range: number = 260 / (handSize + 1)
    for (let i = 0; i <= handSize; ++i) {
      let offset: number = i - (handSize / 2);
      context.fillStyle = this.selectedBid == i ? "#AAFFAA" : "#FFFFFF";
      context.beginPath();
      let position: Position = {
        x: (250 - (NUMBER_DIMENSIONS / 2)) + (offset * range),
        y: 250 + 35 - 10 - (NUMBER_DIMENSIONS)
      }
      context.rect(position.x, position.y, NUMBER_DIMENSIONS, NUMBER_DIMENSIONS);
      context.fill();
      context.stroke();
      context.fillStyle = "#000000";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText("" + i, position.x + (NUMBER_DIMENSIONS / 2), position.y + (NUMBER_DIMENSIONS / 2));
      this.clickableBids.push({
        value: i,
        position: position
      });
    }
    context.fillStyle = "#000000";
    context.textAlign = "center";
    context.textBaseline = "top";
    context.fillText("Choose bid for player " + (currentPlayer + 1), 250, 250 - 20);
    context.restore();
  }

  private nextPlayer(player: number) {
    return (player + 1) % this.options.numberOfPlayers;
  }
}
