import { Identifiable } from "./identifiable";

export interface PreferenceProfile extends Identifiable {
  canPlay: Array<string>
}
