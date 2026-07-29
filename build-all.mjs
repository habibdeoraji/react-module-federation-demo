import { execSync } from 'node:child_process'
import { cpSync, existsSync, rmSync } from 'node:fs'

console.log('Building parent (host)...')
execSync('npm run build', { stdio: 'inherit' })

console.log('\nBuilding child (remote)...')
execSync('npm run build', { stdio: 'inherit', cwd: 'child' })

console.log('\nCopying child build into build/child-app/...')
if (existsSync('build/child-app')) rmSync('build/child-app', { recursive: true })
cpSync('child/build', 'build/child-app', { recursive: true })

console.log(`
Done — single deployable folder: build/
  build/            -> parent app
  build/child-app/  -> child app (remoteEntry.js + its assets)

Serve build/ as one static site (npm run preview, or upload it as-is
to any static host) and both apps come along together.
`)
