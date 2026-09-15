import { useState, useEffect, useRef } from "react";
import { getGames } from "./services/gamesApi";
import StarRating from "./StarRating.jsx";
import defaultGameImage from "./assets/No-Image-Placeholder-Light.png";
import "./App.css";

const fallbackGameImage = defaultGameImage;

function escapeHtml(value = "") {
  return String(value).replace(
    /[&<>'"]/g,
    (character) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;",
      })[character],
  );
}

function downloadLibraryHtml(games, personalData = {}, collection = {}) {
  const collectionTitle = collection.title || "My Game Library";
  const collectionDescription =
    collection.description || "A collection of games worth playing.";
  const {
    userRating = {},
    hoursPlayed = {},
    dateStarted = {},
    dateFinished = {},
    note = {},
  } = personalData;
  const cards = games
    .map(
      (game, index) => `
    <article class="game-card">
      <img src="${escapeHtml(game.background_image || fallbackGameImage)}" alt="${escapeHtml(game.name)} cover">
      <div class="game-info">
        <span class="game-number">${String(index + 1).padStart(2, "0")}</span>
        <h2>${escapeHtml(game.name)}</h2>
        <p>${escapeHtml(game.released || "Release date unknown")}</p>
      </div>
    </article>`,
    )
    .join("");
  const detailsPanels = games
    .map(
      (game, index) => `
    <section class="details-panel" id="details-${index}" hidden>
      <button class="details-back" type="button" data-close-details>← Back to library</button>
      <img class="details-image" src="${escapeHtml(game.background_image || fallbackGameImage)}" alt="${escapeHtml(game.name)} cover">
      <div class="details-content">
        <p class="eyebrow">Game details</p>
        <h2>${escapeHtml(game.name)}</h2>
        <p class="details-description">${escapeHtml(game.description_raw || game.description || "No description available.")}</p>
        <div class="stats-grid">
          <div><span>Rating</span><strong>${escapeHtml(game.rating ?? "-")} / 5</strong></div>
          <div><span>Metacritic</span><strong>${escapeHtml(game.metacritic ?? "-")}</strong></div>
          <div><span>Released</span><strong>${escapeHtml(game.released || "-")}</strong></div>
          <div><span>Playtime</span><strong>${escapeHtml(game.playtime ? `${game.playtime} hrs` : "-")}</strong></div>
        </div>
        <dl class="details-list">
          <div><dt>Genres</dt><dd>${escapeHtml(game.genres?.map((item) => item.name).join(", ") || "Not listed")}</dd></div>
          <div><dt>Platforms</dt><dd>${escapeHtml(game.platforms?.map((item) => item.platform?.name).join(", ") || "Not listed")}</dd></div>
          <div><dt>Developers</dt><dd>${escapeHtml(game.developers?.map((item) => item.name).join(", ") || "Not listed")}</dd></div>
          <div><dt>Publishers</dt><dd>${escapeHtml(game.publishers?.map((item) => item.name).join(", ") || "Not listed")}</dd></div>
        </dl>
        <div class="personal-details">
          <p class="eyebrow">Your progress</p>
          <h3>Personal details</h3>
          <dl class="details-list">
            <div><dt>Your rating</dt><dd>${escapeHtml(userRating[game.id] || "Not rated")}</dd></div>
            <div><dt>Hours played</dt><dd>${escapeHtml(hoursPlayed[game.id] || "Not logged")}</dd></div>
            <div><dt>Date started</dt><dd>${escapeHtml(dateStarted[game.id] || "Not logged")}</dd></div>
            <div><dt>Date finished</dt><dd>${escapeHtml(dateFinished[game.id] || "Not logged")}</dd></div>
          </dl>
          ${note[game.id] ? `<blockquote>${escapeHtml(note[game.id])}</blockquote>` : ""}
        </div>
      </div>
    </section>`,
    )
    .join("");

  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(collectionTitle)}</title>
    <style>
      * { box-sizing: border-box; }
      body { margin: 0; background: #eef1ed; color: #20282c; font-family: Arial, sans-serif; }
      main { width: min(1120px, calc(100% - 40px)); margin: auto; padding: 56px 0 72px; }
      header { display: flex; align-items: end; justify-content: space-between; gap: 24px; margin-bottom: 34px; padding-bottom: 26px; border-bottom: 1px solid #d7e0d9; }
      .eyebrow { margin: 0 0 10px; color: #236b56; font-size: .72rem; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; }
      h1 { margin: 0; font-family: Georgia, serif; font-size: clamp(2.5rem, 7vw, 5.5rem); font-weight: 400; letter-spacing: -.06em; line-height: .9; }
      .count { color: #236b56; font-size: .75rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; white-space: nowrap; }
      .collection-description { max-width: 560px; margin: 16px 0 0; color: #68766f; font-size: .95rem; line-height: 1.55; }
      .game-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(210px, 1fr)); gap: 18px; }
      .game-card { overflow: hidden; border: 1px solid #d7e0d9; border-radius: 12px; background: #fff; box-shadow: 0 12px 26px #26392f14; cursor: pointer; transition: transform .18s ease, box-shadow .18s ease; }
      .game-card:hover, .game-card:focus-visible { transform: translateY(-4px); box-shadow: 0 18px 32px #26392f22; outline: 3px solid #236b5633; outline-offset: 3px; }
      .game-card img { display: block; width: 100%; aspect-ratio: 16 / 10; object-fit: cover; background: #dfe9e1; }
      .game-info { padding: 15px; }
      .game-number { color: #d06b42; font-size: .7rem; font-weight: 700; letter-spacing: .1em; }
      h2 { overflow: hidden; margin: 7px 0; font-size: 1rem; text-overflow: ellipsis; white-space: nowrap; }
      .game-info > p { margin: 0; color: #718078; font-size: .82rem; }
      .details-panel { overflow: hidden; margin-top: 24px; border: 1px solid #d5ddd6; border-radius: 12px; background: #fff; box-shadow: 0 18px 40px #26392f18; }
      .details-back { margin: 16px 16px 0; padding: 9px 12px; border: 1px solid #cbd5cd; border-radius: 5px; background: #fff; color: #236b56; cursor: pointer; font-weight: 700; }
      .details-image { display: block; width: 100%; height: 260px; margin-top: 16px; object-fit: cover; }
      .details-content { padding: 24px; }
      .details-content h2 { margin: 0 0 14px; font-size: 1.8rem; }
      .details-description { max-width: 780px; color: #586660; font-size: .92rem; line-height: 1.6; }
      .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin: 22px 0; padding: 16px 0; border-top: 1px solid #e0e6e1; border-bottom: 1px solid #e0e6e1; }
      .stats-grid span { display: block; color: #718078; font-size: .68rem; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }
      .stats-grid strong { display: block; margin-top: 5px; font-size: .9rem; }
      dl { margin: 0; }
      dl div { display: grid; grid-template-columns: 88px 1fr; gap: 10px; padding: 6px 0; border-bottom: 1px solid #edf0ed; }
      dt { color: #718078; font-size: .68rem; font-weight: 700; letter-spacing: .06em; text-transform: uppercase; }
      dd { margin: 0; color: #586660; font-size: .78rem; line-height: 1.35; }
      blockquote { margin: 14px 0 0; padding: 10px 12px; border-left: 3px solid #d06b42; background: #fff7f2; color: #586660; font-size: .82rem; line-height: 1.45; }
      .personal-details { margin-top: 26px; padding-top: 22px; border-top: 1px solid #e0e6e1; }
      .personal-details h3 { margin: 0 0 16px; font-size: 1.15rem; }
      footer { margin-top: 38px; color: #718078; font-size: .75rem; text-align: center; }
      @media (max-width: 600px) { main { width: min(100% - 28px, 560px); padding: 34px 0 48px; } header { display: block; } .count { display: block; margin-top: 18px; } .game-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .game-info { padding: 11px; } h2 { font-size: .88rem; } .stats-grid { grid-template-columns: repeat(2, 1fr); } .details-content { padding: 16px; } .details-image { height: 180px; } }
    </style>
  </head>
  <body>
    <main>
      <header>
        <div><p class="eyebrow">Shared collection</p><h1>${escapeHtml(collectionTitle)}</h1><p class="collection-description">${escapeHtml(collectionDescription)}</p></div>
        <span class="count">${games.length} ${games.length === 1 ? "game" : "games"}</span>
      </header>
      <section class="game-grid">${cards}</section>
      <div id="details-container">${detailsPanels}</div>
      <footer>Shared from Entertainment Tracker</footer>
    </main>
    <script>
      const cards = document.querySelectorAll(".game-card");
      const panels = document.querySelectorAll(".details-panel");
      cards.forEach((card, index) => {
        card.tabIndex = 0;
        card.addEventListener("click", () => openDetails(index));
        card.addEventListener("keydown", (event) => {
          if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openDetails(index); }
        });
      });
      function openDetails(index) {
        document.querySelector(".game-grid").hidden = true;
        panels.forEach((panel, panelIndex) => { panel.hidden = panelIndex !== index; });
        requestAnimationFrame(() => {
          panels[index].scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
      document.querySelectorAll("[data-close-details]").forEach((button) => {
        button.addEventListener("click", () => {
          panels.forEach((panel) => { panel.hidden = true; });
          document.querySelector(".game-grid").hidden = false;
        });
      });
    </script>
  </body>
</html>`;

  const objectUrl = URL.createObjectURL(
    new Blob([html], { type: "text/html" }),
  );
  const link = document.createElement("a");
  link.href = objectUrl;
  const filename =
    collectionTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "game-collection";
  link.download = `${filename}.html`;
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(objectUrl);
  }, 1000);
}

export default function App() {
  const [detailsTab, setDetailsTab] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [games, setGames] = useState([]);
  const localLibraryGames =
    JSON.parse(localStorage.getItem("libraryGames")) || [];
  const [libraryGames, setLibraryGames] = useState(localLibraryGames);
  const [tab, setTab] = useState("GamesList");
  const [showAddList, setShowAddList] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);
  const [shareCollection, setShareCollection] = useState("library");
  const localLists = JSON.parse(localStorage.getItem("lists")) || [];
  const [lists, setLists] = useState(localLists);
  const [errorMessage, setErrorMessage] = useState("");
  const [userRating, setUserRating] = useState(
    () => JSON.parse(localStorage.getItem("userRating")) || {},
  );
  const [hoursPlayed, setHoursPlayed] = useState(
    () => JSON.parse(localStorage.getItem("hoursPlayed")) || {},
  );
  const [dateStarted, setDateStarted] = useState(
    () => JSON.parse(localStorage.getItem("dateStarted")) || {},
  );
  const [dateFinished, setDateFinished] = useState(
    () => JSON.parse(localStorage.getItem("dateFinished")) || {},
  );
  const [note, setNote] = useState(
    () => JSON.parse(localStorage.getItem("note")) || {},
  );

  useEffect(() => {
    localStorage.setItem("lists", JSON.stringify(lists));
    localStorage.setItem("libraryGames", JSON.stringify(libraryGames));
  }, [lists, libraryGames]);

  useEffect(() => {
    localStorage.setItem("userRating", JSON.stringify(userRating));
    localStorage.setItem("hoursPlayed", JSON.stringify(hoursPlayed));
    localStorage.setItem("note", JSON.stringify(note));
    localStorage.setItem("dateFinished", JSON.stringify(dateFinished));
    localStorage.setItem("dateStarted", JSON.stringify(dateStarted));
  }, [userRating, hoursPlayed, note, dateFinished, dateStarted]);

  function showGameDetails(gameId) {
    setSelectedGameId(gameId);
    setDetailsTab(true);
  }

  function handleAddToList(listTitle, game) {
    if (
      lists.some(
        (list) =>
          list.title === listTitle &&
          list.games.some((item) => item.id === game.id),
      )
    ) {
      alert("This game is already in the list.");
      return;
    }

    setLists((previousLists) =>
      previousLists.map((list) =>
        list.title === listTitle
          ? { ...list, games: [...list.games, game] }
          : list,
      ),
    );
  }

  function handleAddList(listTitle, listDescription = "") {
    if (
      listTitle.trim() === "" ||
      lists.some((list) => list.title === listTitle)
    ) {
      setErrorMessage("List title cannot be empty or duplicate.");
      return;
    }

    setLists((previousLists) => [
      ...previousLists,
      { title: listTitle, description: listDescription, games: [] },
    ]);
    setShowAddList(false);
  }

  function handleDeleteFromList(listTitle, gameId) {
    setLists((previousLists) =>
      previousLists.map((list) =>
        list.title === listTitle
          ? { ...list, games: list.games.filter((game) => game.id !== gameId) }
          : list,
      ),
    );
  }

  function handleDeleteList(listTitle) {
    setLists((previousLists) =>
      previousLists.filter((list) => list.title !== listTitle),
    );
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
            lists={lists}
            onAddToList={handleAddToList}
            setShowAddList={setShowAddList}
            onOpenShare={() => {
              setShareCollection("library");
              setShowSharePanel(true);
            }}
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
            setUserRating={setUserRating}
            note={note}
            dateFinished={dateFinished}
            dateStarted={dateStarted}
            setNote={setNote}
            setDateFinished={setDateFinished}
            setDateStarted={setDateStarted}
            userRating={userRating}
            hoursPlayed={hoursPlayed}
            setHoursPlayed={setHoursPlayed}
          />
        )}
        {tab == "Lists" ? (
          <Lists
            lists={lists}
            setLists={setLists}
            setShowAddList={setShowAddList}
            showGameDetails={showGameDetails}
            onDeleteFromList={handleDeleteFromList}
            onDeleteList={handleDeleteList}
            onOpenShare={(collectionTitle) => {
              setShareCollection(
                collectionTitle || lists[0]?.title || "library",
              );
              setShowSharePanel(true);
            }}
          />
        ) : null}
        {showAddList && (
          <AddList
            setShowAddList={setShowAddList}
            onAddList={handleAddList}
            errorMessage={errorMessage}
          />
        )}
        {showSharePanel && (
          <SharePanel
            libraryGames={libraryGames}
            lists={lists}
            initialCollection={shareCollection}
            setShowSharePanel={setShowSharePanel}
            userRating={userRating}
            hoursPlayed={hoursPlayed}
            dateStarted={dateStarted}
            dateFinished={dateFinished}
            note={note}
          />
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
          const gameLists = lists
            .filter((list) =>
              list.games.some((listGame) => listGame.id === game.id),
            )
            .map((list) => list.title);

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

                <AddToListFlyout
                  lists={lists}
                  onAddToList={onAddToList}
                  game={game}
                  setShowAddList={setShowAddList}
                />
              </div>

              <img
                src={game.background_image || fallbackGameImage}
                alt={game.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackGameImage;
                }}
              />
              <div className="game-card-content">
                <span className="card-number">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div
                  className="game-list-tags"
                  aria-label="Lists containing this game"
                >
                  {gameLists.map((listTitle) => (
                    <span className="game-list-tag" key={listTitle}>
                      {listTitle}
                    </span>
                  ))}
                </div>
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
        type="search"
        aria-label="Search games"
        placeholder="Search games..."
        onChange={handleSearch}
      />
    </div>
  );
}

function GameDetails({
  gameId,
  setDetailsTab,
  games,
  setUserRating,
  hoursPlayed,
  setHoursPlayed,
  note,
  dateFinished,
  dateStarted,
  setNote,
  setDateFinished,
  setDateStarted,
  userRating,
}) {
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
        src={game.background_image || fallbackGameImage}
        alt={game.name}
        onError={(event) => {
          event.currentTarget.onerror = null;
          event.currentTarget.src = fallbackGameImage;
        }}
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
        <PersonalDetails
          setUserRating={setUserRating}
          selectedGameId={gameId}
          hoursPlayed={hoursPlayed}
          setHoursPlayed={setHoursPlayed}
          note={note}
          dateFinished={dateFinished}
          dateStarted={dateStarted}
          setNote={setNote}
          setDateFinished={setDateFinished}
          setDateStarted={setDateStarted}
          userRating={userRating}
        />
      </div>
    </aside>
  );
}

function Library({
  libraryGames,
  onDeleteLibraryGame,
  showGameDetails,
  lists,
  onAddToList,
  setShowAddList,
  onOpenShare,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedList, setSelectedList] = useState("all");

  const selectedListGames =
    selectedList === "all"
      ? libraryGames
      : lists.find((list) => list.title === selectedList)?.games || [];

  const filteredGames = selectedListGames.filter((game) =>
    game.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  function onChangeFilter(list) {
    setSelectedList(list);
    setSearchQuery("");
  }

  return (
    <main className="library-area">
      <header className="page-header">
        <button
          className="library-share-button"
          type="button"
          onClick={() =>
            onOpenShare(selectedList === "all" ? "library" : selectedList)
          }
        >
          <span aria-hidden="true">↗</span>
          Share library
        </button>
        <div>
          <p className="eyebrow">Your collection</p>
          <h1>My Library</h1>
        </div>
        <select
          className="library-filter"
          value={selectedList}
          onChange={(event) => onChangeFilter(event.target.value)}
        >
          <option value="all">All games</option>
          {lists.map((list) => (
            <option key={list.title} value={list.title}>
              {list.title}
            </option>
          ))}
        </select>
        <input
          className="library-search"
          placeholder="Search your library..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button
          className="clear-search-button"
          type="button"
          onClick={() => setSearchQuery("")}
          aria-label="Clear library search"
        >
          Clear
        </button>
        <span className="game-count">{filteredGames.length} games</span>
      </header>

      {filteredGames.length === 0 ? (
        <div className="empty-library">
          <h2>Your library is empty</h2>
          <p>Add games from the home page and they'll appear here.</p>
        </div>
      ) : (
        <div className="library-grid">
          {filteredGames.map((game) => (
            <article
              className="library-card"
              key={game.id}
              onClick={() => showGameDetails(game.id)}
            >
              <div
                className="flyout"
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button">Add to List</button>
                <AddToListFlyout
                  lists={lists}
                  onAddToList={onAddToList}
                  game={game}
                  setShowAddList={setShowAddList}
                />
              </div>
              <img
                src={game.background_image || fallbackGameImage}
                alt={game.name}
                onError={(event) => {
                  event.currentTarget.onerror = null;
                  event.currentTarget.src = fallbackGameImage;
                }}
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
  setLists,
  setShowAddList,
  showGameDetails,
  onDeleteFromList,
  onDeleteList,
  onOpenShare,
}) {
  const [draggedGameId, setDraggedGameId] = useState(null);
  const [draggedFromList, setDraggedFromList] = useState(null);

  function handleDragStart(gameId, listTitle) {
    setDraggedGameId(gameId);
    setDraggedFromList(listTitle);
  }

  function handleDrop(targetListTitle, gameId) {
    if (!draggedFromList || !draggedGameId) return;

    setLists((previousLists) => {
      const sourceList = previousLists.find(
        (list) => list.title === draggedFromList,
      );
      const targetList = previousLists.find(
        (list) => list.title === targetListTitle,
      );

      if (!sourceList || !targetList) return previousLists;

      const gameToMove = sourceList.games.find((game) => game.id === gameId);

      if (!gameToMove) return previousLists;

      if (draggedFromList === targetListTitle) return previousLists;

      if (targetList.games.some((game) => game.id === gameId)) {
        return previousLists;
      }

      return previousLists.map((list) => {
        if (list.title === draggedFromList) {
          return {
            ...list,
            games: list.games.filter((game) => game.id !== gameId),
          };
        }

        if (list.title === targetListTitle) {
          return {
            ...list,
            games: [...list.games, gameToMove],
          };
        }

        return list;
      });
    });

    setDraggedGameId(null);
    setDraggedFromList(null);
  }

  return (
    <main className="lists-area">
      <header className="lists-header">
        <button
          className="lists-share-button"
          type="button"
          onClick={() => onOpenShare(lists[0]?.title)}
        >
          Share Lists
        </button>
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
        <section
          className="list-panel"
          key={list.title}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => handleDrop(list.title, draggedGameId)}
        >
          <h2>{list.title}</h2>
          {list.description && (
            <p className="list-description">{list.description}</p>
          )}
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
                className={
                  draggedGameId === game.id ? "list-game dragging" : "list-game"
                }
                key={game.id}
                draggable
                onDragStart={() => handleDragStart(game.id, list.title)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.stopPropagation();
                  handleDrop(list.title, game.id);
                }}
                onDragEnd={() => {
                  setDraggedGameId(null);
                  setDraggedFromList(null);
                }}
                onClick={() => showGameDetails(game.id)}
              >
                <img
                  src={game.background_image || fallbackGameImage}
                  alt={game.name}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackGameImage;
                  }}
                />
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

function AddList({ setShowAddList, onAddList, errorMessage }) {
  const [listTitle, setListTitle] = useState("");
  const [listDescription, setListDescription] = useState("");

  return (
    <div className="add-list-overlay" onClick={() => setShowAddList(false)}>
      <section
        className="add-list-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="add-list-heading">
          <div>
            <p className="eyebrow">Create a collection</p>
            <h2>New list</h2>
          </div>
          <button
            className="close-button"
            onClick={() => setShowAddList(false)}
          >
            Close
          </button>
        </div>
        {errorMessage && <p className="add-list-error">{errorMessage}</p>}

        <input
          className="list-title-input"
          placeholder="List title"
          onChange={(e) => setListTitle(e.target.value)}
        />
        <input
          className="list-description-input"
          placeholder="List description (optional)"
          onChange={(e) => setListDescription(e.target.value)}
        />
        <button
          className="primary-button"
          onClick={() => {
            onAddList(listTitle, listDescription);
          }}
        >
          Add
        </button>
      </section>
    </div>
  );
}

function PersonalDetails({
  setUserRating,
  userRating,
  selectedGameId,
  setHoursPlayed,
  hoursPlayed,
  note,
  dateFinished,
  dateStarted,
  setNote,
  setDateFinished,
  setDateStarted,
}) {
  return (
    <section
      className="personal-details"
      aria-labelledby="personal-details-title"
    >
      <div className="personal-details-heading">
        <div>
          <p className="eyebrow">Your progress</p>
          <h3 id="personal-details-title">Personal details</h3>
        </div>
        <button
          className="reset-rating-button"
          type="button"
          onClick={() =>
            setUserRating((previousRatings) => ({
              ...previousRatings,
              [selectedGameId]: 0,
            }))
          }
        >
          Reset rating
        </button>
      </div>

      <div className="rating-field">
        <span className="field-label">Your rating</span>
        <StarRating
          maxRating={10}
          size={24}
          defaultRating={userRating[selectedGameId] || 0}
          onSetRating={(rating) =>
            setUserRating((previousRatings) => ({
              ...previousRatings,
              [selectedGameId]: rating,
            }))
          }
        />
      </div>

      <div className="personal-details-fields">
        <label>
          <span className="field-label">Hours played</span>
          <input
            value={hoursPlayed[selectedGameId] || ""}
            onChange={(e) =>
              setHoursPlayed((previousHoursPlayed) => ({
                ...previousHoursPlayed,
                [selectedGameId]: e.target.value,
              }))
            }
            type="number"
            min="0"
            placeholder="0"
          />
        </label>
        <label>
          <span className="field-label">Date started</span>
          <input
            value={dateStarted[selectedGameId] || ""}
            onChange={(e) =>
              setDateStarted((previousDateStarted) => ({
                ...previousDateStarted,
                [selectedGameId]: e.target.value,
              }))
            }
            type="date"
          />
        </label>
        <label>
          <span className="field-label">Date finished</span>
          <input
            value={dateFinished[selectedGameId] || ""}
            onChange={(e) =>
              setDateFinished((previousDateFinished) => ({
                ...previousDateFinished,
                [selectedGameId]: e.target.value,
              }))
            }
            type="date"
          />
        </label>
        <label className="note-field">
          <span className="field-label">Note</span>
          <textarea
            value={note[selectedGameId] || ""}
            onChange={(e) =>
              setNote((previousNote) => ({
                ...previousNote,
                [selectedGameId]: e.target.value,
              }))
            }
            placeholder="What stood out?"
            rows="3"
          />
        </label>
      </div>
    </section>
  );
}

function AddToListFlyout({ lists, onAddToList, game, setShowAddList }) {
  return (
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
  );
}

function SharePanel({
  setShowSharePanel,
  libraryGames,
  lists,
  initialCollection,
  userRating,
  hoursPlayed,
  dateStarted,
  dateFinished,
  note,
}) {
  const [selectedCollection, setSelectedCollection] = useState(
    initialCollection || "library",
  );
  const selectedList = lists.find((list) => list.title === selectedCollection);
  const collectionGames =
    selectedCollection === "library" ? libraryGames : selectedList?.games || [];
  const collection =
    selectedCollection === "library"
      ? {
          title: "My Game Library",
          description: "Share your library with friends and fellow gamers.",
        }
      : {
          title: selectedList?.title || "Shared List",
          description:
            selectedList?.description || "A curated collection of games.",
        };

  return (
    <div
      className="share-panel-overlay"
      onClick={() => setShowSharePanel(false)}
    >
      <section
        className="share-panel"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="share-panel__header">
          <div>
            <span className="share-panel__eyebrow">Shared collection</span>
            <h2>{collection.title}</h2>
            <p>{collection.description}</p>
          </div>

          <span className="share-panel__count">
            {collectionGames.length}{" "}
            {collectionGames.length === 1 ? "game" : "games"}
          </span>
          <button
            className="share-panel__close"
            type="button"
            aria-label="Close share panel"
            onClick={() => setShowSharePanel(false)}
          >
            ×
          </button>
        </div>

        <label className="share-collection-selector">
          <span>Share collection</span>
          <select
            value={selectedCollection}
            onChange={(event) => setSelectedCollection(event.target.value)}
          >
            <option value="library">My library</option>
            {lists.map((list) => (
              <option key={list.title} value={list.title}>
                {list.title}
              </option>
            ))}
          </select>
        </label>

        {collectionGames.length === 0 ? (
          <div className="share-panel__empty">
            <h3>Your library is waiting</h3>
            <p>Add a game first, then come back to share your collection.</p>
          </div>
        ) : (
          <div className="share-panel__games">
            {collectionGames.map((game, index) => (
              <article className="share-game-card" key={game.id}>
                <img
                  src={game.background_image || fallbackGameImage}
                  alt={`${game.name} cover`}
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackGameImage;
                  }}
                />
                <div className="share-game-card__content">
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  <h3>{game.name}</h3>
                  <p>{game.released || "Release date unknown"}</p>
                </div>
              </article>
            ))}
          </div>
        )}
        <div className="share-panel__actions">
          <button
            className="share-panel__download"
            type="button"
            onClick={() =>
              downloadLibraryHtml(
                collectionGames,
                {
                  userRating,
                  hoursPlayed,
                  dateStarted,
                  dateFinished,
                  note,
                },
                collection,
              )
            }
          >
            Download HTML
          </button>
        </div>
      </section>
    </div>
  );
}

// custom color for lists
// tags
// responsive design
