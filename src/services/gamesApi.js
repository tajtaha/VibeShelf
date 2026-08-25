const API_KEY = "7bef91a9e22c45a595b0b7c47150eb34";
const pageSize = 50;

export async function getGames(page, ordering, searchQuery, sort, signal) {
  const url = `https://api.rawg.io/api/games?key=${API_KEY}&page=${page}&page_size=${pageSize}&ordering=${sort === "desc" ? "-" : ""}${ordering}&search=${encodeURIComponent(searchQuery ?? "")}`;
  const response = await fetch(url, { signal });

  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status}`);
  }

  const data = await response.json();
  return data.results ?? [];
}
