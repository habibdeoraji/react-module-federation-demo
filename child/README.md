# child

The remote app in this Module Federation setup. Fully independent React +
Vite app — its own `package.json`, `src/`, and build — exposed as
`child_app/App` and consumed by the Parent app at runtime.

Runs standalone on its own:

```bash
npm install
npm run dev   # http://localhost:5174
```

See the [root README](../README.md) for how this fits together with Parent.
