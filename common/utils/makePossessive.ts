export function makePossessive(name: string): string {
  return name.endsWith("s") ? `${name}'` : `${name}'s`;
}
