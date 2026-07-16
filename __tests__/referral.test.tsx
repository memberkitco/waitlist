import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import WaitlistPage from "@/app/page";

vi.mock("framer-motion");

describe("Copy Button States and Referral Progress", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  async function signUp() {
    render(<WaitlistPage />);
    const emailInput = screen.getByPlaceholderText("you@example.com");
    const submitButton = screen.getByRole("button", { name: /join/i });

    fireEvent.change(emailInput, { target: { value: "user@test.com" } });
    fireEvent.click(submitButton);

    await act(async () => {
      vi.advanceTimersByTime(1200);
    });
  }

  describe("Conditional rendering", () => {
    it("shows the form initially when not signed up", () => {
      render(<WaitlistPage />);
      expect(screen.getByRole("button", { name: /join/i })).toBeInTheDocument();
      expect(screen.queryByText(/referrals completed/i)).not.toBeInTheDocument();
    });

    it("shows the referral section after signup", async () => {
      await signUp();
      expect(screen.getByText(/referrals completed/i)).toBeInTheDocument();
    });
  });

  describe("Copy button idle → copied → idle", () => {
    it("shows 'Copied!' after clicking copy, then reverts after 2s", async () => {
      await signUp();

      const copyButton = screen.getByRole("button", { name: /copy referral link/i });
      expect(copyButton).toHaveTextContent("Copy");

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(screen.getByText("Copied!")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy")).toBeInTheDocument();
    });
  });

  describe("Copy button idle → failed → idle", () => {
    it("shows 'Failed' when clipboard rejects, then reverts after 2s", async () => {
      await signUp();

      (navigator.clipboard.writeText as any).mockRejectedValueOnce(new Error("fail"));

      const copyButton = screen.getByRole("button", { name: /copy referral link/i });

      await act(async () => {
        fireEvent.click(copyButton);
      });

      expect(screen.getByText("Failed")).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText("Copy")).toBeInTheDocument();
    });
  });

  describe("Progress bar label", () => {
    it("displays '0/3 referrals completed' after signup", async () => {
      await signUp();
      expect(screen.getByText("0/3 referrals completed")).toBeInTheDocument();
    });
  });
});
