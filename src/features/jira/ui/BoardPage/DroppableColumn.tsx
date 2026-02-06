import { useDroppable } from "@dnd-kit/core";

export function DroppableColumn(props: {
  id: string;
  title: string;
  count: number;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: props.id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "rounded-2xl border border-white/10 bg-black/20 p-3 transition",
        isOver ? "ring-2 ring-white/20 bg-white/5" : "",
      ].join(" ")}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="font-semibold">{props.title}</div>
        <div className="text-xs text-white/50">{props.count}</div>
      </div>

      <div className="grid gap-2">{props.children}</div>
    </div>
  );
}
