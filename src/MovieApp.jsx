import { useState } from "react";
import { useEffect } from "react";
import { getMovies } from "./moviesApi.js";
import fallbackMovieImage from "./assets/No-Image-Placeholder-Light.png";

export default function MovieApp() {
  const [movies, setMovies] = useState([]);
  const [page, setPage] = useState(1);
  const [sort, setSort] = useState("popularity");
  const [order, setOrder] = useState("desc");
  const [query, setQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState(null);

  return (
    <div className="movie-app">
      <header className="movie-page-header">
        <div>
          <p className="eyebrow">Your movie shelf</p>
          <h1>Find your next favorite</h1>
          <p className="movie-page-intro">
            Browse popular picks or search for a movie by title.
          </p>
        </div>
      </header>

      <SearchBar
        setSort={setSort}
        setOrder={setOrder}
        sort={sort}
        order={order}
        setPage={setPage}
        setMovies={setMovies}
        setQuery={setQuery}
      />

      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      <MoviesList
        movies={movies}
        setMovies={setMovies}
        page={page}
        setPage={setPage}
        sort={sort}
        order={order}
        query={query}
        setSelectedMovie={setSelectedMovie}
      />
    </div>
  );
}

function MoviesList({
  movies,
  setMovies,
  page,
  setPage,
  sort,
  order,
  query,
  setSelectedMovie,
}) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    async function fetchMovies() {
      setLoading(true);

      try {
        const newMovies = await getMovies(page, sort, order, query);
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
  }, [page, sort, order, query, setMovies]);

  return (
    <section className="movie-library">
      <header className="movie-library-heading">
        <div>
          <p className="eyebrow">Explore</p>
          <h2>Movies</h2>
        </div>
        <span className="movie-result-count">
          {movies.length} {movies.length === 1 ? "movie" : "movies"} loaded
        </span>
      </header>

      {movies.length > 0 ? (
        <div className="movie-grid">
      {movies.map((movie) => (
            <button
              key={movie.id}
              className="movie-card"
              type="button"
              onClick={() => setSelectedMovie(movie)}
            >
              <span className="movie-card-poster">
                <img
                  src={
                    movie.poster_path
                      ? `https://image.tmdb.org/t/p/w342${movie.poster_path}`
                      : fallbackMovieImage
                  }
                  alt={`${movie.title} poster`}
                  loading="lazy"
                  onError={(event) => {
                    event.currentTarget.onerror = null;
                    event.currentTarget.src = fallbackMovieImage;
                  }}
                />
                {movie.vote_average > 0 && (
                  <span className="movie-card-rating">
                    ★ {movie.vote_average.toFixed(1)}
                  </span>
                )}
              </span>
              <span className="movie-card-copy">
                <span className="movie-card-title">{movie.title}</span>
                <span className="movie-card-year">
                  {movie.release_date?.slice(0, 4) || "Release year unknown"}
                </span>
              </span>
            </button>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="movie-empty-state">
            <span className="movie-empty-icon" aria-hidden="true">✦</span>
            <h3>No movies to show</h3>
            <p>Try another search, or check back in a moment.</p>
          </div>
        )
      )}

      {errorMessage && (
        <p className="movie-error-message" role="alert">
          {errorMessage}
        </p>
      )}
      {loading && <p className="movie-loading-message">Finding movies…</p>}

      {movies.length > 0 && (
        <button
          className="movie-load-more"
          type="button"
          onClick={() => setPage((prevPage) => prevPage + 1)}
          disabled={loading}
        >
          {loading ? "Loading…" : "Load more movies"}
        </button>
      )}
    </section>
  );
}

function SearchBar({
  setSort,
  setOrder,
  sort,
  order,
  setPage,
  setMovies,
  setQuery,
}) {
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(searchInput);
      setPage(1);
      setMovies([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, setMovies, setPage, setQuery]);

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
    <div className="toolbar movie-toolbar">
      <input
        className="search-input movie-search-input"
        type="text"
        placeholder="Search for a movie..."
        value={searchInput}
        onChange={(e) => setSearchInput(e.target.value)}
      />

      <label className="movie-sort-control">
        <span>Sort by</span>
        <select
          value={sort}
          onChange={(e) => handleChangeSort(e.target.value)}
        >
        <option value="popularity">Popularity</option>
        <option value="title">Title</option>
        <option value="primary_release_date">Release date</option>
        <option value="revenue">Revenue</option>
        <option value="vote_average">Vote average</option>
        </select>
      </label>

      <button className="sort-button movie-order-button" onClick={handleChangeOrder}>
        {order === "desc" ? "↓ Descending" : "↑ Ascending"}
      </button>
    </div>
  );
}

function MovieDetails({ movie, onClose }) {
  const API_KEY = import.meta.env.VITE_TMDB_API_KEY;
  const [movieDetails, setMovieDetails] = useState(movie);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    async function fetchMovieDetails() {
      setMovieDetails(movie);
      setLoading(true);
      setErrorMessage("");

      try {
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${API_KEY}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error(`HTTP error: ${response.status}`);
        }

        const data = await response.json();
        setMovieDetails(data);
      } catch (error) {
        if (error.name !== "AbortError") {
          setErrorMessage(`Could not load full movie details: ${error.message}`);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchMovieDetails();
    return () => controller.abort();
  }, [movie, API_KEY]);

  const posterUrl = movieDetails.poster_path
    ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`
    : null;
  const releaseYear = movieDetails.release_date?.slice(0, 4) || "Unknown";
  const runtime = movieDetails.runtime
    ? `${Math.floor(movieDetails.runtime / 60)}h ${movieDetails.runtime % 60}m`
    : "Unknown";

  return (
    <section className="movie-details-panel" aria-label={`${movie.title} details`}>
      <button
        className="movie-details-close"
        type="button"
        onClick={onClose}
      >
        Close details
      </button>
      <div className="movie-details-art">
        {posterUrl ? (
          <img src={posterUrl} alt={`${movieDetails.title} poster`} />
        ) : (
          <div className="movie-details-no-poster">No poster available</div>
        )}
      </div>

      <div className="movie-details-content">
        <p className="eyebrow">Movie details</p>
        <h2>
          {movieDetails.title}
          <span>{releaseYear}</span>
        </h2>
        {movieDetails.tagline && (
          <p className="movie-details-tagline">{movieDetails.tagline}</p>
        )}
        <p className="movie-details-overview">
          {movieDetails.overview || "No overview is available for this movie."}
        </p>

        <div className="movie-details-stats">
          <div>
            <span>TMDB rating</span>
            <strong>
              {movieDetails.vote_average
                ? `${movieDetails.vote_average.toFixed(1)} / 10`
                : "Not rated"}
            </strong>
          </div>
          <div>
            <span>Runtime</span>
            <strong>{runtime}</strong>
          </div>
          <div>
            <span>Release date</span>
            <strong>{movieDetails.release_date || "Unknown"}</strong>
          </div>
          <div>
            <span>Status</span>
            <strong>{movieDetails.status || "Unknown"}</strong>
          </div>
        </div>

        <dl className="movie-details-list">
          <div>
            <dt>Genres</dt>
            <dd>
              {movieDetails.genres?.map((genre) => genre.name).join(", ") ||
                "Not listed"}
            </dd>
          </div>
          <div>
            <dt>Original language</dt>
            <dd>
              {movieDetails.original_language?.toUpperCase() || "Not listed"}
            </dd>
          </div>
          <div>
            <dt>Production</dt>
            <dd>
              {movieDetails.production_companies
                ?.map((company) => company.name)
                .join(", ") || "Not listed"}
            </dd>
          </div>
        </dl>

        {loading && <p className="movie-details-message">Loading more details…</p>}
        {errorMessage && (
          <p className="movie-details-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </section>
  );
}
