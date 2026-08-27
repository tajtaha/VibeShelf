import { useState, useEffect, useRef } from "react";
import { getGames } from "./services/gamesApi";
import "./App.css";

export default function App() {
  const [detailsTab, setDetailsTab] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [games, setGames] = useState([]);
  const [libraryGames, setLibraryGames] = useState([]);
  const [tab, setTab] = useState("GamesList");

  return (
    <div className="App">
      <NavBar setTab={setTab} />
      {tab == "Library" ? <Library libraryGames={libraryGames} /> : null}
      {tab == "GamesList" ? (
        <GamesList
          setDetailsTab={setDetailsTab}
          setSelectedGameId={setSelectedGameId}
          games={games}
          setGames={setGames}
          setLibraryGames={setLibraryGames}
          libraryGames={libraryGames}
        />
      ) : null}
      {detailsTab && selectedGameId && (
        <GameDetails
          games={games}
          gameId={selectedGameId}
          setDetailsTab={setDetailsTab}
        />
      )}
    </div>
  );
}

function NavBar({ setTab }) {
  return (
    <div>
      <button onClick={() => setTab("GamesList")}>Home</button>
      <button onClick={() => setTab("Library")}>Library</button>
      <button onClick={() => setTab("Lists")}>Lists</button>
    </div>
  );
}

function GamesList({
  setDetailsTab,
  games,
  setGames,
  setSelectedGameId,
  setLibraryGames,
  libraryGames,
}) {
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState("metacritic");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("desc");
  const [error, setError] = useState("");

  function handleLoadMore() {
    setPage((prevPage) => prevPage + 1);
  }

  useEffect(() => {
    const controller = new AbortController();
    async function fetchGames() {
      setLoading(true);

      try {
        const newGames = await getGames(
          page,
          ordering,
          searchQuery,
          sort,
          controller.signal,
        );

        setGames((prevGames) => {
          const gamesMap = new Map();

          [...prevGames, ...newGames].forEach((game) => {
            gamesMap.set(game.id, game);
          });

          return [...gamesMap.values()];
        });
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }

        console.error("Fetch error:", error);
        setError(`Error: ${error}`);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
    return () => controller.abort();
  }, [page, ordering, searchQuery, sort, setGames]);

  function showGameDetails(gameId) {
    setSelectedGameId(gameId);
    setDetailsTab(true);
  }

  return (
    <main className="games-area">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your games library</p>
          <h1>Discover something great</h1>
        </div>
        <span className="game-count">{games.length} games</span>
      </header>

      <SearchBar
        setSearchQuery={setSearchQuery}
        setPage={setPage}
        setGames={setGames}
        setOrdering={setOrdering}
        setSort={setSort}
        ordering={ordering}
        sort={sort}
      />

      <div className="game-grid">
        {games.map((game, index) => (
          <article
            className="game-card"
            key={game.id}
            onClick={() => showGameDetails(game.id)}
          >
            <button
              className="add-game-button"
              type="button"
              aria-label={`Add ${game.name}`}
              onClick={(event) => {
                event.stopPropagation();
                setLibraryGames((previousGames) => [...previousGames, game]);
              }}
            >
              +
            </button>
            <img src={game.background_image} alt={game.name} />
            <div className="game-card-content">
              <span className="card-number">
                {String(index + 1).padStart(2, "0")}
              </span>
              <h2>{game.name}</h2>
              <p>{game.released || "Release date unknown"}</p>
            </div>
          </article>
        ))}
      </div>

      <button className="load-more" onClick={handleLoadMore} disabled={loading}>
        {loading ? "Loading..." : "Load more games"}
      </button>
      <p>{error}</p>
    </main>
  );
}

function SearchBar({
  setSearchQuery,
  setPage,
  setOrdering,
  setGames,
  setSort,
  ordering,
  sort,
}) {
  function handleOrderingChange(event) {
    setOrdering(event.target.value);
    setPage(1);
    setGames([]);
  }
  const searchTimer = useRef(null);

  function handleSearch(event) {
    const value = event.target.value;

    clearTimeout(searchTimer.current);

    searchTimer.current = setTimeout(() => {
      setSearchQuery(value);
      setOrdering("metacritic");
      setPage(1);
      setGames([]);
    }, 500);
  }

  useEffect(() => {
    return () => clearTimeout(searchTimer.current);
  }, []);
  function handleSort() {
    setSort((prevSort) => (prevSort === "desc" ? "asc" : "desc"));
    setPage(1);
    setGames([]);
  }
  return (
    <div className="toolbar">
      <label>
        <span>Sort by</span>
        <select value={ordering} onChange={handleOrderingChange}>
          <option value="rating">Rating</option>
          <option value="released">Released</option>
          <option value="name">Name</option>
          <option value="metacritic">Metacritic</option>
          <option value="added">Added</option>
          <option value="created">Created</option>
        </select>
      </label>
      <button
        className="sort-button"
        onClick={handleSort}
        aria-label="Toggle sort direction"
      >
        {sort === "desc" ? "↓ Descending" : "↑ Ascending"}
      </button>
      <input
        className="search-input"
        placeholder="Search games..."
        onChange={handleSearch}
      />
    </div>
  );
}

function GameDetails({ gameId, setDetailsTab, games }) {
  const game = games.find((item) => item.id === gameId);

  if (!game) {
    return null;
  }

  const listValues = (items) =>
    items?.map((item) => item.name).join(", ") || "Not listed";

  return (
    <aside className="details-panel">
      <button className="back-button" onClick={() => setDetailsTab(false)}>
        ← Back to library
      </button>
      <img
        className="details-image"
        src={game.background_image}
        alt={game.name}
      />
      <div className="details-content">
        <p className="eyebrow">Game details</p>
        <h2>{game.name}</h2>
        <p className="details-description">
          {game.description_raw ||
            game.description ||
            "No description available."}
        </p>
        <div className="stats-grid">
          <div>
            <span>Rating</span>
            <strong>{game.rating ?? "-"} / 5</strong>
          </div>
          <div>
            <span>Metacritic</span>
            <strong>{game.metacritic ?? "-"}</strong>
          </div>
          <div>
            <span>Released</span>
            <strong>{game.released || "-"}</strong>
          </div>
          <div>
            <span>Playtime</span>
            <strong>{game.playtime ? `${game.playtime} hrs` : "-"}</strong>
          </div>
        </div>
        <dl className="details-list">
          <div>
            <dt>Genres</dt>
            <dd>{listValues(game.genres)}</dd>
          </div>
          <div>
            <dt>Platforms</dt>
            <dd>{listValues(game.platforms?.map((item) => item.platform))}</dd>
          </div>
          <div>
            <dt>Developers</dt>
            <dd>{listValues(game.developers)}</dd>
          </div>
          <div>
            <dt>Publishers</dt>
            <dd>{listValues(game.publishers)}</dd>
          </div>
          <div>
            <dt>Tags</dt>
            <dd>{listValues(game.tags)}</dd>
          </div>
        </dl>
        {game.website && (
          <a
            className="website-link"
            href={game.website}
            target="_blank"
            rel="noreferrer"
          >
            Visit official website ↗
          </a>
        )}
      </div>
    </aside>
  );
}

function Library({ libraryGames }) {
  return (
    <div>
      {libraryGames.map((game) => (
        <p key={game.id}>{game.name}</p>
      ))}
    </div>
  );
}
