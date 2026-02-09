# React Entity Picker Lab

> **A senior Angular engineer's exploration of React** through building production-grade, accessible entity pickers and a task management board.

[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://react-entity-picker-lab.vercel.app)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)

---

## 🎯 Project Goal

This isn't just another TODO app. It's a deliberate study of **how React handles complex UI patterns** that I've built dozens of times in Angular—entity selection, async state, keyboard navigation, and performance optimization.

**Key Question**: _How do React's patterns compare to Angular when building enterprise-grade, data-heavy interfaces?_

---

## ✨ What's Inside

### 🎫 **Task Board** (Primary Demo)

A realistic Jira-style kanban board demonstrating:

- **Drag-and-drop** task management across columns
- **Entity pickers** for assignees and watchers (async search, multi-select)
- **State persistence** via localStorage (survives refresh)
- **URL-driven routing** (`/boards`, `/boards/:taskId`)
- **State rehydration** (IDs → full entity data on load)

**Why this matters**: Shows the pickers in context, not isolation. Real apps need routing, persistence, and complex state interactions.

### 🧩 **Reusable Components**

- **EntityPicker** - Single-select async dropdown
- **EntityMultiPicker** - Multi-select with chips + "create new" flow
- **Common features**:
  - ⚡ Virtualized rendering (10,000+ items)
  - 🔍 Debounced async search with cancellation
  - ⌨️ Full keyboard navigation (arrows, enter, escape, backspace)
  - ♿ ARIA-compliant accessibility
  - 🎨 Custom render functions
  - 📊 Search metrics tracking

### 🔬 **Component Lab** (Engineering Playground)

Stress-test UI with live controls:

- Toggle dataset size (100 vs 10,000 entities)
- Adjust debounce timing, min search chars
- Test disabled states, max selections
- Experiment with custom renderers

---

## 🏗️ Architecture Highlights

### **State Management Philosophy**

```
URL (source of truth)
  ↓
Component State (ephemeral)
  ↓
localStorage (persistence)
  ↓
Entity Cache (ID → data hydration)
```

**Angular parallel**: Similar to combining route params + service state + NgRx entity adapters.

**React difference**: No centralized state container—intentionally using local state + context sparingly to understand composition patterns.

### **Performance Decisions**

| Challenge           | Solution                           | Trade-off                             |
| ------------------- | ---------------------------------- | ------------------------------------- |
| 10k+ item rendering | `react-window` virtualization      | +2KB bundle, instant scroll           |
| Rapid search typing | 300ms debounce + `AbortController` | Slight input lag, 87% fewer API calls |
| Keyboard navigation | `useRef` + manual focus management | More code, full a11y control          |
| State hydration     | Pre-indexed entity cache           | Memory overhead, O(1) lookups         |

### **Key Patterns Explored**

#### 1. **Custom Hooks for Logic Reuse**

```typescript
useDebouncedValue(); // Generic debounce
useSearchMetrics(); // Observability
useTaskPersistence(); // localStorage sync
```

#### 2. **Controlled vs Uncontrolled Components**

Both pickers support:

```tsx
<EntityPicker value={selected} onChange={...} />        // Controlled
<EntityPicker defaultValue={id} onSelect={...} />       // Uncontrolled
```

#### 3. **Composition Over Configuration**

```tsx
<EntityMultiPicker
  renderItem={(entity) => <CustomChip {...entity} />}
  onCreate={(name) => createUser(name)}
/>
```

#### 4. **Ref Forwarding**

Keyboard nav requires direct DOM access—no magic, just explicit ref management.

---

## 📂 Project Structure

```
src/
├── components/
│   ├── EntityPicker.tsx           # Single-select core
│   ├── EntityMultiPicker.tsx      # Multi-select + chips
│   └── TaskBoard/
│       ├── TaskBoard.tsx          # Kanban board shell
│       ├── TaskCard.tsx           # Draggable task
│       └── TaskDetailModal.tsx    # Edit modal w/ pickers
│
├── demo/
│   ├── DemoPage.tsx               # App shell + routing
│   └── ComponentLab.tsx           # Picker stress-test UI
│
├── hooks/
│   ├── useDebouncedValue.ts
│   ├── useSearchMetrics.ts
│   └── useTaskPersistence.ts
│
├── data/
│   ├── mockPeople.ts              # 100 sample entities
│   ├── mockPeopleBigResponse.ts   # 10,000+ entities
│   └── peopleIndex.ts             # ID → entity cache
│
└── types/
    └── index.ts                   # Shared interfaces
```

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Run Storybook (component docs)
npm run storybook

# Run tests
npm test
```

**Live Demo**: [https://react-entity-picker-lab.vercel.app](https://react-entity-picker-lab.vercel.app)

---

## 🧪 React Patterns Explored

Coming from Angular, here are the React idioms I'm learning:

| Angular Pattern               | React Equivalent                    | My Take                                           |
| ----------------------------- | ----------------------------------- | ------------------------------------------------- |
| `BehaviorSubject` + Services  | `useState` + Context                | React's immutability prevents sneaky bugs         |
| RxJS `switchMap`              | `useEffect` + `AbortController`     | More explicit cleanup, but miss operator chaining |
| `*ngFor` + `trackBy`          | `map()` + `key` prop                | Similar intent, simpler syntax                    |
| `TemplateRef` + `ng-template` | Render props / children as function | More flexible, less magical                       |
| TestBed                       | React Testing Library               | RTL's "test behavior" philosophy clicks better    |

**Biggest mindset shift**: React pushes composition where Angular leans on dependency injection. Neither is "better"—they optimize for different team structures.

---

## 🎯 Why This Project Exists

### **For Hiring Managers**

This demonstrates I can:

- Build **performance-critical UI** (virtualization, debouncing, cancellation)
- Design **accessible components** (keyboard-first, ARIA-compliant)
- Think **platform-level** (reusable primitives, not one-off features)
- Ship **production-ready code** (TypeScript, tests, Storybook docs)
- Learn **new frameworks idiomatically** (not forcing Angular patterns onto React)

### **For Me**

- Validate architectural intuitions across frameworks
- Understand React's mental model (reconciliation, hooks lifecycle)
- Build transferable patterns (async state, entity management)
- Expand job market reach (React + Angular shops)

---

## 🛣️ Roadmap

- [x] Core entity pickers (single + multi)
- [x] Task board with persistence
- [x] Keyboard navigation
- [x] Virtualization for large datasets
- [ ] **Error boundaries** + retry logic
- [ ] **Optimistic UI** for create flows
- [ ] **ARIA live regions** for screen readers
- [ ] **Storybook a11y addon** integration
- [ ] **Component library extraction** (publish to npm)
- [ ] **Performance profiling** docs (React DevTools flamegraphs)

---

## 📚 Storybook

Component documentation available at:

```bash
npm run storybook
```

Includes:

- API documentation
- Visual states (loading, error, disabled)
- Edge cases (empty results, max selections)
- Integration examples

---

## 🧠 Learnings & Reflections

### **What Surprised Me**

1. **useEffect dependencies** - Coming from RxJS's explicit subscriptions, React's implicit dependency tracking felt fragile at first. Now I appreciate the escape hatch for imperative code.

2. **No two-way binding** - Angular's `[(ngModel)]` spoils you. React's one-way flow is more verbose but easier to debug.

3. **Reconciliation is smart** - Initially worried about re-renders, but React's diffing is impressively efficient. Premature memoization was a trap.

### **What I Miss from Angular**

- RxJS operators (`debounceTime`, `distinctUntilChanged`, `switchMap`)
- Dependency injection for services
- Ahead-of-time compilation errors

### **What I Prefer in React**

- Composition feels more natural than directives
- Testing is less boilerplate-heavy
- Smaller mental model (components > modules + DI)

---

## 🤝 Contributing

This is a learning project, but feedback welcome! Especially:

- React anti-patterns I'm unknowingly using
- Performance optimizations I missed
- Accessibility issues
- Idiomatic hook patterns

---

## 📝 License

MIT - Feel free to use this as a learning resource.

---

## 🔗 Connect

**Author**: Bojan Mickoski  
**Background**: Senior Frontend Engineer (Angular/TypeScript)  
**Currently**: Expanding to React ecosystem

---

## 💭 Final Thoughts

> "The best way to learn a framework isn't to build a TODO app—it's to solve a problem you've already solved in another framework. The differences teach you more than the similarities."

If you're an Angular dev curious about React, or vice versa, I hope this codebase gives you a head start.
