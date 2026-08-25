import { useState, useEffect, useRef } from "react";
import { getGames } from "./services/gamesApi";

export default function App() {
  return (
    <div className="App">
      <GamesList />
    </div>
  );
}

function GamesList() {
  const [page, setPage] = useState(1);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(false);
  const [ordering, setOrdering] = useState("metacritic");
  const [searchQuery, setSearchQuery] = useState("");
  const [sort, setSort] = useState("desc");

  function handleLoadMore() {
    setPage((prevPage) => prevPage + 1);
  }

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
        alert(`Error fetching games: ${error.message}`);
      } finally {
        setLoading(false);
      }
    }

    fetchGames();
    return () => controller.abort();
  }, [page, ordering, searchQuery, sort]);

  return (
    <div>
      <select value={ordering} onChange={handleOrderingChange}>
        <option value="rating">Rating</option>
        <option value="released">Released</option>
        <option value="name">Name</option>
        <option value="metacritic">Metacritic</option>
        <option value="added">Added</option>
        <option value="created">Created</option>
      </select>
      <button onClick={handleSort}>{sort === "desc" ? "↓" : "↑"}</button>

      <input onChange={handleSearch} />

      {games.map((game, index) => (
        <div key={game.id}>
          <h2>
            {index + 1}. {game.name}
          </h2>
          <img src={game.background_image} alt={game.name} />
        </div>
      ))}

      <button onClick={handleLoadMore} disabled={loading}>
        {loading ? "Loading..." : "Load more"}
      </button>
    </div>
  );
}
