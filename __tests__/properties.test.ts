import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { isValidEmail, calculateAnnualSavings, formatUSD } from "@/app/page";

describe("Property-Based Tests: Email Validation", () => {
  // Feature: waitlist-landing-page, Property 1: Valid emails are accepted
  // **Validates: Requirements 2.2**
  describe("Property 1: Valid emails are accepted", () => {
    it("should accept all valid email formats", () => {
      fc.assert(
        fc.property(fc.emailAddress(), (email) => {
          expect(isValidEmail(email)).toBe(true);
        }),
        { numRuns: 100 }
      );
    });
  });

  // Feature: waitlist-landing-page, Property 2: Invalid emails are rejected
  // **Validates: Requirements 2.3**
  describe("Property 2: Invalid emails are rejected", () => {
    it("should reject all invalid email formats", () => {
      // Generator for strings with no "@" symbol
      const noAtSymbol = fc
        .string({ minLength: 1 })
        .filter((s) => !s.includes("@"));

      // Generator for strings with multiple "@" symbols (2+)
      const multipleAtSymbols = fc
        .tuple(
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@")),
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@")),
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@"))
        )
        .map(([a, b, c]) => `${a}@${b}@${c}`);

      // Generator for strings with one "@" but domain has no "."
      const domainNoDot = fc
        .tuple(
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@")),
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@") && !s.includes(".") && !s.includes(" "))
        )
        .map(([local, domain]) => `${local}@${domain}`);

      // Generator for strings with one "@" but domain starts with "."
      const domainStartsWithDot = fc
        .tuple(
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@")),
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@") && !s.includes(" "))
        )
        .map(([local, domain]) => `${local}@.${domain}`);

      // Generator for strings with one "@" but domain ends with "."
      const domainEndsWithDot = fc
        .tuple(
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@")),
          fc.string({ minLength: 1 }).filter((s) => !s.includes("@") && !s.includes(" "))
        )
        .map(([local, domain]) => `${local}@${domain}.`);

      // Generator for empty strings
      const emptyString = fc.constant("");

      // Combine all invalid email generators
      const invalidEmail = fc.oneof(
        noAtSymbol,
        multipleAtSymbols,
        domainNoDot,
        domainStartsWithDot,
        domainEndsWithDot,
        emptyString
      );

      fc.assert(
        fc.property(invalidEmail, (email) => {
          expect(isValidEmail(email)).toBe(false);
        }),
        { numRuns: 100 }
      );
    });
  });
});

// Feature: waitlist-landing-page, Property 3: Fee calculation formula correctness
describe("Property 3: Fee calculation formula correctness", () => {
  /**
   * Validates: Requirements 3.2
   *
   * For any monthly revenue value in the range [500, 50000], the calculated
   * annual savings shall equal Math.round((monthlyRevenue * 0.10 + (monthlyRevenue / 30) * 0.50) * 12),
   * and the result shall always be a non-negative integer.
   */
  it("should calculate annual savings matching the expected formula for all valid revenue inputs", () => {
    fc.assert(
      fc.property(fc.integer({ min: 500, max: 50000 }), (monthlyRevenue) => {
        const result = calculateAnnualSavings(monthlyRevenue);
        const expected = Math.round(
          (monthlyRevenue * 0.10 + (monthlyRevenue / 30) * 0.50) * 12
        );

        // Result must equal the expected formula output
        expect(result).toBe(expected);

        // Result must be a non-negative integer
        expect(result).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(result)).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});

// Feature: waitlist-landing-page, Property 4: USD formatting produces valid currency strings
describe("Property 4: USD formatting produces valid currency strings", () => {
  /**
   * Validates: Requirements 3.3, 3.5
   *
   * For any non-negative integer, the formatUSD function shall produce a string
   * that starts with "$", contains only digits and commas after the "$" sign,
   * has no decimal point, and correctly groups digits into thousands.
   */
  it("should produce valid currency strings for all non-negative integers", () => {
    fc.assert(
      fc.property(fc.nat({ max: 1000000 }), (amount) => {
        const result = formatUSD(amount);

        // Must match the pattern: starts with $, then only digits and commas
        expect(result).toMatch(/^\$[\d,]+$/);

        // Must NOT contain a decimal point
        expect(result).not.toContain(".");

        // Validate thousands grouping by parsing back
        const numericPart = result.slice(1); // remove "$"
        if (amount >= 1000) {
          // Should contain commas for numbers >= 1000
          const groups = numericPart.split(",");
          // First group can be 1-3 digits
          expect(groups[0].length).toBeGreaterThanOrEqual(1);
          expect(groups[0].length).toBeLessThanOrEqual(3);
          // Subsequent groups must be exactly 3 digits
          for (let i = 1; i < groups.length; i++) {
            expect(groups[i].length).toBe(3);
          }
        } else {
          // Numbers < 1000 should not contain commas
          expect(numericPart).not.toContain(",");
        }

        // Verify the formatted value parses back to the original amount
        const parsed = Number(numericPart.replace(/,/g, ""));
        expect(parsed).toBe(amount);
      }),
      { numRuns: 100 }
    );
  });
});
