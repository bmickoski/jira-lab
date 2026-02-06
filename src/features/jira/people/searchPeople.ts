import { MOCK_PEOPLE, type Person } from "./mock/mockPeople";
import { generatePeople } from "./mock/mockPeopleBigResponse";

let bigCache: Person[] | null = null;

function getDataset(useBig: boolean): Person[] {
  if (!useBig) return MOCK_PEOPLE;

  if (!bigCache) {
    bigCache = generatePeople(10_000);
  }
  return bigCache;
}

export async function searchPeople(
  q: string,
  signal?: AbortSignal,
  useBig = false,
): Promise<Person[]> {
  const query = q.trim().toLowerCase();

  // simulate real network latency
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 250);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });

  const data = getDataset(useBig);
  console.log("SEARCH", {
    useBig,
    dataLen: data.length,
    q,
    query,
    results: "TBD",
  });

  if (!query) return [];

  // simple contains search
  const results = data.filter((p) => {
    const name = p.fullName.toLowerCase();
    const email = (p.email ?? "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  console.log("RESULTS", {
    resultsLen: results.length,
    first: results[0]?.fullName,
  });

  // cap to keep UI realistic
  return results.slice(0, 500);
}

export function getPeopleDataset(useBig = false): Person[] {
  return getDataset(useBig);
}
