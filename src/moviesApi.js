const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function getMovies(page, sort, order, query) {
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
  let url = `https://api.themoviedb.org/3/${endpoint}?${params.toString()}`;
  const response = await fetch(url);
  const data = await response.json();
  return data.results;
}
