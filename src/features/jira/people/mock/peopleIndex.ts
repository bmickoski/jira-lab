import type { Person } from "./mockPeople";

export type PersonIndex = {
  byId: Map<string, Person>;
};

export function buildPersonIndex(people: Person[]): PersonIndex {
  const byId = new Map<string, Person>();
  for (const p of people) byId.set(String(p.id), p);
  return { byId };
}
