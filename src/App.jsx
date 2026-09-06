import { useState, useEffect, useRef } from "react";
import { getGames } from "./services/gamesApi";
import "./App.css";

export default function App() {
  const [detailsTab, setDetailsTab] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [games, setGames] = useState([]);
  const localLibraryGames =
    JSON.parse(localStorage.getItem("libraryGames")) || [];
  const [libraryGames, setLibraryGames] = useState(localLibraryGames);
  const [tab, setTab] = useState("GamesList");
  const [showAddList, setShowAddList] = useState(false);
  const localLists = JSON.parse(localStorage.getItem("lists")) || [];
  const [lists, setLists] = useState(localLists);

  useEffect(() => {
    localStorage.setItem("lists", JSON.stringify(lists));
    localStorage.setItem("libraryGames", JSON.stringify(libraryGames));
  }, [lists, libraryGames]);

  function showGameDetails(gameId) {
    setSelectedGameId(gameId);
    setDetailsTab(true);
  }

  function handleAddToList(listTitle, game) {
    setLists((previousLists) =>
      previousLists.map((list) => {
        if (list.title === listTitle) {
          return {
            ...list,
            games: [...list.games, game],
          };
        }

        return list;
      }),
    );
  }

  function handleAddList(listTitle) {
    setLists((previousLists) => [
      ...previousLists,
      {
        title: listTitle,
        games: [],
      },
    ]);

    setShowAddList(false);
  }

  function handleDeleteFromList(listTitle, gameId) {
    setLists((previousLists) =>
      previousLists.map((list) => {
        if (list.title === listTitle) {
          return {
            ...list,
            games: list.games.filter((game) => game.id !== gameId),
          };
        }
        return list;
      }),
    );
  }

  function handleDeleteList(listTitle) {
    setLists((previousLists) =>
      previousLists.filter((list) => list.title !== listTitle),
    );

    localStorage.setItem("lists", JSON.stringify(lists));
  }

  function handleDeleteLibraryGame(gameId) {
    setLibraryGames((previousGames) =>
      previousGames.filter((libraryGame) => libraryGame.id !== gameId),
    );
    localStorage.setItem("libraryGames", JSON.stringify([libraryGames]));
  }

  return (
    <div>
      <NavBar setTab={setTab} setDetailsTab={setDetailsTab} />
      <div className="App">
        {tab == "Library" ? (
          <Library
            libraryGames={libraryGames}
            setLibraryGames={setLibraryGames}
            showGameDetails={showGameDetails}
            onDeleteLibraryGame={handleDeleteLibraryGame}
          />
        ) : null}
        {tab == "GamesList" ? (
          <GamesList
            showGameDetails={showGameDetails}
            games={games}
            setGames={setGames}
            setLibraryGames={setLibraryGames}
            libraryGames={libraryGames}
            lists={lists}
            onAddToList={handleAddToList}
            onAddList={handleAddList}
            setShowAddList={setShowAddList}
          />
        ) : null}
        {detailsTab && selectedGameId && (
          <GameDetails
            games={games}
            gameId={selectedGameId}
            setDetailsTab={setDetailsTab}
            onAddToList={handleAddToList}
          />
        )}
        {tab == "Lists" ? (
          <Lists
            lists={lists}
            setShowAddList={setShowAddList}
            showGameDetails={showGameDetails}
            onDeleteFromList={handleDeleteFromList}
            onDeleteList={handleDeleteList}
          />
        ) : null}
        {showAddList && (
          <AddList setShowAddList={setShowAddList} onAddList={handleAddList} />
        )}
      </div>
    </div>
  );
}

function NavBar({ setTab, setDetailsTab }) {
  function changeTab(tabName) {
    setDetailsTab(false);
    setTab(tabName);
  }
  return (
    <nav className="nav-bar">
      <button onClick={() => changeTab("GamesList")}>Home</button>
      <button onClick={() => changeTab("Library")}>Library</button>
      <button onClick={() => changeTab("Lists")}>Lists</button>
    </nav>
  );
}

function GamesList({
  games,
  setGames,
  setLibraryGames,
  libraryGames,
  showGameDetails,
  onAddToList,
  lists,
  setShowAddList,
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

                  localStorage.setItem(
                    "libraryGames",
                    JSON.stringify([libraryGames]),
                  );
                }}
              >
                {isInLibrary ? "In library" : "+"}
              </button>
              <div
                className="flyout"
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button">Add to List</button>

                <div className="flyout-menu">
                  {lists.map((list) => (
                    <button
                      key={list.title}
                      type="button"
                      onClick={() => onAddToList(list.title, game)}
                    >
                      {list.title}
                    </button>
                  ))}
                  <button onClick={() => setShowAddList(true)} type="button">
                    New List +
                  </button>
                </div>
              </div>

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

function Library({ libraryGames, onDeleteLibraryGame, showGameDetails }) {
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
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteLibraryGame(game.id);
                  }}
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

function Lists({
  lists,
  setShowAddList,
  showGameDetails,
  onDeleteFromList,
  onDeleteList,
}) {
  return (
    <main className="lists-area">
      <header className="lists-header">
        <div>
          <p className="eyebrow">Your collection</p>
          <h1>Game lists</h1>
        </div>
        <div className="lists-actions">
          <button
            className="primary-button"
            onClick={() => setShowAddList(true)}
          >
            Add a list
          </button>
        </div>
      </header>
      {lists.map((list) => (
        <section className="list-panel" key={list.title}>
          <h2>{list.title}</h2>
          <button
            onClick={(event) => {
              event.stopPropagation();
              onDeleteList(list.title);
            }}
          >
            Remove List
          </button>
          <div className="list-games">
            {list.games.map((game) => (
              <div
                className="list-game"
                key={game.id}
                onClick={() => showGameDetails(game.id)}
              >
                <img src={game.background_image} alt={game.name} />
                <p>{game.name}</p>
                <button
                  onClick={(event) => {
                    event.stopPropagation();
                    onDeleteFromList(list.title, game.id);
                  }}
                >
                  Remove
                </button>
              </div>
            ))}
            {list.games.length === 0 && (
              <p className="empty-list">No games in this list yet.</p>
            )}
          </div>
        </section>
      ))}
    </main>
  );
}

function AddList({ setShowAddList, onAddList }) {
  const [listTitle, setListTitle] = useState("");

  return (
    <section className="add-list-panel">
      <div className="add-list-heading">
        <div>
          <p className="eyebrow">Create a collection</p>
          <h2>New list</h2>
        </div>
        <button className="close-button" onClick={() => setShowAddList(false)}>
          Close
        </button>
      </div>

      <input
        className="list-title-input"
        placeholder="List title"
        onChange={(e) => setListTitle(e.target.value)}
      />
      <button
        className="primary-button"
        onClick={() => {
          onAddList(listTitle);
        }}
      >
        Add
      </button>
    </section>
  );
}
