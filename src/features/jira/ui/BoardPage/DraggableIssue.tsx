import { useDraggable } from "@dnd-kit/core";
import type { DraggableAttributes, DraggableSyntheticListeners } from "@dnd-kit/core";

export function DraggableIssue(props: {
  id: string; // issue id
  children: (args: {
    setNodeRef: (el: HTMLElement | null) => void;
    listeners: DraggableSyntheticListeners;
    attributes: DraggableAttributes;
    isDragging: boolean;
    transformStyle?: React.CSSProperties;
  }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: props.id,
  });

  const transformStyle: React.CSSProperties | undefined = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return props.children({
    setNodeRef,
    listeners,
    attributes,
    isDragging,
    transformStyle,
  });
}
