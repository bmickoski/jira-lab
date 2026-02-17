import { useCallback, useMemo } from "react";
import type { EntityBase } from "../../../components/EntityPicker";
import type { Person } from "./mock/mockPeople";
import { buildPersonIndex } from "./mock/peopleIndex";
import { getPeopleDataset, searchPeople } from "./searchPeople";

export type PersonEntity = EntityBase & { raw: Person };

export function usePeopleSearch(useBig = true) {
  const personIndex = useMemo(() => {
    const data = getPeopleDataset(useBig);
    return buildPersonIndex(data);
  }, [useBig]);

  const toPersonEntity = useCallback(
    (id: string | number): PersonEntity => {
      const p = personIndex.byId.get(String(id));
      if (!p) {
        return {
          id,
          label: `User ${String(id)}`,
          subLabel: undefined,
          raw: {
            id: Number(id),
            fullName: `User ${String(id)}`,
            email: undefined,
          },
        };
      }
      return { id: p.id, label: p.fullName, subLabel: p.email, raw: p };
    },
    [personIndex]
  );

  const search = useCallback(async (q: string, signal?: AbortSignal) => {
    const res = await searchPeople(q, signal, true);
    return res.map((p) => ({
      id: p.id,
      label: p.fullName,
      subLabel: p.email,
      raw: p,
    }));
  }, []);

  return { toPersonEntity, search };
}
