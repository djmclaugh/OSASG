import { Identifiable } from "./identifiable";

export interface PreferenceProfile extends Identifiable {
  username: string,
  canPlay: Array<string>
}
