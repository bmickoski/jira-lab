// eslint-disable-next-line storybook/no-renderer-packages
import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, useMemo, useState } from "react";
import { EntityMultiPicker, type EntityBase } from "./EntityMultiPicker";

type Person = { id: number; fullName: string; email?: string };
type PersonEntity = EntityBase & { raw: Person };

function makePeople(n = 500): Person[] {
  const first = ["John", "Emily", "Michael", "Sarah", "David", "Olivia", "James", "Sophia"];
  const last = ["Smith", "Johnson", "Williams", "Brown", "Miller", "Davis", "Wilson", "Taylor"];
  return Array.from({ length: n }, (_, i) => {
    const f = first[i % first.length];
    const l = last[(i * 7) % last.length];
    const id = i + 1;
    return {
      id,
      fullName: `${f} ${l} ${String(id).padStart(4, "0")}`,
      email: `${f.toLowerCase()}.${l.toLowerCase()}.${String(id).padStart(4, "0")}@company.com`,
    };
  });
}

const DATA = makePeople(2000);

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

  const res = DATA.filter((p) => {
    const name = p.fullName.toLowerCase();
    const email = (p.email ?? "").toLowerCase();
    return name.includes(query) || email.includes(query);
  });

  return res.slice(0, 500);
}

const meta: Meta<typeof EntityMultiPicker<PersonEntity>> = {
  title: "Pickers/EntityMultiPicker",
  component: EntityMultiPicker,
  parameters: {
    layout: "centered",
  },
  args: {
    label: "Assignees",
    placeholder: "Search people…",
    minChars: 2,
    debounceMs: 250,
    maxSelected: 5,
    allowCreate: true,
    virtualize: true,
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

function StoryWrapper(args: any) {
  const [value, setValue] = useState<PersonEntity[]>([]);

  const mapPerson = useCallback(
    (p: Person): PersonEntity => ({ id: p.id, label: p.fullName, subLabel: p.email, raw: p }),
    []
  );

  const search = useCallback(
    async (q: string, signal?: AbortSignal) => (await fakeSearch(q, signal)).map(mapPerson),
    [mapPerson]
  );

  const onCreate = useCallback(
    (name: string): PersonEntity => ({
      id: `new-${Date.now()}`,
      label: name,
      subLabel: "created locally",
      raw: { id: -1, fullName: name },
    }),
    []
  );

  const pretty = useMemo(() => value.map((v) => v.raw), [value]);

  return (
    <div className="w-[720px]">
      <EntityMultiPicker {...args} value={value} onChange={setValue} search={search} onCreate={onCreate} />
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

export const NoVirtualization: Story = {
  args: { virtualize: false },
  render: (args) => <StoryWrapper {...args} />,
};

export const CustomRender: Story = {
  args: {
    renderItem: (item: PersonEntity) => (
      <div className="flex items-center justify-between gap-3">
        <span className="text-white">{item.label}</span>
        <span className="text-xs text-white/60">{item.subLabel}</span>
      </div>
    ),
  },
  render: (args) => <StoryWrapper {...args} />,
};
