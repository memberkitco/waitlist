import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";

vi.mock("framer-motion");

import WaitlistPage from "@/app/page";

describe("Hero Section", () => {
  it("displays the headline on initial load", () => {
    render(<WaitlistPage />);
    const h1 = screen.getByRole("heading", { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.textContent).toMatch(/Sell digital/i);
  });

  it("displays sub-headline with key value propositions", () => {
    render(<WaitlistPage />);
    const subHeadline = screen.getByText(/Replace your fragmented stack/i);
    expect(subHeadline).toBeInTheDocument();
  });

  it("wraps the hero content in a section-like container", () => {
    const { container } = render(<WaitlistPage />);
    const h1 = container.querySelector("h1");
    expect(h1).toBeInTheDocument();
  });
});
