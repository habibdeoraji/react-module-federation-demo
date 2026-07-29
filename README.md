# Parent + Child — Micro-Frontend via Module Federation

A reference/demo project — no live deployment, just the code and setup for
running it locally. Two fully independent React + Vite apps composed together
at runtime:

- **`Parent`** (this directory) — the shell/host app. Has its own `package.json`,
  `src/`, and build.
- **`Parent/child`** — a separate app nested inside Parent's folder for
  convenience, but not merged with it in any way: its own `package.json`,
  `node_modules`, `src/`, and build output. It could just as easily live in a
  different repo entirely.

They are stitched together with **Module Federation**
([`@module-federation/vite`](https://www.npmjs.com/package/@module-federation/vite)),
not by importing source code. Parent fetches the child's compiled bundle over
HTTP at runtime and renders it inline.

## Quick start

You need two terminals — each app runs its own dev server.

```bash
# terminal 1 — child (must be running before Parent tries to load it)
cd child
npm install
npm run dev
# -> http://localhost:5174

# terminal 2 — parent
cd ..            # back in Parent/
npm install
npm run dev
# -> http://localhost:5173
```

Open **http://localhost:5173** in a browser:

1. You land on the Parent home page (a small "which framework do you like
   best" voting app).
2. Click **"Open Child App →"** at the bottom.
3. The URL changes to `http://localhost:5173/child` and the child app's UI
   renders inline, in place, with no full page reload.
4. Click **"← Back to Parent"** to return.

If child isn't running when you load `/child`, you'll see the "Loading child
app…" fallback hang — start the child dev server and refresh.

## How it's wired up (architecture)

```
Parent (host, :5173)                    child (remote, :5174)
┌───────────────────────────┐           ┌───────────────────────────┐
│ vite.config.js            │           │ vite.config.js            │
│  federation({             │  HTTP     │  federation({             │
│    remotes: {             │ ────────► │    name: 'child_app',     │
│      child_app: {         │  fetches  │    filename:'remoteEntry.js│
│        entry: 'http://    │  remoteEntry.js  exposes: {           │
│         localhost:5174/   │  at        │      './App':             │
│         remoteEntry.js'   │  runtime  │       './src/App.jsx',    │
│      }                    │           │    },                     │
│    },                     │           │    shared: [               │
│    shared: ['react',      │◄─────────►│  'react','react-dom'],   │
│      'react-dom'],        │  React is │  }),                      │
│  })                       │  a shared │ ]                         │
└───────────────────────────┘  singleton└───────────────────────────┘
```

- **`shared: ['react', 'react-dom']`** — both apps declare React as a
  federation-shared dependency, so at runtime there is exactly **one** React
  instance loaded in the page, no matter which app renders which component.
  This is what lets the child's own `useState`/hooks work correctly once it's
  mounted inside Parent's tree.
- Nothing is imported at build time across the two apps — Parent's build
  never touches child's `src/`, and vice versa. The only coupling is the
  runtime URL to `remoteEntry.js`.
- Each app keeps its own independent build/deploy pipeline. You could deploy
  child to a completely different host/CDN and just update the `entry` URL
  in Parent's config.

### Key files

| File | Role |
|---|---|
| [`vite.config.js`](vite.config.js) | Parent's federation config — declares itself `parent_host` and points at `child_app`'s `remoteEntry.js` |
| [`child/vite.config.js`](child/vite.config.js) | Child's federation config — declares itself `child_app` and exposes `./App` (its `src/App.jsx`) |
| [`src/App.jsx`](src/App.jsx) | Parent's router shell (`react-router-dom` `<Routes>`) |
| [`src/pages/Home.jsx`](src/pages/Home.jsx) | Parent's home page (voting UI) + the "Open Child App →" button |
| [`src/pages/ChildPage.jsx`](src/pages/ChildPage.jsx) | The `/child` route — `React.lazy(() => import('child_app/App'))` wrapped in `Suspense`, plus the back link |
| [`child/src/App.jsx`](child/src/App.jsx) | The child app's actual UI — this is the exact component that gets federated in, unmodified from how it'd run standalone |

`import('child_app/App')` in `ChildPage.jsx` looks like a normal dynamic
import, but `child_app` isn't a real package on disk — the
`@module-federation/vite` plugin intercepts that specifier and resolves it to
whatever `remoteEntry.js` exposes under `./App` at runtime.

## Running the child app on its own

Because it's fully independent, you can run/build/deploy it with zero
awareness of Parent:

```bash
cd child
npm run dev      # http://localhost:5174 — the child app standalone
```

## Production build

Each app's `npm run build` outputs to a `build/` folder (not Vite's default
`dist/`) — configured via `build.outDir` in each `vite.config.js`, to match
the Create React App convention.

```bash
# build child first
cd child && npm run build && npm run preview   # serves remoteEntry.js on :5174

# then build parent
cd .. && npm run build && npm run preview       # serves the shell on :5173
```

For a real deployment, child needs to be hosted somewhere reachable (its own
static host/CDN/subdomain), and Parent's `vite.config.js` `remotes.child_app.entry`
URL needs to point there instead of `localhost:5174`.

## Known note

`react-router-dom` pulls in a `react-router` version range that `npm audit`
flags as high-severity (a CSRF bypass specific to **RSC mode**). This app is a
plain client-side SPA — no React Server Components, no server actions — so
the advisory doesn't apply to how it's used here. Left as-is rather than
force-downgrading; worth revisiting if this app's usage of react-router ever
changes.
