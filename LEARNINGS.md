# React vs Angular: Learnings from Building Entity Pickers

> A senior Angular engineer's reflections on building the same patterns in React.

---

## 🎯 Context

I've built entity pickers, autocompletes, and multi-selects dozens of times in Angular for enterprise applications. This project recreates those same patterns in React to understand:

1. **Where frameworks converge** (similar solutions to similar problems)
2. **Where they diverge** (fundamentally different mental models)
3. **What transfers** (architectural thinking vs framework-specific tricks)

---

## 📊 Side-by-Side Comparison

### **1. State Management**

#### Angular Approach

```typescript
@Injectable()
export class EntityService {
  private selectedEntities$ = new BehaviorSubject<Entity[]>([]);

  select(entity: Entity) {
    this.selectedEntities$.next([
      ...this.selectedEntities$.value,
      entity
    ]);
  }
}

// Component
constructor(private entityService: EntityService) {}
entities$ = this.entityService.selectedEntities$;
```

**Pros**: Centralized state, reactive streams, automatic subscription cleanup  
**Cons**: Boilerplate, easy to create memory leaks, hard to debug state mutations

#### React Approach

```typescript
function EntityPicker() {
  const [selected, setSelected] = useState<Entity[]>([]);

  const handleSelect = (entity: Entity) => {
    setSelected(prev => [...prev, entity]);
  };

  return <Dropdown selected={selected} onSelect={handleSelect} />;
}
```

**Pros**: Local state, explicit updates, easier to trace data flow  
**Cons**: Prop drilling, no built-in global state, manual optimization

#### My Take

- **Angular's RxJS shines** for complex async flows (multiple streams, retries, cancellation)
- **React's useState wins** for simple component state (less overhead, clearer ownership)
- **Both struggle** with deeply nested state (Angular → NgRx, React → Context/Zustand)

---

### **2. Async Data Fetching**

#### Angular Approach

```typescript
searchEntities(query: string): Observable<Entity[]> {
  return this.http.get<Entity[]>(`/api/search?q=${query}`).pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.http.get(`/api/entities?q=${q}`)),
    catchError(() => of([]))
  );
}

// Template
<input [formControl]="searchControl">
<div *ngFor="let entity of entities$ | async">{{ entity.name }}</div>
```

**Pros**: Operators handle debounce/cancel/retry declaratively  
**Cons**: `async` pipe creates subscriptions (hard to debug when they leak)

#### React Approach

```typescript
function useEntitySearch(query: string) {
  const [results, setResults] = useState<Entity[]>([]);
  const debouncedQuery = useDebouncedValue(query, 300);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`/api/entities?q=${debouncedQuery}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then(setResults)
      .catch(() => setResults([]));

    return () => controller.abort();
  }, [debouncedQuery]);

  return results;
}
```

**Pros**: Explicit cleanup, clear data flow, easier to test  
**Cons**: More imperative, miss RxJS operators, manual debounce implementation

#### My Take

- **Angular's `switchMap` is magic** for "cancel previous request" patterns
- **React's `AbortController` is clearer** about _why_ cleanup happens
- **Trade-off**: Angular = less code, React = less magic

---

### **3. Keyboard Navigation**

#### Angular Approach

```typescript
@HostListener('keydown.arrowdown', ['$event'])
handleArrowDown(event: KeyboardEvent) {
  event.preventDefault();
  this.focusedIndex = Math.min(
    this.focusedIndex + 1,
    this.items.length - 1
  );
}

@ViewChild('dropdown') dropdown: ElementRef;
ngAfterViewInit() {
  this.dropdown.nativeElement.focus();
}
```

**Pros**: Declarative event binding, lifecycle hooks for DOM access  
**Cons**: ViewChild timing issues, HostListener adds global listeners

#### React Approach

```typescript
function Dropdown({ items }) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => Math.min(prev + 1, items.length - 1));
    }
  };

  useEffect(() => {
    listRef.current?.focus();
  }, []);

  return <div ref={listRef} onKeyDown={handleKeyDown}>...</div>;
}
```

**Pros**: Event handlers scoped to component, refs are straightforward  
**Cons**: Manual ref forwarding, no built-in keyboard directive

#### My Take

- **React's event system is simpler** (no synthetic event confusion)
- **Angular's `@HostListener` is convenient** but easy to misuse
- **Both need manual focus management** for complex keyboard UX

---

### **4. Reusable Logic**

#### Angular Approach

```typescript
@Directive({ selector: '[appDebounce]' })
export class DebounceDirective {
  @Input() debounceTime = 300;
  @Output() debounced = new EventEmitter();

  private subject = new Subject();

  ngOnInit() {
    this.subject.pipe(
      debounceTime(this.debounceTime)
    ).subscribe(this.debounced);
  }
}

// Usage
<input (input)="subject.next($event)" appDebounce (debounced)="search($event)">
```

**Pros**: Reusable across templates, familiar directive pattern  
**Cons**: Requires understanding directives, lifecycle management

#### React Approach

```typescript
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

// Usage
const debouncedQuery = useDebouncedValue(query, 300);
```

**Pros**: Just JavaScript, easy to test, obvious dependencies  
**Cons**: Hooks rules (can't call conditionally), closure confusion

#### My Take

- **React's hooks are more composable** (easier to combine multiple concerns)
- **Angular's directives are more discoverable** (visible in templates)
- **Custom hooks feel cleaner** than custom directives (less boilerplate)

---

### **5. Testing**

#### Angular Approach

```typescript
describe("EntityPickerComponent", () => {
  let component: EntityPickerComponent;
  let fixture: ComponentFixture<EntityPickerComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [EntityPickerComponent],
      imports: [HttpClientTestingModule],
    });
    fixture = TestBed.createComponent(EntityPickerComponent);
    component = fixture.componentInstance;
  });

  it("should search on input", fakeAsync(() => {
    component.query = "John";
    fixture.detectChanges();
    tick(300);
    expect(component.results.length).toBeGreaterThan(0);
  }));
});
```

**Pros**: Full integration testing, dependency injection mocking  
**Cons**: Boilerplate-heavy, `detectChanges()` confusion, slow tests

#### React Approach

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

test('searches on input', async () => {
  render(<EntityPicker />);

  const input = screen.getByRole('textbox');
  await userEvent.type(input, 'John');

  await waitFor(() => {
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });
});
```

**Pros**: User-centric, less boilerplate, fast  
**Cons**: Async testing can be tricky, mock setup less structured

#### My Take

- **React Testing Library's philosophy is superior** (test behavior, not implementation)
- **Angular's TestBed is overkill** for most component tests
- **Both need better async testing primitives** (fakeAsync vs waitFor)

---

## 🚦 When to Choose Which

### Choose **Angular** if you need:

- Large enterprise apps with strict conventions
- Heavy async coordination (multiple streams, retries, caching)
- Strong typing enforced at compile-time (Ahead-of-Time compilation)
- Teams that prefer opinionated structure

### Choose **React** if you need:

- Rapid prototyping with minimal setup
- Maximum flexibility in state management
- Server-side rendering (Next.js ecosystem)
- Teams that prefer composition over dependency injection

### Both are great at:

- Building complex, data-heavy UIs
- TypeScript integration
- Component reusability
- Large-scale applications

---

## 💡 Key Insights

### **1. Framework Choice Matters Less Than Principles**

The same architectural patterns apply:

- Separation of concerns (presentation vs logic)
- Unidirectional data flow
- Testable, composable components
- Performance optimization (virtualization, memoization)

### **2. Migration Isn't 1:1**

Don't translate Angular patterns directly to React (or vice versa):

- ❌ Creating "service" classes with RxJS in React
- ❌ Using Context for everything (over-centralization)
- ✅ Embracing local state + composition
- ✅ Using hooks idiomatically

### **3. Cross-Framework Experience Is Valuable**

Learning React made me a better Angular developer:

- I now avoid over-using RxJS where `async/await` suffices
- I prefer composition over inheritance in Angular too
- I question "magic" solutions (like `async` pipe) more often

---

## 🎓 What I'd Tell My Past Self

1. **Don't fight the framework** - Use React hooks as intended, not as RxJS replacements
2. **Local state is okay** - Not everything needs global state management
3. **Testing philosophy matters more than framework** - RTL's approach applies to Angular too
4. **Performance is similar** - Both are fast enough; architecture matters more
5. **TypeScript is the equalizer** - Strict typing helps in both ecosystems

---

## 🔮 What's Next

- Exploring **Next.js** (React's routing/SSR story vs Angular Universal)
- Comparing **state libraries** (NgRx vs Zustand vs Jotai)
- Testing **animation libraries** (Angular Animations vs Framer Motion)
- Understanding **React Server Components** (no Angular equivalent yet)

---

## 📚 Resources That Helped

- [React Docs Beta](https://react.dev) - Best framework docs I've read
- [Kent C. Dodds' Blog](https://kentcdodds.com) - Testing philosophy
- [Josh Comeau's CSS Course](https://css-for-js.dev) - Styling patterns
- [Angular to React Cheatsheet](https://github.com/typescript-cheatsheets/react) - Quick reference

---

**TL;DR**: React and Angular solve the same problems with different philosophies. Angular optimizes for consistency in large teams; React optimizes for flexibility. Neither is "better"—they're tools for different contexts. Learning both makes you a better frontend engineer.
