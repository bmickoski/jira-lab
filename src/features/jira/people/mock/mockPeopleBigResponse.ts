import type { Person } from "./mockPeople";

function pad(n: number, size = 4) {
  const s = String(n);
  return s.length >= size ? s : "0".repeat(size - s.length) + s;
}

export function generatePeople(count = 10_000): Person[] {
  const firstNames = [
    "James",
    "Michael",
    "Robert",
    "John",
    "David",
    "William",
    "Richard",
    "Joseph",
    "Thomas",
    "Charles",
    "Christopher",
    "Daniel",
    "Matthew",
    "Anthony",
    "Mark",
    "Donald",
    "Steven",
    "Paul",
    "Andrew",
    "Joshua",

    "Emily",
    "Jessica",
    "Ashley",
    "Sarah",
    "Jennifer",
    "Amanda",
    "Elizabeth",
    "Megan",
    "Lauren",
    "Rachel",
    "Kayla",
    "Nicole",
    "Hannah",
    "Samantha",
    "Brittany",
    "Alexis",
    "Madison",
    "Victoria",
    "Olivia",
    "Sophia",
  ];

  const lastNames = [
    "Smith",
    "Johnson",
    "Williams",
    "Brown",
    "Jones",
    "Garcia",
    "Miller",
    "Davis",
    "Rodriguez",
    "Martinez",
    "Hernandez",
    "Lopez",
    "Gonzalez",
    "Wilson",
    "Anderson",
    "Thomas",
    "Taylor",
    "Moore",
    "Jackson",
    "Martin",
    "Lee",
    "Perez",
    "Thompson",
    "White",
    "Harris",
    "Sanchez",
    "Clark",
    "Ramirez",
    "Lewis",
    "Robinson",
    "Walker",
    "Young",
    "Allen",
    "King",
    "Wright",
    "Scott",
    "Torres",
    "Nguyen",
    "Hill",
  ];

  const out: Person[] = new Array(count);

  for (let i = 0; i < count; i++) {
    const f = firstNames[i % firstNames.length];
    const l = lastNames[(i * 7) % lastNames.length];
    const n = i + 1;
    const id = n;

    out[i] = {
      id,
      fullName: `${f} ${l} ${pad(n, 4)}`,
      email: `${f.toLowerCase()}.${l.toLowerCase()}.${pad(n, 4)}@example.com`,
    };
  }

  return out;
}
