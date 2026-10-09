import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import GamesApp from "./GamesApp.jsx";
import { getGames } from "./services/gamesApi";

vi.mock("./services/gamesApi", () => ({
  getGames: vi.fn(),
}));

const game = {
  id: 7,
  name: "Sample Game",
  released: "2024-01-01",
  background_image: null,
  rating: 4,
};

describe("GamesApp", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGames.mockResolvedValue([game]);
  });

  it("toggles a game in and out of favorites", async () => {
    const user = userEvent.setup();
    render(<GamesApp />);

    await user.click(
      await screen.findByRole("button", { name: "Add Sample Game to favorites" }),
    );

    const removeButton = await screen.findByRole("button", {
      name: "Remove Sample Game from favorites",
    });
    expect(removeButton.getAttribute("aria-pressed")).toBe("true");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("favoriteGames"))).toEqual([game]),
    );

    await user.click(removeButton);

    const addButton = await screen.findByRole("button", {
      name: "Add Sample Game to favorites",
    });
    expect(addButton.getAttribute("aria-pressed")).toBe("false");
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("favoriteGames"))).toEqual([]),
    );
  });
});
