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
  const [lists, setLists] = useState(() => {
    const savedMovieLists = JSON.parse(localStorage.getItem("movieLists"));
    if (Array.isArray(savedMovieLists)) {
      return savedMovieLists.map((list) => ({
        ...list,
        movies: Array.isArray(list.movies) ? list.movies : [],
      }));
    }

    const savedLists = JSON.parse(localStorage.getItem("lists")) || [];
    return savedLists
      .map((list) => ({
        title: list.title,
        description: list.description || "",
        movies: [
          ...(Array.isArray(list.movies) ? list.movies : []),
          ...(Array.isArray(list.games)
            ? list.games.filter((item) => item.title)
            : []),
        ],
      }))
      .filter((list) => list.movies.length > 0);
  });
  const [showAddList, setShowAddList] = useState(false);
  const [listError, setListError] = useState("");
  const [activeView, setActiveView] = useState("discover");

  useEffect(() => {
    localStorage.setItem("movieLists", JSON.stringify(lists));
  }, [lists]);

  function handleAddToList(listTitle, movie) {
    if (
      lists.some(
        (list) =>
          list.title === listTitle &&
          list.movies.some((item) => item.id === movie.id),
      )
    ) {
      alert("This movie is already in the list.");
      return;
    }

    setLists((previousLists) =>
      previousLists.map((list) =>
        list.title === listTitle
          ? { ...list, movies: [...list.movies, movie] }
          : list,
      ),
    );
  }

  function handleAddList(listTitle, listDescription = "") {
    if (
      listTitle.trim() === "" ||
      lists.some((list) => list.title === listTitle)
    ) {
      setListError("List title cannot be empty or duplicate.");
      return;
    }

    setLists((previousLists) => [
      ...previousLists,
      { title: listTitle, description: listDescription, movies: [] },
    ]);
    setShowAddList(false);
    setListError("");
  }

  function handleDeleteList(listTitle) {
    setLists((previousLists) =>
      previousLists.filter((list) => list.title !== listTitle),
    );
  }

  function handleDeleteListItem(listTitle, movieId) {
    setLists((previousLists) =>
      previousLists.map((list) =>
        list.title === listTitle
          ? {
              ...list,
              movies: list.movies.filter((movie) => movie.id !== movieId),
            }
          : list,
      ),
    );
  }

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

      <nav className="movie-view-tabs" aria-label="Movie sections">
        <button
          type="button"
          className={activeView === "discover" ? "active" : ""}
          onClick={() => setActiveView("discover")}
        >
          Discover
        </button>
        <button
          type="button"
          className={activeView === "lists" ? "active" : ""}
          onClick={() => setActiveView("lists")}
        >
          My Lists
        </button>
      </nav>

      {selectedMovie && (
        <MovieDetails
          movie={selectedMovie}
          onClose={() => setSelectedMovie(null)}
        />
      )}

      {activeView === "discover" ? (
        <>
          <SearchBar
            setSort={setSort}
            setOrder={setOrder}
            sort={sort}
            order={order}
            setPage={setPage}
            setMovies={setMovies}
            setQuery={setQuery}
            query={query}
          />
          <MoviesList
            movies={movies}
            setMovies={setMovies}
            page={page}
            setPage={setPage}
            sort={sort}
            order={order}
            query={query}
            lists={lists}
            onAddToList={handleAddToList}
            setShowAddList={setShowAddList}
            setSelectedMovie={setSelectedMovie}
          />
        </>
      ) : (
        <Lists
          lists={lists}
          setShowAddList={setShowAddList}
          setSelectedMovie={setSelectedMovie}
          onDeleteList={handleDeleteList}
          onDeleteListItem={handleDeleteListItem}
        />
      )}
      {showAddList && (
        <AddList
          setShowAddList={setShowAddList}
          onAddList={handleAddList}
          errorMessage={listError}
        />
      )}
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
  lists,
  onAddToList,
  setShowAddList,
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
            <article
              className="movie-card"
              key={movie.id}
              onClick={() => setSelectedMovie(movie)}
            >
              <div
                className="flyout"
                onClick={(event) => event.stopPropagation()}
              >
                <button type="button">Add to List</button>

                <AddToListFlyout
                  lists={lists}
                  onAddToList={onAddToList}
                  movie={movie}
                  setShowAddList={setShowAddList}
                />
              </div>

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

              <div className="movie-card-copy">
                <div
                  className="game-list-tags"
                  aria-label="Lists containing this movie"
                >
                  {lists
                    .filter((list) =>
                      list.movies.some(
                        (listMovie) => listMovie.id === movie.id,
                      ),
                    )
                    .map((list) => list.title)
                    .map((listTitle) => (
                      <span className="game-list-tag" key={listTitle}>
                        {listTitle}
                      </span>
                    ))}
                </div>

                <span className="movie-card-title">{movie.title}</span>
                <span className="movie-card-year">
                  {movie.release_date?.slice(0, 4) || "Release year unknown"}
                </span>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !loading && (
          <div className="movie-empty-state">
            <span className="movie-empty-icon" aria-hidden="true">
              ✦
            </span>
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

function AddToListFlyout({ lists, onAddToList, movie, setShowAddList }) {
  return (
    <div className="flyout-menu">
      {lists.map((list) => (
        <button
          key={list.title}
          type="button"
          onClick={() => onAddToList(list.title, movie)}
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

function SearchBar({
  setSort,
  setOrder,
  sort,
  order,
  setPage,
  setMovies,
  setQuery,
  query,
}) {
  const [searchInput, setSearchInput] = useState("");

  useEffect(() => {
    const nextQuery = searchInput.trim();
    if (nextQuery === query) return;

    const timer = setTimeout(() => {
      setQuery(nextQuery);
      setPage(1);
      setMovies([]);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput, query, setMovies, setPage, setQuery]);

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
        <select value={sort} onChange={(e) => handleChangeSort(e.target.value)}>
          <option value="popularity">Popularity</option>
          <option value="title">Title</option>
          <option value="primary_release_date">Release date</option>
          <option value="revenue">Revenue</option>
          <option value="vote_average">Vote average</option>
        </select>
      </label>

      <button
        className="sort-button movie-order-button"
        onClick={handleChangeOrder}
      >
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
          setErrorMessage(
            `Could not load full movie details: ${error.message}`,
          );
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
    <section
      className="movie-details-panel"
      aria-label={`${movie.title} details`}
    >
      <button className="movie-details-close" type="button" onClick={onClose}>
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

        {loading && (
          <p className="movie-details-message">Loading more details…</p>
        )}
        {errorMessage && (
          <p className="movie-details-message" role="alert">
            {errorMessage}
          </p>
        )}
      </div>
    </section>
  );
}

function Lists({ lists, setShowAddList, setSelectedMovie, onDeleteList, onDeleteListItem }) {
  return (
    <main className="movie-lists-area">
      <header className="movie-lists-header">
        <div>
          <p className="eyebrow">Your collections</p>
          <h2>Movie Lists</h2>
        </div>
        <button
          className="movie-create-list-button"
          type="button"
          onClick={() => setShowAddList(true)}
        >
          New List +
        </button>
      </header>

      {lists.length === 0 ? (
        <div className="movie-empty-state">
          <h3>No movie lists yet</h3>
          <p>Create a list, then add movies from Discover.</p>
        </div>
      ) : (
        lists.map((list) => (
          <section className="list-panel movie-list-panel" key={list.title}>
            <div className="movie-list-heading">
              <h2>{list.title}</h2>
              <button
                className="movie-list-delete"
                type="button"
                onClick={() => onDeleteList(list.title)}
              >
                Delete list
              </button>
            </div>
            {list.description && (
              <p className="list-description">{list.description}</p>
            )}
            {list.movies.length > 0 ? (
              <div className="movie-list-items">
                {list.movies.map((movie) => (
                  <article className="movie-list-item" key={movie.id}>
                    <button
                      className="movie-list-item-details"
                      type="button"
                      onClick={() => setSelectedMovie(movie)}
                    >
                      <img
                        src={
                          movie.poster_path
                            ? `https://image.tmdb.org/t/p/w185${movie.poster_path}`
                            : fallbackMovieImage
                        }
                        alt={`${movie.title} poster`}
                        onError={(event) => {
                          event.currentTarget.onerror = null;
                          event.currentTarget.src = fallbackMovieImage;
                        }}
                      />
                      <span>
                        <strong>{movie.title}</strong>
                        <small>
                          {movie.release_date?.slice(0, 4) ||
                            "Release year unknown"}
                        </small>
                      </span>
                    </button>
                    <button
                      className="movie-list-item-delete"
                      type="button"
                      aria-label={`Remove ${movie.title} from ${list.title}`}
                      onClick={() => onDeleteListItem(list.title, movie.id)}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            ) : (
              <p className="movie-list-empty">This list has no movies yet.</p>
            )}
          </section>
        ))
      )}
    </main>
  );
}
