// eslint-disable-next-line storybook/no-renderer-packages
import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo, useState, type ComponentProps } from "react";
import { EntityPicker, type EntityBase } from "./EntityPicker";

type Person = { id: number; fullName: string; email?: string };
type PersonEntity = EntityBase & { raw: Person };

const DATA: Person[] = Array.from({ length: 300 }, (_, i) => ({
  id: i + 1,
  fullName: `John Smith ${String(i + 1).padStart(4, "0")}`,
  email: `john.smith.${String(i + 1).padStart(4, "0")}@company.com`,
}));

async function fakeSearch(q: string, signal?: AbortSignal): Promise<Person[]> {
  const query = q.trim().toLowerCase();
  await new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, 200);
    signal?.addEventListener("abort", () => {
      clearTimeout(t);
      reject(new DOMException("Aborted", "AbortError"));
    });
  });
  if (!query) return [];
  const res = DATA.filter((p) => p.fullName.toLowerCase().includes(query) || (p.email ?? "").toLowerCase().includes(query));
  return res.slice(0, 50);
}

const meta: Meta<typeof EntityPicker<PersonEntity>> = {
  title: "Pickers/EntityPicker",
  component: EntityPicker,
  parameters: { layout: "centered" },
  args: {
    label: "Assignee",
    placeholder: "Search people…",
    minChars: 2,
    debounceMs: 250,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function StoryWrapper(args: ComponentProps<typeof EntityPicker<PersonEntity>>) {
  const [value, setValue] = useState<PersonEntity | null>(null);

  const mapPerson = useCallback(
    (p: Person): PersonEntity => ({ id: p.id, label: p.fullName, subLabel: p.email, raw: p }),
    []
  );

  const search = useCallback(async (q: string, signal?: AbortSignal) => (await fakeSearch(q, signal)).map(mapPerson), [
    mapPerson,
  ]);

  const pretty = useMemo(() => value?.raw ?? null, [value]);

  return (
    <div className="w-[720px]">
      <EntityPicker {...args} value={value} onChange={setValue} search={search} />
      <pre className="mt-3 max-h-48 overflow-auto rounded-xl border border-white/10 bg-black/30 p-3 text-xs text-white/80">
        {JSON.stringify(pretty, null, 2)}
      </pre>
    </div>
  );
}

export const Playground: Story = {
  render: (args) => <StoryWrapper {...args} />,
};

export const Disabled: Story = {
  args: { disabled: true },
  render: (args) => <StoryWrapper {...args} />,
};
