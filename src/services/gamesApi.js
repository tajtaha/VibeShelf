const API_KEY = import.meta.env.VITE_RAWG_API_KEY;
const pageSize = 50;

export async function getGames(page, ordering, searchQuery, sort, signal) {
  let url = `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=${pageSize}&ordering=${sort === "desc" ? "-" : ""}${ordering}`;

  if (searchQuery) {
    url += `&search_exact=true&search=${encodeURIComponent(searchQuery)}`;
  }

  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data.results ?? [];
}
