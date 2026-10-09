import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import MovieApp from "./MovieApp.jsx";
import { getMovies } from "./moviesApi.js";

vi.mock("./moviesApi.js", () => ({
  getMovies: vi.fn(),
}));

const movie = {
  id: 101,
  title: "Sample Movie",
  release_date: "2024-06-01",
  poster_path: null,
  vote_average: 7.5,
};

describe("MovieApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getMovies.mockResolvedValue([movie]);
  });

  it("creates a list, adds and removes a movie, and deletes the list", async () => {
    const user = userEvent.setup();
    render(<MovieApp />);

    await screen.findByText("Sample Movie");
    await user.click(screen.getByRole("button", { name: "My Lists" }));
    await user.click(screen.getByRole("button", { name: "New List +" }));

    await user.type(screen.getByPlaceholderText("List title"), "Favorites");
    await user.type(
      screen.getByPlaceholderText("List description (optional)"),
      "Movies to rewatch",
    );
    await user.click(screen.getByRole("button", { name: "Add", exact: true }));

    expect(await screen.findByText("Favorites")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("movieLists"))).toEqual([
      { title: "Favorites", description: "Movies to rewatch", movies: [] },
    ]);

    await user.click(screen.getByRole("button", { name: "Discover" }));
    await user.click(screen.getByText("Add to List"));
    await user.click(screen.getByRole("button", { name: "Favorites" }));
    await user.click(screen.getByRole("button", { name: "My Lists" }));

    expect(await screen.findByText("Sample Movie")).toBeTruthy();
    expect(JSON.parse(localStorage.getItem("movieLists"))[0].movies).toEqual([
      movie,
    ]);

    await user.click(
      screen.getByRole("button", { name: "Remove Sample Movie from Favorites" }),
    );
    expect(screen.getByText("This list has no movies yet.")).toBeTruthy();

    await user.click(screen.getByRole("button", { name: "Delete list" }));
    expect(screen.getByText("No movie lists yet")).toBeTruthy();
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("movieLists"))).toEqual([]),
    );
  });

  it("does not add the same movie twice to a list", async () => {
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    render(<MovieApp />);

    await screen.findByText("Sample Movie");
    await user.click(screen.getByRole("button", { name: "My Lists" }));
    await user.click(screen.getByRole("button", { name: "New List +" }));
    await user.type(screen.getByPlaceholderText("List title"), "Favorites");
    await user.click(screen.getByRole("button", { name: "Add", exact: true }));
    await user.click(screen.getByRole("button", { name: "Discover" }));

    await user.click(screen.getByText("Add to List"));
    await user.click(screen.getByRole("button", { name: "Favorites" }));
    await user.click(screen.getByText("Add to List"));
    await user.click(screen.getByRole("button", { name: "Favorites" }));

    expect(alertSpy).toHaveBeenCalledWith(
      "This movie is already in the list.",
    );
    expect(JSON.parse(localStorage.getItem("movieLists"))[0].movies).toHaveLength(
      1,
    );
  });

  it("shows fetch errors and retries the request", async () => {
    getMovies
      .mockRejectedValueOnce(new Error("Network unavailable"))
      .mockResolvedValueOnce([movie]);
    const user = userEvent.setup();
    render(<MovieApp />);

    expect(
      await screen.findByText("Could not load movies: Network unavailable"),
    ).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(await screen.findByText("Sample Movie")).toBeTruthy();
    expect(getMovies).toHaveBeenCalledTimes(2);
  });

  it("aborts the active movie request when the component unmounts", async () => {
    getMovies.mockReturnValue(new Promise(() => {}));
    const { unmount } = render(<MovieApp />);

    await waitFor(() => expect(getMovies).toHaveBeenCalledTimes(1));
    const [, , , , signal] = getMovies.mock.calls[0];
    expect(signal).toBeInstanceOf(AbortSignal);

    unmount();

    expect(signal.aborted).toBe(true);
  });

  it("opens the share preview and lets users choose a list", async () => {
    const user = userEvent.setup();
    localStorage.setItem(
      "movieLists",
      JSON.stringify([
        { title: "Favorites", description: "", movies: [movie] },
        { title: "Classics", description: "", movies: [] },
      ]),
    );
    render(<MovieApp />);

    await user.click(screen.getByRole("button", { name: "My Lists" }));
    await user.click(screen.getByRole("button", { name: "Share Lists" }));

    expect(await screen.findByText("Shared collection")).toBeTruthy();
    expect(screen.getAllByText("Sample Movie")).toHaveLength(2);
    fireEvent.change(screen.getByLabelText("Share collection"), {
      target: { value: "Classics" },
    });
    expect(screen.getByText("This list is empty")).toBeTruthy();
  });

  it("saves a personal movie rating and places details on the right", async () => {
    const user = userEvent.setup();
    const { container } = render(<MovieApp />);

    await user.click(await screen.findByText("Sample Movie"));

    expect(container.querySelector(".movie-workspace.has-details")).toBeTruthy();
    expect(await screen.findByText("Your rating")).toBeTruthy();

    fireEvent.click(
      container.querySelectorAll(".movie-star-rating button")[4],
    );
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("movieUserRating"))).toEqual({
        "101": 5,
      }),
    );
  });

  it("moves movies between lists by dragging list items", async () => {
    localStorage.setItem(
      "movieLists",
      JSON.stringify([
        { title: "Source", description: "", movies: [movie] },
        { title: "Target", description: "", movies: [] },
      ]),
    );
    const user = userEvent.setup();
    render(<MovieApp />);

    await user.click(screen.getByRole("button", { name: "My Lists" }));
    const sourceItem = document.querySelector(".movie-list-item");
    const targetList = screen.getByText("Target").closest("section");

    fireEvent.dragStart(sourceItem);
    fireEvent.dragOver(targetList);
    fireEvent.drop(targetList);

    await waitFor(() => {
      const savedLists = JSON.parse(localStorage.getItem("movieLists"));
      expect(savedLists[0].movies).toEqual([]);
      expect(savedLists[1].movies).toEqual([movie]);
    });
  });
});
