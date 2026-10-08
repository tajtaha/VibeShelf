import { beforeEach, describe, expect, it, vi } from "vitest";
import { getMovies } from "./moviesApi.js";

describe("getMovies", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("requests discover results with the selected sort settings", async () => {
    const results = [{ id: 1, title: "Sample movie" }];
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ results }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const movies = await getMovies(2, "popularity", "desc", "");
    const [requestUrl] = fetchMock.mock.calls[0];
    const url = new URL(requestUrl);

    expect(url.pathname).toBe("/3/discover/movie");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("sort_by")).toBe("popularity.desc");
    expect(movies).toEqual(results);
  });

  it("uses the search endpoint and passes the abort signal", async () => {
    const signal = new AbortController().signal;
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({ results: [] }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await getMovies(1, "popularity", "desc", "  sample title  ", signal);
    const [requestUrl, options] = fetchMock.mock.calls[0];

    expect(new URL(requestUrl).pathname).toBe("/3/search/movie");
    expect(new URL(requestUrl).searchParams.get("query")).toBe("sample title");
    expect(options.signal).toBe(signal);
  });

  it("throws the API message for an unsuccessful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        json: vi.fn().mockResolvedValue({ status_message: "Invalid API key" }),
      }),
    );

    await expect(getMovies(1, "popularity", "desc", "")).rejects.toThrow(
      "Invalid API key",
    );
  });

  it("throws when the successful response has no results array", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      }),
    );

    await expect(getMovies(1, "popularity", "desc", "")).rejects.toThrow(
      "invalid response",
    );
  });
});
