import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <div className="app">
      <button
        type="button"
        className="open-child-btn"
        onClick={() => navigate("/child")}
      >
        Open Child App →
      </button>
    </div>
  );
}

export default Home;
