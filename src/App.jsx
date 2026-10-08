import { useState } from "react";
import GamesApp from "./GamesApp.jsx";
import MovieApp from "./MovieApp.jsx";
import "./App.css";

export default function App() {
  const [activeTab, setActiveTab] = useState("Movies");
  const [visitedTabs, setVisitedTabs] = useState({
    Movies: true,
    Games: false,
  });

  function changeTab(tab) {
    setActiveTab(tab);
    setVisitedTabs((previousTabs) => ({ ...previousTabs, [tab]: true }));
  }

  return (
    <div className="app-shell">
      <nav className="top-tabs" aria-label="Main sections">
        <button
          type="button"
          className={activeTab === "Movies" ? "active" : ""}
          onClick={() => changeTab("Movies")}
        >
          Movies
        </button>
        <button
          type="button"
          className={activeTab === "Games" ? "active" : ""}
          onClick={() => changeTab("Games")}
        >
          Games
        </button>
      </nav>

      {visitedTabs.Movies && (
        <div style={{ display: activeTab === "Movies" ? "block" : "none" }}>
          <MovieApp />
        </div>
      )}
      {visitedTabs.Games && (
        <div style={{ display: activeTab === "Games" ? "block" : "none" }}>
          <GamesApp />
        </div>
      )}
    </div>
  );
}
