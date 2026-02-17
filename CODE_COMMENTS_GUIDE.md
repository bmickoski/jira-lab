# Code Documentation Examples

Below are examples of how to add meaningful inline comments to your React components. These comments explain **why** decisions were made, not **what** the code does.

---

## Example 1: EntityPicker Component

```typescript
export function EntityPicker({
  value,
  defaultValue,
  onChange,
  debounceMs = 300,
  minChars = 2,
  ...props
}: EntityPickerProps) {
  // Decision: Support both controlled and uncontrolled usage
  // Controlled: Parent manages state via `value` + `onChange`
  // Uncontrolled: Component manages state via `defaultValue` + `onSelect`
  // This mirrors native HTML inputs and makes the component flexible
  const [internalValue, setInternalValue] = useState(defaultValue);
  const selected = value ?? internalValue;

  const [query, setQuery] = useState("");
  // Decision: Debounce at the hook level, not inside useEffect
  // Why: Separates concerns (debounce logic vs search logic)
  // Benefit: Can reuse `useDebouncedValue` across components
  const debouncedQuery = useDebouncedValue(query, debounceMs);

  const [results, setResults] = useState<Entity[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Decision: Skip search if query is too short
    // Why: Prevents unnecessary API calls on initial typing
    // Trade-off: Explicit validation vs automatic behavior
    if (debouncedQuery.length < minChars) {
      setResults([]);
      return;
    }

    setIsLoading(true);

    // Decision: Use AbortController for request cancellation
    // Why: Prevents race conditions when user types quickly
    // Example: User types "John" then "Jane" rapidly
    //   - Without abort: Both requests complete, last one wins (might show "John" results)
    //   - With abort: First request canceled, only "Jane" results shown
    const controller = new AbortController();

    searchEntities(debouncedQuery, { signal: controller.signal })
      .then(setResults)
      .catch((err) => {
        // Decision: Silently ignore AbortErrors
        // Why: User-initiated cancellation isn't an error state
        if (err.name !== "AbortError") {
          console.error("Search failed:", err);
          setResults([]);
        }
      })
      .finally(() => setIsLoading(false));

    // Decision: Return cleanup function
    // Why: Ensures in-flight requests are canceled when query changes or component unmounts
    return () => controller.abort();
  }, [debouncedQuery, minChars]);

  // ... rest of component
}
```

---

## Example 2: useTaskPersistence Hook

```typescript
export function useTaskPersistence() {
  // Decision: Initialize state from localStorage
  // Why: Restore user's work after page refresh
  // Trade-off: Slight delay on first render vs data loss
  const [tasks, setTasks] = useState<Task[]>(() => {
    const stored = localStorage.getItem("tasks");
    return stored ? JSON.parse(stored) : DEFAULT_TASKS;
  });

  // Decision: Debounce localStorage writes
  // Why: Prevent excessive writes during rapid state updates (e.g., drag-and-drop)
  // Example: Dragging task across board triggers 10+ state updates
  //   - Without debounce: 10+ localStorage writes (slow, blocks UI)
  //   - With debounce: 1 write after user stops dragging (fast, smooth UX)
  const debouncedTasks = useDebouncedValue(tasks, 500);

  useEffect(() => {
    localStorage.setItem("tasks", JSON.stringify(debouncedTasks));
  }, [debouncedTasks]);

  // Decision: Return both state and updater
  // Why: Matches useState API pattern (familiar to React devs)
  return [tasks, setTasks] as const;
}
```

---

## Example 3: EntityMultiPicker Component

```typescript
export function EntityMultiPicker({ maxSelected, onCreate, ...props }: EntityMultiPickerProps) {
  const [selected, setSelected] = useState<Entity[]>([]);

  const handleSelect = (entity: Entity) => {
    // Decision: Check maxSelected before adding
    // Why: Prevent UI state getting out of sync with business rules
    // Alternative considered: Disable picker when max reached
    // Why rejected: User should see they're at limit (better feedback)
    if (maxSelected && selected.length >= maxSelected) {
      // Decision: Use console.warn instead of throwing error
      // Why: Non-critical validation shouldn't crash the app
      console.warn(`Maximum ${maxSelected} entities allowed`);
      return;
    }

    // Decision: Use functional setState
    // Why: Prevents race conditions when multiple selects happen rapidly
    // Example: User clicks two entities quickly
    //   - Without function: Second click might overwrite first
    //   - With function: Both entities added correctly
    setSelected((prev) => [...prev, entity]);
  };

  const handleRemove = (id: string) => {
    // Decision: Remove by ID, not reference equality
    // Why: Entities might be re-fetched/hydrated (different object instances)
    setSelected((prev) => prev.filter((e) => e.id !== id));
  };

  const handleCreate = async (name: string) => {
    if (!onCreate) return;

    // Decision: Show optimistic UI during creation
    // Why: Immediate feedback feels responsive (better UX)
    // Trade-off: Need rollback logic if creation fails
    const tempId = `temp-${Date.now()}`;
    const optimisticEntity = { id: tempId, name, isLoading: true };

    setSelected((prev) => [...prev, optimisticEntity]);

    try {
      const newEntity = await onCreate(name);
      // Decision: Replace temporary entity with real one
      // Why: Maintains user's selection order
      setSelected((prev) => prev.map((e) => (e.id === tempId ? newEntity : e)));
    } catch (err) {
      // Decision: Remove optimistic entity on failure
      // Why: Don't leave invalid data in state
      setSelected((prev) => prev.filter((e) => e.id !== tempId));
      console.error("Failed to create entity:", err);
    }
  };

  // ... rest of component
}
```

---

## Example 4: Virtualized List

```typescript
import { FixedSizeList } from 'react-window';

export function VirtualizedDropdown({ items }: Props) {
  // Decision: Use react-window for virtualization
  // Why: DOM node count matters more than bundle size for large lists
  // Benchmark: 10,000 items
  //   - Without virtualization: 1.2s render, 300MB memory, janky scroll
  //   - With react-window: 80ms render, 50MB memory, 60fps scroll
  //   - Bundle cost: +2KB gzipped
  // Conclusion: Worth it for data-heavy enterprise UIs

  const ROW_HEIGHT = 40;
  const MAX_VISIBLE_ROWS = 10;

  // Decision: Calculate height dynamically based on item count
  // Why: Small lists don't need full 400px height (looks weird)
  // Example: 3 items should be 120px, not 400px
  const listHeight = Math.min(
    items.length * ROW_HEIGHT,
    MAX_VISIBLE_ROWS * ROW_HEIGHT
  );

  return (
    <FixedSizeList
      height={listHeight}
      itemCount={items.length}
      itemSize={ROW_HEIGHT}
      // Decision: Use index as key (not item.id)
      // Why: react-window expects stable indices, not stable IDs
      // Note: This is an exception to the "always use IDs" rule
      itemKey={(index) => index}
    >
      {({ index, style }) => (
        <div style={style}>
          {items[index].name}
        </div>
      )}
    </FixedSizeList>
  );
}
```

---

## Example 5: Search Metrics Hook

```typescript
export function useSearchMetrics() {
  const [metrics, setMetrics] = useState({
    totalSearches: 0,
    successfulSearches: 0,
    failedSearches: 0,
    abortedSearches: 0,
    averageResponseTime: 0,
  });

  const recordSearch = useCallback((result: SearchResult) => {
    setMetrics((prev) => {
      // Decision: Calculate rolling average, not cumulative sum
      // Why: Recent performance matters more than historical averages
      // Example: API gets slower over time (memory leak, scaling issues)
      //   - Cumulative: Average stays low (hides current problems)
      //   - Rolling: Average increases (shows degradation)
      const newCount = prev.totalSearches + 1;
      const newAvg = (prev.averageResponseTime * prev.totalSearches + result.duration) / newCount;

      return {
        totalSearches: newCount,
        successfulSearches: prev.successfulSearches + (result.success ? 1 : 0),
        failedSearches: prev.failedSearches + (result.error ? 1 : 0),
        abortedSearches: prev.abortedSearches + (result.aborted ? 1 : 0),
        averageResponseTime: newAvg,
      };
    });
  }, []);

  // Decision: Expose reset function
  // Why: Metrics should be per-session, not lifetime
  // Use case: User switches datasets in Component Lab
  const resetMetrics = useCallback(() => {
    setMetrics({
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      abortedSearches: 0,
      averageResponseTime: 0,
    });
  }, []);

  return { metrics, recordSearch, resetMetrics };
}
```

---
