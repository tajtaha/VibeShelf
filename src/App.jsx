import { useState, useEffect, useRef } from "react";
import { getGames } from "./services/gamesApi";
import "./App.css";

export default function App() {
  const [detailsTab, setDetailsTab] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [games, setGames] = useState([]);
  const [libraryGames, setLibraryGames] = useState([]);
  const [tab, setTab] = useState("GamesList");
  const [showAddGame, setShowAddGame] = useState(false);
  const [showAddList, setShowAddList] = useState(false);
  const [lists, setLists] = useState([
    {
      title: "finished",
      games: [],
    },
    {
      title: "dropped",
      games: [],
    },
    { title: "finished", games: [] },
  ]);

  function showGameDetails(gameId) {
    setSelectedGameId(gameId);
    setDetailsTab(true);
  }

  return (
    <div>
      <NavBar setTab={setTab} />
      <div className="App">
        {tab == "Library" ? (
          <Library
            libraryGames={libraryGames}
            setLibraryGames={setLibraryGames}
            showGameDetails={showGameDetails}
          />
        ) : null}
        {tab == "GamesList" ? (
          <GamesList
            showGameDetails={showGameDetails}
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
        {tab == "Lists" ? (
          <Lists
            lists={lists}
            setShowAddGame={setShowAddGame}
            setShowAddList={setShowAddList}
          />
        ) : null}
        {showAddGame && (
          <AddGameToList
            setShowAddGame={setShowAddGame}
            libraryGames={libraryGames}
            setGames={setGames}
          />
        )}
        {showAddList && (
          <AddList setShowAddList={setShowAddList} setLists={setLists} />
        )}
      </div>
    </div>
  );
}

function NavBar({ setTab }) {
  return (
    <nav className="nav-bar">
      <button onClick={() => setTab("GamesList")}>Home</button>
      <button onClick={() => setTab("Library")}>Library</button>
      <button onClick={() => setTab("Lists")}>Lists</button>
    </nav>
  );
}

function GamesList({
  games,
  setGames,
  setLibraryGames,
  libraryGames,
  showGameDetails,
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
        {games.map((game, index) => {
          const isInLibrary = libraryGames.some(
            (libraryGame) => libraryGame.id === game.id,
          );

          return (
            <article
              className="game-card"
              key={game.id}
              onClick={() => showGameDetails(game.id)}
            >
              <button
                className={`add-game-button${isInLibrary ? " is-in-library" : ""}`}
                type="button"
                aria-label={
                  isInLibrary
                    ? `${game.name} is already in your library`
                    : `Add ${game.name}`
                }
                onClick={(event) => {
                  event.stopPropagation();
                  event.currentTarget.blur();

                  if (isInLibrary) {
                    return;
                  }

                  setLibraryGames((previousGames) => [...previousGames, game]);
                }}
              >
                {isInLibrary ? "In library" : "+"}
              </button>
              <button>Add to List</button>
              <img
                src={
                  game.background_image || "assets/No-Image-Placeholder-Light"
                }
                alt={game.name}
              />
              <div className="game-card-content">
                <span className="card-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{game.name}</h2>
                <p>{game.released || "Release date unknown"}</p>
              </div>
            </article>
          );
        })}
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
        src={game.background_image || "assets/No-Image-Placeholder-Light"}
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

function Library({ libraryGames, setLibraryGames, showGameDetails }) {
  return (
    <main className="library-area">
      <header className="page-header">
        <div>
          <p className="eyebrow">Your collection</p>
          <h1>My Library</h1>
        </div>

        <span className="game-count">{libraryGames.length} games</span>
      </header>

      {libraryGames.length === 0 ? (
        <div className="empty-library">
          <h2>Your library is empty</h2>
          <p>Add games from the home page and they'll appear here.</p>
        </div>
      ) : (
        <div className="library-grid">
          {libraryGames.map((game) => (
            <article
              className="library-card"
              key={game.id}
              onClick={() => showGameDetails(game.id)}
            >
              <img
                src={
                  game.background_image || "assets/No-Image-Placeholder-Light"
                }
                alt={game.name}
              />

              <div className="library-card-content">
                <h2>{game.name}</h2>

                <p>{game.released || "Release date unknown"}</p>

                <button
                  className="remove-game-button"
                  onClick={() =>
                    setLibraryGames((previousGames) =>
                      previousGames.filter(
                        (libraryGame) => libraryGame.id !== game.id,
                      ),
                    )
                  }
                >
                  Remove
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}

function Lists({ lists, setShowAddGame, setShowAddList }) {
  return (
    <div>
      <button onClick={() => setShowAddGame(true)}>Add a game +</button>
      <button onClick={() => setShowAddList(true)}>Add a list</button>
      {lists.map((list) => (
        <div>
          <h2>{list}</h2>
        </div>
      ))}
    </div>
  );
}

function AddGameToList({ setShowAddGame, libraryGames }) {
  return (
    <div>
      <button onClick={() => setShowAddGame(false)}>Back</button>

      <div></div>
      {libraryGames.map((game) => (
        <div key={game.id}>
          <img src={game.background_image} alt={game.name} />
          <h2>{game.name}</h2>
        </div>
      ))}
    </div>
  );
}

function AddList({ setShowAddList, setLists }) {
  const [listTitle, setListTitle] = useState("");

  function addList(listTitle) {
    setLists((prevLists) =>
      prevLists.map((list) => {
        if (list.title !== listTitle) return list;

        return { ...list, title: listTitle };
      }),
    );
  }

  return (
    <div>
      <button onClick={() => setShowAddList(false)}>Close</button>

      <input
        placeholder="List title"
        onChange={(e) => setListTitle(e.target.value)}
      />
      <button
        onClick={() => {
          addList(listTitle);
        }}
      >
        Add
      </button>
    </div>
  );
}
