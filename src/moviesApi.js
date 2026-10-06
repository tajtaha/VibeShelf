const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

export async function getMovies(page, sort, order, signal) {
  const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&page=${page}&sort_by=${sort}.${order}&vote_count.gte=1000`;
  const response = await fetch(url, { signal });
  const data = await response.json();
  return data.results;
}
