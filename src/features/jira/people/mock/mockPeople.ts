export type Person = { id: number; fullName: string; email?: string };

export const MOCK_PEOPLE: Person[] = [
  { id: 1, fullName: "James", email: "james@example.com" },
  { id: 2, fullName: "John", email: "john@example.com" },
  { id: 3, fullName: "Susan", email: "susan@example.com" },
  { id: 4, fullName: "David", email: "david@example.com" },
  { id: 5, fullName: "Jasmine", email: "jasmine@example.com" },
];
