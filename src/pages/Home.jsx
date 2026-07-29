import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const INITIAL_OPTIONS = [
  { id: 1, label: 'React', votes: 0 },
  { id: 2, label: 'Vue', votes: 0 },
  { id: 3, label: 'Svelte', votes: 0 },
  { id: 4, label: 'Angular', votes: 0 },
]

function Home() {
  const [options, setOptions] = useState(INITIAL_OPTIONS)
  const [votedId, setVotedId] = useState(null)
  const navigate = useNavigate()

  const totalVotes = options.reduce((sum, option) => sum + option.votes, 0)

  const handleVote = (id) => {
    setOptions((prev) =>
      prev.map((option) =>
        option.id === id ? { ...option, votes: option.votes + 1 } : option
      )
    )
    setVotedId(id)
  }

  const handleReset = () => {
    setOptions(INITIAL_OPTIONS)
    setVotedId(null)
  }

  return (
    <div className="app">
      <h1>Which framework do you like best?</h1>

      <ul className="options">
        {options.map((option) => {
          const percent =
            totalVotes === 0 ? 0 : Math.round((option.votes / totalVotes) * 100)

          return (
            <li key={option.id} className="option">
              <button
                type="button"
                className={`vote-btn${votedId === option.id ? ' voted' : ''}`}
                onClick={() => handleVote(option.id)}
              >
                <span className="option-label">{option.label}</span>
                <span className="option-count">{option.votes} votes</span>
              </button>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="percent">{percent}%</span>
            </li>
          )
        })}
      </ul>

      <div className="footer">
        <p>Total votes: {totalVotes}</p>
        <button type="button" className="reset-btn" onClick={handleReset}>
          Reset
        </button>
      </div>

      <button
        type="button"
        className="open-child-btn"
        onClick={() => navigate('/child')}
      >
        Open Child App →
      </button>
    </div>
  )
}

export default Home
