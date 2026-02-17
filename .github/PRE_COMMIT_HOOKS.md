# Pre-commit Hooks Setup

This project uses **Husky** and **lint-staged** to enforce code quality before commits.

## What Gets Checked

On every commit, the following checks run automatically **only on staged files**:

### Frontend (`src/**/*.{ts,tsx}`)

1. **ESLint** - Linting with auto-fix
2. **Prettier** - Code formatting

### Backend (`server/src/**/*.ts`)

1. **Prettier** - Code formatting
2. **TypeScript** - Type checking (no emit)

### Config Files (`*.{json,md,yml,yaml}`)

1. **Prettier** - Code formatting

## Manual Commands

### Frontend

```bash
# Lint all files
npm run lint

# Lint and auto-fix
npm run lint:fix

# Format all files
npm run format

# Check formatting (CI mode)
npm run format:check

# Type check
npm run type-check
```

### Backend

```bash
cd server

# Format all files
npm run format

# Check formatting
npm run format:check

# Type check
npm run type-check
```

## How It Works

1. **Husky** intercepts git commit
2. **lint-staged** runs configured tools only on staged files
3. If checks fail, commit is aborted
4. Fix issues and try again

### Configuration Files

- `.husky/pre-commit` - Husky hook script
- `.lintstagedrc.json` - lint-staged rules
- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to skip formatting
- `eslint.config.js` - ESLint rules (frontend)

## Bypassing Hooks (Emergency Only)

```bash
# Skip pre-commit hooks (not recommended)
git commit --no-verify -m "emergency fix"
```

⚠️ **Warning:** Only use `--no-verify` in emergencies. CI will still run checks!

## Installation

Hooks are installed automatically via the `prepare` script when running:

```bash
npm install
```

If hooks aren't working:

```bash
# Reinstall hooks
npx husky install
```

## Troubleshooting

### Issue: "Hooks not running"

**Solution:**

```bash
# Ensure Husky is installed
npx husky install

# Check pre-commit hook exists and is executable
ls -la .husky/pre-commit
```

### Issue: "lint-staged command not found"

**Solution:**

```bash
# Install dependencies
npm install
```

### Issue: "ESLint/Prettier errors on commit"

**Solution:**

```bash
# Auto-fix what can be fixed
npm run lint:fix
npm run format

# Stage fixed files
git add .

# Commit again
git commit -m "your message"
```

### Issue: "TypeScript errors in server"

**Solution:**

```bash
cd server
npm run type-check

# Fix the TypeScript errors
# Then commit again
```

## CI/CD Integration

These same checks run in CI:

```yaml
# .github/workflows/ci.yml
- name: Lint
  run: npm run lint

- name: Format Check
  run: npm run format:check

- name: Type Check
  run: npm run type-check
```

## Best Practices

1. **Commit often** - Smaller commits = faster checks
2. **Stage incrementally** - Use `git add -p` for partial staging
3. **Fix issues immediately** - Don't accumulate linting debt
4. **Run checks manually** - Test before committing: `npm run lint:fix && npm run format`

## Adding New Rules

### Add ESLint Rule

Edit `eslint.config.js`:

```js
export default defineConfig([
  {
    rules: {
      "no-console": "warn", // Example: warn on console.log
    },
  },
]);
```

### Add Prettier Rule

Edit `.prettierrc`:

```json
{
  "printWidth": 100,
  "semi": true
}
```

### Add lint-staged Rule

Edit `.lintstagedrc.json`:

```json
{
  "src/**/*.{ts,tsx}": [
    "eslint --fix",
    "prettier --write",
    "vitest related --run" // Example: run related tests
  ]
}
```

## Performance

lint-staged is **fast** because:

- ✅ Only checks staged files (not entire codebase)
- ✅ Runs tasks in parallel
- ✅ Caches results when possible

Typical commit check time: **2-5 seconds**

## Further Reading

- [Husky Documentation](https://typicode.github.io/husky/)
- [lint-staged Documentation](https://github.com/okonet/lint-staged)
- [Prettier Documentation](https://prettier.io/)
- [ESLint Documentation](https://eslint.org/)
