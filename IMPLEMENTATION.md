# How this was built — step by step

A walkthrough for reproducing this setup with your own two apps: embedding
one independent React app inside another, keeping both isolated (own
`package.json`, own `src/`, own build), composed at runtime via Module
Federation, and deployed as a single unit.

Prerequisites: Node 20+, npm, both apps on Vite + React (any recent major
version; this repo uses React 19 + Vite 8).

## 1. Start from two independent apps

Two Vite + React apps, each with its own `package.json`. Here child sits
nested inside Parent's folder for convenience, but that's cosmetic — it
could just as easily be a separate repo. The rule that matters: no shared
`node_modules`, no shared `src/`, no importing one's source from the other.

```bash
npm create vite@latest my-parent-app -- --template react
cd my-parent-app
npm create vite@latest child -- --template react   # nested, or anywhere else
cd child && npm install
```

## 2. Install the Module Federation plugin in both

```bash
# in child/
npm install --save-dev @module-federation/vite

# in the parent root
npm install --save-dev @module-federation/vite
```

## 3. Configure child as the remote

`child/vite.config.js` — declare a name, a `remoteEntry.js` filename, and
which component to expose:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'child_app',
      filename: 'remoteEntry.js',
      exposes: {
        './App': './src/App.jsx',
      },
      shared: ['react', 'react-dom'],
      dts: false, // no tsconfig.json in a plain-JS app; skip type generation
    }),
  ],
  server: {
    port: 5174,
    strictPort: true,
    origin: 'http://localhost:5174',
    cors: true,
  },
})
```

`shared: ['react', 'react-dom']` is the important part — it makes both apps
use the *same* React instance at runtime instead of two competing copies.
Without it, the child's hooks (`useState`, etc.) can break once mounted
inside Parent's tree.

## 4. Configure Parent as the host

`vite.config.js` at Parent's root — declare a name, and where to fetch the
remote from:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { federation } from '@module-federation/vite'

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'parent_host',
      remotes: {
        child_app: {
          type: 'module',
          name: 'child_app',
          entry: 'http://localhost:5174/remoteEntry.js',
          entryGlobalName: 'child_app',
          shareScope: 'default',
        },
      },
      shared: ['react', 'react-dom'],
      dts: false,
    }),
  ],
  server: {
    port: 5173,
    strictPort: true,
    origin: 'http://localhost:5173',
    cors: true,
  },
})
```

## 5. Add routing + the button to load the remote

```bash
npm install react-router-dom
```

Wrap the app in `BrowserRouter` (`src/main.jsx`), give it a router shell
(`src/App.jsx` with `<Routes>`), and lazy-load the remote in whichever route
should render it:

```jsx
// src/pages/ChildPage.jsx
import { lazy, Suspense } from 'react'

const RemoteChildApp = lazy(() => import('child_app/App'))

export default function ChildPage() {
  return (
    <Suspense fallback={<p>Loading…</p>}>
      <RemoteChildApp />
    </Suspense>
  )
}
```

`import('child_app/App')` isn't a real path on disk — `child_app` isn't a
package that exists anywhere. The `@module-federation/vite` plugin
intercepts that specifier at build/dev time and resolves it to whatever
`remoteEntry.js` exposes under `./App`, fetched from the URL configured in
step 4. Add a button/link elsewhere in Parent that navigates to this route.

## 6. Run it locally — two dev servers

```bash
# terminal 1
cd child && npm run dev        # http://localhost:5174

# terminal 2 (parent root)
npm run dev                    # http://localhost:5173
```

Child must be running before Parent tries to load its route, or you'll be
stuck on the `Suspense` fallback. Open Parent, click through to the child
route, confirm it renders with no console errors.

## 7. (Optional) Rename the build output

Vite defaults to `dist/`. To match Create React App's `build/` instead, add
to both `vite.config.js` files:

```js
build: {
  outDir: 'build',
},
```

## 8. Unify into a single deployable build

This is the part that turns "two apps, two hosts" into "one deployment."
Two changes, both mode-aware (different behavior in dev vs. production):

**`child/vite.config.js`** — set `base` so child's own asset URLs are
correct once nested under a sub-path in production:

```js
export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? '/child-app/' : '/',
  // ...rest of the config from step 3
}))
```

**Parent's `vite.config.js`** — point the remote `entry` at that same
sub-path (relative, same-origin) instead of `localhost:5174` when building
for production:

```js
export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  return {
    plugins: [
      react(),
      federation({
        name: 'parent_host',
        remotes: {
          child_app: {
            type: 'module',
            name: 'child_app',
            entry: isProd
              ? '/child-app/remoteEntry.js'
              : 'http://localhost:5174/remoteEntry.js',
            entryGlobalName: 'child_app',
            shareScope: 'default',
          },
        },
        shared: ['react', 'react-dom'],
        dts: false,
      }),
    ],
    build: { outDir: 'build' },
    // ...server/preview config
  }
})
```

Then a small script builds both and merges child's output into Parent's
build folder (see [`build-all.mjs`](build-all.mjs)):

```js
import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'

execSync('npm run build', { stdio: 'inherit' })                      // parent -> build/
execSync('npm run build', { stdio: 'inherit', cwd: 'child' })         // child -> child/build/
if (existsSync('build/child-app')) rmSync('build/child-app', { recursive: true })
cpSync('child/build', 'build/child-app', { recursive: true })
```

Wire it up as an npm script: `"build:all": "node build-all.mjs"`. Run it,
and `build/` is now one self-contained folder — Parent at the top level,
child under `build/child-app/` — deployable as a single static site with no
CORS to configure, since everything's served from one origin.

## 9. Deploy it

Any static host works since the output of step 8 is just static files. This
repo uses Vercel — [`vercel.json`](vercel.json):

```json
{
  "installCommand": "npm install && npm install --prefix child",
  "buildCommand": "npm run build:all",
  "outputDirectory": "build",
  "rewrites": [
    { "source": "/((?!.*\\..*).*)", "destination": "/index.html" }
  ]
}
```

The `installCommand` installs both apps' dependencies (Vercel only runs
`npm install` at the project root by default — child needs its own pass).
The `rewrites` entry is a SPA fallback: client-side routes like `/child`
aren't real files on disk, so without it a direct hit on that URL 404s
instead of loading `index.html` and letting React Router take over. The
regex rewrites anything *without* a dot in the path (client routes) while
leaving real files (`/child-app/remoteEntry.js`, `/assets/*.js`) alone.

```bash
vercel login          # or: generate a token at vercel.com/account/tokens
vercel link --yes --project your-project-name
vercel deploy --prod --yes
```

## Common pitfalls

- **Blank Suspense fallback forever**: child's dev server isn't running (dev)
  or the `entry` URL is wrong for the current mode (prod).
- **Hooks/state breaking once embedded**: `shared: ['react', 'react-dom']`
  missing from one side, or the two apps have incompatible React major
  versions — federation's shared-singleton mechanism needs compatible
  versions to actually dedupe.
- **CORS errors in dev**: child's `server.cors: true` / `origin` not set —
  only matters in dev, since prod is same-origin once unified.
- **404 on client-side routes in production**: missing the SPA-fallback
  rewrite from step 9 — the platform doesn't know `/child` should serve
  `index.html`.
- **`Unable to compile federated types` build warning**: harmless if your
  apps are plain JS with no `tsconfig.json` — set `dts: false` in the
  `federation()` config on both sides to silence it.
