import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import React from "react";

vi.mock("framer-motion");

import WaitlistPage from "@/app/page";

describe("Fee Calculator - Slider Attributes and Display", () => {
  describe("Slider attributes", () => {
    it("should render with min=500, max=50000, step=100, default value=5000", () => {
      render(<WaitlistPage />);

      const slider = screen.getByLabelText("Monthly revenue slider");

      expect(slider).toHaveAttribute("min", "500");
      expect(slider).toHaveAttribute("max", "50000");
      expect(slider).toHaveAttribute("step", "100");
      expect(slider).toHaveAttribute("value", "5000");
    });
  });

  describe("Savings display updates on slider change", () => {
    it("should update savings and revenue display when slider value changes to $10,000", () => {
      render(<WaitlistPage />);

      const slider = screen.getByLabelText("Monthly revenue slider");

      fireEvent.change(slider, { target: { value: "10000" } });

      // Expected: $14,000 annual savings for $10,000/month
      expect(screen.getByText("$14,000")).toBeInTheDocument();
      expect(screen.getByText("$10,000")).toBeInTheDocument();
    });
  });
});
