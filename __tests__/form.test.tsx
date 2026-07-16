import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion");

import WaitlistPage from "@/app/page";

describe("Form State Machine Transitions", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should transition idle → submitting → success with valid email", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    expect(submitButton).not.toBeDisabled();

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText("Joining...")).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(1500);
    });

    // Should show referral view with position
    expect(screen.getByText(/You are/i)).toBeInTheDocument();
  });

  it("should transition idle → error with invalid email", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const form = emailInput.closest("form")!;

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "notanemail" } });
    });
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(
      screen.getByText("Please enter a valid email address")
    ).toBeInTheDocument();
  });

  it("should transition error → submitting on retry with valid email", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const form = emailInput.closest("form")!;

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "bademail" } });
    });
    await act(async () => {
      fireEvent.submit(form);
    });
    expect(
      screen.getByText("Please enter a valid email address")
    ).toBeInTheDocument();

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "valid@example.com" } });
    });
    await act(async () => {
      fireEvent.submit(form);
    });

    expect(screen.getByText("Joining...")).toBeInTheDocument();
  });

  it("should disable button during submission", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("should show loading spinner during submitting state", async () => {
    render(<WaitlistPage />);

    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    await act(async () => {
      fireEvent.change(emailInput, { target: { value: "user@example.com" } });
    });
    await act(async () => {
      fireEvent.click(submitButton);
    });

    expect(screen.getByText("Joining...")).toBeInTheDocument();
  });
});
