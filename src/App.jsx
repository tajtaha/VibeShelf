import { useState } from "react";
import GamesApp from "./GamesApp.jsx";
import MovieApp from "./MovieApp.jsx";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("Games");

  return (
    <div className="app-shell">
      <nav className="top-tabs" aria-label="Main sections">
        <button
          type="button"
          className={activeTab === "Movies" ? "active" : ""}
          onClick={() => setActiveTab("Movies")}
        >
          Movies
        </button>
        <button
          type="button"
          className={activeTab === "Games" ? "active" : ""}
          onClick={() => setActiveTab("Games")}
        >
          Games
        </button>
      </nav>

      {activeTab === "Movies" ? <MovieApp /> : <GamesApp />}
    </div>
  );
}
