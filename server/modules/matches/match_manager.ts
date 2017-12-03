import { Match } from "./match";
import { MatchSettings } from "../../../shared/match_info"

export class MatchManager {
  public onMatchCreated: (match: Match) => void;
  public onMatchEnded: (match: Match) => void;
  private counter: number = 1;
  private allMatches: Map<string, Match> = new Map();

  public getMatch(matchID: string): Match {
    return this.allMatches.get(matchID);
  }

  public createNewMatch(matchSettings: MatchSettings): Match {
    let matchID: string = matchSettings.gameName.toLowerCase() + "_" + this.counter++;
    let match = new Match(matchID, matchSettings);
    this.allMatches.set(matchID, match);
    match.onMatchEnd = () => {
      this.allMatches.delete(matchID);
      this.onMatchEnded(match);
    }
    this.onMatchCreated(match);
    return match;
  }

  public getMatchesUserCanJoin(playerIdentifier: string): Array<Match> {
    let matches: Array<Match> = [];
     for (let match of this.allMatches.values()) {
       matches.push(match);
     }
     return matches;
  }
}
