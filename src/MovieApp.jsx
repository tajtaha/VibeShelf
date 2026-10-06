import { useState } from "react";
import { useEffect } from "react";
import { getMovies } from "./moviesApi.js";

export default function MovieApp() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("popularity");
  const [order, setOrder] = useState("desc");

  return (
    <div className="movie-app">
      <header className="page-header">
        <div>
          <p className="eyebrow">Movie library</p>
        </div>
      </header>

      <SearchBar
        setSort={setSort}
        setOrder={setOrder}
        order={order}
        setPage={setPage}
        setMovies={setMovies}
      />

      <MoviesList
        movies={movies}
        setMovies={setMovies}
        page={page}
        setPage={setPage}
        sort={sort}
        order={order}
      />
    </div>
  );
}

function MoviesList({ movies, setMovies, page, setPage, sort, order }) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);

      try {
        const newMovies = await getMovies(page, sort, order);
        setMovies((prevMovies) =>
          page === 1 ? newMovies : [...prevMovies, ...newMovies],
        );
      } catch (error) {
        setErrorMessage("Error fetching movies:" + error.message);
      } finally {
        setLoading(false);
      }
    }

    fetchMovies();
  }, [page, sort, order]);

  return (
    <div>
      {movies.map((movie) => (
        <div key={movie.id} className="movie-card">
          <h2>{movie.title}</h2>
          <img
            src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`}
            alt={movie.title}
          />
        </div>
      ))}

      <button onClick={() => setPage((prevPage) => prevPage + 1)}>
        Load More
      </button>

      <p>{loading ? "Loading..." : errorMessage}</p>
    </div>
  );
}

function SearchBar({ setSort, setOrder, order, setPage, setMovies }) {
  function handleChangeSort(sortValue) {
    setSort(sortValue);
    setPage(1);
    setMovies([]);
  }
  function handleChangeOrder() {
    setOrder((prevOrder) => (prevOrder === "desc" ? "asc" : "desc"));
    setPage(1);
    setMovies([]);
  }

  return (
    <div>
      <input type="text" placeholder="Search for a movie..." />

      <select onChange={(e) => handleChangeSort(e.target.value)}>
        <option value="popularity">Popularity</option>
        <option value="title">Title</option>
        <option value="primary_release_date">Release date</option>
        <option value="revenue">Revenue</option>
        <option value="vote_average">Vote average</option>
      </select>

      <button onClick={handleChangeOrder}>
        {order === "desc" ? "↓" : "↑"}
      </button>
    </div>
  );
}
