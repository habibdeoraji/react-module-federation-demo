import { Routes, Route } from 'react-router-dom'
import './App.css'
import Home from './pages/Home'
import ChildPage from './pages/ChildPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/child" element={<ChildPage />} />
    </Routes>
  )
}

export default App
