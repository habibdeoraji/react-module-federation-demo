import { lazy, Suspense } from 'react'
import { Link } from 'react-router-dom'

// Loaded at runtime from the child app's own build (remoteEntry.js).
// The child app is not part of this app's build — it's fetched independently.
const RemoteChildApp = lazy(() => import('child_app/App'))

function ChildPage() {
  return (
    <div>
      <div className="child-page-bar">
        <Link to="/" className="reset-btn">
          ← Back to Parent
        </Link>
      </div>
      <Suspense fallback={<p style={{ textAlign: 'center' }}>Loading child app…</p>}>
        <RemoteChildApp />
      </Suspense>
    </div>
  )
}

export default ChildPage
