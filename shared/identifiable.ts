export interface Identifiable {
  identifier: string
}

export function areEqual(a: Identifiable, b: Identifiable): boolean {
  return a.identifier == b.identifier;
}
