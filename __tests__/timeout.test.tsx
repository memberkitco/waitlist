import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion");

vi.mock("@/app/page", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/app/page")>();
  return {
    ...actual,
    simulateSubmission: () => new Promise(() => {}), // never resolves
  };
});

import WaitlistPage from "@/app/page";

describe("Timeout and Error Handling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should re-enable the submit button after 10s timeout", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(submitButton).toBeDisabled();

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(submitButton).not.toBeDisabled();
  });

  it("should display error message on timeout", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(
      screen.getByText("Something went wrong. Please try again.")
    ).toBeInTheDocument();
  });

  it("should preserve the email in the input after a timeout error", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    await act(async () => {
      vi.advanceTimersByTime(10000);
    });

    expect(emailInput).toHaveValue("user@example.com");
  });
});
