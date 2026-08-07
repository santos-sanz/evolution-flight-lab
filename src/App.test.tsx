import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "./App";

describe("Evolution Flight Lab", () => {
  beforeEach(() => localStorage.clear());

  it("switches from the manual game to the evolution lab", async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByText("Wind Tunnel Laboratory")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "FLY A MANUAL RUN" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "EVOLVE" }));
    expect(screen.getByRole("button", { name: /EVOLVE NEXT GENERATION/ })).toBeInTheDocument();
    expect(screen.getByText("Why did it flap?")).toBeInTheDocument();
  });

  it("offers the complete five-step walkthrough", async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByRole("button", { name: /LESSON PROGRESS/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Fly it yourself");
    await user.click(screen.getByRole("button", { name: /Next lesson/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Watch the sensors");
  });
});
