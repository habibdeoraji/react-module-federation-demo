import { useState } from 'react'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="app">
      <p className="badge">Child App — rendered via Module Federation</p>
      <h1>child</h1>
      <button
        type="button"
        className="counter"
        onClick={() => setCount((c) => c + 1)}
      >
        Count is {count}
      </button>
    </div>
  )
}

export default App
