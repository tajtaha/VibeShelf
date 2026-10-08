const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function getMovies(page, sort, order, query, signal) {
  const searchQuery = query.trim();
  const endpoint = searchQuery ? "search/movie" : "discover/movie";

  const params = new URLSearchParams({
    api_key: API_KEY,
    page: String(page),
  });

  if (!searchQuery) {
    params.set("sort_by", `${sort}.${order}`);
    params.set("vote_count.gte", "1000");
  } else {
    params.set("query", searchQuery);
  }
  const url = `https://api.themoviedb.org/3/${endpoint}?${params.toString()}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    let errorBody;
    try {
      errorBody = await response.json();
    } catch {
      errorBody = null;
    }
    throw new Error(
      errorBody?.status_message || `Movie request failed (HTTP ${response.status}).`,
    );
  }

  const data = await response.json();
  if (!Array.isArray(data.results)) {
    throw new Error("The movie service returned an invalid response.");
  }

  return data.results;
}
