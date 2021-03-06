import { Update } from "ts-turnbased";
import { Match } from "./matches/match";
import { ProcessedUpdate } from "./matches/processed_update";
import { MatchManager } from "./matches/match_manager";
import { PlayerSocket } from "./sockets/player_socket";
import { SocketServer } from "./sockets/socket_server";
import { PlayerInfo } from "../../shared/player_info";
import {
  MATCH_UPDATE_TYPE,
  SPECTATE_MATCH_TYPE,
  Channel,
  InviteMessage,
  JoinMatchMessage,
  MatchUpdateMessage,
  PlayMessage,
  SpectateMatchMessage,
} from "../../shared/socket_protocol";

export class MatchLobby {
  private spectators: Map<string, Set<PlayerSocket>> = new Map();
  constructor(private server: SocketServer, private matchManager: MatchManager) {
    this.server.onNewPlayer = (player: PlayerSocket) => {
      this.onNewPlayer(player);
    }
    this.matchManager.onMatchCreated = (match: Match) => {
      this.onNewMatch(match);
    }
    this.matchManager.onMatchEnded = (match: Match) => {
      this.spectators.delete(match.identifier);
      this.server.subsciptionManager.removeItem(Channel.ACTIVE_MATCHES, match.identifier);
    }
  }

  private updateSpectator(player: PlayerSocket, matchID: string, spectate: boolean) {
    let spectatorSet: Set<PlayerSocket> = this.getSpectators(matchID);
    if (spectate) {
      spectatorSet.add(player);
      let match: Match = this.matchManager.getMatch(matchID);
      let updateMessage: MatchUpdateMessage = {
        type: MATCH_UPDATE_TYPE,
        matchID: match.identifier,
        matchInfo: match.matchInfoForPlayer(player.playerInfo.identifier),
      }
      player.send(updateMessage);
    } else {
      spectatorSet.delete(player);
    }
  }

  private onNewPlayer(player: PlayerSocket) {
    player.onSpectateMatch = (message: SpectateMatchMessage) => {
      this.updateSpectator(player, message.matchID, message.spectate);
    };

    player.onPlay = (message: PlayMessage) => {
      let match: Match = this.matchManager.getMatch(message.matchID);
      if (!match) {
        throw new Error("Match " + message.matchID + " is not active.");
      }
      match.play(player.playerInfo, message.move, message.playerNumber, message.turnNumber);
      player.send(message);
    };

    player.onJoinMatch = (message: JoinMatchMessage) => {
      let match: Match = this.matchManager.getMatch(message.matchID);
      if (!match) {
        throw new Error("Match " + message.matchID + " is not active.");
      }
      this.updateSpectator(player, message.matchID, true);
      match.addPlayer(player.playerInfo, message.seat);
    };

    player.onInvite = (message: InviteMessage) => {
      let match: Match = this.matchManager.getMatch(message.matchSummary.identifier);
      if (!match) {
        throw new Error("Match " + message.matchSummary.identifier + " is not active.");
      }
      message.matchSummary = match.matchSummary();
      let sockets: Set<PlayerSocket> = this.server.getSocketsForUser(message.receiver);
      for (let socket of sockets) {
        socket.send(message);
      }
    };
  }

  private onNewMatch(match: Match) {
    this.server.subsciptionManager.addItem(Channel.ACTIVE_MATCHES, match.matchSummary());

    match.onPlayersUpdate = (players: Array<PlayerInfo>) => {
      this.server.subsciptionManager.updateItem(Channel.ACTIVE_MATCHES, match.matchSummary());
      let updateMessage: MatchUpdateMessage = {
        type: MATCH_UPDATE_TYPE,
        matchID: match.identifier,
        players: players,
      }
      for (let socket of this.getSpectators(match.identifier)) {
        socket.send(updateMessage);
      }
    };

    match.onGameUpdate = (update: ProcessedUpdate) => {
      let updateMessage: MatchUpdateMessage = {
        type: MATCH_UPDATE_TYPE,
        matchID: match.identifier,
      }
      for (let socket of this.getSpectators(match.identifier)) {
        updateMessage.gameUpdate = update.updateForPlayer(socket.playerInfo.identifier);
        socket.send(updateMessage);
      }
    }
  }

  private getSpectators(matchID: string): Set<PlayerSocket> {
    if (!this.matchManager.getMatch(matchID)) {
      throw new Error("Match " + matchID + " is not active.");
    }
    let spectatorSet: Set<PlayerSocket> = this.spectators.get(matchID);
    if (!spectatorSet) {
      spectatorSet = new Set();
      this.spectators.set(matchID, spectatorSet);
    }
    return spectatorSet;
  }
}
