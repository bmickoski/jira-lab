import React, { useMemo } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Issue } from "../../domain/types";
import { IssueCard } from "./IssueCard";

export function SortableIssue(props: { issue: Issue; onOpen: () => void }) {
  const { issue } = props;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: issue.id,
    data: { status: issue.status },
  });

  const style = useMemo<React.CSSProperties>(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
    }),
    [transform, transition],
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "opacity-60" : ""}
    >
      <IssueCard
        issue={issue}
        onOpen={props.onOpen}
        dragHandleProps={{ listeners, attributes }}
      />
    </div>
  );
}
